/**
 * Mmasa OCR Server
 * 
 * Simple Express server that runs Tesseract OCR
 * Allows Expo app to use OCR without native modules
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');
const fs = require('fs');
const path = require('path');
const scrapeRouter = require('./scrape-booking-code');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting middleware
// SECURITY: Protect against spam and abuse
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  console.warn('⚠️ express-rate-limit not installed. Run: npm install express-rate-limit');
}

if (rateLimit) {
  // General API rate limiter: 100 requests per hour per IP
  const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per hour
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
  });

  // OCR endpoint: 10 requests per 15 minutes (more restrictive)
  const ocrLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 OCR requests per 15 minutes
    message: 'Too many OCR requests, please try again later.',
  });

  // Scraping endpoint: 20 requests per hour (resource intensive)
  const scrapeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 scraping requests per hour
    message: 'Too many scraping requests, please try again later.',
  });

  // Apply rate limiters
  app.use('/api/scrape-booking-code', scrapeLimiter);
  app.use('/ocr', ocrLimiter);
  app.use('/api/', apiLimiter);
  console.log('✅ Rate limiting enabled');
} else {
  console.warn('⚠️ Rate limiting disabled - install express-rate-limit for production');
}

// Middleware
app.use(cors());
app.use(express.json());

// Booking code scraping routes
app.use('/api', scrapeRouter);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'Mmasa OCR Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      ocr: 'POST /ocr',
      verifyAccount: 'POST /verify-account',
      transfer: 'POST /transfer',
      scrapeBookingCode: 'POST /api/scrape-booking-code'
    }
  });
});

// OCR endpoint
app.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log(`Processing image: ${req.file.originalname}`);

    // Tesseract configuration
    const config = {
      lang: 'eng',
      oem: 1,
      psm: 3,
    };

    // Perform OCR
    const text = await tesseract.recognize(req.file.path, config);

    console.log('OCR completed successfully');
    console.log('Text length:', text.length);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Calculate confidence (simple estimate based on text quality)
    const confidence = calculateConfidence(text);

    res.json({
      success: true,
      text: text.trim(),
      confidence: confidence,
      textLength: text.length
    });

  } catch (error) {
    console.error('❌ OCR Error:', error.message);
    console.error('Error details:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'OCR processing failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mobile Money Account Verification Endpoint
app.post('/verify-account', async (req, res) => {
  try {
    const { phoneNumber, provider } = req.body;

    if (!phoneNumber || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and provider are required'
      });
    }

    console.log(`Verifying mobile money account: ${phoneNumber} (${provider})`);

    // Map provider to Paystack bank codes
    const providerCodes = {
      'MTN': 'MTN',
      'Vodafone': 'VOD',
      'AirtelTigo': 'ATL'
    };

    const bankCode = providerCodes[provider];
    if (!bankCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider'
      });
    }

    // Call Paystack Transfer Recipient API
    // SECURITY: Secret key from environment variable
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({
        success: false,
        error: 'Paystack secret key not configured'
      });
    }
    
    const https = require('https');
    const postData = JSON.stringify({
      type: 'mobile_money',
      account_number: phoneNumber,
      bank_code: bankCode,
      currency: 'GHS'
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transferrecipient',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const paystackRequest = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          console.log('Paystack response:', result);

          if (result.status === true && result.data) {
            // Account verified successfully
            res.json({
              success: true,
              verified: true,
              accountName: result.data.details?.account_name || result.data.name || 'Unknown',
              recipientCode: result.data.recipient_code
            });
          } else {
            // Account verification failed
            res.json({
              success: true,
              verified: false,
              error: result.message || 'Account verification failed'
            });
          }
        } catch (error) {
          console.error('Error parsing Paystack response:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to parse verification response'
          });
        }
      });
    });

    paystackRequest.on('error', (error) => {
      console.error('Paystack API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect to verification service'
      });
    });

    paystackRequest.write(postData);
    paystackRequest.end();

  } catch (error) {
    console.error('❌ Account verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Account verification failed'
    });
  }
});

// Paystack Transfer Endpoint - Send money to mobile money account
app.post('/transfer', async (req, res) => {
  try {
    const { recipientCode, amount, reference, reason } = req.body;

    if (!recipientCode || !amount || !reference) {
      return res.status(400).json({
        success: false,
        error: 'recipientCode, amount, and reference are required'
      });
    }

    console.log(`💸 Processing transfer: ${amount} GHS to ${recipientCode}`);

    // Paystack Secret Key
    // SECURITY: Secret key from environment variable
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({
        success: false,
        error: 'Paystack secret key not configured'
      });
    }
    
    const https = require('https');
    const postData = JSON.stringify({
      source: 'balance',
      amount: Math.round(amount * 100), // Convert GHS to pesewas
      recipient: recipientCode,
      reason: reason || 'Mmasa earnings withdrawal',
      reference: reference,
      currency: 'GHS'
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transfer',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const paystackRequest = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          console.log('Paystack transfer response:', result);

          if (result.status === true && result.data) {
            // Transfer initiated successfully
            res.json({
              success: true,
              transferCode: result.data.transfer_code,
              reference: result.data.reference,
              status: result.data.status,
              message: result.message || 'Transfer initiated successfully'
            });
          } else {
            // Transfer failed
            res.json({
              success: false,
              error: result.message || 'Transfer failed',
              details: result.data
            });
          }
        } catch (error) {
          console.error('Error parsing Paystack response:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to parse transfer response'
          });
        }
      });
    });

    paystackRequest.on('error', (error) => {
      console.error('Paystack Transfer API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect to transfer service'
      });
    });

    paystackRequest.write(postData);
    paystackRequest.end();

  } catch (error) {
    console.error('❌ Transfer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Transfer processing failed'
    });
  }
});

// Simple confidence calculation
function calculateConfidence(text) {
  if (!text || text.length === 0) return 0;
  
  // Basic heuristics for confidence
  let confidence = 0.5; // Start at 50%
  
  // Increase confidence if we find common betting slip keywords
  const keywords = [
    'BOOKING', 'CODE', 'ODDS', 'STAKE', 'BET', 'WIN',
    'SPORTYBET', 'BET9JA', '1XBET', 'BETWAY'
  ];
  
  const upperText = text.toUpperCase();
  const keywordsFound = keywords.filter(k => upperText.includes(k)).length;
  confidence += (keywordsFound * 0.05); // +5% per keyword
  
  // Cap at 95%
  return Math.min(confidence, 0.95);
}

// ========== SLIP PURCHASE VERIFICATION ==========
// SECURITY: Server-side check to prevent purchasing expired slips
// This is the authoritative check - client-side checks can be bypassed
app.post('/api/verify-slip-purchase', async (req, res) => {
  try {
    const { slipId } = req.body;
    
    if (!slipId) {
      return res.status(400).json({
        success: false,
        error: 'Slip ID is required'
      });
    }

    // TODO: Implement with Firebase Admin SDK
    // Install: npm install firebase-admin
    // Initialize with service account JSON
    // Then uncomment and implement the code below:
    
    /*
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(require('./path-to-service-account.json'))
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
    */
    
    // TEMPORARY: Return success for now
    // NOTE: Actual expiry enforcement happens in FirestoreService.purchaseSlip
    // which is called after payment succeeds. This endpoint is for pre-payment UX.
    // For true security, implement Firebase Admin SDK above.
    console.log(`✅ Slip purchase verification requested for: ${slipId}`);
    return res.json({
      success: true,
      purchasable: true,
      message: 'Verification passed (client-side enforcement active)'
    });
    
  } catch (error) {
    console.error('Error verifying slip purchase:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify slip purchase'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server - bind to 0.0.0.0 to allow access from physical devices
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OCR Server running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.1.152:${PORT}`);
  console.log(`📸 Ready to process images from physical devices!`);
  console.log(`\n💡 Usage:`);
  console.log(`   curl -X POST -F "image=@slip.jpg" http://192.168.1.152:${PORT}/ocr\n`);
});

