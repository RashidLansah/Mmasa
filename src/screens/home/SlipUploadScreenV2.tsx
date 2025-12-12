/**
 * Slip Upload Screen V2 - With Screenshot OCR
 * 
 * Two upload methods:
 * A. Upload Screenshot (Recommended) - OCR extracts data
 * B. Manual Entry - Type in details
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { theme } from '../../design/theme';
import { FirestoreService } from '../../services/firestore.service';
import { Storage } from '../../services/storage.service';
import { OCR } from '../../services/ocr.service';
import { SlipParser, ParsedSlip } from '../../services/slip-parser.service';
import { useAuth } from '../../contexts/AuthContext';

interface SlipUploadScreenV2Props {
  navigation: any;
}

type UploadMethod = 'screenshot' | 'manual' | null;

export const SlipUploadScreenV2: React.FC<SlipUploadScreenV2Props> = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  
  // Upload method selection
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>(null);
  
  // Screenshot upload flow
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedSlip | null>(null);
  
  // Manual entry flow
  const [bookingCode, setBookingCode] = useState('');
  const [platform, setPlatform] = useState<'SportyBet' | 'Bet9ja' | '1xBet' | 'Betway' | 'MozzartBet' | 'Other'>('SportyBet');
  
  // Common fields
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Premium fields
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('');

  /**
   * Request camera/gallery permissions
   */
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to upload your betting slip');
      return false;
    }
    return true;
  };

  /**
   * Handle screenshot upload
   */
  const handleUploadScreenshot = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setScreenshot(imageUri);
        
        // Process with OCR
        await processScreenshot(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  /**
   * Take photo with camera
   */
  const handleTakePhoto = async () => {
    // Check if running on simulator
    if (__DEV__ && Platform.OS === 'ios') {
      Alert.alert(
        'Camera Not Available',
        'Camera is not available on iOS Simulator. Please use "Choose from Gallery" instead.',
        [{ text: 'OK', onPress: () => handleUploadScreenshot() }]
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera permissions');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setScreenshot(imageUri);
        await processScreenshot(imageUri);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      if (error.message?.includes('Camera not available')) {
        Alert.alert(
          'Camera Not Available',
          'Please use "Choose from Gallery" instead.',
          [{ text: 'OK', onPress: () => handleUploadScreenshot() }]
        );
      } else {
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  /**
   * Process screenshot with OCR (optional)
   */
  const processScreenshot = async (imageUri: string) => {
    setProcessing(true);
    try {
      console.log('Attempting OCR extraction...');
      
      // Try OCR with server (optional - gracefully fails if not available)
      const ocrResult = await OCR.extractTextFromImage(imageUri);
      
      if (ocrResult.success && ocrResult.text) {
        // OCR succeeded! Parse the text
        console.log('OCR Success! Parsing text...');
        const parsed = SlipParser.parseSlipText(ocrResult.text);
        setParsedData(parsed);
        
        // Auto-fill fields
        if (parsed.platform) {
          setPlatform(parsed.platform);
        }
        if (parsed.bookingCode) {
          setBookingCode(parsed.bookingCode);
        }
        
        Alert.alert(
          'OCR Success! ✅',
          `Found:\n• Booking Code: ${parsed.bookingCode || 'Not found'}\n• Platform: ${parsed.platform || 'Not found'}\n• Odds: ${parsed.totalOdds?.toFixed(2) || 'Not found'}\n\nPlease verify the details below.`,
          [{ text: 'OK' }]
        );
      } else {
        // OCR not available - continue with manual entry (no error shown)
        console.log('OCR not available, continuing with manual entry');
      }

    } catch (error) {
      // OCR failed - this is fine, just use manual entry
      console.log('OCR processing skipped, using manual entry');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle publish slip
   */
  const handlePublish = async () => {
    // Validation
    if (!screenshot && uploadMethod === 'screenshot') {
      Alert.alert('Error', 'Please upload a screenshot');
      return;
    }
    if (!bookingCode.trim()) {
      Alert.alert('Error', 'Please enter the booking code');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please add your analysis');
      return;
    }
    
    // Enhanced auth check with better error message
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to create a slip. Please log out and log back in.');
      return;
    }
    
    if (!userProfile) {
      Alert.alert(
        'Profile Loading', 
        'Your profile is still loading. Please wait a moment and try again.\n\nIf this persists, please log out and log back in.',
        [{ text: 'OK' }]
      );
      console.error('❌ User profile not loaded:', {
        hasUser: !!user,
        userId: user?.uid,
        hasProfile: !!userProfile
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined;
      
      // Upload screenshot if provided
      if (screenshot) {
        imageUrl = await Storage.uploadSlipImage(user.uid, screenshot);
      }

      // Calculate values from parsed data or defaults
      const totalOdds = parsedData?.totalOdds || 2.0;
      const stake = parsedData?.stake;
      const potentialWin = parsedData?.potentialWin || (stake ? stake * totalOdds : undefined);
      
      // Get match details from parsed data (use first match for now)
      const firstMatch = parsedData?.matches?.[0];
      const homeTeam = firstMatch?.homeTeam || 'TBD';
      const awayTeam = firstMatch?.awayTeam || 'TBD';
      
      // Check if user is already a creator, if not, create creator profile
      try {
        const existingCreators = await FirestoreService.getCreators();
        const isCreator = existingCreators.some(creator => creator.id === user.uid);
        
        if (!isCreator) {
          // Create creator profile for first-time slip poster
          await FirestoreService.createCreator({
            id: user.uid,
            name: userProfile.displayName,
            avatar: userProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName)}&background=10B981&color=fff&size=128`,
            bio: '',
            winRate: 0,
            subscribers: 0,
            totalSlips: 0,
            verifiedStatus: 'unverified',
          });
        }
      } catch (error) {
        console.log('Note: Could not verify/create creator status:', error);
        // Continue with slip creation even if creator check fails
      }
      
      // Create slip
      await FirestoreService.createSlip({
        creatorId: user.uid,
        creatorName: userProfile.displayName,
        creatorAvatar: userProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName)}&background=10B981&color=fff&size=128`,
        title: `${homeTeam} vs ${awayTeam}`,
        description: description.trim(),
        odds: totalOdds,
        status: 'pending',
        matchDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
        sport: 'Football',
        league: 'Various',
        stake,
        potentialWin,
        imageUrl,
        bookingCode: bookingCode.trim(),
        platform,
        verified: !!screenshot,
        homeTeam,
        awayTeam,
        resultChecked: false,
        isPremium,
        price: isPremium ? parseFloat(price) : undefined,
        purchasedBy: [],
      });

      Alert.alert(
        'Success! 🎉',
        'Your slip has been published and verified',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating slip:', error);
      Alert.alert('Error', error.message || 'Failed to create slip');
    } finally {
      setLoading(false);
    }
  };

  // Method selection screen
  if (!uploadMethod) {
    return (
      <AppScreen>
        <View style={styles.header}>
          <AppText variant="h1">Add Slip</AppText>
          <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
            Choose how you want to upload your betting slip
          </AppText>
        </View>

        <View style={styles.methodsContainer}>
          {/* Screenshot Upload (Recommended) */}
          <Card style={styles.methodCard}>
            <View style={styles.recommendedBadge}>
              <AppText variant="caption" color={theme.colors.status.success}>
                RECOMMENDED
              </AppText>
            </View>
            
            <View style={styles.methodIcon}>
              <Ionicons name="camera" size={48} color={theme.colors.accent.primary} />
            </View>
            
            <AppText variant="h2" style={styles.methodTitle}>
              Upload Screenshot
            </AppText>
            
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.methodDescription}>
              Upload a screenshot of your betting slip from SportyBet, Bet9ja, or other platforms. 
              We'll automatically extract the matches, odds, and booking code.
            </AppText>
            
            <View style={styles.methodFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.success} />
                <AppText variant="bodySmall" style={styles.featureText}>
                  Auto-extracts matches & odds
                </AppText>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.success} />
                <AppText variant="bodySmall" style={styles.featureText}>
                  Verified & trusted by followers
                </AppText>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.status.success} />
                <AppText variant="bodySmall" style={styles.featureText}>
                  Easy sharing with booking code
                </AppText>
              </View>
            </View>
            
            <AppButton
              title="Upload Screenshot"
              onPress={() => setUploadMethod('screenshot')}
              variant="primary"
              style={styles.methodButton}
            />
          </Card>

          {/* Manual Entry */}
          <Card style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <Ionicons name="create-outline" size={48} color={theme.colors.text.secondary} />
            </View>
            
            <AppText variant="h2" style={styles.methodTitle}>
              Enter Manually
            </AppText>
            
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.methodDescription}>
              Manually enter your booking code and slip details. 
              We recommend uploading a screenshot for verification.
            </AppText>
            
            <AppButton
              title="Enter Manually"
              onPress={() => setUploadMethod('manual')}
              variant="secondary"
              style={styles.methodButton}
            />
          </Card>
        </View>
      </AppScreen>
    );
  }

  // Screenshot upload flow
  if (uploadMethod === 'screenshot') {
    return (
      <AppScreen>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setUploadMethod(null)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <AppText variant="h1">Upload Screenshot</AppText>
              <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
                Upload your betting slip screenshot
              </AppText>
            </View>

            <View style={styles.form}>
              {/* Screenshot upload */}
              {!screenshot ? (
                <View style={styles.uploadSection}>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleUploadScreenshot}
                  >
                    <Ionicons name="images" size={48} color={theme.colors.accent.primary} />
                    <AppText variant="h3" color={theme.colors.accent.primary} style={styles.uploadText}>
                      Choose from Gallery
                    </AppText>
                  </TouchableOpacity>
                  
                  <AppText variant="body" color={theme.colors.text.secondary} style={styles.orText}>
                    OR
                  </AppText>
                  
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleTakePhoto}
                  >
                    <Ionicons name="camera" size={48} color={theme.colors.accent.primary} />
                    <AppText variant="h3" color={theme.colors.accent.primary} style={styles.uploadText}>
                      Take Photo
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.previewSection}>
                  <Image source={{ uri: screenshot }} style={styles.previewImage} />
                  {processing && (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="large" color={theme.colors.accent.primary} />
                      <AppText variant="body" color={theme.colors.text.primary} style={styles.processingText}>
                        Processing screenshot...
                      </AppText>
                    </View>
                  )}
                  <AppButton
                    title="Change Screenshot"
                    onPress={() => {
                      setScreenshot(null);
                      setParsedData(null);
                    }}
                    variant="secondary"
                    style={styles.changeButton}
                  />
                </View>
              )}

              {/* Extracted data preview */}
              {parsedData && (
                <Card style={styles.extractedCard}>
                  <AppText variant="h3" style={styles.extractedTitle}>
                    Extracted Data ✅
                  </AppText>
                  
                  {parsedData.bookingCode && (
                    <View style={styles.extractedRow}>
                      <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                        Booking Code:
                      </AppText>
                      <AppText variant="bodySmall" color={theme.colors.accent.primary}>
                        {parsedData.bookingCode}
                      </AppText>
                    </View>
                  )}
                  
                  {parsedData.totalOdds && (
                    <View style={styles.extractedRow}>
                      <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                        Total Odds:
                      </AppText>
                      <AppText variant="bodySmall">
                        {parsedData.totalOdds.toFixed(2)}
                      </AppText>
                    </View>
                  )}
                  
                  {parsedData.matches.length > 0 && (
                    <View style={styles.matchesList}>
                      <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.matchesTitle}>
                        Matches ({parsedData.matches.length}):
                      </AppText>
                      {parsedData.matches.map((match, index) => (
                        <View key={index} style={styles.matchItem}>
                          <AppText variant="caption">
                            {match.homeTeam} vs {match.awayTeam}
                          </AppText>
                          <AppText variant="caption" color={theme.colors.accent.primary}>
                            {match.odds.toFixed(2)}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              )}

              {/* Booking Code */}
              {screenshot && (
                <>
                  <View style={styles.formGroup}>
                    <AppText variant="bodySmall" style={styles.label}>
                      Booking Code *
                    </AppText>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter booking code"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={bookingCode}
                      onChangeText={setBookingCode}
                      autoCapitalize="characters"
                    />
                  </View>

                  {/* Platform */}
                  <View style={styles.formGroup}>
                    <AppText variant="bodySmall" style={styles.label}>
                      Platform
                    </AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.platformOptions}>
                        {(['SportyBet', 'Bet9ja', '1xBet', 'Betway', 'MozzartBet'] as const).map((p) => (
                          <TouchableOpacity
                            key={p}
                            style={[styles.platformOption, platform === p && styles.platformOptionActive]}
                            onPress={() => setPlatform(p)}
                          >
                            <AppText
                              variant="bodySmall"
                              color={platform === p ? theme.colors.accent.primary : theme.colors.text.secondary}
                            >
                              {p}
                            </AppText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Premium Toggle */}
                  <View style={styles.formGroup}>
                    <AppText variant="bodySmall" style={styles.label}>
                      Slip Type
                    </AppText>
                    <View style={styles.premiumToggle}>
                      <TouchableOpacity
                        style={[styles.toggleOption, !isPremium && styles.toggleOptionActive]}
                        onPress={() => setIsPremium(false)}
                      >
                        <Ionicons 
                          name="checkmark-circle" 
                          size={20} 
                          color={!isPremium ? theme.colors.accent.primary : theme.colors.text.secondary} 
                        />
                        <AppText
                          variant="bodySmall"
                          color={!isPremium ? theme.colors.accent.primary : theme.colors.text.secondary}
                          style={styles.toggleText}
                        >
                          Free
                        </AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleOption, isPremium && styles.toggleOptionActive]}
                        onPress={() => setIsPremium(true)}
                      >
                        <Ionicons 
                          name="diamond" 
                          size={20} 
                          color={isPremium ? theme.colors.accent.primary : theme.colors.text.secondary} 
                        />
                        <AppText
                          variant="bodySmall"
                          color={isPremium ? theme.colors.accent.primary : theme.colors.text.secondary}
                          style={styles.toggleText}
                        >
                          Premium
                        </AppText>
                      </TouchableOpacity>
                    </View>
                    {isPremium && (
                      <View style={styles.priceInputContainer}>
                        <AppText variant="caption" color={theme.colors.text.secondary} style={styles.priceLabel}>
                          Set your price
                        </AppText>
                        <View style={styles.priceInput}>
                          <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                            GH₵
                          </AppText>
                          <TextInput
                            style={styles.priceField}
                            placeholder="0.00"
                            placeholderTextColor={theme.colors.text.secondary}
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Analysis */}
                  <View style={styles.formGroup}>
                    <AppText variant="bodySmall" style={styles.label}>
                      Your Analysis *
                    </AppText>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Explain why you think this slip will win..."
                      placeholderTextColor={theme.colors.text.secondary}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <AppButton
                    title={loading ? 'Publishing...' : 'Publish Slip'}
                    onPress={handlePublish}
                    variant="primary"
                    disabled={loading || !bookingCode || !description || (isPremium && !price)}
                  />
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppScreen>
    );
  }

  // Manual entry flow (simplified)
  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setUploadMethod(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <AppText variant="h1">Enter Manually</AppText>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
              We recommend uploading a screenshot for verification
            </AppText>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.uploadScreenshotPrompt}
              onPress={() => setUploadMethod('screenshot')}
            >
              <Ionicons name="camera" size={24} color={theme.colors.accent.primary} />
              <AppText variant="bodySmall" color={theme.colors.accent.primary}>
                Upload Screenshot Instead (Recommended)
              </AppText>
            </TouchableOpacity>

            {/* Same form fields as screenshot flow */}
            <View style={styles.formGroup}>
              <AppText variant="bodySmall" style={styles.label}>
                Booking Code *
              </AppText>
              <TextInput
                style={styles.input}
                placeholder="Enter booking code from betting platform"
                placeholderTextColor={theme.colors.text.secondary}
                value={bookingCode}
                onChangeText={setBookingCode}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <AppText variant="bodySmall" style={styles.label}>
                Platform
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.platformOptions}>
                  {(['SportyBet', 'Bet9ja', '1xBet', 'Betway', 'MozzartBet'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.platformOption, platform === p && styles.platformOptionActive]}
                      onPress={() => setPlatform(p)}
                    >
                      <AppText
                        variant="bodySmall"
                        color={platform === p ? theme.colors.accent.primary : theme.colors.text.secondary}
                      >
                        {p}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Premium Toggle */}
            <View style={styles.formGroup}>
              <AppText variant="bodySmall" style={styles.label}>
                Slip Type
              </AppText>
              <View style={styles.premiumToggle}>
                <TouchableOpacity
                  style={[styles.toggleOption, !isPremium && styles.toggleOptionActive]}
                  onPress={() => setIsPremium(false)}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={!isPremium ? theme.colors.accent.primary : theme.colors.text.secondary} 
                  />
                  <AppText
                    variant="bodySmall"
                    color={!isPremium ? theme.colors.accent.primary : theme.colors.text.secondary}
                    style={styles.toggleText}
                  >
                    Free
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, isPremium && styles.toggleOptionActive]}
                  onPress={() => setIsPremium(true)}
                >
                  <Ionicons 
                    name="diamond" 
                    size={20} 
                    color={isPremium ? theme.colors.accent.primary : theme.colors.text.secondary} 
                  />
                  <AppText
                    variant="bodySmall"
                    color={isPremium ? theme.colors.accent.primary : theme.colors.text.secondary}
                    style={styles.toggleText}
                  >
                    Premium
                  </AppText>
                </TouchableOpacity>
              </View>
              {isPremium && (
                <View style={styles.priceInputContainer}>
                  <AppText variant="caption" color={theme.colors.text.secondary} style={styles.priceLabel}>
                    Set your price
                  </AppText>
                  <View style={styles.priceInput}>
                    <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                      GH₵
                    </AppText>
                    <TextInput
                      style={styles.priceField}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <AppText variant="bodySmall" style={styles.label}>
                Your Analysis *
              </AppText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your betting slip and prediction..."
                placeholderTextColor={theme.colors.text.secondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <AppButton
              title={loading ? 'Publishing...' : 'Publish Slip'}
              onPress={handlePublish}
              variant="primary"
              disabled={loading || !bookingCode || !description || (isPremium && !price)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  backButton: {
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
  },
  methodsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  methodCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  recommendedBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.status.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
  },
  methodIcon: {
    marginBottom: theme.spacing.md,
  },
  methodTitle: {
    marginBottom: theme.spacing.sm,
  },
  methodDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  methodFeatures: {
    width: '100%',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    flex: 1,
  },
  methodButton: {
    width: '100%',
  },
  form: {
    padding: theme.spacing.lg,
  },
  uploadSection: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
  },
  uploadButton: {
    width: '100%',
    borderRadius: theme.borderRadius.card,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
    borderStyle: 'dashed',
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  uploadText: {
    marginTop: theme.spacing.sm,
  },
  orText: {
    marginVertical: theme.spacing.sm,
  },
  previewSection: {
    marginBottom: theme.spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: theme.borderRadius.card,
    resizeMode: 'contain',
    backgroundColor: theme.colors.background.surface,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 10, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.card,
  },
  processingText: {
    marginTop: theme.spacing.md,
  },
  changeButton: {
    marginTop: theme.spacing.md,
  },
  extractedCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background.raised,
  },
  extractedTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.status.success,
  },
  extractedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  matchesList: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  matchesTitle: {
    marginBottom: theme.spacing.sm,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.lg,
  },
  platformOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  platformOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  platformOptionActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.background.raised,
  },
  uploadScreenshotPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.raised,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
    marginBottom: theme.spacing.lg,
  },
  premiumToggle: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    backgroundColor: theme.colors.background.raised,
  },
  toggleOptionActive: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
  },
  toggleText: {
    fontWeight: '600',
  },
  priceInputContainer: {
    marginTop: theme.spacing.md,
  },
  priceLabel: {
    marginBottom: theme.spacing.sm,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  priceField: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    padding: 0,
  },
});

