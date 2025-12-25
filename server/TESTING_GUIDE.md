# 🧪 Testing Booking Code Scraper

## ✅ Server Status

The server is running and the endpoint is working!

**Endpoint:** `POST http://localhost:3001/api/scrape-booking-code`

## 🧪 How to Test

### Option 1: Using the Test Script

```bash
cd server
node test-scraper.js <Platform> <BookingCode>

# Examples:
node test-scraper.js SportyBet ABC123XYZ
node test-scraper.js Bet9ja XYZ789ABC
```

### Option 2: Using cURL

```bash
curl -X POST http://localhost:3001/api/scrape-booking-code \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "SportyBet",
    "bookingCode": "YOUR_CODE_HERE",
    "url": "https://www.sportybet.com/gh/share/code/YOUR_CODE_HERE"
  }'
```

### Option 3: From Mobile App

1. Open the app
2. Go to "Add Slip"
3. Select "Manual Entry"
4. Enter a booking code
5. Select platform
6. Tap "Extract Matches from URL"

## 📋 Expected Responses

### ✅ Success Response

```json
{
  "matches": [
    {
      "homeTeam": "Arsenal",
      "awayTeam": "Chelsea",
      "prediction": "home",
      "odds": 2.5,
      "market": "h2h"
    }
  ],
  "totalOdds": 2.5,
  "stake": 10.0,
  "potentialWin": 25.0,
  "platform": "SportyBet",
  "bookingCode": "ABC123XYZ"
}
```

### ❌ Error Responses

**404 - Booking Code Not Found:**
```json
{
  "error": "Booking code not found",
  "message": "The booking code URL returned 404. The code may be invalid or expired.",
  "status": 404
}
```

**403 - Access Forbidden:**
```json
{
  "error": "Access forbidden",
  "message": "The booking code may be private or require authentication.",
  "status": 403
}
```

**500 - Server Error:**
```json
{
  "error": "Failed to scrape booking code",
  "message": "Error details..."
}
```

## 🔍 Testing with Real Booking Codes

To test with real booking codes:

1. **Get a real booking code** from a betting platform
2. **Make sure it's a shareable/public code** (not private)
3. **Test the URL in browser first** - visit the share URL to confirm it works
4. **Then test via API**

### Example Real Test:

```bash
# Replace with actual booking code
node test-scraper.js SportyBet REAL_CODE_HERE
```

## 🛠️ Debugging

### Check Server Logs

The server logs all requests. Watch the terminal where the server is running.

### Common Issues

1. **404 Error**: Booking code doesn't exist or expired
2. **403 Error**: Code is private/requires login
3. **Timeout**: Platform is slow or blocking requests
4. **Parse Errors**: HTML structure changed - need to update selectors

### Inspect HTML Structure

To update parsers, you need to inspect the actual HTML:

1. Visit the booking code URL in browser
2. View page source (Right-click → View Source)
3. Find the match data structure
4. Update CSS selectors in `parseSportyBet()`, `parseBet9ja()`, etc.

## 📝 Next Steps

1. ✅ Server is running
2. ✅ Endpoint is working
3. ⏳ Test with real booking codes
4. ⏳ Adjust HTML parsers based on actual structure
5. ⏳ Handle edge cases (expired codes, private slips, etc.)

## 🚀 Ready to Use!

The scraper is functional. You just need to:
- Test with real booking codes
- Fine-tune the HTML parsers for each platform
- Handle platform-specific edge cases



