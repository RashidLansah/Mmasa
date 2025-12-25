# Deploy Firestore Rules

## Quick Fix for Team Alias Permission Errors

The team alias cache needs updated Firestore rules. Here's how to deploy them:

### Option 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sureodds-8f685`
3. Go to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Using Firebase CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### What Changed

**Before:**
```javascript
match /team_aliases/{aliasId} {
  allow read: if isAuthenticated();
  allow write: if false; // No one could write
}
```

**After:**
```javascript
match /team_aliases/{aliasId} {
  allow read: if true; // Public read (team mappings are not sensitive)
  allow write: if isAuthenticated(); // Authenticated users can write
}
```

### Why This Fix Works

- **Public read**: Team name mappings are not sensitive data, so anyone can read them
- **Authenticated write**: Only logged-in users can save new mappings (builds the cache)
- **Service continues working**: Even if Firestore access fails, the in-memory cache still works

---

**Note:** The service will work with just in-memory cache if Firestore access fails, but deploying the rules will enable the full caching system and reduce API calls significantly.

