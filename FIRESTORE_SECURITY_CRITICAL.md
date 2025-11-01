# 🔒 CRITICAL: Firestore Security Setup

## ⚠️ URGENT: Your Firestore is Currently Insecure!

If non-authenticated users can see Firestore data, your database security rules are not properly configured. **This must be fixed immediately!**

## The Problem

Without proper security rules:

- ❌ Anyone can read your tournament data from Firestore
- ❌ Anyone can write/modify/delete data
- ❌ Your database is completely exposed
- ❌ Non-authenticated users can bypass your app's authentication checks

## The Solution

Deploy strict Firestore security rules that **deny all access by default** and only allow authenticated users to access their own data.

---

## 🚨 Deploy Security Rules NOW (5 Minutes)

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** in the left sidebar
4. Click the **"Rules"** tab at the top

### Step 2: Copy These Secure Rules

Replace ALL existing rules with these secure rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // DENY ALL ACCESS BY DEFAULT
    // This is critical - it prevents unauthorized access
    match /{document=**} {
      allow read, write: if false;
    }

    // Allow authenticated users to read/write ONLY their own tournament data
    match /tournamentData/{userId} {
      // Must be authenticated AND user ID must match
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 3: Publish the Rules

1. Click **"Publish"** button
2. Wait for confirmation message
3. Rules are now active!

### Step 4: Test the Security

**Test 1: Unauthenticated Access (Should Fail)**

1. Sign out of your app
2. Open browser console (F12)
3. Try to read data:
   ```javascript
   // This should fail with "Missing or insufficient permissions"
   const db = firebase.firestore();
   db.collection("tournamentData")
     .get()
     .then(() => console.log("❌ INSECURE - Unauthenticated access succeeded!"))
     .catch(() => console.log("✅ SECURE - Unauthenticated access blocked!"));
   ```

**Test 2: Authenticated Access (Should Succeed)**

1. Sign in to your app
2. Navigate to any page
3. Data should load normally from Firestore

---

## Understanding the Security Rules

### Rule 1: Deny All by Default

```javascript
match /{document=**} {
  allow read, write: if false;
}
```

- Blocks ALL access to ALL collections by default
- Safety net to prevent accidental data exposure
- Any collection not explicitly allowed is blocked

### Rule 2: Allow User-Specific Access

```javascript
match /tournamentData/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

- `request.auth != null` → User must be signed in
- `request.auth.uid == userId` → User can only access their own data
- Path `/tournamentData/{userId}` → Each user has their own isolated data

---

## Why This Matters

### Without Proper Rules:

```
Non-Authenticated User → Firestore → ✅ Full Access (BAD!)
```

### With Proper Rules:

```
Non-Authenticated User → Firestore → ❌ Access Denied (GOOD!)
Non-Authenticated User → localStorage → ✅ Read-Only (GOOD!)

Authenticated User → Firestore → ✅ Own Data Only (GOOD!)
```

---

## Common Mistakes to Avoid

### ❌ DON'T Use Test Mode Rules

```javascript
// NEVER use this in production!
allow read, write: if true;
```

### ❌ DON'T Allow Read Access to All

```javascript
// This is still insecure
allow read: if true;
allow write: if request.auth != null;
```

### ❌ DON'T Forget to Check User ID

```javascript
// This allows any authenticated user to access any data
allow read, write: if request.auth != null;
// Missing: && request.auth.uid == userId
```

### ✅ DO Use Strict Rules

```javascript
// Secure: Authentication + User ID match
allow read, write: if request.auth != null && request.auth.uid == userId;
```

---

## How to Verify Your Rules Are Active

### Method 1: Firebase Console

1. Go to Firestore Database → Rules
2. Check the timestamp shows recent publish time
3. Verify the rules match the secure template above

### Method 2: Test in Browser Console

**While Signed Out:**

```javascript
// Should fail with permission error
fetch(
  "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default)/documents/tournamentData"
)
  .then((r) => r.json())
  .then((d) => console.log("❌ INSECURE:", d))
  .catch((e) => console.log("✅ SECURE:", e));
```

**While Signed In:**

```javascript
// Should succeed
import { getDoc, doc } from "firebase/firestore";
import { db, auth } from "./firebase/config";

const userId = auth.currentUser.uid;
const docRef = doc(db, "tournamentData", userId);
getDoc(docRef)
  .then(() => console.log("✅ Access to own data works"))
  .catch((e) => console.log("❌ Error:", e));
```

---

## Emergency: Already Exposed Data

If your data was already exposed:

### 1. Change Security Rules Immediately (above)

### 2. Review Access Logs

1. Go to Firebase Console
2. Click "Usage" tab
3. Check for unusual read/write patterns

### 3. Consider Rotating Sensitive Data

- If tournament data contains sensitive information
- Create a new Firebase project
- Migrate only verified data

### 4. Enable App Check (Optional)

1. Go to Firebase Console → App Check
2. Follow setup to add additional protection
3. Prevents unauthorized API access

---

## Monitoring and Maintenance

### Regular Security Checks

**Weekly:**

- Review Firebase Console → Rules
- Check "Last published" timestamp
- Verify rules haven't been modified

**Monthly:**

- Review access patterns in Usage tab
- Check for authentication anomalies
- Update Firebase Admin SDK if needed

### Set Up Alerts

1. Firebase Console → Project Settings
2. Enable Cloud Monitoring
3. Set alerts for:
   - Unusual read/write spikes
   - Permission denied errors (should see these from non-auth users)
   - Unexpected authentication patterns

---

## Data Flow After Fix

### For Non-Authenticated Users:

```
1. Visit App
2. App checks: isAuthenticated? → No
3. App loads from: localStorage (Browser Storage)
4. Firestore access: BLOCKED by security rules ✅
5. User sees: Read-only data from localStorage
```

### For Authenticated Users:

```
1. Visit App
2. Sign In → Firebase Authentication
3. App checks: isAuthenticated? → Yes
4. App loads from: Firestore (userId matches)
5. Firestore access: ALLOWED for own data only ✅
6. User sees: Full CRUD access to their data
```

---

## Additional Security Recommendations

### 1. Enable Email Verification

```javascript
// In your sign-up flow
await sendEmailVerification(user);
```

### 2. Use Strong Password Requirements

- Minimum 8 characters
- Require uppercase, lowercase, numbers
- Consider requiring special characters

### 3. Implement Rate Limiting

- Prevent brute force attacks
- Use Firebase App Check
- Consider Cloud Functions for additional validation

### 4. Regular Backups

- Use Firebase Console → Database → Export
- Schedule regular exports
- Store backups securely

### 5. Audit User Access

- Log all admin actions
- Review user list regularly
- Remove inactive users

---

## Need Help?

### Firebase Documentation

- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Common Patterns](https://firebase.google.com/docs/firestore/security/rules-conditions)

### Test Your Rules

- [Rules Playground](https://console.firebase.google.com/) (Rules tab → Test)
- Simulate authenticated and unauthenticated requests
- Verify rules work as expected

---

## ✅ Checklist

Before considering your Firestore secure:

- [ ] Firestore security rules deployed (strict rules above)
- [ ] Rules published and active (check timestamp)
- [ ] Tested: Non-authenticated users blocked from Firestore
- [ ] Tested: Authenticated users can access own data
- [ ] Tested: Authenticated users cannot access other users' data
- [ ] Verified: Non-authenticated users see localStorage data only
- [ ] Email verification enabled (recommended)
- [ ] Regular backups scheduled (recommended)
- [ ] Access monitoring enabled (recommended)

---

## Summary

**The Fix:**

1. ✅ Deploy strict Firestore security rules (see Step 2 above)
2. ✅ Non-authenticated users → localStorage only
3. ✅ Authenticated users → Firestore (own data only)
4. ✅ Default deny all unauthorized access

**Your `firestore.rules` file is ready to deploy!**

Copy the rules from this file (or from `/firestore.rules` in your project) to Firebase Console → Firestore Database → Rules → Publish.
