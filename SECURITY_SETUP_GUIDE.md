# 🔒 Security Setup Guide

## ⚠️ CRITICAL: Complete These Steps Before Production

---

## Step 1: Create Environment Variables Files

### Frontend (.env in root directory)

Create `.env` file in the project root:

```env
# API Keys - DO NOT COMMIT THIS FILE
ODDS_API_KEY=your_odds_api_key_here
API_FOOTBALL_KEY=your_api_football_key_here
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

### Backend (server/.env)

Create `.env` file in `server/` directory:

```env
# Backend Environment Variables
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PORT=3001
```

---

## Step 2: Rotate API Keys (Optional)

**Note:** Since your repository is private, key rotation is less urgent. However, it's still recommended if:
- You plan to make the repo public
- Team members have left
- You want to follow security best practices

**Optional Rotation:**

The following keys were found in your source code (consider rotating if needed):

1. **The Odds API Key**: `063346656bae78faf608f5f6fed231e6`
   - Go to: https://the-odds-api.com/
   - Generate new key
   - Update in `.env`

2. **API-Football Key**: `c2cff9ab4ef7ae228a2dc5dae9cebbab`
   - Go to: https://www.api-football.com/
   - Generate new key
   - Update in `.env`

3. **Firebase API Key**: `AIzaSyCoh832PXv3T1hLclcZZOppCdDgSyki_P4`
   - Go to: Firebase Console → Project Settings
   - Regenerate API key
   - Update in `.env`

4. **Paystack Keys**:
   - Public: `pk_test_22eeaf379d48c3fac65b37d0506904d217249234`
   - Secret: `sk_test_3b67b6dbfab99c5d86740eb9a9e1fee992503300`
   - Go to: https://dashboard.paystack.com/
   - Generate new keys
   - Update in `.env` files

---

## Step 3: Install Environment Variable Support

### For React Native/Expo:

**Option A: Using expo-constants (Recommended for Expo)**

```bash
npm install expo-constants
```

Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "oddsApiKey": process.env.ODDS_API_KEY,
      "apiFootballKey": process.env.API_FOOTBALL_KEY,
      "paystackPublicKey": process.env.PAYSTACK_PUBLIC_KEY
    }
  }
}
```

Then in code:
```typescript
import Constants from 'expo-constants';
const API_KEY = Constants.expoConfig?.extra?.oddsApiKey;
```

**Option B: Using react-native-config**

```bash
npm install react-native-config
```

Then in code:
```typescript
import { ODDS_API_KEY } from 'react-native-config';
```

---

## Step 4: Verify .gitignore

Ensure `.gitignore` includes:
```
.env
.env.local
.env*.local
.env.production
.env.development
```

✅ Already added!

---

## Step 5: Test Rate Limiting

The backend now has rate limiting enabled:

- **General API**: 100 requests/hour per IP
- **OCR endpoint**: 10 requests/15 minutes per IP
- **Scraping endpoint**: 20 requests/hour per IP

Test it:
```bash
cd server
npm start
```

You should see: `✅ Rate limiting enabled`

---

## Step 6: Deploy Updated Firestore Rules

The Firestore security rules have been updated with Row Level Security:

```bash
firebase deploy --only firestore:rules
```

**New Rules:**
- ✅ Users can only create/update their own creator profiles
- ✅ Users can only update their own slips (or purchase)
- ✅ Users can only access their own transactions
- ✅ Users can only manage their own mobile money accounts

---

## Step 7: Verify Security

### Checklist:

- [ ] All API keys moved to `.env` files
- [ ] All exposed keys rotated
- [ ] `.env` files added to `.gitignore`
- [ ] Rate limiting installed and working
- [ ] Firestore rules deployed
- [ ] No hardcoded keys in source code
- [ ] Environment variables loading correctly

---

## 🚨 Important Notes

1. **Never commit `.env` files** - They're in `.gitignore` now
2. **Rotate keys immediately** - The exposed keys are compromised
3. **Use different keys for dev/prod** - Never use production keys in development
4. **Monitor API usage** - Watch for unusual spikes (indicates key theft)

---

## 📝 Next Steps (Medium Priority)

1. **Add CAPTCHA** - Install `react-native-recaptcha-v3`
2. **Input Sanitization** - Add DOMPurify or similar
3. **HTTPS** - Deploy with HTTPS (Vercel, Railway, etc.)
4. **Dependency Updates** - Enable Dependabot

See `SECURITY_AUDIT.md` for full details.

---

**Status:** ✅ Critical fixes implemented  
**Next:** Rotate keys and test environment variables

