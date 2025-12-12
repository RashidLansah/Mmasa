import { firebaseFirestore, Collections } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  subscribers: number;
  winRate: number;
  totalSlips: number;
  wins?: number; // Track total wins for accurate win rate
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
  status: 'pending' | 'won' | 'lost';
  matchDate: Date;
  sport: string;
  league: string;
  stake?: number;
  potentialWin?: number;
  imageUrl?: string; // Screenshot URL (local URI or base64)
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
  verified?: boolean; // Screenshot verified
  // Premium fields
  isPremium?: boolean;
  price?: number; // Price in GHS
  purchasedBy?: string[]; // User IDs who purchased
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

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        matchDate: docSnap.data().matchDate?.toDate() || new Date(),
      })) as Slip[];
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

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        matchDate: docSnap.data().matchDate?.toDate() || new Date(),
      })) as Slip[];
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
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          matchDate: data.matchDate?.toDate() || new Date(),
        } as Slip;
      }
      return null;
    } catch (error) {
      console.error('Error fetching slip:', error);
      return null;
    }
  }

  static async createSlip(slip: Omit<Slip, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<string> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      
      // Remove undefined values (Firestore doesn't accept undefined)
      const cleanSlip = Object.fromEntries(
        Object.entries(slip).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(slipsRef, {
        ...cleanSlip,
        matchDate: Timestamp.fromDate(slip.matchDate),
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
      });
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

  static async updateCreatorStats(creatorId: string): Promise<void> {
    try {
      // Get all slips by creator
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const q = query(
        slipsRef,
        where('creatorId', '==', creatorId),
        where('resultChecked', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const slips = snapshot.docs.map(doc => doc.data());
      
      const totalSlips = slips.length;
      const wins = slips.filter(slip => slip.status === 'won').length;
      const winRate = totalSlips > 0 ? (wins / totalSlips) * 100 : 0;

      // Update creator profile
      const creatorRef = doc(firebaseFirestore, Collections.CREATORS, creatorId);
      const creatorSnap = await getDoc(creatorRef);
      
      if (creatorSnap.exists()) {
        await updateDoc(creatorRef, {
          totalSlips,
          wins,
          winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
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
      const slipRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
      await updateDoc(slipRef, {
        purchasedBy: arrayUnion(userId),
      });
    } catch (error) {
      console.error('Error purchasing slip:', error);
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

