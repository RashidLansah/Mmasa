/**
 * Results Updater Service
 * 
 * Handles updating slip results and creator statistics
 */

import { firebaseFirestore, Collections } from './firebase';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, increment } from 'firebase/firestore';

export interface SlipResultUpdate {
  slipId: string;
  homeScore: number;
  awayScore: number;
}

class ResultsUpdaterService {
  /**
   * Update a single slip's result
   */
  async updateSlipResult(slipId: string, homeScore: number, awayScore: number): Promise<void> {
    try {
      const slipRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
      const slipDoc = await getDocs(query(collection(firebaseFirestore, Collections.SLIPS), where('__name__', '==', slipId)));
      
      if (slipDoc.empty) {
        throw new Error('Slip not found');
      }

      const slipData = slipDoc.docs[0].data();
      const prediction = slipData.prediction;
      
      // Determine if prediction was correct
      let status: 'won' | 'lost' = 'lost';
      
      if (prediction === 'home' && homeScore > awayScore) {
        status = 'won';
      } else if (prediction === 'away' && awayScore > homeScore) {
        status = 'won';
      } else if (prediction === 'draw' && homeScore === awayScore) {
        status = 'won';
      }

      // Update slip
      await updateDoc(slipRef, {
        status,
        homeScore,
        awayScore,
        resultChecked: true,
      });

      // Update creator stats
      await this.updateCreatorStats(slipData.creatorId, status);

      console.log(`Slip ${slipId} updated: ${status}`);
    } catch (error) {
      console.error('Error updating slip result:', error);
      throw error;
    }
  }

  /**
   * Update creator statistics after slip result
   */
  private async updateCreatorStats(creatorId: string, result: 'won' | 'lost'): Promise<void> {
    try {
      const creatorRef = doc(firebaseFirestore, Collections.CREATORS, creatorId);
      
      // Get all checked slips by this creator
      const slipsQuery = query(
        collection(firebaseFirestore, Collections.SLIPS),
        where('creatorId', '==', creatorId),
        where('resultChecked', '==', true)
      );
      const slipsSnapshot = await getDocs(slipsQuery);
      
      const totalSlips = slipsSnapshot.docs.length;
      const wins = slipsSnapshot.docs.filter(doc => doc.data().status === 'won').length;
      const winRate = totalSlips > 0 ? (wins / totalSlips) * 100 : 0;

      // Check if creator exists
      const creatorDoc = await getDoc(creatorRef);

      if (creatorDoc.exists()) {
        await updateDoc(creatorRef, {
          totalSlips,
          wins,
          winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
        });
        console.log(`Creator ${creatorId} stats updated: ${totalSlips} slips, ${wins} wins, ${winRate.toFixed(1)}% win rate`);
      } else {
        console.log('Creator not in creators collection yet:', creatorId);
      }
    } catch (error) {
      console.error('Error updating creator stats:', error);
      // Don't throw - slip update should succeed even if stats fail
    }
  }

  /**
   * Check and update pending slips that have match IDs
   */
  async checkPendingSlips(): Promise<number> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const q = query(
        slipsRef,
        where('status', '==', 'pending'),
        where('matchId', '!=', null),
        where('resultChecked', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      console.log(`Found ${snapshot.docs.length} pending slips to check`);
      
      // TODO: For each slip, fetch result from sports API and update
      // This requires integrating a scores API (e.g., API-Football)
      
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error checking pending slips:', error);
      return 0;
    }
  }

  /**
   * Get all pending slips (for manual review)
   */
  async getPendingSlips(): Promise<any[]> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const q = query(
        slipsRef,
        where('status', '==', 'pending'),
        where('resultChecked', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        matchDate: doc.data().matchDate?.toDate?.() || new Date(doc.data().matchDate),
      }));
    } catch (error) {
      console.error('Error fetching pending slips:', error);
      return [];
    }
  }
}

export const ResultsUpdater = new ResultsUpdaterService();

