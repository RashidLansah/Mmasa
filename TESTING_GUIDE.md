# 🧪 SureOdds Testing Guide - Simulated Payments

## ✅ Current Status
- **Payments**: Simulated (Alert dialog confirms purchase)
- **Tracking**: Fully implemented (userId + transactions)
- **Paystack**: Keys configured, ready for real payments later
- **All Features**: Working with test data

---

## 📱 Complete Testing Flow

### **Prerequisites**
1. ✅ App is running (check terminal)
2. ✅ Firestore connected
3. ✅ Firebase Auth working
4. ✅ No console errors

---

## 🎯 Test Scenario 1: Creator Journey (Premium Slip)

### **User 1: Become a Creator**

1. **Sign Up / Login**
   - Open app → Sign up with phone number
   - Complete OTP verification
   - Set up profile (name, photo)

2. **Create Your First Premium Slip** 🎉
   - Tap **+ Button** (bottom right, Home screen)
   - Choose **"Upload Screenshot"** or **"Enter Manually"**
   
   **Premium Slip Details:**
   ```
   ✓ Upload a betting slip screenshot (or skip)
   ✓ Booking Code: ABC123XYZ
   ✓ Platform: SportyBet
   ✓ Your Analysis: "Arsenal has strong home advantage..."
   
   ✓ Slip Type: Toggle to "Premium" 💎
   ✓ Price: GH₵ 5.00
   ```

3. **Tap "Publish Slip"**
   - ✅ **Auto-Creator Creation**: You're now a creator/tipster!
   - ✅ Slip appears on Home screen with "Premium" badge
   - ✅ Navigate to "My Slips" tab → See your slip

---

## 🎯 Test Scenario 2: Buyer Journey

### **User 2: Purchase Premium Slip**

1. **Sign Up as New User**
   - Use different phone number
   - Complete profile setup

2. **Browse & View Premium Slip**
   - Go to Home screen
   - See User 1's slip with 💎 "Premium" badge
   - Tap on the slip

3. **See Locked Content** 🔒
   - Title and basic info visible
   - Premium purchase card shows:
     ```
     💎 Premium Slip
     Purchase this premium slip to view full details...
     
     GH₵ 5.00
     [Purchase Now]
     🔒 Secure payment via Paystack
     ```
   - **Booking code is HIDDEN**
   - **Screenshot is HIDDEN**

4. **Purchase the Slip** (Simulated)
   - Tap **"Purchase Now"**
   - Alert appears: "Pay GH₵ 5.00 for this premium slip?"
   - Tap **"Pay Now"**
   - ✅ Success message: "Purchase Successful! 🎉"

5. **View Unlocked Content** 🎊
   - Booking code now visible
   - Screenshot now visible
   - Full slip details accessible

---

## 🎯 Test Scenario 3: Earnings & Wallet

### **User 1: Check Earnings**

1. **Navigate to Wallet Tab**
   - See **Available Balance**: GH₵ 5.00
   - See **Total Earnings**: GH₵ 5.00

2. **View Recent Transactions**
   - See transaction:
     ```
     ↓ +GH₵ 5.00
     Earnings from slip: [Slip Title]
     [Date & Time]
     ```

3. **View Full Transaction History**
   - Tap "History" or navigate to Transactions screen
   - See complete earnings record
   - Filter: All / Earning / Purchase / Withdrawal

### **User 2: Check Purchase History**

1. **Navigate to Wallet Tab**
   - See **Available Balance**: GH₵ -5.00 (or 0 if no initial balance)

2. **View Transaction**
   - See transaction:
     ```
     ↑ -GH₵ 5.00
     Purchased slip: [Slip Title]
     [Date & Time]
     ```

3. **Navigate to "My Slips" → "Purchased" Tab**
   - See the slip you purchased
   - Access full details anytime

---

## 🎯 Test Scenario 4: Mobile Money Account Setup

### **User 1: Add Withdrawal Account**

1. **Navigate to Wallet → "Add Account"**
   
   **Step 1: Choose Provider**
   - Select **MTN** / **Vodafone** / **AirtelTigo**

   **Step 2: Enter Details**
   ```
   Phone Number: 0241234567 (10 digits)
   Account Name: [MUST match your profile name]
   ```
   - ⚠️ Name validation: Must match exactly
   - Info card explains verification

   **Step 3: OTP Verification** (Simulated)
   ```
   Enter OTP: 123456
   ```
   - Tap "Verify"
   - ✅ Account added successfully!

2. **Check Settings → Mobile Money Accounts**
   - See your verified account
   - "PRIMARY" badge displayed
   - Provider, phone, name visible
   - Green checkmark for verified ✅

---

## 🎯 Test Scenario 5: Withdrawal Request

### **User 1: Request Withdrawal** (Simulated)

1. **Navigate to Wallet → "Withdraw"**
   - See available balance: GH₵ 5.00
   - See your mobile money account

2. **Select Account & Amount**
   - Account is pre-selected (primary)
   - Enter amount: GH₵ 5.00 (or use "All" button)
   - Quick buttons: 10, 50, 100, All

3. **Request Withdrawal**
   - Tap "Withdraw Funds"
   - Confirm: "Withdraw GH₵ 5.00 to MTN (024...)?"
   - Tap "Confirm"
   - ✅ "Withdrawal Requested! 🎉"
   - Message: "Processed within 24 hours"

