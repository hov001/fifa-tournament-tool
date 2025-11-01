# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your FIFA Tournament App.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "FIFA Tournament App")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "FIFA Tournament Web")
3. Click "Register app"
4. Copy the Firebase configuration object shown on the screen

## Step 3: Enable Email/Password Authentication

1. In the Firebase Console, go to **Authentication** in the left sidebar
2. Click the **Sign-in method** tab
3. Click on **Email/Password**
4. Enable it by toggling the switch
5. Click **Save**

## Step 4: Create an Admin User

1. Still in the **Authentication** section, click on the **Users** tab
2. Click **Add user**
3. Enter an email and password for your admin account
4. Click **Add user**

## Step 5: Configure Your App

1. Open `/src/firebase/config.js` in your project
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API key
  authDomain: "YOUR_AUTH_DOMAIN", // Replace with your actual auth domain
  projectId: "YOUR_PROJECT_ID", // Replace with your actual project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your actual storage bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your messaging sender ID
  appId: "YOUR_APP_ID", // Replace with your app ID
};
```

### Example Configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1xXxXxXxXxXxXxXxXxXxXxXxXxXx",
  authDomain: "fifa-tournament-app.firebaseapp.com",
  projectId: "fifa-tournament-app",
  storageBucket: "fifa-tournament-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

## Step 6: Run Your App

1. Save the configuration file
2. Run your development server:
   ```bash
   npm run dev
   ```
3. Open your app in the browser
4. Click the **Admin Login** button in the header
5. Sign in with the admin credentials you created in Step 4

## Features

### For Signed-In Admins:

- ✅ Add/Remove participants
- ✅ Generate random order
- ✅ Reset random order
- ✅ Select clubs for participants
- ✅ Reset club selections
- ✅ Conduct group draw
- ✅ Reset group draw
- ✅ Add match results
- ✅ Delete match results
- ✅ Update match results
- ✅ Reset tournament standings
- ✅ Reset knockout stage
- ✅ Clear all tournament data

### For Non-Authenticated Users:

- ✅ View participants
- ✅ View random order results
- ✅ View club selections
- ✅ View group draw
- ✅ View tournament tables
- ✅ View match history
- ✅ View knockout bracket
- ✅ View qualified teams
- ❌ Cannot modify any data

## Security Notes

- The Firebase configuration file can be safely committed to your repository
- The sensitive information is your authentication rules in Firebase Console
- Make sure to set up proper security rules in Firebase if deploying to production
- Never share your admin credentials

## Troubleshooting

### Issue: "Firebase app not initialized"

- Solution: Make sure your Firebase configuration is correct and complete

### Issue: "Auth domain not authorized"

- Solution: Go to Firebase Console → Authentication → Settings → Authorized domains and add your domain

### Issue: "Invalid email/password"

- Solution: Double-check your admin credentials or create a new user in Firebase Console

## Production Deployment

When deploying to production, consider:

1. **Authorized Domains**: Add your production domain to Firebase Console
2. **Security Rules**: Set up proper Firestore/Storage security rules if needed
3. **Environment Variables**: Consider using environment variables for Firebase config
4. **Multiple Admins**: Add more admin users in Firebase Console as needed

## Support

If you encounter any issues, check:

- Firebase Console for error logs
- Browser console for JavaScript errors
- Firebase documentation: https://firebase.google.com/docs
