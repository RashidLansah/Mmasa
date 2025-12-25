/**
 * Slip Upload Screen V2 - Booking Code Entry
 * 
 * Users enter booking code and platform to extract match data
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
import { doc, updateDoc } from 'firebase/firestore';
import { firebaseFirestore } from '../../services/firebase';
import { showToast, showError, showSuccess } from '../../utils/toast.service';

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
   * Generate a better slip title based on matches
   */
  const generateSlipTitle = (matches: Array<{ homeTeam: string; awayTeam: string; league?: string }>): string => {
    if (!matches || matches.length === 0) {
      return 'Betting Slip';
    }

    if (matches.length === 1) {
      // Single match: "Team1 vs Team2"
      return `${matches[0].homeTeam} vs ${matches[0].awayTeam}`;
    }

    if (matches.length === 2) {
      // Two matches: "Team1 vs Team2, Team3 vs Team4"
      const match1 = `${matches[0].homeTeam} vs ${matches[0].awayTeam}`;
      const match2 = `${matches[1].homeTeam} vs ${matches[1].awayTeam}`;
      return `${match1}, ${match2}`;
    }

    if (matches.length === 3) {
      // Three matches: "Team1 vs Team2, Team3 vs Team4, Team5 vs Team6"
      const match1 = `${matches[0].homeTeam} vs ${matches[0].awayTeam}`;
      const match2 = `${matches[1].homeTeam} vs ${matches[1].awayTeam}`;
      const match3 = `${matches[2].homeTeam} vs ${matches[2].awayTeam}`;
      return `${match1}, ${match2}, ${match3}`;
    }

    // More than 3 matches: Use count-based title with first match
    const firstMatch = `${matches[0].homeTeam} vs ${matches[0].awayTeam}`;
    return `${firstMatch} + ${matches.length - 1} more`;
  };

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
   * Background function to extract matches and update slip
   * This runs asynchronously after slip is created
   */
  const extractAndUpdateSlipInBackground = async (slipId: string, bookingCodeParam: string, platformParam: string) => {
    try {
      console.log(`🔄 Background extraction started for slip ${slipId}`);
      
      // Extract matches with longer timeout and more retries
      let extractedData: ParsedSlip | null = null;
      const retries = 5;
      const timeout = 40000; // 40 seconds
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`🔄 Background extraction attempt ${attempt}/${retries} for booking code: ${bookingCodeParam}`);
          
          const scrapedData = await BookingCodeScraper.scrapeFromBookingCode(
            platformParam,
            bookingCodeParam.trim()
          );

          if (scrapedData.matches && scrapedData.matches.length > 0) {
            console.log(`✅ Successfully extracted ${scrapedData.matches.length} match(es) on attempt ${attempt}`);
            
            extractedData = {
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
              earliestMatchDate: scrapedData.earliestMatchDate,
            };
            
            break; // Success, exit retry loop
          } else {
            console.warn(`⚠️ No matches found on attempt ${attempt}`);
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
            }
          }
        } catch (error: any) {
          console.error(`❌ Background extraction attempt ${attempt} failed:`, error.message);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
          }
        }
      }
      
      if (!extractedData || !extractedData.matches || extractedData.matches.length === 0) {
        console.error('❌ No matches extracted after all retries, marking as failed');
        const slipRef = doc(firebaseFirestore, 'slips', slipId);
        await updateDoc(slipRef, { extractionStatus: 'failed' });
        return;
      }
      
      console.log(`✅ Background extraction complete: ${extractedData.matches.length} matches found`);
      
      // Use extracted matches directly - no API matching during parsing
      // Focus on getting parsed matches, API matching can happen later if needed
      const extractedMatches = extractedData.matches.map(match => ({
        ...match,
        matchDate: match.matchDate ? new Date(match.matchDate) : undefined,
      }));
      
      if (extractedMatches.length === 0) {
        console.error('❌ No matches extracted, marking slip as failed');
        const slipRef = doc(firebaseFirestore, 'slips', slipId);
        await updateDoc(slipRef, { 
          extractionStatus: 'failed',
          status: 'pending'
        });
        return;
      }
      
      // Use all extracted matches - no filtering
      const validMatches = extractedMatches;
      
      // Generate proper title
      const title = generateSlipTitle(validMatches);
      
      // Get match details
      const firstMatch = validMatches[0];
      const homeTeam = firstMatch?.homeTeam || 'TBD';
      const awayTeam = firstMatch?.awayTeam || 'TBD';
      
      // Use extracted data
      const totalOdds = extractedData.totalOdds || validMatches.reduce((acc, m) => acc * (m.odds || 1.0), 1);
      const stake = extractedData.stake;
      const potentialWin = extractedData.potentialWin || (stake ? stake * totalOdds : undefined);
      
      // Update slip with extracted data
      const slipRef = doc(firebaseFirestore, 'slips', slipId);
      
      // Build update data, filtering out undefined values
      const updateData: any = {
        title,
        odds: totalOdds,
        status: 'active',
        extractionStatus: 'completed',
        matchDate: extractedData.matches[0]?.matchDate ? new Date(extractedData.matches[0].matchDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        league: extractedData.matches[0]?.league || 'Various',
        homeTeam,
        awayTeam,
        matches: validMatches.map(m => {
          const matchData: any = {
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            prediction: m.prediction,
            odds: m.odds || 1.0,
            market: m.market || 'h2h',
          };
          
          // Only add optional fields if they exist
          if (m.league) {
            matchData.league = m.league;
          }
          if (m.matchDate) {
            matchData.matchDate = new Date(m.matchDate);
          }
          
          return matchData;
        }),
      };
      
      // Only add optional fields if they exist (don't include undefined)
      if (stake !== undefined && stake !== null) {
        updateData.stake = stake;
      }
      if (potentialWin !== undefined && potentialWin !== null) {
        updateData.potentialWin = potentialWin;
      }
      
      // Filter out any undefined values before updating
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      await updateDoc(slipRef, filteredUpdateData);
      console.log(`✅ Slip ${slipId} updated with ${validMatches.length} matches`);
    } catch (error) {
      console.error('❌ Background extraction error:', error);
      // Mark as failed
      const slipRef = doc(firebaseFirestore, 'slips', slipId);
      await updateDoc(slipRef, { extractionStatus: 'failed' });
    }
  };

  /**
   * Handle publish slip
   */
  const handlePublish = async () => {
    // Validation
    if (!bookingCode.trim()) {
      showError('Please enter the booking code', 'Error');
      return;
    }
    
    if (platform === 'Other') {
      showError('Please select a betting platform', 'Error');
      return;
    }
    
    // Enhanced auth check with better error message
    if (!user) {
      showError('You must be logged in to create a slip. Please log out and log back in.', 'Authentication Error');
      return;
    }
    
    if (!userProfile) {
      showError(
        'Your profile is still loading. Please wait a moment and try again.\n\nIf this persists, please log out and log back in.',
        'Profile Loading'
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
      // Step 1: Create slip immediately with pending status
      // Parsing will happen in background
      console.log('📝 Creating slip with pending status...');
      
      // Generate temporary title
      const tempTitle = `Betting Slip - ${bookingCode}`;
      
      // Step 2: Create creator profile if needed
      try {
        const existingCreators = await FirestoreService.getCreators();
        const isCreator = existingCreators.some(creator => creator.id === user.uid);
        
        if (!isCreator) {
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
      }
      
      // Check if slip with same booking code already exists (prevent duplicates)
      const existingSlips = await FirestoreService.getSlipsByCreator(user.uid);
      const existingSlip = existingSlips.find(s => 
        s.bookingCode === bookingCode.trim() && 
        s.platform === platform &&
        s.status === 'pending' // Only check pending slips to allow retries
      );
      
      if (existingSlip) {
        Alert.alert(
          'Slip Already Exists',
          'A slip with this booking code is already being processed. Please wait for it to complete.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      // Step 3: Create slip with pending status
      const slipData: any = {
        creatorId: user.uid,
        creatorName: userProfile.displayName,
        creatorAvatar: userProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName)}&background=10B981&color=fff&size=128`,
        title: tempTitle,
        description: description.trim(),
        // Don't set odds yet - will be set after parsing
        status: 'pending', // Will become active after parsing
        extractionStatus: 'extracting', // Currently extracting
        matchDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Temporary, will be updated
        sport: 'Football',
        league: 'Various',
        bookingCode: bookingCode.trim(),
        platform,
        homeTeam: 'TBD',
        awayTeam: 'TBD',
        resultChecked: false,
        isPremium,
        purchasedBy: [],
        matches: [], // Will be populated after parsing
      };
      
      if (isPremium && price) {
        slipData.price = parseFloat(price);
      }
      
      // Create slip first
      const slipId = await FirestoreService.createSlip(slipData);
      console.log('✅ Slip created with pending status, ID:', slipId);
      
      // Step 4: Start background parsing (don't await - let it run in background)
      console.log('🔄 Starting background match extraction...');
      extractAndUpdateSlipInBackground(slipId, bookingCode, platform).catch(error => {
        console.error('❌ Background extraction failed:', error);
        // Update slip status to failed
        FirestoreService.updateSlipStatus(slipId, 'pending').catch(console.error);
      });
      
      setLoading(false);

      showSuccess(
        'Your slip has been created and is being processed. Matches will be extracted in the background.',
        'Slip Published! 🎉'
      );
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
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
      
      showError(errorMessage, 'Error');
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
                
                {parsedData.totalOdds ? (
                  <View style={styles.extractedRow}>
                    <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                      Total Odds:
                        </AppText>
                    <AppText variant="bodySmall" style={styles.oddsValue}>
                      {parsedData.totalOdds.toFixed(2)}
                        </AppText>
                      </View>
                    ) : (
                      <View style={styles.extractedRow}>
                        <AppText variant="bodySmall" color={theme.colors.text.secondary}>
                          Total Odds:
                        </AppText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="time-outline" size={12} color={theme.colors.text.secondary} />
                          <AppText variant="bodySmall" style={[styles.oddsValue, { color: theme.colors.text.secondary }]}>
                            —
                          </AppText>
                        </View>
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
                          {match.odds ? (
                            <AppText variant="bodySmall" color={theme.colors.accent.primary} style={styles.matchOdds}>
                              {match.odds.toFixed(2)}
                            </AppText>
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="time-outline" size={12} color={theme.colors.text.secondary} />
                              <AppText variant="bodySmall" color={theme.colors.text.secondary} style={styles.matchOdds}>
                                —
                              </AppText>
                            </View>
                          )}
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
              disabled={loading || !bookingCode || (isPremium && !price)}
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

