# Firestore Security Rules Setup Guide

## ⚠️ IMPORTANT: Fix "Missing or insufficient permissions" Error

If you're getting this error, it means Firestore security rules are not configured. Follow these steps to fix it:

## Quick Fix (5 minutes)

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **fifa-tournament-tool**
3. Click on **Firestore Database** in the left sidebar

### Step 2: Navigate to Rules

1. Click on the **Rules** tab at the top
2. You'll see the current rules (probably in test mode or denying all access)

### Step 3: Update Rules

Replace the existing rules with these secure rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Tournament data collection - users can only access their own data
    match /tournamentData/{userId} {
      // Allow read and write only if the authenticated user's ID matches the document ID
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 4: Publish Rules

1. Click the **Publish** button at the top right
2. Confirm the changes
3. Wait a few seconds for the rules to deploy

### Step 5: Test

1. Go back to your application
2. Sign in
3. Try adding participants or accessing tournament data
4. The error should be gone! ✅

---

## Understanding the Rules

### What These Rules Do:

```javascript
match /tournamentData/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

This rule:

- ✅ **Requires authentication**: `request.auth != null`
- ✅ **User isolation**: Users can only access documents where the document ID matches their user ID
- ✅ **Full CRUD**: Users can read and write their own tournament data
- ❌ **No cross-user access**: Users cannot see or modify other users' data

### Security Features:

1. **Authentication Required**: Users must be signed in
2. **Data Isolation**: Each user can only access their own data
3. **No Unauthorized Access**: Deny all other access by default
4. **Simple and Secure**: Easy to understand and maintain

---

## Alternative: Test Mode (NOT RECOMMENDED for Production)

⚠️ **WARNING**: Only use this for testing/development. Never use in production!

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // WARNING: Allow all read/write for 30 days (testing only)
      allow read, write: if request.time < timestamp.date(2025, 12, 1);
    }
  }
}
```

This allows anyone to read/write any data until the specified date. **Not secure!**

---

## Troubleshooting

### Still Getting Permission Errors?

1. **Check Authentication**:

   - Make sure you're signed in to the app
   - Check the browser console for authentication errors
   - Verify your email/password is correct

2. **Check Rules Published**:

   - Go back to Firebase Console → Firestore → Rules
   - Verify the rules match the ones above
   - Check if there's a "Publish" button (if so, rules aren't published yet)

3. **Check Document Structure**:

   - In Firestore Console, go to **Data** tab
   - You should see a collection named `tournamentData`
   - Each document ID should match a user's UID
   - Example: `tournamentData/abc123xyz` (where abc123xyz is the user's UID)

4. **Clear Browser Cache**:

   - Sometimes cached permissions cause issues
   - Try signing out and signing in again
   - Or clear browser cache and cookies

5. **Check Firebase Project**:
   - Verify you're in the correct Firebase project
   - Project ID should be: `fifa-tournament-tool`

### Error: "Error performing get: Missing or insufficient permissions"

This means:

- Rules are not published yet, OR
- You're not authenticated, OR
- Rules are configured incorrectly

**Solution**: Follow Steps 1-5 above again carefully.

---

## Advanced: Custom Rules (Optional)

### Allow Read-Only Access for Specific Fields

```javascript
match /tournamentData/{userId} {
  // Full access to own data
  allow read, write: if request.auth != null && request.auth.uid == userId;

  // Read-only access to specific fields for all authenticated users
  allow get: if request.auth != null
    && resource.data.keys().hasAny(['tournamentSettings', 'publicData']);
}
```

### Add Data Validation

```javascript
match /tournamentData/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;

  allow write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.keys().hasAll(['tournamentSettings'])
    && request.resource.data.participantNames is list;
}
```

---

## Deployment with Firebase CLI (Optional)

If you want to deploy rules from command line:

1. **Install Firebase CLI**:

   ```bash
   npm install -g firebase-tools
   ```

2. **Login**:

   ```bash
   firebase login
   ```

3. **Initialize**:

   ```bash
   firebase init firestore
   ```

   - Select your project
   - Accept default for rules file (`firestore.rules`)
   - Accept default for indexes file

4. **Deploy Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Security Best Practices

✅ **DO**:

- Always require authentication
- Use user ID matching for personal data
- Test rules in the Rules Playground
- Monitor usage in Firebase Console
- Review rules regularly

❌ **DON'T**:

- Never use test mode in production
- Don't allow public read/write access
- Don't skip authentication checks
- Don't share admin credentials
- Don't ignore security warnings

---

## Testing Rules

### In Firebase Console:

1. Go to Firestore → Rules
2. Click **Rules Playground** button
3. Select operation type (get, list, create, update, delete)
4. Enter document path: `tournamentData/testUserId`
5. Set authenticated user ID to: `testUserId`
6. Click **Run**
7. Should show: ✅ **Allowed**

### In Your App:

1. Sign in with test account
2. Try adding a participant
3. Check browser console for errors
4. Verify data appears in Firestore Console

---

## Quick Reference

| Action                 | Required                      | Rule       |
| ---------------------- | ----------------------------- | ---------- |
| Read own data          | Authenticated + User ID match | ✅ Allowed |
| Write own data         | Authenticated + User ID match | ✅ Allowed |
| Read others' data      | Any                           | ❌ Denied  |
| Write others' data     | Any                           | ❌ Denied  |
| Unauthenticated access | Any                           | ❌ Denied  |

---

## Need Help?

If you're still having issues:

1. Check the Firebase Console → Usage tab for error details
2. Look at the Firestore → Data tab to see if data is being created
3. Check browser console for detailed error messages
4. Verify authentication is working (check AuthContext)
5. Make sure Firestore is enabled (not in "disabled" state)

---

**Last Updated**: November 2025  
**For Project**: FIFA Tournament Tool  
**Firebase Project**: fifa-tournament-tool
