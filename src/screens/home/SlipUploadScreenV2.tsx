/**
 * Slip Upload Screen V2 - With Screenshot OCR
 * 
 * Two upload methods:
 * A. Upload Screenshot (Recommended) - OCR extracts data
 * B. Manual Entry - Type in details
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { theme } from '../../design/theme';
import { FirestoreService } from '../../services/firestore.service';
import { ParsedSlip } from '../../services/slip-parser.service';
import { BookingCodeScraper } from '../../services/booking-code-scraper.service';
import { useAuth } from '../../contexts/AuthContext';

interface SlipUploadScreenV2Props {
  navigation: any;
}

export const SlipUploadScreenV2: React.FC<SlipUploadScreenV2Props> = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  
  // Form fields
  const [bookingCode, setBookingCode] = useState('');
  const [platform, setPlatform] = useState<'SportyBet' | 'Bet9ja' | '1xBet' | 'Betway' | 'MozzartBet' | 'Other'>('SportyBet');
  const [parsedData, setParsedData] = useState<ParsedSlip | null>(null);
  const [processing, setProcessing] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Premium fields
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('');
  
  // Ref to prevent multiple simultaneous scrapes
  const scrapingRef = useRef(false);

  // Removed automatic extraction - now happens on publish

  /**
   * Scrape matches from booking code URL
   */
  const scrapeMatches = async () => {
    if (!bookingCode.trim() || platform === 'Other' || scrapingRef.current) {
      return;
    }

    scrapingRef.current = true;
    setProcessing(true);
    
    try {
      const scrapedData = await BookingCodeScraper.scrapeFromBookingCode(
        platform,
        bookingCode.trim()
      );

      if (scrapedData.matches && scrapedData.matches.length > 0) {
        // Calculate expiration: 10 minutes before first match kickoff
        let expiresAt: Date | undefined;
        if (scrapedData.earliestMatchDate) {
          const earliestDate = new Date(scrapedData.earliestMatchDate);
          expiresAt = new Date(earliestDate.getTime() - 10 * 60 * 1000); // 10 minutes before
        }
        
        // Update parsedData with scraped matches
        const updatedParsedData: ParsedSlip = {
          matches: scrapedData.matches.map(m => ({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            prediction: m.prediction,
            odds: m.odds,
            market: m.market,
            matchDate: m.matchDate ? new Date(m.matchDate) : undefined,
            league: m.league,
          })),
          bookingCode: scrapedData.bookingCode,
          totalOdds: scrapedData.totalOdds,
          stake: scrapedData.stake,
          potentialWin: scrapedData.potentialWin,
          platform: scrapedData.platform,
          expiresAt,
        };

        setParsedData(updatedParsedData);
        console.log(`✅ Auto-extracted ${scrapedData.matches.length} match(es)`);
        
        // Verify total odds
        if (scrapedData.totalOdds) {
          const calculatedOdds = scrapedData.matches.reduce((acc, m) => acc * m.odds, 1);
          const difference = Math.abs(scrapedData.totalOdds - calculatedOdds);
          if (difference > 0.01) {
            console.warn(`⚠️ Total odds mismatch: Extracted=${scrapedData.totalOdds.toFixed(2)}, Calculated=${calculatedOdds.toFixed(2)}`);
          } else {
            console.log(`✅ Total odds verified: ${scrapedData.totalOdds.toFixed(2)}`);
          }
        } else {
          // Calculate if not provided
          const calculatedOdds = scrapedData.matches.reduce((acc, m) => acc * m.odds, 1);
          updatedParsedData.totalOdds = calculatedOdds;
          setParsedData(updatedParsedData);
          console.log(`📊 Total odds calculated: ${calculatedOdds.toFixed(2)}`);
        }
        
        if (expiresAt) {
          console.log(`⏰ Slip will expire at: ${expiresAt.toLocaleString()}`);
        }
      } else {
        // Clear parsed data if no matches found
        setParsedData(null);
      }
    } catch (error: any) {
      console.error('Error auto-extracting matches:', error);
      
      // Check for specific error types and log helpful messages
      const errorMessage = error.message || '';
      if (errorMessage.includes('Cannot connect to server') || errorMessage.includes('Failed to fetch')) {
        console.warn('⚠️ Server may not be running. Make sure the backend server is started on http://localhost:3001');
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        console.warn('⚠️ Booking code not found or expired:', bookingCode);
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        console.warn('⚠️ Booking code may be private or require authentication');
      } else {
        console.warn('⚠️ Could not extract matches:', errorMessage);
      }
      
      // Silently fail - don't show alert for auto-scraping
      setParsedData(null);
    } finally {
      setProcessing(false);
      scrapingRef.current = false;
    }
  };

  /**
   * Extract matches from booking code with retries and better error handling
   */
  const extractMatchesWithRetry = async (retries = 3): Promise<ParsedSlip | null> => {
    if (!bookingCode.trim() || platform === 'Other') {
      return null;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Extraction attempt ${attempt}/${retries} for booking code: ${bookingCode}`);
        
        const scrapedData = await BookingCodeScraper.scrapeFromBookingCode(
          platform,
          bookingCode.trim()
        );

        if (scrapedData.matches && scrapedData.matches.length > 0) {
          console.log(`✅ Successfully extracted ${scrapedData.matches.length} match(es) on attempt ${attempt}`);
          
          // Calculate expiration: 10 minutes before first match kickoff
          let expiresAt: Date | undefined;
          if (scrapedData.earliestMatchDate) {
            const earliestDate = new Date(scrapedData.earliestMatchDate);
            expiresAt = new Date(earliestDate.getTime() - 10 * 60 * 1000); // 10 minutes before
          }
          
          const parsedData: ParsedSlip = {
            matches: scrapedData.matches.map(m => ({
              homeTeam: m.homeTeam,
              awayTeam: m.awayTeam,
              prediction: m.prediction,
              odds: m.odds,
              market: m.market,
              matchDate: m.matchDate ? new Date(m.matchDate) : undefined,
              league: m.league,
            })),
            bookingCode: scrapedData.bookingCode,
            totalOdds: scrapedData.totalOdds,
            stake: scrapedData.stake,
            potentialWin: scrapedData.potentialWin,
            platform: scrapedData.platform,
            expiresAt,
          };
          
          return parsedData;
        } else {
          console.warn(`⚠️ No matches found on attempt ${attempt}`);
          if (attempt < retries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }
      } catch (error: any) {
        console.error(`❌ Extraction attempt ${attempt} failed:`, error.message);
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        } else {
          // All retries failed
          throw error;
        }
      }
    }
    
    return null;
  };

  /**
   * Handle publish slip
   */
  const handlePublish = async () => {
    // Validation
    if (!bookingCode.trim()) {
      Alert.alert('Error', 'Please enter the booking code');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please add your analysis');
      return;
    }
    
    if (platform === 'Other') {
      Alert.alert('Error', 'Please select a betting platform');
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
    setProcessing(true);
    
    try {
      // Step 1: Extract matches from booking code (with retries)
      console.log('📥 Starting match extraction...');
      const extractedData = await extractMatchesWithRetry(3);
      
      if (!extractedData || !extractedData.matches || extractedData.matches.length === 0) {
        Alert.alert(
          'Extraction Failed',
          'Could not extract matches from the booking code. Please verify the code is correct and try again.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        setProcessing(false);
        return;
      }
      
      console.log(`✅ Extraction complete: ${extractedData.matches.length} matches found`);
      
      // Use extracted data
      const totalOdds = extractedData.totalOdds || 2.0;
      const stake = extractedData.stake;
      const potentialWin = extractedData.potentialWin || (stake ? stake * totalOdds : undefined);
      
      // Get match details from extracted data (use first match for title)
      const firstMatch = extractedData.matches[0];
      const homeTeam = firstMatch?.homeTeam || 'TBD';
      const awayTeam = firstMatch?.awayTeam || 'TBD';
      
      // Step 2: Create creator profile if needed
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
      
      // Step 3: Build slip data with extracted matches
      const slipData: any = {
        creatorId: user.uid,
        creatorName: userProfile.displayName,
        creatorAvatar: userProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName)}&background=10B981&color=fff&size=128`,
        title: `${homeTeam} vs ${awayTeam}`,
        description: description.trim(),
        odds: totalOdds,
        status: 'active', // Mark as active since extraction is complete
        extractionStatus: 'completed', // Extraction completed successfully
        matchDate: extractedData.matches[0]?.matchDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        sport: 'Football',
        league: extractedData.matches[0]?.league || 'Various',
        bookingCode: bookingCode.trim(),
        platform,
        verified: false, // No screenshot verification anymore
        homeTeam,
        awayTeam,
        resultChecked: false,
        isPremium,
        purchasedBy: [],
        // Store all extracted matches
        matches: extractedData.matches,
      };
      
      // Only add optional fields if they exist (don't include undefined)
      if (stake) {
        slipData.stake = stake;
      }
      if (potentialWin) {
        slipData.potentialWin = potentialWin;
      }
      if (isPremium && price) {
        slipData.price = parseFloat(price);
      }
      // Only add expiresAt if it exists
      if (extractedData.expiresAt) {
        slipData.expiresAt = extractedData.expiresAt;
      }
      
      // Step 4: Create slip
      console.log('💾 Creating slip with extracted data...');
      await FirestoreService.createSlip(slipData);
      console.log('✅ Slip created successfully');

      Alert.alert(
        'Success! 🎉',
        `Your slip has been published with ${extractedData.matches.length} match(es) extracted successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating slip:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to create slip';
      if (error.message?.includes('Cannot connect to server') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend server is running.';
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        errorMessage = 'Booking code not found or expired. Please verify the code is correct.';
      } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        errorMessage = 'Booking code may be private or require authentication.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  // Main form
  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <AppText variant="h1">Add Slip</AppText>
            <AppText variant="body" color={theme.colors.text.secondary} style={styles.subtitle}>
              Enter your booking code and we'll automatically extract match details
            </AppText>
          </View>

          <View style={styles.form}>
            {/* Booking Code */}
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
              {processing && (
                <View style={styles.processingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.accent.primary} />
                  <AppText variant="caption" color={theme.colors.accent.primary} style={styles.processingText}>
                    Extracting matches...
                  </AppText>
                </View>
              )}
            </View>

            {/* Platform */}
            <View style={styles.formGroup}>
              <AppText variant="bodySmall" style={styles.label}>
                Platform *
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

            {/* Extracted matches preview */}
            {parsedData && parsedData.matches.length > 0 && (
              <Card style={styles.extractedCard}>
                <AppText variant="h3" style={styles.extractedTitle}>
                  Extracted Matches ✅
                </AppText>
                
                {parsedData.totalOdds && (
                  <View style={styles.extractedRow}>
                    <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                      Total Odds:
                    </AppText>
                    <AppText variant="bodySmall" style={styles.oddsValue}>
                      {parsedData.totalOdds.toFixed(2)}
                    </AppText>
                  </View>
                )}
                
                <View style={styles.matchesList}>
                  <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.matchesTitle}>
                    Selections ({parsedData.matches.length}):
                  </AppText>
                  {parsedData.matches.map((match, index) => {
                    // Format prediction display
                    const predictionLabel = match.prediction === 'home' ? 'Home' : 
                                          match.prediction === 'away' ? 'Away' : 
                                          match.prediction === 'draw' ? 'Draw' :
                                          match.prediction.charAt(0).toUpperCase() + match.prediction.slice(1);
                    
                    // Format market/bet type
                    const marketLabel = match.market === 'h2h' ? '1X2' :
                                      match.market === 'totals' ? 'Over/Under' :
                                      match.market === 'btts' ? 'BTTS' :
                                      match.market === 'spreads' ? 'Handicap' :
                                      match.market === 'double_chance' ? 'Double Chance' :
                                      match.market.toUpperCase();
                    
                    return (
                      <View key={index} style={styles.matchItem}>
                        {index > 0 && <View style={styles.matchDivider} />}
                        <View style={styles.matchContent}>
                          <View style={styles.matchLeft}>
                            <View style={styles.predictionRow}>
                              <Ionicons name="football" size={16} color={theme.colors.text.primary} />
                              <AppText variant="bodySmall" style={styles.predictionLabel}>
                                {predictionLabel}
                              </AppText>
                            </View>
                            <AppText variant="bodySmall" style={styles.matchTeams}>
                              {match.homeTeam} vs {match.awayTeam}
                            </AppText>
                            <AppText variant="caption" color={theme.colors.text.secondary} style={styles.marketLabel}>
                              {marketLabel}
                            </AppText>
                          </View>
                          <AppText variant="bodySmall" color={theme.colors.accent.primary} style={styles.matchOdds}>
                            {match.odds.toFixed(2)}
                          </AppText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}

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
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: `${theme.colors.accent.primary}15`,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  extractButtonText: {
    fontWeight: '600',
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
    marginBottom: 0,
  },
  matchDivider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginVertical: theme.spacing.sm,
  },
  matchContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  matchLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  predictionLabel: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  matchTeams: {
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },
  marketLabel: {
    fontSize: 11,
  },
  matchOdds: {
    fontWeight: '600',
    fontSize: 16,
    minWidth: 50,
    textAlign: 'right',
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

