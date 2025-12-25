/**
 * Team Alias Service
 * 
 * Caches team name mappings to API-Football team IDs
 * Reduces API calls and improves matching reliability
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { firebaseFirestore } from './firebase';

export interface TeamAlias {
  id: string; // Document ID (normalized team name)
  providerName: string; // e.g., "SportyBet"
  rawName: string; // Original name from provider
  normalized: string; // Normalized version
  apiFootballTeamId?: number; // API-Football team ID
  apiFootballTeamName?: string; // Official API-Football name
  createdAt: Date;
  lastUsed: Date;
  matchCount: number; // How many times this alias was used successfully
}

class TeamAliasServiceClass {
  private cache: Map<string, TeamAlias> = new Map();
  private readonly COLLECTION = 'team_aliases';

  /**
   * Normalize team name (same logic as sports-api.service.ts)
   */
  private normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\b(fc|cf|sc|fk|afc|cfc)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get team alias from cache or Firestore
   */
  async getTeamAlias(
    teamName: string, 
    providerName: string = 'SportyBet'
  ): Promise<TeamAlias | null> {
    const normalized = this.normalizeTeamName(teamName);
    const cacheKey = `${providerName}:${normalized}`;

    // Check in-memory cache first (fastest)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Check Firestore (now with public read access)
      const aliasRef = doc(firebaseFirestore, this.COLLECTION, normalized);
      const aliasSnap = await getDoc(aliasRef);

      if (aliasSnap.exists()) {
        const data = aliasSnap.data();
        const alias: TeamAlias = {
          id: aliasSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate() || new Date(),
        } as TeamAlias;

        // Update in-memory cache
        this.cache.set(cacheKey, alias);
        
        // Update lastUsed timestamp (async, don't await - only if authenticated)
        this.updateLastUsed(normalized).catch(() => {
          // Silently fail - not critical, user may not be authenticated
        });

        return alias;
      }
    } catch (error: any) {
      // Handle errors gracefully - cache is optional, service continues without it
      if (error?.code === 'permission-denied') {
        // This shouldn't happen now with public read, but handle just in case
        console.warn('⚠️ Team alias cache read failed (will retry on next request)');
      } else {
        console.error('Error fetching team alias:', error);
      }
    }

    return null;
  }

  /**
   * Save team alias to Firestore
   */
  async saveTeamAlias(
    teamName: string,
    providerName: string,
    apiFootballTeamId?: number,
    apiFootballTeamName?: string
  ): Promise<void> {
    const normalized = this.normalizeTeamName(teamName);
    const cacheKey = `${providerName}:${normalized}`;

    try {
      const aliasRef = doc(firebaseFirestore, this.COLLECTION, normalized);
      const existing = await getDoc(aliasRef);

      const aliasData: Omit<TeamAlias, 'id'> = {
        providerName,
        rawName: teamName,
        normalized,
        apiFootballTeamId,
        apiFootballTeamName,
        createdAt: existing.exists() 
          ? (existing.data().createdAt?.toDate() || new Date())
          : new Date(),
        lastUsed: Timestamp.now(),
        matchCount: existing.exists() 
          ? (existing.data().matchCount || 0) + 1
          : 1,
      };

      await setDoc(aliasRef, {
        ...aliasData,
        createdAt: Timestamp.fromDate(aliasData.createdAt),
        lastUsed: Timestamp.now(),
      }, { merge: true });

      // Update cache
      const alias: TeamAlias = {
        id: normalized,
        ...aliasData,
        createdAt: aliasData.createdAt,
        lastUsed: new Date(),
      };
      this.cache.set(cacheKey, alias);

      console.log(`✅ Saved team alias: ${teamName} → ${apiFootballTeamName || 'no ID'}`);
    } catch (error: any) {
      // Handle permission errors gracefully - cache is optional
      if (error?.code === 'permission-denied') {
        console.warn('⚠️ Team alias cache write permission denied (user may not be authenticated)');
      } else {
        console.error('Error saving team alias:', error);
      }
    }
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(normalized: string): Promise<void> {
    try {
      const aliasRef = doc(firebaseFirestore, this.COLLECTION, normalized);
      await setDoc(aliasRef, {
        lastUsed: Timestamp.now(),
      }, { merge: true });
    } catch (error: any) {
      // Handle permission errors gracefully - cache is optional
      if (error?.code === 'permission-denied') {
        // Silently fail - not critical
      } else {
        console.error('Error updating lastUsed:', error);
      }
    }
  }

  /**
   * Search for team aliases by API-Football team ID
   * Useful for finding all variations of a team name
   */
  async getAliasesByTeamId(apiFootballTeamId: number): Promise<TeamAlias[]> {
    try {
      const q = query(
        collection(firebaseFirestore, this.COLLECTION),
        where('apiFootballTeamId', '==', apiFootballTeamId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUsed: doc.data().lastUsed?.toDate() || new Date(),
      })) as TeamAlias[];
    } catch (error) {
      console.error('Error fetching aliases by team ID:', error);
      return [];
    }
  }

  /**
   * Clear in-memory cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const TeamAliasService = new TeamAliasServiceClass();

