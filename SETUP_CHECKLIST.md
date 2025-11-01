# Firebase Authentication Setup Checklist

Use this checklist to set up Firebase Authentication for your FIFA Tournament App.

## ✅ Pre-Setup (Already Complete)

- [x] Firebase SDK installed
- [x] Authentication components created
- [x] All pages protected with auth checks
- [x] UI updated with login/logout functionality
- [x] App successfully builds

## 📋 What You Need to Do

### Step 1: Create Firebase Project (5 minutes)

- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add project"
- [ ] Name your project (e.g., "FIFA Tournament App")
- [ ] Complete the setup wizard
- [ ] Click "Create project"

### Step 2: Register Web App (2 minutes)

- [ ] Click the web icon (`</>`) to add a web app
- [ ] Give it a nickname (e.g., "FIFA Tournament Web")
- [ ] Click "Register app"
- [ ] **IMPORTANT**: Copy the Firebase configuration object

### Step 3: Enable Email/Password Auth (2 minutes)

- [ ] Go to Authentication → Sign-in method
- [ ] Click "Email/Password"
- [ ] Toggle it ON
- [ ] Click "Save"

### Step 4: Create Admin User (1 minute)

- [ ] Go to Authentication → Users
- [ ] Click "Add user"
- [ ] Enter email: **\*\***\_\_\_\_**\*\***
- [ ] Enter password: **\*\***\_\_\_\_**\*\***
- [ ] Click "Add user"
- [ ] **SAVE THESE CREDENTIALS SECURELY!**

### Step 5: Configure Your App (2 minutes)

- [ ] Open `/src/firebase/config.js` in your code editor
- [ ] Replace the placeholder values with your Firebase config
- [ ] Save the file

Example:

```javascript
const firebaseConfig = {
  apiKey: "AIza...", // Your actual API key
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123",
};
```

### Step 6: Test Your Setup (5 minutes)

- [ ] Run `npm run dev`
- [ ] Open the app in your browser
- [ ] Click "Admin Login" in the header
- [ ] Sign in with your admin credentials
- [ ] Verify you can see edit/delete buttons
- [ ] Try adding a participant
- [ ] Sign out
- [ ] Verify edit/delete buttons are hidden
- [ ] Verify you can still view data

## 🎉 Success Criteria

You're done when:

✅ App runs without errors  
✅ Login modal appears when clicking "Admin Login"  
✅ You can sign in with admin credentials  
✅ Admin email appears in header after login  
✅ All edit/delete buttons are visible when signed in  
✅ All edit/delete buttons are hidden when signed out  
✅ You can add participants when signed in  
✅ You can generate random order when signed in  
✅ You can select clubs when signed in  
✅ You can conduct group draw when signed in  
✅ You can add matches when signed in  
✅ Non-authenticated users can view all data  
✅ Non-authenticated users cannot modify anything

## ⚠️ Troubleshooting

### Issue: "Firebase app not initialized"

**Solution**: Check that your config is complete and saved properly

### Issue: "Auth domain not authorized"

**Solution**: Go to Firebase Console → Authentication → Settings → Authorized domains

### Issue: Can't sign in

**Solution**:

1. Check your email/password in Firebase Console
2. Verify Email/Password auth is enabled
3. Check browser console for errors

### Issue: Buttons still hidden after login

**Solution**:

1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
2. Check browser console for errors
3. Verify you're actually signed in (email shows in header)

## 📚 Additional Resources

- Full setup guide: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- Implementation details: [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md)
- Main README: [README.md](./README.md)
- Firebase Docs: https://firebase.google.com/docs/auth

## 🔒 Security Reminders

- ✅ Firebase config can be public (it's in your frontend code)
- ✅ Your Firebase security rules protect your data
- ❌ Never share admin passwords
- ❌ Never commit sensitive credentials to git
- ⚠️ Consider using environment variables for production

## Need Help?

If you're stuck, check:

1. Browser console for error messages
2. Firebase Console for any warning indicators
3. The detailed guides in FIREBASE_SETUP.md

---

**Estimated Total Time**: 15-20 minutes

**Required**: Firebase account (free tier is fine)
