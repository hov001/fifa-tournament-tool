# Public Viewing Configuration

This application is now configured to allow **anyone to view tournament data immediately** without requiring authentication.

## How It Works

1. **Default Tournament ID**: The app uses a default tournament ID that everyone can view
2. **Public Read Access**: Firestore rules allow anyone to read tournament data
3. **Admin-Only Writes**: Only authenticated admins can modify tournament data

## Configuration Steps

### 1. Get Your Admin User ID

First, you need to find your admin user ID:

1. Sign in to the app as an admin
2. Open browser developer tools (F12)
3. Go to the Console tab
4. Run: `localStorage.getItem('viewingTournamentId')`
5. Copy the user ID that appears (e.g., `"eHcIGH0uqiSe1SuYBfLBPAb0NJz2"`)

### 2. Set the Default Tournament ID

Open `src/firebase/config.js` and update the `DEFAULT_TOURNAMENT_ID` constant:

```javascript
export const DEFAULT_TOURNAMENT_ID = "YOUR_ADMIN_USER_ID_HERE";
```

Replace `"YOUR_ADMIN_USER_ID_HERE"` with the user ID you copied in step 1.

### 3. Verify Firestore Rules

Make sure your `firestore.rules` file has public read access:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /tournamentData/{userId} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Deploy and Test

1. Build your app: `npm run build`
2. Deploy to your hosting
3. Visit the site **without logging in** - you should see all tournament data immediately!

## How Users Interact

### Non-Authenticated Users (Viewers)

- Can view all tournament data in real-time
- See participants, clubs, groups, matches, standings, knockout stages
- **Cannot** make any changes (buttons are disabled)
- No login required

### Authenticated Users (Admin)

- Can view and edit all tournament data
- Can add/remove participants
- Can generate random orders
- Can select clubs
- Can create groups
- Can record match results
- Full control over the tournament

## Sharing Your Tournament

Simply share the URL of your deployed app:

- `https://your-app-domain.com`

Anyone who visits will automatically see your tournament data!

## Security Notes

- **Read Access**: Public (anyone can view)
- **Write Access**: Protected (only the admin who created the tournament can modify it)
- Each admin can only modify their own tournament data
- User authentication is required for all write operations

## Troubleshooting

### Data Not Loading?

1. Check that `DEFAULT_TOURNAMENT_ID` is set correctly in `src/firebase/config.js`
2. Verify the admin has created some tournament data
3. Check browser console for any errors
4. Ensure Firestore rules are deployed correctly

### Need Multiple Tournaments?

If you have multiple admins/tournaments, each admin should:

1. Create their own Firebase account
2. Sign in and create their tournament
3. Get their user ID
4. Set it as the `DEFAULT_TOURNAMENT_ID` for their deployment

Or, you can modify the app to support tournament selection by adding a tournament ID selector in the UI.
