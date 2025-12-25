import { firebaseFirestore, Collections } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  subscribers: number;
  winRate: number;
  totalSlips: number;
  wins?: number; // Track total wins for accurate win rate
  accuracy?: number; // Weighted performance metric (0-100)
  roi?: number; // Return on investment - average earnings per premium slip (GH₵)
  avgEarningsPerSlip?: number; // Average earnings per premium slip (GH₵) - same as roi but clearer name
  verifiedStatus: 'verified' | 'unverified';
  bio?: string;
  description?: string;
  createdAt: Date;
}

export interface Slip {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  description: string;
  odds: number;
  status: 'pending' | 'active' | 'expired' | 'won' | 'lost';
  extractionStatus?: 'extracting' | 'completed' | 'failed'; // Track extraction state
  matchDate: Date;
  sport: string;
  league: string;
  stake?: number;
  potentialWin?: number;
  imageUrl?: string; // Deprecated: No longer used (OCR removed)
  createdAt: Date;
  likes: number;
  comments: number;
  // Match tracking fields
  matchId?: string; // API match ID for auto-tracking
  fixtureId?: number; // API-Football fixture ID for automatic verification
  homeTeam?: string;
  awayTeam?: string;
  prediction?: string; // User's prediction (e.g., 'home', 'away', 'draw', 'over', 'under')
  homeScore?: number; // Final score (filled when match completes)
  awayScore?: number;
  resultChecked?: boolean; // Has result been verified
  autoVerified?: boolean; // True if verified by API, false if manual
  // Advanced bet types
  betType?: 'h2h' | 'totals' | 'spreads' | 'btts' | 'double_chance' | 'correct_score';
  line?: number; // For totals (e.g., 2.5) or spreads (e.g., -1.5)
  // Betting platform fields
  bookingCode?: string; // Betting platform booking code
  platform?: 'SportyBet' | 'Bet9ja' | '1xBet' | 'Betway' | 'MozzartBet' | 'Other';
  verified?: boolean; // Deprecated: No longer used (OCR removed)
  // Premium fields
  isPremium?: boolean;
  price?: number; // Price in GHS
  purchasedBy?: string[]; // User IDs who purchased
  // Extracted matches from booking code
  matches?: Array<{
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    odds: number;
    market: string;
    matchDate?: Date; // Individual match date/time
    league?: string;
    fixtureId?: number; // API-Football fixture ID for automatic verification
    unverified?: boolean; // True if match not found in API-Football
  }>;
  // Expiration: slip expires 15 minutes before first match
  expiresAt?: Date;
  // Derived expiry status (computed client-side, not stored in Firestore)
  expiryStatus?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface Subscription {
  id: string;
  userId: string;
  creatorId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  amount: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'slip_update' | 'new_slip' | 'subscription' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  relatedId?: string; // slip ID, creator ID, etc.
}

export interface MobileMoneyAccount {
  id: string;
  userId: string;
  provider: 'MTN' | 'Vodafone' | 'AirtelTigo';
  phoneNumber: string;
  accountName: string;
  isVerified: boolean;
  isPrimary: boolean;
  recipientCode?: string; // Paystack Transfer Recipient Code
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'earning' | 'withdrawal' | 'purchase' | 'platform_fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  slipId?: string;
  reference?: string; // Payment reference from Paystack
  platformFee?: number; // 10% platform fee (for earnings)
  availableAt?: Date; // When funds become available for withdrawal (5 days hold)
  createdAt: Date;
  completedAt?: Date;
}

export class FirestoreService {
  // ========== CREATORS ==========
  
