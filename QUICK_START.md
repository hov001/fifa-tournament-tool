# Quick Start Guide - Public Tournament Viewing

## ✅ What Was Changed

Your app now **automatically loads tournament data for all visitors without requiring login**!

### Changes Made:

1. **Added Default Tournament ID** (`src/firebase/config.js`)

   - Set to: `eHcIGH0uqiSe1SuYBfLBPAb0NJz2`
   - This is the tournament that everyone will see by default

2. **Updated Tournament Context** (`src/utils/tournamentContext.js`)

   - Falls back to default tournament ID when no user is logged in
   - Ensures data loads immediately on page visit

3. **Firestore Rules** (already configured ✓)
   - Public read access: Anyone can view tournament data
   - Protected write access: Only admin can modify

## 🚀 What Happens Now

### For Non-Logged-In Users (Viewers):

- **Instant Access**: Tournament data loads immediately when they visit the site
- **Full Visibility**: Can see participants, clubs, groups, matches, standings, knockout stages
- **No Login Required**: Just visit the URL and watch the tournament
- **Read-Only**: All modification buttons are disabled

### For Logged-In Admin:

- **Full Control**: Can edit all tournament data
- **Real-Time Updates**: Changes appear instantly for all viewers
- **Protected Operations**: Only you can modify your tournament

## ⚙️ Configuration (If Needed)

The default tournament ID is currently set to: **`eHcIGH0uqiSe1SuYBfLBPAb0NJz2`**

### To Change the Default Tournament:

1. **Find Your User ID**:

   ```javascript
   // In browser console after logging in as admin:
   localStorage.getItem("viewingTournamentId");
   ```

2. **Update the Config**:

   - Open `src/firebase/config.js`
   - Change line 28:

   ```javascript
   export const DEFAULT_TOURNAMENT_ID = "YOUR_NEW_TOURNAMENT_ID_HERE";
   ```

3. **Rebuild and Deploy**:
   ```bash
   npm run build
   ```

## 📤 Sharing Your Tournament

Simply share your app URL:

- `https://your-app-domain.com`

Anyone who visits will see your tournament instantly!

## 🔍 Testing

### Test as Viewer (Non-Logged-In):

1. Open an incognito/private browser window
2. Visit your app URL
3. You should see all tournament data immediately
4. Verify all modification buttons are disabled

### Test as Admin (Logged-In):

1. Sign in with your admin credentials
2. Make a change (e.g., add a participant)
3. Open another browser/tab without logging in
4. Verify the change appears there too

## 🎯 Next Steps

1. **Deploy your app** (if not already deployed)
2. **Create/update your tournament data** as admin
3. **Share the URL** with your viewers
4. **Enjoy real-time tournament viewing!**

## 📋 Summary

✅ Data loads immediately without login  
✅ Public viewing enabled  
✅ Admin controls protected  
✅ Real-time updates for all viewers  
✅ No configuration needed (using default tournament)

Your tournament is now ready for public viewing! 🎉
