/**
 * This script contains sample data structures for initializing Firestore.
 * Copy these structures and manually create them in Firebase Console.
 * 
 * DO NOT run this as a script - it's a reference guide only.
 * Use Firebase Console or Firebase Admin SDK to populate data.
 */

// Sample Creators
export const sampleCreators = [
  {
    name: "Mike Predictions",
    avatar: "https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff",
    subscribers: 2500,
    winRate: 82.5,
    totalSlips: 200,
    verifiedStatus: "verified",
    description: "Professional football analyst. Specializing in Premier League and Champions League predictions.",
    // createdAt: [Use Firebase serverTimestamp]
  },
  {
    name: "Sarah Sports",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Sports&background=8B5CF6&color=fff",
    subscribers: 1800,
    winRate: 75.3,
    totalSlips: 150,
    verifiedStatus: "verified",
    description: "Multi-sport expert covering football, basketball, and tennis.",
    // createdAt: [Use Firebase serverTimestamp]
  },
  {
    name: "David Odds",
    avatar: "https://ui-avatars.com/api/?name=David+Odds&background=EF4444&color=fff",
    subscribers: 3200,
    winRate: 88.2,
    totalSlips: 300,
    verifiedStatus: "verified",
    description: "Value betting specialist. Focus on finding the best odds in the market.",
    // createdAt: [Use Firebase serverTimestamp]
  },
  {
    name: "James Stats",
    avatar: "https://ui-avatars.com/api/?name=James+Stats&background=F59E0B&color=fff",
    subscribers: 980,
    winRate: 70.1,
    totalSlips: 95,
    verifiedStatus: "unverified",
    description: "Data-driven predictions using advanced statistics.",
    // createdAt: [Use Firebase serverTimestamp]
  },
];

// Sample Slips
export const sampleSlips = [
  {
    // creatorId: "[Replace with actual creator ID]",
    creatorName: "Mike Predictions",
    creatorAvatar: "https://ui-avatars.com/api/?name=Mike+Predictions&background=10B981&color=fff",
    title: "Liverpool vs Arsenal",
    description: "Liverpool to win. They have a strong home record and Arsenal are missing key players.",
    odds: 2.10,
    status: "pending",
    // matchDate: [Set to future date],
    sport: "Football",
    league: "Premier League",
    stake: 100,
    potentialWin: 210,
    // createdAt: [Use Firebase serverTimestamp],
    likes: 45,
    comments: 12,
  },
  {
    // creatorId: "[Replace with actual creator ID]",
    creatorName: "Sarah Sports",
    creatorAvatar: "https://ui-avatars.com/api/?name=Sarah+Sports&background=8B5CF6&color=fff",
    title: "Lakers vs Warriors - Over 220.5",
    description: "Both teams have high-scoring offenses. Expect a high-scoring game.",
    odds: 1.90,
    status: "won",
    // matchDate: [Recent past date],
    sport: "Basketball",
    league: "NBA",
    stake: 50,
    potentialWin: 95,
    // createdAt: [Use Firebase serverTimestamp],
    likes: 67,
    comments: 23,
  },
  {
    // creatorId: "[Replace with actual creator ID]",
    creatorName: "David Odds",
    creatorAvatar: "https://ui-avatars.com/api/?name=David+Odds&background=EF4444&color=fff",
    title: "Real Madrid vs Barcelona",
    description: "Both teams to score. El Clasico rarely disappoints with goals from both sides.",
    odds: 1.75,
    status: "pending",
    // matchDate: [Set to future date],
    sport: "Football",
    league: "La Liga",
    stake: 200,
    potentialWin: 350,
    // createdAt: [Use Firebase serverTimestamp],
    likes: 123,
    comments: 45,
  },
];

// Sample Notifications
export const sampleNotifications = [
  {
    // userId: "[Replace with actual user ID]",
    type: "slip_update",
    title: "Slip Won! 🎉",
    message: "Your slip 'Lakers vs Warriors' has won! Check it out.",
    read: false,
    // relatedId: "[Slip ID]",
    // createdAt: [Use Firebase serverTimestamp],
  },
  {
    // userId: "[Replace with actual user ID]",
    type: "new_slip",
    title: "New Slip from Mike Predictions",
    message: "Mike Predictions just posted a new slip for Liverpool vs Arsenal.",
    read: false,
    // relatedId: "[Slip ID]",
    // createdAt: [Use Firebase serverTimestamp],
  },
];

// Instructions for setting up data:
// 1. Go to Firebase Console -> Firestore Database
// 2. Create a new collection (e.g., 'creators')
// 3. Add a new document
// 4. Copy the fields from the objects above
// 5. For timestamp fields, use the 'timestamp' type and select server timestamp
// 6. Repeat for each collection

