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

      // Check if slip has multiple matches (accumulator) or single match
      const hasMatchesArray = Array.isArray(slipData.matches) && slipData.matches.length > 0;
      
      if (hasMatchesArray) {
        // Handle accumulator slips with multiple matches
        return await this.verifyAccumulatorSlip(slipId, slipData, slipRef);
      } else {
        // Handle single match slips (legacy format)
        return await this.verifySingleMatchSlip(slipId, slipData, slipRef);
      }
    } catch (error: any) {
      console.error('Error verifying slip:', error);
      return { slipId, verified: false, error: error.message };
    }
  }

  /**
   * Verify a single match slip
   */
  private async verifySingleMatchSlip(
    slipId: string,
    slipData: any,
    slipRef: any
  ): Promise<VerificationResult> {
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
  }

  /**
   * Verify an accumulator slip with multiple matches
   */
  private async verifyAccumulatorSlip(
    slipId: string,
    slipData: any,
    slipRef: any
  ): Promise<VerificationResult> {
    try {
      const matches = slipData.matches || [];
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    // Check all matches to see if they're finished
    const matchResults: Array<{
      match: any;
      result: any;
      status: 'won' | 'lost' | 'pending';
    }> = [];
    
    let allMatchesFinished = true;
    let allMatchesWon = true;
    
    for (const match of matches) {
      const matchDate = match.matchDate?.toDate?.() || new Date(match.matchDate);
      
      // Skip if match hasn't happened yet or is too recent
      if (matchDate > twoHoursAgo) {
        allMatchesFinished = false;
        matchResults.push({
          match,
          result: null,
          status: 'pending',
        });
        continue;
      }
      
      // Get fixture ID for this match
      let fixtureId = match.fixtureId;
      
      if (!fixtureId) {
        // Try to find fixture by team names
        fixtureId = await SportsAPI.searchFixtureByTeams(
          match.homeTeam,
          match.awayTeam,
          matchDate
        );
        
        if (fixtureId) {
          // Update the match with fixture ID
          const matchesArray = [...matches];
          const matchIndex = matchesArray.findIndex(
            m => m.homeTeam === match.homeTeam && m.awayTeam === match.awayTeam
          );
          if (matchIndex >= 0) {
            matchesArray[matchIndex] = { ...matchesArray[matchIndex], fixtureId };
            await updateDoc(slipRef, { matches: matchesArray });
          }
        } else {
          allMatchesFinished = false;
          matchResults.push({
            match,
            result: null,
            status: 'pending',
          });
          continue;
        }
      }
      
      // Get match result from API
      const result = await SportsAPI.getMatchResult(fixtureId);
      
      if (!result || !result.completed) {
        allMatchesFinished = false;
        matchResults.push({
          match,
          result: null,
          status: 'pending',
        });
        continue;
      }
      
      // Verify this match's prediction
      const betType = match.market === 'h2h' ? 'h2h' : (slipData.betType || 'h2h');
      const prediction = match.prediction?.toLowerCase() || 'home';
      const line = match.line;
      
      const matchStatus = SportsAPI.verifyBetResult(
        betType,
        prediction,
        result.home_score,
        result.away_score,
        line
      );
      
      if (matchStatus === 'lost') {
        allMatchesWon = false;
      }
      
      matchResults.push({
        match,
        result,
        status: matchStatus,
      });
    }
    
    // If not all matches are finished, can't verify yet
    if (!allMatchesFinished) {
      return { 
        slipId, 
        verified: false, 
        error: 'Not all matches have finished yet' 
      };
    }
    
    // Determine overall slip status
    // For accumulator: all matches must win for slip to win
    const overallStatus: 'won' | 'lost' = allMatchesWon ? 'won' : 'lost';
    
    // Update slip with result
    // Use first match's scores for backward compatibility
    const firstResult = matchResults.find(mr => mr.result)?.result;
    await updateDoc(slipRef, {
      status: overallStatus,
      homeScore: firstResult?.home_score,
      awayScore: firstResult?.away_score,
      resultChecked: true,
      autoVerified: true,
      matches: matches.map((m: any, index: number) => ({
        ...m,
        homeScore: matchResults[index]?.result?.home_score,
        awayScore: matchResults[index]?.result?.away_score,
      })),
    });
    
      // Update creator stats
      await ResultsUpdater['updateCreatorStats'](slipData.creatorId, overallStatus);
      
      return { slipId, verified: true, status: overallStatus };
    } catch (error: any) {
      console.error('Error verifying accumulator slip:', error);
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
        
        // For accumulator slips, check if all matches are finished
        // For single match slips, check the main matchDate
        const hasMatchesArray = Array.isArray(slipData.matches) && slipData.matches.length > 0;
        
        let shouldVerify = false;
        
        if (hasMatchesArray) {
          // For accumulator: check if earliest match was more than 2 hours ago
          const matches = slipData.matches || [];
          const earliestMatch = matches
            .map((m: any) => m.matchDate?.toDate?.() || new Date(m.matchDate))
            .filter((d: Date) => !isNaN(d.getTime()))
            .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];
          
          if (earliestMatch) {
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            shouldVerify = earliestMatch < twoHoursAgo;
          }
        } else {
          // For single match: check main matchDate
          const matchDate = slipData.matchDate?.toDate?.() || new Date(slipData.matchDate);
          const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          shouldVerify = matchDate < twoHoursAgo;
        }
        
        if (shouldVerify) {
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

