# 🔑 Paystack Integration Setup

## Step 1: Get Your Paystack Keys

1. Go to https://dashboard.paystack.com/
2. Create an account (if you haven't)
3. Navigate to **Settings → API Keys & Webhooks**
4. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)

---

## Step 2: Add Your Public Key

Open `/src/services/paystack.service.ts` and replace the placeholder:

```typescript
class PaystackService {
  // Replace this with your actual Paystack public key
  private readonly TEST_PUBLIC_KEY = 'pk_test_YOUR_ACTUAL_KEY_HERE';
  
  getPublicKey(): string {
    return this.TEST_PUBLIC_KEY;
  }
  // ...
}
```

**For Production (Later):**
```typescript
getPublicKey(): string {
  return process.env.PAYSTACK_PUBLIC_KEY || this.TEST_PUBLIC_KEY;
}
```

---

## Step 3: Test Mode vs Live Mode

### **Test Mode (Current):**
- Use `pk_test_...` key
- Use test card: `5060 6666 6666 6666 666` (PIN: 123 | OTP: 123456)
- No real money charged
- Perfect for development

### **Live Mode (Production):**
- Use `pk_live_...` key
- Real transactions
- Real money charged

---

## Step 4: Enable Payment in SlipDetailsScreen

The payment flow is already implemented! Just update your Paystack key and it will work.

**Current Flow (Simulated):**
```typescript
// User clicks "Purchase Now"
Alert.alert(
  'Purchase Slip',
  `Pay GH₵ ${slip.price?.toFixed(2)} for this premium slip?`,
  [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Pay Now',
      onPress: () => handlePaymentSuccess('demo_reference_' + Date.now()),
    },
  ]
);
```

**To Enable Real Payments:**
Uncomment the PaystackWebView code (lines 291-304 in SlipDetailsScreen.tsx):

```typescript
// Replace the Alert.alert with:
{showPaystack && user && userProfile && slip && (
  <PaystackWebView
    paystackKey={PaystackService.getPublicKey()}
    billingEmail={userProfile.email || user.email || ''}
    amount={PaystackService.toKobo(slip.price || 0)}
    channels={['mobile_money', 'card']}
    onCancel={() => {
      setShowPaystack(false);
      Alert.alert('Cancelled', 'Payment was cancelled');
    }}
    onSuccess={(res) => {
      handlePaymentSuccess(res.reference);
    }}
    autoStart={true}
  />
)}
```

---

## Step 5: Enable Withdrawals with Paystack Transfer API

For creators to withdraw earnings, you'll need:

1. **Secret Key** (starts with `sk_test_` or `sk_live_`)
2. **Backend Server** (Node.js/Express) - Can't use secret key in app
3. **Paystack Transfer API**

### **Architecture:**

```
React Native App
      ↓
   (Request withdrawal)
      ↓
Your Backend Server (Node.js)
      ↓
Paystack Transfer API
      ↓
Creator's Mobile Money Account
```

### **Backend Endpoint Example:**

```javascript
// backend/routes/withdrawals.js
const axios = require('axios');

app.post('/api/withdraw', async (req, res) => {
  const { amount, accountNumber, bankCode, reference } = req.body;
  
  try {
    // 1. Verify user has sufficient balance (check Firestore)
    // 2. Create transfer recipient
    const recipient = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'mobile_money',
        name: 'Creator Name',
        account_number: accountNumber,
        bank_code: bankCode, // MTN, VDF, ATL
        currency: 'GHS'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );
    
    // 3. Initiate transfer
    const transfer = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount: amount * 100, // Convert to pesewas
        recipient: recipient.data.data.recipient_code,
        reason: 'Earnings withdrawal',
        reference: reference
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );
    
    // 4. Update transaction status in Firestore
    await updateDoc(doc(db, 'transactions', transactionId), {
      status: 'completed',
      completedAt: new Date()
    });
    
    res.json({ success: true, transfer: transfer.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Step 6: Webhook Setup (Recommended)

To handle payment confirmations automatically:

1. Go to **Settings → API Keys & Webhooks**
2. Add webhook URL: `https://your-server.com/api/webhooks/paystack`
3. Listen for events: `charge.success`, `transfer.success`

```javascript
app.post('/api/webhooks/paystack', (req, res) => {
  const event = req.body;
  
  if (event.event === 'charge.success') {
    // Payment confirmed - update Firestore
    const { reference, amount } = event.data;
    // Update transaction status...
  }
  
  if (event.event === 'transfer.success') {
    // Withdrawal completed - notify user
    const { reference } = event.data;
    // Update transaction status...
  }
  
  res.sendStatus(200);
});
```

---

## 📊 Platform Revenue Tracking

With the current setup, you can easily track platform revenue:

```typescript
// Calculate platform fees (10% example)
const platformFee = 0.10;

// When creator withdraws
const grossEarnings = 100; // GH₵ 100
const platformRevenue = grossEarnings * platformFee; // GH₵ 10
const creatorPayout = grossEarnings - platformRevenue; // GH₵ 90

// Store in Firestore
await createTransaction({
  userId: 'PLATFORM',
  type: 'platform_fee',
  amount: platformRevenue,
  description: 'Platform fee (10%)',
  createdAt: new Date()
});
```

---

## 🎯 Admin Dashboard Queries

```typescript
// Total platform revenue
const platformRevenue = await getDocs(
  query(
    collection(db, 'transactions'),
    where('userId', '==', 'PLATFORM'),
    where('type', '==', 'platform_fee')
  )
);

// Top earning creators
const creatorEarnings = await getDocs(
  query(
    collection(db, 'transactions'),
    where('type', '==', 'earning'),
    where('status', '==', 'completed'),
    orderBy('amount', 'desc'),
    limit(10)
  )
);

// Total slip sales
const totalSales = await getDocs(
  query(
    collection(db, 'transactions'),
    where('type', '==', 'purchase'),
    where('status', '==', 'completed')
  )
);
```

---

## ✅ Current Status

- ✅ User ID tracking on all transactions
- ✅ Slip ID linking for traceability
- ✅ Transaction types (earning, withdrawal, purchase)
- ✅ Status tracking (pending, completed, failed)
- ✅ Amount tracking with proper signs (+/-)
- ✅ Ready for admin dashboard integration
- ⏳ **Need:** Your Paystack public key
- ⏳ **Need:** Backend server for withdrawals (optional, can be added later)

---

## 📝 Next Steps

1. **For Testing:** Get your Paystack test public key (`pk_test_...`)
2. **Update:** `src/services/paystack.service.ts` with your key
3. **Test:** Try purchasing a premium slip with test cards
4. **Production:** Switch to live key (`pk_live_...`) when ready
5. **Backend:** Build withdrawal API when you have consistent transaction volume

---

**Need your Paystack keys to proceed with real payments! 🚀**

