# Migration Fix: Participants Not Showing After Firestore Migration

## Problem Fixed

**Issue**: Participants were removed from Firestore or not showing up after migration.

**Root Causes**:

1. Automatic migration ran before user signed in
2. Data was in localStorage but not migrated to Firestore
3. Firestore security rules were preventing access
4. Clear All function removed all data

## Solutions Implemented

### 1. **Automatic localStorage Check on Load** ✅

The `ParticipantManagement` page now automatically checks localStorage when Firestore is empty:

```javascript
// When loading participants
if (!savedParticipants || savedParticipants.length === 0) {
  // Check localStorage and migrate automatically
  const localStorageData = localStorage.getItem("participantNames");
  if (localStorageData) {
    // Migrate to Firestore
    await setParticipantNames(currentUser.uid, parsedLocal);
  }
}
```

**This happens automatically when you:**

- Sign in to the app
- Navigate to the Add Participants page
- Firestore has no data but localStorage does

### 2. **Manual Migration Button** ✅

Added a "Migrate from localStorage" button that appears when:

- You're signed in as admin
- No participants are showing (participants.length === 0)
- There's localStorage data available

**How to Use**:

1. Sign in to the app
2. Go to "Add Participants" page
3. If you see "Migrate from localStorage" button, click it
4. Your data will be restored from localStorage to Firestore

### 3. **Checks Multiple localStorage Keys** ✅

The migration now checks both:

- `participantNames` - Basic participant list
- `participants` - Ordered participants with clubs

**Priority**:

1. First checks `participantNames`
2. If not found, checks `participants` (ordered list)
3. Extracts participant info and migrates to Firestore

### 4. **Improved Console Logging** ✅

Added detailed console logs to help debug:

```
No data in Firestore, checking localStorage...
Found participantNames in localStorage, migrating...
✓ Migrated participantNames to Firestore
```

**To see logs**:

- Open browser Developer Tools (F12)
- Go to Console tab
- Refresh the page or sign in
- Watch for migration messages

## How to Recover Your Data

### Option 1: Automatic Recovery (Easiest)

1. **Sign in** to the app
2. **Go to** "Add Participants" page (`/`)
3. **Wait** for automatic migration
4. Check console for: `✓ Migrated participants to Firestore`
5. Your participants should appear!

### Option 2: Manual Migration Button

1. **Sign in** to the app
2. **Go to** "Add Participants" page
3. **Look for** "Migrate from localStorage" button
4. **Click** the button
5. Alert will confirm migration success
6. Participants will appear immediately

### Option 3: Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `fifa-tournament-tool`
3. Click **Firestore Database**
4. Look for collection: `tournamentData`
5. Find document with your user ID
6. Check if `participantNames` field exists
7. If empty, use Option 1 or 2 above

### Option 4: Check localStorage in Browser

1. Open browser Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → your app URL
4. Look for keys:
   - `participantNames`
   - `participants`
5. If data exists, use Option 1 or 2 to migrate

## Data Flow

```
Old Flow (Before Fix):
Sign In → Load from Firestore → Empty → Show Nothing ❌

New Flow (After Fix):
Sign In → Load from Firestore → Empty?
  → Check localStorage → Found data?
    → Migrate to Firestore → Show Data ✅
```

## Prevention

To prevent losing data in the future:

### 1. **Don't Use "Clear All" Unless Necessary**

- This deletes ALL tournament data from Firestore
- Cannot be undone
- Only use when starting a completely new tournament

### 2. **Verify Firestore Security Rules**

- Follow [FIRESTORE_RULES_SETUP.md](./FIRESTORE_RULES_SETUP.md)
- Ensure rules allow authenticated users to read/write their data

### 3. **Check Data After Operations**

- After adding participants, verify they appear
- Check browser console for errors
- If errors appear, don't continue until fixed

### 4. **Use Manual Migration if Needed**

- The button is always available when no data shows
- Safe to click multiple times
- Won't duplicate data

## Verification Checklist

After migration, verify:

- [ ] Participants show in the list
- [ ] Participant count is correct
- [ ] Photos/avatars are preserved
- [ ] Can add new participants
- [ ] Data persists after page refresh
- [ ] No errors in browser console
- [ ] Data visible in Firestore Console

## Technical Details

### Modified Files:

- `src/pages/ParticipantManagement.jsx`

### Changes Made:

1. Added localStorage check in `loadParticipants` useEffect
2. Checks both `participantNames` and `participants` keys
3. Added `manualMigrate()` function
4. Added "Migrate from localStorage" button
5. Improved console logging for debugging

### Data Structure:

**localStorage keys checked**:

```javascript
participantNames: [
  {
    userId: "abc123",
    id: "abc123",
    name: "Player Name",
    avatar: "😀",
    customImage: "base64...",
  },
];

participants: [
  {
    userId: "abc123",
    id: "abc123",
    name: "Player Name",
    avatar: "😀",
    customImage: "base64...",
    order: 1,
    club: { name: "Club", logo: "..." },
  },
];
```

**Firestore structure**:

```
tournamentData/{userId}/
  participantNames: Array<Participant>
  participants: Array<OrderedParticipant>
  // ... other tournament data
```

## Troubleshooting

### Still No Data After Migration?

1. **Check Browser Console**:

   - Any red errors?
   - Do you see migration messages?
   - Are there authentication errors?

2. **Verify Sign-In**:

   - Are you signed in?
   - Is your email verified?
   - Try signing out and back in

3. **Check localStorage Data**:

   ```javascript
   // Open console and run:
   console.log(localStorage.getItem("participantNames"));
   console.log(localStorage.getItem("participants"));
   ```

   - If both return `null`, data was cleared
   - Need to re-add participants manually

4. **Check Firestore Rules**:

   - Go to Firebase Console → Firestore → Rules
   - Verify rules allow read/write for authenticated users
   - See [FIRESTORE_RULES_SETUP.md](./FIRESTORE_RULES_SETUP.md)

5. **Check Network Tab**:
   - Open Developer Tools → Network tab
   - Filter by "firestore"
   - Check if requests are failing
   - Look for 403 (permission denied) errors

### Migration Button Not Showing?

The button only shows when:

- You're authenticated (signed in)
- `participants.length === 0` (no data loaded)
- There's data in localStorage

**To force it to show**:

1. Sign in
2. Make sure page shows "No participants added yet"
3. Check console to see if localStorage has data

### Data Migrated But Still Empty?

This might mean:

- localStorage data was in wrong format
- Migration had an error (check console)
- Firestore write failed (check network tab)

**Solution**:

1. Check console for error messages
2. Try manual migration button again
3. If still failing, manually re-add participants

## Need Help?

If you're still experiencing issues:

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Screenshot any error messages
4. Check what's in localStorage:
   ```javascript
   console.log("participantNames:", localStorage.getItem("participantNames"));
   console.log("participants:", localStorage.getItem("participants"));
   ```
5. Check Firestore Console for your data
6. Provide screenshots and error messages for support

---

**Last Updated**: November 2025  
**Status**: ✅ Fixed and Tested  
**Build Status**: ✅ Passing
