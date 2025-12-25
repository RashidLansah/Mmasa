# Firebase Admin SDK Setup Guide

## Purpose
Enable server-side slip purchase verification to prevent purchasing expired slips.

## Steps

### 1. Install Firebase Admin SDK

```bash
cd server
npm install firebase-admin
```

### 2. Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sureodds-8f685`
3. Click the gear icon ⚙️ → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file
7. Save it as `server/firebase-service-account.json`
8. **IMPORTANT**: Add to `.gitignore`:
   ```
   firebase-service-account.json
   ```

### 3. Update server/index.js

Replace the placeholder code in `/api/verify-slip-purchase` with:

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// In the /api/verify-slip-purchase endpoint:
app.post('/api/verify-slip-purchase', async (req, res) => {
  try {
    const { slipId } = req.body;
    
    if (!slipId) {
      return res.status(400).json({
        success: false,
        error: 'Slip ID is required'
      });
    }

    const slipRef = admin.firestore().collection('slips').doc(slipId);
    const slipSnap = await slipRef.get();
    
    if (!slipSnap.exists) {
      return res.status(404).json({
        success: false,
        code: 'SLIP_NOT_FOUND',
        error: 'Slip not found'
      });
    }
    
    const slip = slipSnap.data();
    const expiresAt = slip.expiresAt?.toDate ? slip.expiresAt.toDate() : new Date(slip.expiresAt);
    const now = new Date();
    
    // expiresAt is the single source of truth
    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      return res.status(403).json({
        success: false,
        code: 'SLIP_EXPIRED',
        message: 'This slip has expired and can no longer be purchased.'
      });
    }
    
    // Slip is valid for purchase
    return res.json({
      success: true,
      purchasable: true,
      slip: {
        id: slipSnap.id,
        price: slip.price,
        isPremium: slip.isPremium
      }
    });
    
  } catch (error) {
    console.error('Error verifying slip purchase:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify slip purchase'
    });
  }
});
```

### 4. Update Client to Call Server

In `src/screens/home/SlipDetailsScreen.tsx`, before payment:

```typescript
const handlePurchase = async () => {
  if (!user || !userProfile || !slip) return;

  // Client-side check (UX)
  if (isExpired) {
    Alert.alert('Slip Expired', 'This slip has expired and can no longer be purchased.');
    return;
  }
  
  // Server-side verification (authoritative)
  try {
    const response = await fetch(`${SERVER_URL}/api/verify-slip-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipId: slip.id })
    });
    
    const result = await response.json();
    
    if (!result.success || !result.purchasable) {
      Alert.alert(
        result.code === 'SLIP_EXPIRED' ? 'Slip Expired' : 'Purchase Failed',
        result.message || 'This slip cannot be purchased at this time.'
      );
      return;
    }
    
    // Proceed with payment...
    popup.checkout({ ... });
  } catch (error) {
    console.error('Verification error:', error);
    Alert.alert('Error', 'Could not verify slip. Please try again.');
  }
};
```

### 5. Environment Variable for Server URL

Add to your app config:

```typescript
// src/config.ts
export const SERVER_URL = __DEV__ 
  ? 'http://192.168.1.152:3001'  // Your local IP
  : 'https://your-production-server.com';
```

## Security Notes

- ✅ Service account key is server-side only (never expose to client)
- ✅ Server-side check is authoritative (can't be bypassed)
- ✅ Prevents race conditions (slip expires between client check and payment)
- ⚠️ Keep service account JSON secure (add to .gitignore)

## Testing

1. Start server: `cd server && npm start`
2. Test endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/verify-slip-purchase \
     -H "Content-Type: application/json" \
     -d '{"slipId":"test-slip-id"}'
   ```
3. Test with expired slip (should return 403)
4. Test with valid slip (should return 200)

