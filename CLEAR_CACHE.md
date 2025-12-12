# 🔄 Clear Cache & Hard Reset

## If You See Old/Placeholder Data

The app might be showing cached data. Here's how to fix it:

### Option 1: Hard Refresh (Quick)

In your terminal where npm start is running:

```bash
# Press 'r' to reload
# Then press 'shift + r' for a HARD reload
```

Or:

```bash
# Stop the app
Ctrl + C

# Start with clear cache
expo start -c

# Then press 'i' or 'a' to reopen
```

### Option 2: Full Clean (If above doesn't work)

```bash
# Stop the app
Ctrl + C

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo

# Restart
npm start
```

### Option 3: Nuclear Option (Complete reset)

```bash
# Stop app
Ctrl + C

# Clear everything
rm -rf node_modules
rm -rf .expo
rm -rf node_modules/.cache

# Reinstall
npm install

# Start fresh
expo start -c
```

## On Your Phone/Simulator:

### iOS Simulator:
- **Device** → **Erase All Content and Settings**
- Or press `Cmd + Shift + K` to clear

### Android Emulator:
- Settings → Apps → Expo Go → Clear Data

### Physical Device (Expo Go):
- Close Expo Go app completely
- Reopen and scan QR code again

## Expected Behavior After Reset:

You should see **EMPTY STATES**:

```
Home Feed:
    📄
 No Slips Yet

Check back soon for new
betting predictions from
top creators

   [Refresh]
```

## If You Still See Data:

### Case 1: You have actual data in Firestore
If you added sample data to Firebase Console, it will show! To remove it:
1. Go to Firebase Console
2. Firestore Database
3. Delete the `slips` and `creators` collections

### Case 2: Cache persists
Try deleting the app from your device/simulator and reinstalling.

## Verify Clean State:

After clearing:
- [ ] Home Feed shows empty state
- [ ] Leaderboard shows empty state  
- [ ] Notifications shows empty state
- [ ] No old data visible
- [ ] Pull to refresh works
- [ ] No errors in terminal

---

**Quick Command**: `expo start -c` then reload app

