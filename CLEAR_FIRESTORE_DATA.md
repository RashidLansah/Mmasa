# 🗑️ Clear Firestore Data

## What You're Seeing

Your app is showing data with names like:
- "Tipster King"
- "BetMaster Pro"
- Odds: 0.00

This is **real data in Firestore**, not cached placeholder data!

## How to Clear It

### Method 1: Firebase Console (Easiest)

1. **Go to**: https://console.firebase.google.com
2. **Select project**: sureodds-8f685
3. **Navigate to**: Firestore Database (left sidebar)
4. **You'll see collections**: `slips`, `creators`, etc.

#### Delete Slips Collection:
1. Click on `slips` collection
2. Click the **⋮** (three dots menu) at the top
3. Select **"Delete collection"**
4. Confirm deletion

#### Delete Creators Collection:
1. Click on `creators` collection
2. Click the **⋮** menu
3. Select **"Delete collection"**
4. Confirm deletion

5. **Refresh your app**: Press `r` in terminal

### Method 2: Delete Individual Documents

If you see documents in Firestore:
1. Open the collection (e.g., `slips`)
2. Click on each document
3. Click **Delete document** button
4. Repeat for all documents
5. Repeat for all collections

## After Clearing

Refresh the app and you should see:

```
    📄
 No Slips Yet

Check back soon for new
betting predictions from
top creators

   [Refresh]
```

## Verify Empty State

Check all tabs:
- [ ] **Home Feed** → "No Slips Yet"
- [ ] **Leaderboard** → "No Creators Yet"
- [ ] **Notifications** → "No Notifications"

## If You Want to Keep Some Data

Only delete what you don't want:
- Delete slips with placeholder names
- Keep any real slips you created
- Delete test creators

## Next Steps

Once cleared, you can:
1. **Create real content** via the app (when slip upload is implemented)
2. **Add proper sample data** using the guide in ADD_SAMPLE_DATA.md
3. **Leave it empty** and build up content as users create it

---

**Quick Action**: Go to Firebase Console → Firestore → Delete collections → Refresh app