4. **Check Transaction Status**
   - Navigate to Transactions
   - See withdrawal as "PENDING"
   - Will show "COMPLETED" after processing

---

## 🎯 Test Scenario 6: Free Slip (Comparison)

### **Create a Free Slip**

1. **User 1: Create Another Slip**
   - Follow same process
   - **Slip Type**: Keep as "Free" (default)
   - No price needed
   - Publish slip

2. **User 2: View Free Slip**
   - Browse Home screen
   - See slip with "Free" badge (or no badge)
   - Tap to view
   - **All content immediately visible**:
     - ✅ Booking code visible
     - ✅ Screenshot visible
     - ✅ No payment required

---

## ✅ What to Verify

### **UI/UX Checks:**
- [ ] Premium badge shows on slip cards
- [ ] Locked content displays purchase UI
- [ ] Wallet shows correct balance
- [ ] Transactions list properly formatted
- [ ] Mobile money account displays in Settings
- [ ] Withdrawal form validates correctly
- [ ] Empty states show when no data
- [ ] Pull-to-refresh works on all screens

### **Data Tracking Checks:**
- [ ] Every transaction has `userId`
- [ ] Every transaction has `slipId` (if applicable)
- [ ] Transaction `type` is correct (earning/purchase/withdrawal)
- [ ] Transaction `amount` has correct sign (+/-)
- [ ] Transaction `status` updates properly
- [ ] Creator profile auto-created on first slip

### **Navigation Checks:**
- [ ] All tabs work (Home, My Slips, Wallet, Leaderboard)
- [ ] Notification bell navigates correctly
- [ ] Profile avatar goes to Settings
- [ ] Settings shows mobile money accounts
- [ ] My Slips shows "Created" and "Purchased" tabs

---

## 🐛 Common Issues & Solutions

### **Issue 1: Slip not appearing on Home screen**
**Solution**: Pull down to refresh

### **Issue 2: "Creator not found" error**
**Solution**: Creator profile should auto-create on first slip publish

### **Issue 3: Balance not updating**
**Solution**: Close and reopen Wallet tab, or pull to refresh

### **Issue 4: Name validation fails on mobile money**
**Solution**: Account name must EXACTLY match profile name (check Settings)

### **Issue 5: Empty screens everywhere**
**Solution**: 
- Dummy data removed (intended)
- Create some slips to populate
- Real data from Firestore will show

---

## 📊 Database Verification (Firebase Console)

### **Check Firestore Collections:**

1. **`creators` collection**
   ```
   ✓ Should have User 1's profile
   ✓ Contains: name, avatar, bio, winRate, subscribers, totalSlips
   ✓ Auto-created on first slip publish
   ```

2. **`slips` collection**
   ```
   ✓ Contains all created slips
   ✓ Premium slips have: isPremium: true, price: 5.00
   ✓ Free slips have: isPremium: false (or undefined)
   ✓ purchasedBy: [] array tracks buyers
   ```

3. **`transactions` collection**
   ```
   ✓ Every purchase creates 2 transactions:
     - Creator earning (+GH₵ 5.00, type: 'earning')
     - Buyer purchase (-GH₵ 5.00, type: 'purchase')
   ✓ Each has userId, slipId, amount, status, createdAt
   ```

4. **`mobileMoneyAccounts` collection**
   ```
   ✓ Contains verified accounts
   ✓ Fields: userId, provider, phoneNumber, accountName
   ✓ isVerified: true, isPrimary: true/false
   ```

---

## 🎥 Recording Test Results

### **Take Screenshots of:**
1. Premium slip creation form (with price)
2. Premium slip on Home screen (with badge)
3. Locked slip view (purchase UI)
4. Unlocked slip view (after purchase)
5. Wallet screen (showing balance)
6. Transaction history
7. Mobile money account in Settings
8. Withdrawal form

### **Test Checklist:**
```
[ ] User can create premium slip
[ ] User can create free slip
[ ] Premium slips show lock icon
[ ] Purchase flow works (simulated)
[ ] Earnings track correctly
[ ] Wallet balance calculates properly
[ ] Transactions list all activities
[ ] Mobile money account setup works
[ ] OTP verification works (simulated)
[ ] Withdrawal request creates pending transaction
[ ] Settings shows mobile money account
[ ] My Slips tab shows created & purchased
[ ] Auto-creator profile creation works
```

---

## 🚀 Next Steps After Testing

**Once everything works with simulated payments:**

1. **Enable Real Paystack Payments** (Option B)
   - Test with Paystack test cards
   - Verify actual payment flow
   - Check webhook integration

2. **Build Backend for Withdrawals** (Option C)
   - Deploy Express server
   - Integrate Paystack Transfer API
   - Enable real withdrawals

3. **Production Launch**
   - Switch to Paystack live keys
   - Configure production webhooks
   - Enable real money transactions

---

## 📝 Report Template

After testing, note any issues:

```
✅ WORKING:
- Premium slip creation
- Simulated purchase flow
- Transaction tracking
- ...

⚠️ ISSUES:
- [Describe any bugs or unexpected behavior]
- [Include steps to reproduce]
- [Screenshots if applicable]

💡 SUGGESTIONS:
- [Any UX improvements]
- [Feature requests]
- [Design tweaks]
```

---

**Happy Testing! 🎉**

If you encounter any issues, let me know the exact screen and what happened!

