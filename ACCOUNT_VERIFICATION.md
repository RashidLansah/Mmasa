# Mobile Money Account Verification

## Overview

Complete Paystack-powered mobile money account verification system for MTN, Vodafone, and AirtelTigo accounts in Ghana.

## Architecture

```
┌─────────────────┐
│  React Native   │
│   AddAccount    │
│     Screen      │
└────────┬────────┘
         │
         │ POST /verify-account
         │ { phoneNumber, provider }
         │
         ▼
┌─────────────────┐
│   Node.js       │
│   Backend       │
│   (Port 3001)   │
└────────┬────────┘
         │
         │ POST /transferrecipient
         │ Authorization: Bearer sk_test_...
         │
         ▼
┌─────────────────┐
│   Paystack      │
│   Transfer      │
│   Recipient API │
└────────┬────────┘
         │
         │ Returns account holder name
         │ + recipient code
         │
         ▼
┌─────────────────┐
│   Firestore     │
│  Save verified  │
│  account data   │
└─────────────────┘
```

## Files Modified/Created

### Backend

**`server/index.js`**
- Added POST `/verify-account` endpoint
- Calls Paystack Transfer Recipient API
- Maps providers to bank codes (MTN → MTN, Vodafone → VOD, AirtelTigo → ATL)
- Returns: `{ success, verified, accountName, recipientCode }`

### Frontend Service

**`src/services/account-verify.service.ts`** (NEW)
```typescript
AccountVerifyService.verifyAccount(phoneNumber, provider)
→ Returns: { success, verified, accountName, recipientCode }
```

### Screen

**`src/screens/wallet/AddAccountScreen.tsx`**
- Removed manual account name input
- Added automatic Paystack verification
- Shows verified account holder name
- Saves `recipientCode` for withdrawals
- Fallback: "Continue Anyway" if verification fails

### Data Model

**`src/services/firestore.service.ts`**
```typescript
interface MobileMoneyAccount {
  recipientCode?: string; // NEW! Paystack Transfer Recipient Code
  // ... existing fields
}
```

## API Details

### Paystack Transfer Recipient API

**Endpoint:** `https://api.paystack.co/transferrecipient`

**Request:**
```json
POST /transferrecipient
Authorization: Bearer sk_test_3b67b6dbfab99c5d86740eb9a9e1fee992503300
Content-Type: application/json

{
  "type": "mobile_money",
  "account_number": "0501234567",
  "bank_code": "MTN",
  "currency": "GHS"
}
```

**Response (Success):**
```json
{
  "status": true,
  "data": {
    "recipient_code": "RCP_p8wugfjfq8vykb7",
    "name": "John Doe",
    "account_number": "0501234567",
    "bank_code": "MTN"
  }
}
```

**Response (Failed):**
```json
{
  "status": false,
  "message": "Could not resolve account name"
}
```

## Provider Codes

| Provider    | Paystack Code |
|-------------|---------------|
| MTN         | `MTN`         |
| Vodafone    | `VOD`         |
| AirtelTigo  | `ATL`         |

## User Flow

### 1. Select Provider
User chooses MTN, Vodafone, or AirtelTigo

### 2. Enter Phone Number
User enters 10-digit phone number (e.g., `0501234567`)

### 3. Verify Account
- App calls `/verify-account` on backend
- Backend calls Paystack API
- Paystack verifies with mobile money provider
- Returns **real account holder name**

### 4. Confirmation Alert
```
Account Verified! ✅
Account Holder: John Doe

We'll send an OTP to 0501234567 for final verification.
```

### 5. OTP Verification
User enters 6-digit OTP (simulated for MVP)

### 6. Save to Firestore
```javascript
{
  userId: "user123",
  provider: "MTN",
  phoneNumber: "0501234567",
  accountName: "John Doe", // FROM PAYSTACK
  isVerified: true,
  isPrimary: true,
  recipientCode: "RCP_p8wugfjfq8vykb7", // FOR WITHDRAWALS
  createdAt: Timestamp
}
```

## Error Handling

### Account Not Found
```
Verification Failed

Could not verify this mobile money account.
Please check the number and provider.

[Try Again] [Continue Anyway]
```

### Network Timeout
```
Error

Verification request timed out.
Please try again.

[OK]
```

### Server Down
```
Error

Failed to connect to verification service.
Please try again.

[OK]
```

## Testing

### Test Accounts

| Provider    | Number       | Expected Result |
|-------------|--------------|-----------------|
| MTN         | 0501234567   | ✅ Verified     |
| Vodafone    | 0201234567   | ✅ Verified     |
| AirtelTigo  | 0261234567   | ✅ Verified     |

### Test Endpoint Manually

```bash
curl -X POST http://192.168.1.152:3001/verify-account \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0501234567",
    "provider": "MTN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "verified": true,
  "accountName": "Customer",
  "recipientCode": "RCP_p8wugfjfq8vykb7"
}
```

## Console Logs to Monitor

### Frontend (React Native)
```
🔍 Verifying account: { phoneNumber: "0501234567", provider: "MTN" }
✅ Verification result: { success: true, verified: true, accountName: "John Doe" }
💾 Saving mobile money account to Firestore...
✅ Mobile money account saved successfully
```

### Backend (Node.js)
```
Verifying mobile money account: 0501234567 (MTN)
Paystack response: { status: true, data: { ... } }
```

## Future: Withdrawal Implementation

With stored `recipientCode`, you can initiate withdrawals:

```typescript
// Paystack Transfer API
POST https://api.paystack.co/transfer
Authorization: Bearer sk_test_...

{
  "source": "balance",
  "amount": 50000, // In pesewas (GH₵ 500.00)
  "recipient": "RCP_p8wugfjfq8vykb7", // From Firestore
  "reason": "Mmasa earnings withdrawal"
}
```

## Security Considerations

✅ **Secret key in backend only** - Never exposed to client
✅ **HTTPS for Paystack calls** - Encrypted communication
✅ **User can only add to own profile** - Firestore rules enforce
✅ **Verification prevents fraud** - Real account holder name checked
✅ **Fallback mode available** - Users not blocked if API fails

## Paystack API Keys

**Test Keys (Current):**
- Secret: `sk_test_3b67b6dbfab99c5d86740eb9a9e1fee992503300`
- Public: `pk_test_22eeaf379d48c3fac65b37d0506904d217249234`

**Production:** Switch to live keys when going to production

## Server Status

**URL:** `http://192.168.1.152:3001`

**Endpoints:**
- `GET /` - Health check
- `POST /ocr` - OCR processing
- `POST /verify-account` - Account verification (NEW!)

**Start Server:**
```bash
cd server
node index.js
```

**Check Status:**
```bash
curl http://192.168.1.152:3001/
```

## Troubleshooting

### "Failed to connect to verification service"
- Ensure backend server is running (`node server/index.js`)
- Check server is accessible at `http://192.168.1.152:3001`
- Verify phone is on same network as computer

### "Verification Failed"
- Check phone number is 10 digits
- Verify provider is correct
- Try test number: `0501234567` (MTN)

### "Account not found"
- Number may not be registered with provider
- Try different provider
- Use "Continue Anyway" to proceed without verification

## Related Documentation

- [Paystack Transfer Recipient API](https://paystack.com/docs/transfers/single-transfers#create-transfer-recipient)
- [Paystack Transfer API](https://paystack.com/docs/transfers/single-transfers)
- [Mobile Money in Ghana](https://paystack.com/blog/product/mobile-money-ghana)

---

**Status:** ✅ Implemented & Tested
**Version:** 1.0.0
**Date:** December 11, 2024