  static async getCreators(): Promise<Creator[]> {
    try {
      const creatorsRef = collection(firebaseFirestore, Collections.CREATORS);
      const q = query(creatorsRef, orderBy('subscribers', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as Creator[];
    } catch (error) {
      console.error('Error fetching creators:', error);
      return [];
    }
  }

  static async getCreator(creatorId: string): Promise<Creator | null> {
    try {
      const docRef = doc(firebaseFirestore, Collections.CREATORS, creatorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Creator;
      }
      return null;
    } catch (error) {
      console.error('Error fetching creator:', error);
      return null;
    }
  }

  static async createCreator(creator: Omit<Creator, 'createdAt'>): Promise<void> {
    try {
      const docRef = doc(firebaseFirestore, Collections.CREATORS, creator.id);
      await setDoc(docRef, {
        ...creator,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating creator:', error);
      throw new Error('Failed to create creator profile');
    }
  }

  // ========== SLIPS ==========

  static async getSlips(limitCount: number = 20): Promise<Slip[]> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const q = query(slipsRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);

      const now = new Date();
      return snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          const slip: Slip = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            matchDate: data.matchDate?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate(),
            // Convert match dates in matches array
            matches: data.matches?.map((m: any) => ({
              ...m,
              matchDate: m.matchDate?.toDate ? m.matchDate.toDate() : (m.matchDate ? new Date(m.matchDate) : undefined),
            })),
          } as Slip;
          
          // Filter out won, lost, and pending slips
          if (slip.status === 'expired' || slip.status === 'won' || slip.status === 'lost' || slip.status === 'pending') {
            return null;
          }
          
          // Only show active slips
          if (slip.status !== 'active') {
            return null;
          }
          
          // Also check if slip should be marked as expired (even if status is still 'active')
          // This handles cases where status hasn't been updated yet
          // Use getTime() for consistent UTC timestamp comparison
          if (slip.expiresAt) {
            const expiresAtTime = slip.expiresAt instanceof Date ? slip.expiresAt.getTime() : new Date(slip.expiresAt).getTime();
            if (expiresAtTime <= now.getTime()) {
              return null; // Expired, don't show in feed
            }
          }
          
          return slip;
        })
        .filter((slip): slip is Slip => slip !== null);
    } catch (error) {
      console.error('Error fetching slips:', error);
      return [];
    }
  }

