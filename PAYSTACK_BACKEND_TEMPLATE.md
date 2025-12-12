# 🔐 Paystack Backend Server Template

## ⚠️ IMPORTANT: Secret Key Usage

Your **Secret Key** should **NEVER** be in the React Native app!
- ✅ Public Key (`pk_test_...`) → Frontend (React Native)
- ❌ Secret Key (`sk_test_...`) → Backend ONLY (Node.js/Express)

---

## Backend Server Setup (For Withdrawals)

### **Step 1: Create Backend Server**

```bash
mkdir sureodds-backend
cd sureodds-backend
npm init -y
npm install express cors dotenv axios firebase-admin
```

### **Step 2: Create `.env` file**

```env
PAYSTACK_SECRET_KEY=sk_test_3b67b6dbfab99c5d86740eb9a9e1fee992503300
PORT=3000
```

### **Step 3: Create `server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SureOdds Backend Running' });
});

// ========== WITHDRAWAL ENDPOINT ==========
app.post('/api/withdrawals/initiate', async (req, res) => {
  try {
    const { amount, accountNumber, bankCode, userId, transactionId } = req.body;

    // 1. Validate request
    if (!amount || !accountNumber || !bankCode || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 2. TODO: Verify user has sufficient balance in Firestore
    // const userBalance = await checkUserBalance(userId);
    // if (userBalance < amount) {
    //   return res.status(400).json({ error: 'Insufficient balance' });
    // }

    // 3. Create transfer recipient (mobile money)
    const recipientResponse = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'mobile_money',
        name: req.body.accountName || 'User',
        account_number: accountNumber,
        bank_code: bankCode, // MTN, VDF, ATL
        currency: 'GHS'
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const recipientCode = recipientResponse.data.data.recipient_code;

    // 4. Initiate transfer
    const reference = `withdraw_${userId}_${Date.now()}`;
    const transferResponse = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount: amount * 100, // Convert to pesewas (GHS to pesewas)
        recipient: recipientCode,
        reason: 'SureOdds Earnings Withdrawal',
        reference: reference
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 5. TODO: Update transaction status in Firestore
    // await updateDoc(doc(db, 'transactions', transactionId), {
    //   status: 'completed',
    //   paystackReference: reference,
    //   completedAt: new Date()
    // });

    res.json({
      success: true,
      reference: reference,
      transfer: transferResponse.data.data
    });

  } catch (error) {
    console.error('Withdrawal error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Withdrawal failed',
      details: error.response?.data?.message || error.message
    });
  }
});

// ========== VERIFY PAYMENT ENDPOINT ==========
app.get('/api/payments/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Verification failed',
      details: error.response?.data || error.message
    });
  }
});

// ========== WEBHOOK ENDPOINT ==========
app.post('/api/webhooks/paystack', (req, res) => {
  const event = req.body;

  console.log('Paystack webhook received:', event.event);

  // Verify webhook signature (important for production!)
  // const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
  //   .update(JSON.stringify(req.body))
  //   .digest('hex');
  // if (hash !== req.headers['x-paystack-signature']) {
  //   return res.sendStatus(400);
  // }

  switch (event.event) {
    case 'charge.success':
      // Payment successful - update Firestore
      console.log('Payment successful:', event.data.reference);
      // TODO: Update transaction status in Firestore
      break;

    case 'transfer.success':
      // Withdrawal successful - notify user
      console.log('Transfer successful:', event.data.reference);
      // TODO: Update transaction status and send push notification
      break;

    case 'transfer.failed':
      // Withdrawal failed - refund user
      console.log('Transfer failed:', event.data.reference);
      // TODO: Refund user's balance
      break;
  }

  res.sendStatus(200);
});

// ========== MOBILE MONEY BANK CODES ==========
app.get('/api/banks/mobile-money', (req, res) => {
  res.json({
    banks: [
      { code: 'MTN', name: 'MTN Mobile Money', type: 'mobile_money' },
      { code: 'VDF', name: 'Vodafone Cash', type: 'mobile_money' },
      { code: 'ATL', name: 'AirtelTigo Money', type: 'mobile_money' }
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SureOdds Backend running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://your-domain.com/api/webhooks/paystack`);
});
```

### **Step 4: Update React Native App**

In `src/screens/wallet/WithdrawScreen.tsx`, call your backend:

```typescript
const handleWithdraw = async () => {
  try {
    // Call your backend server
    const response = await fetch('https://your-backend-url.com/api/withdrawals/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: withdrawAmount,
        accountNumber: selectedAccount.phoneNumber,
        bankCode: getBankCode(selectedAccount.provider), // MTN, VDF, ATL
        accountName: selectedAccount.accountName,
        userId: user.uid,
        transactionId: transactionId
      }),
    });

    const result = await response.json();

    if (result.success) {
      Alert.alert('Success', 'Withdrawal processed!');
    } else {
      Alert.alert('Error', result.error);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to process withdrawal');
  }
};

const getBankCode = (provider: string) => {
  switch (provider) {
    case 'MTN': return 'MTN';
    case 'Vodafone': return 'VDF';
    case 'AirtelTigo': return 'ATL';
    default: return 'MTN';
  }
};
```

---

## 🚀 Deploy Backend (Options)

### **Option 1: Render.com (Free Tier)**
1. Push code to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect GitHub repo
5. Add environment variables
6. Deploy!

### **Option 2: Railway.app (Free Tier)**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy!

### **Option 3: Heroku**
```bash
heroku create sureodds-backend
heroku config:set PAYSTACK_SECRET_KEY=sk_test_...
git push heroku main
```

---

## 🔒 Security Best Practices

1. ✅ **Never commit secret key** to Git
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. ✅ **Verify webhook signatures** in production
3. ✅ **Rate limit** withdrawal endpoints
4. ✅ **Log all transactions** for auditing
5. ✅ **Use HTTPS** in production

---

## 📊 Testing Withdrawals

### **Paystack Test Accounts:**
- **MTN**: `0551234567` (will succeed)
- **Vodafone**: `0201234567` (will succeed)
- **Test Amount**: Any amount (no real money transferred)

### **Test Flow:**
1. User requests withdrawal in app
2. App calls backend API
3. Backend initiates Paystack transfer
4. Paystack simulates transfer (test mode)
5. Webhook confirms success
6. Update Firestore transaction status
7. Notify user

---

## 🎯 Next Steps

1. **For now**: Keep using simulated withdrawals in the app
2. **When ready**: Set up backend server
3. **Deploy**: Use Render/Railway for free hosting
4. **Configure**: Add your backend URL to the app
5. **Test**: Use Paystack test accounts
6. **Production**: Switch to live keys when ready

---

**Backend is optional for now - you can manually process withdrawals until you have volume!** 🚀

