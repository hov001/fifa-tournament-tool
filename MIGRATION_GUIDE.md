# Data Migration Guide: localStorage to Firestore

## Overview

This application has been migrated from using browser localStorage to Firebase Firestore for data storage. This provides several benefits:

- ✅ **Multi-device access**: Access your tournament data from any device
- ✅ **Data security**: Protected by Firebase authentication
- ✅ **No data loss**: Data persists even if browser cache is cleared
- ✅ **Real-time sync**: Data automatically syncs across sessions

## Automatic Migration

### How It Works

When you sign in to the application after this update, the system will automatically:

1. **Check for existing data**: Scan localStorage for tournament data
2. **Migrate to Firestore**: Copy all data to your Firestore account
3. **Verify migration**: Ensure data was transferred successfully
4. **Mark as complete**: Set a flag to prevent duplicate migrations

### What Gets Migrated

The following data is automatically migrated:

- Tournament settings (page visibility preferences)
- Participant names and information
- Ordered participants with selected clubs
- Available clubs list
- Group assignments
- Group standings and statistics
- Match history
- Knockout stage matches and results

### Migration Process

```
User Signs In
    ↓
Check: Migration Already Done?
    ↓ (No)
Check: Data in localStorage?
    ↓ (Yes)
Check: User Already Has Firestore Data?
    ↓ (No)
Migrate Each Data Type
    ↓
Mark Migration Complete
    ↓
Continue Using App
```

## Manual Migration

If automatic migration fails or you want to manually trigger it:

1. **Sign in** to the application
2. Navigate to **Settings** page (⚙️ icon in navigation)
3. Scroll to **Data Migration** section
4. Check the migration status
5. Click **"Migrate Now"** if migration is not completed

## After Migration

### Clearing localStorage

Once migration is complete, you can safely clear localStorage data:

1. Go to **Settings** page
2. In the **Data Migration** section
3. Click **"Clear localStorage"** button
4. Confirm the action

**Note**: Your data is safe in Firestore. Clearing localStorage just removes the local copy.

### Verification

To verify your data was migrated successfully:

1. Check that all your participants, matches, and tournament data are visible
2. Try accessing the app from a different device or browser (after signing in)
3. Your data should be identical across all devices

## Troubleshooting

### Migration Not Completing

If migration doesn't complete automatically:

1. Check browser console for error messages
2. Ensure you have a stable internet connection
3. Try the manual migration option in Settings
4. Contact support if issues persist

### Data Missing After Migration

If some data appears to be missing:

1. Check if you're signed in with the correct account
2. Verify migration status in Settings
3. Check browser console for errors
4. Data may still be in localStorage (not cleared yet)

### Resetting Migration (For Testing)

If you need to reset the migration flag:

```javascript
// Open browser console and run:
localStorage.removeItem("firestore_migration_completed");
```

Then refresh the page and sign in again to trigger migration.

## Technical Details

### Migration Implementation

- **File**: `src/firebase/localStorageMigration.js`
- **Trigger**: Runs on user authentication in `AuthContext.jsx`
- **Flag**: `firestore_migration_completed` in localStorage
- **Safety**: Checks for existing Firestore data before migrating

### Data Structure in Firestore

All user data is stored in a single document:

```
Collection: tournamentData
Document: {userId}
Fields:
  - tournamentSettings: Object
  - participantNames: Array
  - participants: Array
  - availableClubs: Array
  - groups: Array
  - groupStandings: Array
  - matchHistory: Array
  - knockoutMatches: Object
```

### Security Rules

Firestore security rules ensure:

- Users can only access their own data
- Authentication is required for all operations
- Data is validated before writing

## FAQ

**Q: Will I lose my data during migration?**
A: No, data is copied from localStorage to Firestore. The original localStorage data remains until you manually clear it.

**Q: Can I use the app without signing in?**
A: After migration, you must sign in to access and manage tournament data.

**Q: What happens if I clear my browser cache?**
A: Your data is safe in Firestore! Just sign in again and your data will load from the cloud.

**Q: Can I access my data from multiple devices?**
A: Yes! Sign in with the same account on any device to access your tournament data.

**Q: How do I know if migration was successful?**
A: Check the Settings page for migration status. It will show "✓ Data has been migrated to Firestore" when complete.

**Q: Can I export my data?**
A: Currently, data is stored in Firestore. You can view and manage it through the application interface.

## Support

If you encounter issues with migration:

1. Check this guide first
2. Review browser console for error messages
3. Try the manual migration option
4. Contact development team with:
   - Browser and version
   - Error messages
   - Steps to reproduce the issue

---

**Last Updated**: November 2025  
**Version**: 2.0.0 (Firestore Migration)
