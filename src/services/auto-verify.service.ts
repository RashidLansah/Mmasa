/**
 * Auto Verification Service
 * 
 * Automatically verifies slip results using:
 * - API-Football for match scores
 * - SportsAPI for bet verification logic
 */

import { firebaseFirestore, Collections } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { SportsAPI } from './sports-api.service';
import { ResultsUpdater } from './results-updater.service';

interface VerificationResult {
  slipId: string;
  verified: boolean;
  status?: 'won' | 'lost';
  error?: string;
}

class AutoVerifyService {
  /**
   * Verify a single slip using API
   */
  async verifySlip(slipId: string): Promise<VerificationResult> {
    try {
      // Get slip from Firestore
      const slipRef = doc(firebaseFirestore, Collections.SLIPS, slipId);
      const slipQuery = query(
        collection(firebaseFirestore, Collections.SLIPS),
        where('__name__', '==', slipId)
      );
      const slipSnapshot = await getDocs(slipQuery);

      if (slipSnapshot.empty) {
        return { slipId, verified: false, error: 'Slip not found' };
      }

      const slipData = slipSnapshot.docs[0].data();

      // Check if slip has fixture ID for API verification
      if (!slipData.fixtureId) {
        // Try to find fixture by team names
        const fixtureId = await SportsAPI.searchFixtureByTeams(
          slipData.homeTeam,
          slipData.awayTeam,
          slipData.matchDate?.toDate?.() || new Date(slipData.matchDate)
        );

        if (fixtureId) {
          // Save fixture ID for future use
          await updateDoc(slipRef, { fixtureId });
          slipData.fixtureId = fixtureId;
        } else {
          return { slipId, verified: false, error: 'Match not found in API' };
        }
      }

      // Get match result from API
      const result = await SportsAPI.getMatchResult(slipData.fixtureId);

      if (!result) {
        return { slipId, verified: false, error: 'Result not available yet' };
      }

      if (!result.completed) {
        return { slipId, verified: false, error: 'Match not finished' };
      }

      // Verify bet based on type
      const betType = slipData.betType || 'h2h';
      const prediction = slipData.prediction || 'home';
      const line = slipData.line;

      const status = SportsAPI.verifyBetResult(
        betType,
        prediction,
        result.home_score,
        result.away_score,
        line
      );

      // Update slip with result
      await updateDoc(slipRef, {
        status,
        homeScore: result.home_score,
        awayScore: result.away_score,
        resultChecked: true,
        autoVerified: true,
      });

      // Update creator stats
      await ResultsUpdater['updateCreatorStats'](slipData.creatorId, status);

      return { slipId, verified: true, status };
    } catch (error: any) {
      console.error('Error verifying slip:', error);
      return { slipId, verified: false, error: error.message };
    }
  }

  /**
   * Verify all pending slips
   */
  async verifyPendingSlips(): Promise<VerificationResult[]> {
    try {
      // Get all pending slips that are past match date
      const now = new Date();
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const q = query(
        slipsRef,
        where('status', '==', 'pending'),
        where('resultChecked', '==', false)
      );

      const snapshot = await getDocs(q);
      const results: VerificationResult[] = [];

      console.log(`Found ${snapshot.docs.length} pending slips to verify`);

      for (const docSnap of snapshot.docs) {
        const slipData = docSnap.data();
        const matchDate = slipData.matchDate?.toDate?.() || new Date(slipData.matchDate);

        // Only verify if match was more than 2 hours ago (to ensure it's finished)
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        
        if (matchDate < twoHoursAgo) {
          const result = await this.verifySlip(docSnap.id);
          results.push(result);

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter(r => r.verified).length;
      console.log(`✅ Verified ${successCount} out of ${results.length} slips`);

      return results;
    } catch (error) {
      console.error('Error verifying pending slips:', error);
      return [];
    }
  }

  /**
   * Verify slips for a specific creator
   */
  async verifyCreatorSlips(creatorId: string): Promise<VerificationResult[]> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      const q = query(
        slipsRef,
        where('creatorId', '==', creatorId),
        where('status', '==', 'pending'),
        where('resultChecked', '==', false)
      );

      const snapshot = await getDocs(q);
      const results: VerificationResult[] = [];

      for (const docSnap of snapshot.docs) {
        const result = await this.verifySlip(docSnap.id);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;
    } catch (error) {
      console.error('Error verifying creator slips:', error);
      return [];
    }
  }

  /**
   * Get verification summary
   */
  async getVerificationSummary(): Promise<{
    totalPending: number;
    verifiable: number;
    alreadyVerified: number;
  }> {
    try {
      const slipsRef = collection(firebaseFirestore, Collections.SLIPS);
      
      const pendingQuery = query(
        slipsRef,
        where('status', '==', 'pending'),
        where('resultChecked', '==', false)
      );
      
      const verifiedQuery = query(
        slipsRef,
        where('resultChecked', '==', true)
      );

      const [pendingSnapshot, verifiedSnapshot] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(verifiedQuery)
      ]);

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const verifiable = pendingSnapshot.docs.filter(doc => {
        const matchDate = doc.data().matchDate?.toDate?.() || new Date(doc.data().matchDate);
        return matchDate < twoHoursAgo;
      }).length;

      return {
        totalPending: pendingSnapshot.docs.length,
        verifiable,
        alreadyVerified: verifiedSnapshot.docs.length
      };
    } catch (error) {
      console.error('Error getting verification summary:', error);
      return { totalPending: 0, verifiable: 0, alreadyVerified: 0 };
    }
  }
}

export const AutoVerify = new AutoVerifyService();

