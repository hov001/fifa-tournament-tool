# Non-Authenticated View Fix

## Issue

After migrating to Firestore, non-authenticated users could not view tournament data. The original design allowed:

- **Authenticated users (Admin)**: Full CRUD access
- **Non-authenticated users (Viewers)**: Read-only access to tournament data

However, the Firestore migration made all data user-scoped, requiring authentication to access any data.

## Solution

Implemented a hybrid approach where:

1. **Authenticated users**: Load data from Firestore (full CRUD)
2. **Non-authenticated users**: Load data from localStorage (read-only)

This maintains backward compatibility and allows viewers to see tournament progress without signing in.

## Modified Files

All main tournament pages were updated to support non-authenticated viewing:

### 1. ParticipantManagement.jsx

- Loads `participantNames` from localStorage for non-authenticated users
- Displays participants in read-only mode
- Shows "Sign in to manage participants" message

### 2. RandomOrdering.jsx

- Loads `participants` or `participantNames` from localStorage
- Shows ordering in read-only mode
- Randomize button disabled for non-authenticated users

### 3. ClubSelection.jsx

- Loads `participants` and `availableClubs` from localStorage
- Shows club selections in read-only mode
- Selection buttons disabled for non-authenticated users

### 4. GroupDraw.jsx

- Loads `participants` and `groups` from localStorage
- Shows group assignments in read-only mode
- Draw button disabled for non-authenticated users

### 5. TournamentTable.jsx

- Loads `groups`, `groupStandings`, and `matchHistory` from localStorage
- Shows standings and match results in read-only mode
- Edit/delete buttons disabled for non-authenticated users

### 6. KnockoutStage.jsx

- Loads `knockoutMatches` and `groupStandings` from localStorage
- Shows knockout bracket in read-only mode
- Edit buttons disabled for non-authenticated users

### 7. QualifiedTeams.jsx

- Loads `knockoutMatches` and `groupStandings` from localStorage
- Shows qualified teams at each stage in read-only mode

## How It Works

### Loading Logic

Each page now follows this pattern:

```javascript
useEffect(() => {
  const loadData = async () => {
    // If not authenticated, load from localStorage (read-only mode)
    if (!currentUser) {
      try {
        const localData = localStorage.getItem("keyName");
        if (localData) {
          const parsed = JSON.parse(localData);
          setState(parsed);
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
      setLoading(false);
      return;
    }

    // Authenticated user: load from Firestore
    try {
      const data = await getFromFirestore(currentUser.uid);
      setState(data);
    } catch (error) {
      console.error("Error loading from Firestore:", error);
    }
    setLoading(false);
  };

  loadData();
}, [currentUser]);
```

### Data Flow

**For Authenticated Users:**

```
Sign In → Load from Firestore → Edit → Save to Firestore
                                   ↓
                        (Also saves to localStorage via migration)
```

**For Non-Authenticated Users:**

```
Visit Page → Load from localStorage → View Only (Read-only)
```

## localStorage Keys Used

The following localStorage keys are accessed for non-authenticated viewing:

- `participantNames` - List of participants
- `participants` - Ordered participants with clubs
- `availableClubs` - Available clubs for selection
- `groups` - Group stage assignments
- `groupStandings` - Current standings and points
- `matchHistory` - Match results history
- `knockoutMatches` - Knockout stage bracket
- `tournamentSettings` - Tournament configuration

## Benefits

1. **Backward Compatibility**: Existing localStorage data is still viewable
2. **No Breaking Changes**: Authenticated users continue using Firestore
3. **Better UX**: Viewers can see tournament progress without signing in
4. **Original Design Maintained**: Admin (write) vs Viewer (read-only) roles preserved

## Testing

To test non-authenticated viewing:

1. **Sign out** of the application
2. Visit any tournament page
3. You should see existing data from localStorage
4. All edit/modify buttons should be disabled or hidden
5. You should see a message prompting to sign in for editing

## Notes

- Non-authenticated users will see data last saved to localStorage
- If an authenticated user clears localStorage, non-authenticated viewers will see no data
- For multi-user scenarios, consider implementing a "share tournament" feature where authenticated users can publish their tournament to a public URL
- localStorage is browser-specific, so viewers on different devices won't see the same data unless they're on the same machine

## Future Enhancements

Consider implementing:

1. **Public Tournament URLs**: Allow admins to share tournament via unique URLs
2. **Export/Import**: Allow admins to export tournament data and share as a file
3. **QR Code Sharing**: Generate QR codes for easy tournament viewing
4. **Real-time Updates**: Use Firestore real-time listeners for live tournament updates
