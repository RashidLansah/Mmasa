# 🔑 API Keys Setup Guide

Quick guide to get your API keys for the betting slip OCR system.

---

## 1. Google Vision API (For OCR)

### Why You Need It:
- Extracts text from betting slip screenshots
- Reads booking codes, odds, matches automatically
- **Essential for screenshot upload feature**

### How to Get It (5 minutes):

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name it: "Mmasa OCR" or similar
   - Click "Create"

3. **Enable Cloud Vision API**
   - In the search bar, type "Vision API"
   - Click "Cloud Vision API"
   - Click "Enable"

4. **Create API Key**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - **Copy the API key** (long string starting with `AIza...`)

5. **Restrict the API Key** (Optional but recommended)
   - Click "Edit API key"
   - Under "API restrictions":
     - Select "Restrict key"
     - Check only "Cloud Vision API"
   - Save

6. **Add to Your Code**
   ```typescript
   // Open: src/services/ocr.service.ts
   // Replace line 15 with your key:
   const GOOGLE_VISION_API_KEY = 'AIzaSy....YOUR_KEY_HERE';
   ```

### Pricing:
- **FREE:** First 1,000 requests/month
- **Paid:** $1.50 per 1,000 requests after that
- **For MVP:** Completely free! (unless you get 1000+ slip uploads/month)

---

## 2. The Odds API (For Match Data)

### Why You Need It:
- Fetches upcoming matches & odds
- Auto-tracks match results
- **Optional for MVP** (can use manual entry)

### How to Get It (2 minutes):

1. **Go to The Odds API**
   - Visit: https://the-odds-api.com/

2. **Sign Up**
   - Click "Get a Free API Key"
   - Enter your email
   - Verify email

3. **Copy API Key**
   - You'll see your API key on the dashboard
   - Copy it

4. **Add to Your Code**
   ```typescript
   // Open: src/services/sports-api.service.ts
   // Replace line 15 with your key:
   const THE_ODDS_API_KEY = 'YOUR_API_KEY_HERE';
   ```

### Pricing:
- **FREE:** 500 requests/month
- **Paid:** $10-100/month for more requests
- **For MVP:** Completely free!

---

## 3. Firebase (Already Set Up) ✅

You've already got Firebase configured! You're good to go.

- ✅ Authentication
- ✅ Firestore Database
- ✅ Firebase Storage
- ✅ Firebase Config

No additional setup needed.

---

## Quick Setup Checklist

- [ ] Create Google Cloud account
- [ ] Enable Vision API
- [ ] Get Vision API key
- [ ] Add key to `ocr.service.ts`
- [ ] Sign up for The Odds API
- [ ] Get Odds API key
- [ ] Add key to `sports-api.service.ts`
- [ ] Test screenshot upload
- [ ] Test OCR extraction
- [ ] 🎉 Done!

---

## Testing Without API Keys

### Can You Test Without Keys?

**Yes!** You can still test most features:

✅ **Manual slip entry** - Works without OCR
✅ **Booking code display** - Works fine
✅ **Deep links** - Works without APIs
✅ **Screenshot upload** - Upload works, OCR will show "not configured"
✅ **All other features** - Fully functional

### What Doesn't Work Without Keys:

❌ **OCR text extraction** - Need Vision API
❌ **Auto-match fetching** - Need Odds API
❌ **Auto result updates** - Need Odds API

### Recommendation:

For MVP testing, you can use **manual entry only** and skip the API keys initially. Add them later when you're ready to scale.

---

## Environment Variables (Future)

For production, move API keys to environment variables:

```bash
# Create .env file
GOOGLE_VISION_API_KEY=AIzaSy...
THE_ODDS_API_KEY=...
FIREBASE_API_KEY=...
```

Then use `react-native-config` or `expo-constants` to load them.

---

## Cost Summary (Monthly)

For **100 users** uploading **10 slips each** (1,000 slips/month):

| Service | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| Google Vision | 1,000 req | $0 (covered by free tier) |
| The Odds API | 500 req | $0-10 |
| Firebase Storage | 5GB | ~$1-2 |
| Firebase Firestore | 50K reads | $0-1 |
| **Total** | | **~$1-13/month** |

**Very affordable!** 🎉

---

## Need Help?

### If you get stuck:

1. **Google Vision API Issues:**
   - Make sure Vision API is enabled
   - Check API key restrictions
   - Verify billing is enabled (even for free tier)

2. **The Odds API Issues:**
   - Verify email
   - Check API key is active
   - Check request limits

3. **Can't Find Where to Add Keys:**
   - Look for files in `src/services/`
   - Search for `YOUR_API_KEY` or `YOUR_GOOGLE_VISION`

---

**Status**: Ready to set up!  
**Time Needed**: ~10 minutes total  
**Cost**: $0 for MVP testing

Let me know when you've added the keys and we'll test the OCR flow! 🚀