  static async getSlipsByCreator(creatorId: string): Promise<Slip[]> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const q = query(
        slipsRef,
        where('creatorId', '==', creatorId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      // Don't filter expired slips - creators should see their history
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          matchDate: data.matchDate?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
          // Convert match dates in matches array - ensure it's an array
          matches: Array.isArray(data.matches) ? data.matches.map((m: any) => ({
            ...m,
            matchDate: m.matchDate?.toDate ? m.matchDate.toDate() : (m.matchDate ? new Date(m.matchDate) : undefined),
          })) : undefined,
        } as Slip;
      });
    } catch (error) {
      console.error('Error fetching creator slips:', error);
      return [];
    }
  }

  static async getSlip(slipId: string): Promise<Slip | null> {
    try {
      const docRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const matches = Array.isArray(data.matches) ? data.matches.map((m: any) => ({
          ...m,
          matchDate: m.matchDate?.toDate ? m.matchDate.toDate() : (m.matchDate ? new Date(m.matchDate) : undefined),
        })) : undefined;
        
        console.log(`📖 Reading slip ${docSnap.id}:`, {
          hasMatches: !!data.matches,
          matchesLength: Array.isArray(data.matches) ? data.matches.length : 0,
          matchesType: typeof data.matches,
          matches: matches,
        });
        
        const slip: Slip = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          matchDate: data.matchDate?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
          // Convert match dates in matches array - ensure it's an array
          matches,
        } as Slip;
        
        // Attach derived expiry status (computed client-side)
        return slip;
      }
      return null;
    } catch (error) {
      console.error('Error fetching slip:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time updates for slips
   * Returns unsubscribe function
   */
  static subscribeToSlips(
    callback: (slips: Slip[]) => void,
    limitCount: number = 20
  ): Unsubscribe {
    const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
    const q = query(slipsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
      return onSnapshot(q, (snapshot) => {
      const nowMs = Date.now();
      
      const slips = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          const slip: Slip = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            matchDate: data.matchDate?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate(),
            // Convert match dates in matches array - ensure it's an array
            matches: Array.isArray(data.matches) ? data.matches.map((m: any) => ({
              ...m,
              matchDate: m.matchDate?.toDate ? m.matchDate.toDate() : (m.matchDate ? new Date(m.matchDate) : undefined),
            })) : undefined,
          } as Slip;
          
          // Filter out won, lost, and pending slips
          if (slip.status === 'won' || slip.status === 'lost' || slip.status === 'pending') {
            return null;
          }
          
          // Only show active slips
          if (slip.status && slip.status !== 'active') {
            return null;
          }
          
          return slip;
        })
        .filter((slip): slip is Slip => slip !== null);
      
      callback(slips);
    }, (error) => {
      console.error('Error in slips subscription:', error);
      callback([]);
    });
  }

  /**
   * Subscribe to real-time updates for a single slip
   * Returns unsubscribe function
   */
  static subscribeToSlip(
    slipId: string,
    callback: (slip: Slip | null) => void
  ): Unsubscribe {
    const slipRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
    
    return onSnapshot(slipRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const slip: Slip = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          matchDate: data.matchDate?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
          // Convert match dates in matches array - ensure it's an array
          matches: Array.isArray(data.matches) ? data.matches.map((m: any) => ({
            ...m,
            matchDate: m.matchDate?.toDate ? m.matchDate.toDate() : (m.matchDate ? new Date(m.matchDate) : undefined),
          })) : undefined,
        } as Slip;
        
        callback(slip);
      } else {
        callback(null); // Slip was deleted
      }
    }, (error) => {
      console.error('Error in slip subscription:', error);
      callback(null);
    });
  }

  /**
   * Subscribe to real-time updates for creator's slips
   * Returns unsubscribe function
   */
  static subscribeToCreatorSlips(
    creatorId: string,
    callback: (slips: Slip[]) => void
  ): Unsubscribe {
    const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
    const q = query(
      slipsRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const slipsMap = new Map<string, Slip>(); // Use Map to deduplicate by booking code
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const slip: Slip = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          matchDate: data.matchDate?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
          // Convert match dates in matches array - ensure it's an array
          matches: Array.isArray(data.matches) ? data.matches.map((m: any) => ({
            ...m,
            matchDate: m.matchDate?.toDate ? m.matchDate.toDate() : (m.matchDate ? new Date(m.matchDate) : undefined),
          })) : undefined,
        } as Slip;
        
        // Attach derived expiry status (computed client-side)
        // For creator history, we show all slips including expired ones
        // Deduplicate: if same booking code and platform, keep the most recent one
        if (slip.bookingCode && slip.platform) {
          const key = `${slip.bookingCode}|${slip.platform}`;
          const existing = slipsMap.get(key);
          if (!existing || slip.createdAt > existing.createdAt) {
            slipsMap.set(key, slip);
          }
        } else {
          // If no booking code, use slip ID as key
          slipsMap.set(slip.id, slip);
        }
      });
      
      // Convert map to array and sort by creation date
      const uniqueSlips = Array.from(slipsMap.values()).sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      callback(uniqueSlips);
    }, (error) => {
      console.error('Error in creator slips subscription:', error);
      callback([]);
    });
  }

  static async createSlip(slip: Omit<Slip, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<string> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      
      // Remove undefined values (Firestore doesn't accept undefined)
      const cleanSlip = Object.fromEntries(
        Object.entries(slip).filter(([_, value]) => value !== undefined)
      );
      
      // Build slip data object, only including defined values
      const slipData: any = {
        ...cleanSlip,
        matchDate: Timestamp.fromDate(slip.matchDate),
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
      };
      
      
      // Convert match dates in matches array to Timestamps (remove undefined values)
      if (slip.matches && slip.matches.length > 0) {
        console.log(`📝 Saving slip with ${slip.matches.length} matches`);
        slipData.matches = slip.matches.map(m => {
          const matchData: any = {
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            prediction: m.prediction,
            odds: m.odds,
            // Include fixtureId if present
            ...(m.fixtureId && { fixtureId: m.fixtureId }),
            market: m.market,
          };
          // Only add matchDate if it exists
          if (m.matchDate) {
            matchData.matchDate = Timestamp.fromDate(m.matchDate);
          }
          // Only add league if it exists
          if (m.league) {
            matchData.league = m.league;
          }
          return matchData;
        });
        console.log(`✅ Matches saved:`, JSON.stringify(slipData.matches, null, 2));
      } else {
        console.warn(`⚠️ No matches to save for slip`);
      }
      
      const docRef = await addDoc(slipsRef, slipData);
      console.log(`✅ Slip created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating slip:', error);
      throw new Error('Failed to create slip');
    }
  }

  static async updateSlipStatus(slipId: string, status: 'pending' | 'won' | 'lost'): Promise<void> {
    try {
      const docRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
      await updateDoc(docRef, { 
        status,
        resultChecked: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating slip status:', error);
      throw new Error('Failed to update slip status');
    }
  }

  /**
   * Delete a slip (only creator can delete their own slips)
   */
  static async deleteSlip(slipId: string, creatorId: string): Promise<void> {
    try {
      // Verify the slip belongs to the creator
      const slipData = await this.getSlip(slipId);
      if (!slipData) {
        throw new Error('Slip not found');
      }
      if (slipData.creatorId !== creatorId) {
        throw new Error('You can only delete your own slips');
      }

      const docRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
      await deleteDoc(docRef);
      
      // Update creator stats after deletion
      await this.updateCreatorStats(creatorId);
    } catch (error) {
      console.error('Error deleting slip:', error);
      throw new Error('Failed to delete slip');
    }
  }

  /**
   * Calculate comprehensive creator statistics
   * Returns: { winRate, accuracy, roi, avgEarningsPerSlip, totalSlips, wins, losses }
   */
  static async calculateCreatorStats(creatorId: string): Promise<{
    winRate: number;
    accuracy: number;
    roi: number;
    avgEarningsPerSlip: number;
    totalSlips: number;
    wins: number;
    losses: number;
  }> {
    try {
      // 1. Get all verified slips for win rate and accuracy
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const verifiedSlipsQuery = query(
        slipsRef,
        where('creatorId', '==', creatorId),
        where('resultChecked', '==', true)
      );
      const verifiedSnapshot = await getDocs(verifiedSlipsQuery);
      const verifiedSlips = verifiedSnapshot.docs.map(doc => doc.data());
      
      // Calculate Win Rate
      const totalSlips = verifiedSlips.length;
      const wins = verifiedSlips.filter(slip => slip.status === 'won').length;
      const losses = verifiedSlips.filter(slip => slip.status === 'lost').length;
      const winRate = totalSlips > 0 ? (wins / totalSlips) * 100 : 0;
      
      // Calculate Accuracy (weighted by odds)
      const wonSlips = verifiedSlips.filter(slip => slip.status === 'won');
      const weightedWins = wonSlips.reduce((sum, slip) => {
        const odds = slip.odds || 1.0; // Default to 1.0 if missing
        return sum + Math.max(odds, 1.0); // Ensure minimum 1.0
      }, 0);
      
      const weightedTotal = verifiedSlips.reduce((sum, slip) => {
        const odds = slip.odds || 1.0;
        return sum + Math.max(odds, 1.0);
      }, 0);
      
      const accuracy = weightedTotal > 0 ? (weightedWins / weightedTotal) * 100 : 0;
      
      // 2. Get earnings for ROI calculation
      const transactionsRef = collection(firebaseFirestore, Collections.TRANSACTIONS);
      const earningsQuery = query(
        transactionsRef,
        where('userId', '==', creatorId),
        where('type', '==', 'earning'),
        where('status', '==', 'completed')
      );
      const earningsSnapshot = await getDocs(earningsQuery);
      const totalEarnings = earningsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);
      
      // Calculate platform fees (10%)
      const platformFees = totalEarnings * 0.10;
      const netEarnings = totalEarnings - platformFees;
      
      // 3. Get premium slips count
      const premiumSlipsQuery = query(
        slipsRef,
        where('creatorId', '==', creatorId),
        where('isPremium', '==', true)
      );
      const premiumSnapshot = await getDocs(premiumSlipsQuery);
      const totalPremiumSlips = premiumSnapshot.docs.length;
      
      // Calculate ROI (average earnings per premium slip)
      const avgEarningsPerSlip = totalPremiumSlips > 0 ? netEarnings / totalPremiumSlips : 0;
      const roi = avgEarningsPerSlip; // Same value, roi is just an alias for clarity
      
      return {
        winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
        accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal
        roi: Math.round(avgEarningsPerSlip * 100) / 100, // Round to 2 decimals for currency
        avgEarningsPerSlip: Math.round(avgEarningsPerSlip * 100) / 100,
        totalSlips,
        wins,
        losses,
      };
    } catch (error) {
      console.error('Error calculating creator stats:', error);
      // Return zeros on error
      return {
        winRate: 0,
        accuracy: 0,
        roi: 0,
        avgEarningsPerSlip: 0,
        totalSlips: 0,
        wins: 0,
        losses: 0,
      };
    }
  }

  /**
   * Check and update expired slips automatically
   * Should be called periodically (e.g., every minute) or when viewing slips
   */
  static async checkAndUpdateExpiredSlips(): Promise<number> {
    try {
      const now = new Date();
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      
      // Get all active slips that might be expired
      const q = query(
        slipsRef,
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      let updatedCount = 0;
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const slipRef = doc(firebaseFirestore, Collections.SLIPS, docSnap.id);
        
        let shouldExpire = false;
        
        // Check expiresAt if available
        if (data.expiresAt) {
          const expiresAt = data.expiresAt.toDate();
          if (expiresAt <= now) {
            shouldExpire = true;
          }
        } else {
          // For old slips without expiresAt, check match date
          if (data.matchDate) {
            const matchDate = data.matchDate.toDate();
            let earliestMatchDate: Date | null = null;
            
            // Check matches array for accumulator slips
            if (Array.isArray(data.matches) && data.matches.length > 0) {
              const matchDates = data.matches
                .map((m: any) => m.matchDate?.toDate?.() || (m.matchDate ? new Date(m.matchDate) : null))
                .filter((d: Date | null) => d !== null && !isNaN(d.getTime()))
                .sort((a: Date, b: Date) => a.getTime() - b.getTime());
              
              if (matchDates.length > 0) {
                earliestMatchDate = matchDates[0];
              }
            }
            
            const dateToCheck = earliestMatchDate || matchDate;
            const tenMinutesBeforeMatch = new Date(dateToCheck.getTime() - 10 * 60 * 1000);
            if (tenMinutesBeforeMatch <= now) {
              shouldExpire = true;
            }
          }
        }
        
        if (shouldExpire) {
          await updateDoc(slipRef, { status: 'expired' });
          updatedCount++;
          console.log(`✅ Updated slip ${docSnap.id} to expired status`);
        }
      }
      
      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} slip(s) to expired status`);
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error checking expired slips:', error);
      return 0;
    }
  }

  static async updateCreatorStats(creatorId: string): Promise<void> {
    try {
      const stats = await this.calculateCreatorStats(creatorId);

      // Update creator profile
      const creatorRef = doc(firebaseFirestore, Collections.CREATORS, creatorId);
      const creatorSnap = await getDoc(creatorRef);
      
      if (creatorSnap.exists()) {
        await updateDoc(creatorRef, {
          totalSlips: stats.totalSlips,
          wins: stats.wins,
          winRate: stats.winRate,
          accuracy: stats.accuracy,
          roi: stats.roi,
          avgEarningsPerSlip: stats.avgEarningsPerSlip,
        });
        
        console.log(`Creator ${creatorId} stats updated:`, {
          winRate: `${stats.winRate}%`,
          accuracy: `${stats.accuracy}%`,
          roi: `GH₵ ${stats.roi.toFixed(2)}`,
          totalSlips: stats.totalSlips,
        });
      }
    } catch (error) {
      console.error('Error updating creator stats:', error);
      throw new Error('Failed to update creator stats');
    }
  }

  // ========== SUBSCRIPTIONS ==========

  static async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const subsRef = collection(firebaseFirestore, Collections.SUBSCRIPTIONS);
      const q = query(
        subsRef,
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        startDate: docSnap.data().startDate?.toDate() || new Date(),
        endDate: docSnap.data().endDate?.toDate() || new Date(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as Subscription[];
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  static async subscribeToCreator(userId: string, creatorId: string, amount: number): Promise<void> {
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      const subsRef = collection(firebaseFirestore, Collections.SUBSCRIPTIONS);
      await addDoc(subsRef, {
        userId,
        creatorId,
        status: 'active',
        startDate: serverTimestamp(),
        endDate: Timestamp.fromDate(endDate),
        amount,
        createdAt: serverTimestamp(),
      });

      // Update user's subscribed creators
      const userRef = doc(firebaseFirestore, Collections.USERS, userId);
      await updateDoc(userRef, {
        subscribedCreators: arrayUnion(creatorId),
      });

      // Update creator's subscriber count
      const creatorRef = doc(firebaseFirestore, Collections.CREATORS, creatorId);
      await updateDoc(creatorRef, {
        subscribers: increment(1),
      });
    } catch (error) {
      console.error('Error subscribing to creator:', error);
      throw new Error('Failed to subscribe');
    }
  }

  // ========== NOTIFICATIONS ==========

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifRef = collection(firebaseFirestore, Collections.NOTIFICATIONS);
      const q = query(
        notifRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(firebaseFirestore, Collections.NOTIFICATIONS, notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  static async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const notifRef = collection(firebaseFirestore, Collections.NOTIFICATIONS);
      const q = query(
        notifRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);

      // Update each document individually (batching not available in the current import)
      const updatePromises = snapshot.docs.map(docSnap => 
        updateDoc(doc(firebaseFirestore, Collections.NOTIFICATIONS, docSnap.id), { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // ========== MOBILE MONEY ACCOUNTS ==========

  static async addMobileMoneyAccount(account: Omit<MobileMoneyAccount, 'id' | 'createdAt'>): Promise<string> {
    try {
      const accountsRef = collection(firebaseFirestore, Collections.MOBILE_MONEY_ACCOUNTS);
      
      // If this is primary, unset other primary accounts
      if (account.isPrimary) {
        const q = query(
          accountsRef,
          where('userId', '==', account.userId),
          where('isPrimary', '==', true)
        );
        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs.map(docSnap =>
          updateDoc(doc(firebaseFirestore, Collections.MOBILE_MONEY_ACCOUNTS, docSnap.id), { isPrimary: false })
        );
        await Promise.all(updatePromises);
      }

      const docRef = await addDoc(accountsRef, {
        ...account,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding mobile money account:', error);
      throw new Error('Failed to add account');
    }
  }

  static async getUserMobileMoneyAccounts(userId: string): Promise<MobileMoneyAccount[]> {
    try {
      const accountsRef = collection(firebaseFirestore, Collections.MOBILE_MONEY_ACCOUNTS);
      const q = query(accountsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as MobileMoneyAccount[];
    } catch (error) {
      console.error('Error fetching mobile money accounts:', error);
      return [];
    }
  }

  // ========== TRANSACTIONS ==========

  static async purchaseSlip(slipId: string, userId: string): Promise<void> {
    try {
      // First, get the slip to check expiry (defensive check - server-side is authoritative)
      const slip = await this.getSlip(slipId);
      if (!slip) {
        throw new Error('Slip not found');
      }
      
      // Check if slip is expired - expiresAt is the single source of truth
      if (slip.expiresAt) {
        const expiresAtMs = slip.expiresAt instanceof Date ? slip.expiresAt.getTime() : new Date(slip.expiresAt).getTime();
        const nowMs = Date.now();
        if (expiresAtMs <= nowMs) {
          throw new Error('SLIP_EXPIRED: This slip has expired and can no longer be purchased.');
        }
      }
      
      const slipRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
      await updateDoc(slipRef, {
        purchasedBy: arrayUnion(userId),
      });
    } catch (error: any) {
      console.error('Error purchasing slip:', error);
      // Re-throw with original message if it's an expiry error
      if (error.message && error.message.includes('SLIP_EXPIRED')) {
        throw error;
      }
      throw new Error('Failed to purchase slip');
    }
  }

  static async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const transactionsRef = collection(firebaseFirestore, Collections.TRANSACTIONS);
      const docRef = await addDoc(transactionsRef, {
        ...transaction,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const transactionRef = doc(firebaseFirestore, Collections.TRANSACTIONS, transactionId);
      await updateDoc(transactionRef, updates);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(firebaseFirestore, Collections.TRANSACTIONS);
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        completedAt: docSnap.data().completedAt?.toDate(),
        availableAt: docSnap.data().availableAt?.toDate(),
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // ========== UTILITY ==========

  static async initializeCollections(): Promise<void> {
    // This would be called once to set up initial data
    // In production, you'd use Firebase Admin SDK or Firebase Console to set this up
    console.log('Initialize collections if needed');
  }
}

