# Next Steps Implementation Guide

## ✅ Completed

1. **Slip Expiration Fixes**
   - ✅ Client-side defensive filtering
   - ✅ Server-side endpoint structure (needs Firebase Admin SDK)

2. **API Matching Improvements**
   - ✅ Better team name normalization
   - ✅ Team alias mapping function
   - ✅ Enhanced matching strategies

3. **Team Alias Service**
   - ✅ Created `team-alias.service.ts` with caching
   - ✅ Firestore collection structure defined

4. **Unverified Match Handling**
   - ✅ Improved to keep unverified matches (with warning)
   - ✅ Slip still created if at least some matches are verified

---

## 🔄 Next Steps (In Order)

### 1. Complete Firebase Admin SDK Setup (HIGH PRIORITY)

**File:** `server/FIREBASE_ADMIN_SETUP.md` (already created)

**Steps:**
1. Install: `cd server && npm install firebase-admin`
2. Download service account JSON from Firebase Console
3. Update `server/index.js` with full implementation
4. Test the endpoint

**Impact:** Prevents purchasing expired slips (security critical)

---

### 2. Integrate Team Alias Service (MEDIUM PRIORITY)

**Current State:** Service created but not integrated

**Files to Update:**
- `src/services/sports-api.service.ts`
- `src/screens/home/SlipUploadScreenV2.tsx`

**Changes Needed:**

1. **In `sports-api.service.ts`:**
   ```typescript
   import { TeamAliasService } from './team-alias.service';
   
   // In searchFixtureByTeams(), before searching:
   const homeAlias = await TeamAliasService.getTeamAlias(homeTeam, 'SportyBet');
   const awayAlias = await TeamAliasService.getTeamAlias(awayTeam, 'SportyBet');
   
   // If aliases have team IDs, use those for more reliable matching
   if (homeAlias?.apiFootballTeamId && awayAlias?.apiFootballTeamId) {
     // Search fixtures by team IDs instead of names
     // This is more reliable
   }
   
   // After successful match:
   await TeamAliasService.saveTeamAlias(
     homeTeam,
     'SportyBet',
     match.teams.home.id,
     match.teams.home.name
   );
   ```

2. **In `SlipUploadScreenV2.tsx`:**
   - Already updated to handle unverified matches
   - No additional changes needed

**Impact:** 
- Reduces API calls (caching)
- Improves matching reliability
- Faster matching for known teams

---

### 3. Add Firestore Rules for team_aliases (LOW PRIORITY)

**File:** `firestore.rules`

**Add:**
```javascript
// Team aliases - read-only for all, write by system only
match /team_aliases/{aliasId} {
  allow read: if isAuthenticated();
  allow write: if false; // Only system can write (via server)
}
```

**Impact:** Security for team alias collection

---

### 4. Optional: Team ID-Based Fixture Search (FUTURE)

**Current:** Search by team names (string matching)

**Future:** Search by team IDs (more reliable)

**Implementation:**
```typescript
// In sports-api.service.ts
async searchFixtureByTeamIds(
  homeTeamId: number,
  awayTeamId: number,
  date?: Date
): Promise<{ fixtureId: number; matchDate: Date | null } | null> {
  // Use API-Football endpoint: /fixtures?team={teamId}&date={date}
  // Much more reliable than name matching
}
```

**Impact:** 10x more reliable matching

---

## 📊 Current Status

| Feature | Status | Priority |
|---------|--------|----------|
| Slip Expiration (Client) | ✅ Complete | - |
| Slip Expiration (Server) | ⚠️ Needs Firebase Admin | HIGH |
| Team Alias Service | ✅ Created | - |
| Team Alias Integration | ⏳ Pending | MEDIUM |
| Unverified Match Handling | ✅ Improved | - |
| Team ID Search | ⏳ Future | LOW |

---

## 🧪 Testing Checklist

After implementing Firebase Admin SDK:

- [ ] Test with expired slip (should return 403)
- [ ] Test with valid slip (should return 200)
- [ ] Test with non-existent slip (should return 404)
- [ ] Verify client calls server before payment
- [ ] Test race condition (slip expires during payment)

After integrating Team Alias Service:

- [ ] Test with known team (should use cache)
- [ ] Test with new team (should save to cache)
- [ ] Verify API calls reduced
- [ ] Check Firestore for saved aliases

---

## 📝 Notes

1. **Team Alias Service** is ready but not integrated yet. Uncomment the TODO sections when ready.

2. **Unverified Matches** are now kept (with warning) if at least one match is verified. This is better UX than failing the entire slip.

3. **Firebase Admin SDK** is the highest priority - it's a security fix.

4. **Team ID Search** is a future enhancement that would require API-Football team search endpoint integration.

---

**Ready to implement:** Firebase Admin SDK setup (follow `server/FIREBASE_ADMIN_SETUP.md`)

