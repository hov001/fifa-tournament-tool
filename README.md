# EA FC 26 Tournament App

## 🔥 IMPORTANT: Firestore Setup Required

**Firestore security rules must be deployed for the app to work correctly!**

👉 **Deploy Firestore Rules**: [FIRESTORE_READ_ACCESS_FIX.md](./FIRESTORE_READ_ACCESS_FIX.md) (5 minutes)

The app now allows:

- ✅ Everyone can READ tournament data (viewers)
- ✅ Only authenticated users can WRITE (admin)

**📖 Read more**: [FIRESTORE_SECURITY_CRITICAL.md](./FIRESTORE_SECURITY_CRITICAL.md) for security best practices

---

A modern React application for managing EA FC 26 individual tournaments with dynamic participant management, random ordering, club selection, and tournament standings. Features **Firebase Authentication** for admin access control.

## 🔐 Authentication

The app now includes **Firebase Authentication** with two modes:

- **Admin Mode** (Signed In): Full access to add, edit, and delete data
- **Viewer Mode** (Not Signed In): Read-only access to view tournament information

### Admin Features (Requires Sign-In)

✅ Add/Remove participants  
✅ Add/Delete/Update matches  
✅ Reset tournament data  
✅ Clear all data

### Viewer Features (No Sign-In Required)

✅ View participants  
✅ View tournament standings  
✅ View match history  
✅ View knockout brackets  
✅ View qualified teams

**Setup Instructions**: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete Firebase configuration guide.

## Features

### 1. Add Participants Page (`/`)

- Add unlimited participants to the tournament
- **Upload custom photos** for each participant (or use emoji avatars)
- Real-time photo preview with validation (max 2MB)
- Choose from 16 colorful emoji avatars
- Remove participants individually
- Clear all participants at once
- Validation to prevent duplicate names
- Shows participant count
- Persistent storage of participant list and photos

### 2. Random Ordering Page (`/ordering`)

- Randomly shuffle and assign order numbers to all participants
- **Displays participant photos** during shuffling animation
- Animated shuffling effect for excitement
- Shows final order with badges (🥇🥈🥉) for top 3
- Lock-in mechanism (one-time randomization unless reset)
- Success message when ordering is complete
- Proceed to club selection after ordering

### 3. Club Selection Page (`/clubs`)

- Display list of 16 EA FC 26 clubs with **real club logos**
- Random club selection with animated spinner for each participant
- **Shows participant photos and avatars** with order numbers
- Visual feedback during selection process
- Persistent storage of selections
- Reset functionality to re-select clubs

### 4. Tournament Table Page (`/tournament`)

- Live tournament standings with:
  - Position (with top 3 highlighted)
  - **Player photos/avatars** with order badges
  - **Club logos** next to club names
  - Games played (P)
  - Wins (W)
  - Draws (D)
  - Losses (L)
  - Goals for (GF)
  - Goals against (GA)
  - Goal difference (GD) - color-coded
  - Points (Pts)
- Add match results with modal interface
- Automatic standings calculation and sorting
- Persistent storage of tournament data
- Reset functionality

## Getting Started

### 🚨 CRITICAL: Secure Your Firestore Database

**Your database is not secure until you deploy security rules!**

👉 **[Follow FIRESTORE_SECURITY_CRITICAL.md](./FIRESTORE_SECURITY_CRITICAL.md)** (5 minutes)

Without proper rules, anyone can read/write your data!

### 1. Installation

```bash
npm install
```

### 2. Firebase Setup (REQUIRED)

Before running the app, you need to configure Firebase:

1. Follow the complete setup guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. Create a Firebase project
3. Enable Email/Password authentication
4. **🔥 CRITICAL: Deploy Firestore security rules** - [FIRESTORE_SECURITY_CRITICAL.md](./FIRESTORE_SECURITY_CRITICAL.md)
5. Create an admin user
6. Update `src/firebase/config.js` with your Firebase credentials

### 3. Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 4. Build

```bash
npm run build
```

### 5. Admin Login

- Click "Admin Login" in the header
- Sign in with the admin credentials you created in Firebase Console
- All admin features will become available

### 6. Viewing Modes

The application supports two viewing modes:

#### 🔒 Authenticated Mode (Admin)

- Sign in to manage and edit tournament data
- All data is saved to Firestore and synced across devices
- Full access to all tournament management features

#### 👀 Non-Authenticated Mode (Viewer)

- View tournament data without signing in
- Read-only access to all pages
- Data is loaded from browser's localStorage
- Perfect for spectators watching tournament progress
- **Note**: Viewers see data from their browser's localStorage only

**📖 For more details, see [NON_AUTH_VIEW_FIX.md](./NON_AUTH_VIEW_FIX.md)**

## How to Use

### Step-by-Step Tournament Setup

**Note**: Steps 1-3 require admin authentication. Step 4 can be viewed by anyone.

1. **Sign In as Admin** (Required for setup):

   - Click "Admin Login" in the header
   - Enter your admin email and password
   - You're now in Admin Mode

2. **Add Participants** (`/`):

   - Enter participant names one by one
   - Add at least 2 participants
   - Click "Proceed to Ordering" when done

3. **Random Ordering** (`/ordering`):

   - Click "Generate Random Order" to randomly assign order numbers
   - Watch the animated shuffle
   - See the final order with badges for top 3 positions
   - Click "Proceed to Club Selection"

4. **Select Clubs** (`/clubs`):

   - Each participant (in order) clicks "Select Random Club"
   - Watch the animated club selection
   - Each club can only be selected once
   - Participants are shown with their order numbers

5. **Play Tournament** (`/tournament`):
   - Admin: Click "Add Match Result" to record game outcomes
   - Admin: Select home team, away team, and enter scores
   - Everyone: View standings that automatically update and sort
   - Everyone: Track all statistics throughout the tournament
   - Admin: Delete or reset matches as needed

## Flow Diagram

```
Add Participants → Random Ordering → Club Selection → Tournament Table
```

Each step saves data to browser storage, so you can navigate back and forth without losing progress.

## Technologies

- React 18
- React Router DOM 6
- Firebase Authentication
- Firebase Firestore (Cloud Database)
- Vite
- CSS3 with modern animations
- Automatic localStorage → Firestore migration
- Component-based architecture

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Avatar.jsx       # Participant avatar display
│   ├── AuthButton.jsx   # Login/Logout button
│   ├── AuthModal.jsx    # Login modal
│   ├── Button.jsx       # Styled button component
│   ├── ClubCard.jsx     # Club display card
│   ├── ClubLogo.jsx     # Club logo component
│   ├── Container.jsx    # Page container wrapper
│   ├── Modal.jsx        # Modal dialog
│   ├── OrderBadge.jsx   # Order number badge
│   ├── PlayerCard.jsx   # Player info card
│   └── index.js         # Component exports
├── context/            # React Context
│   └── AuthContext.jsx # Authentication context
├── data/               # Data and configurations
│   ├── clubs.js        # Club data with logos
│   └── avatars.js      # Avatar options
├── firebase/           # Firebase configuration
│   └── config.js       # Firebase setup
├── pages/              # Page components
│   ├── ParticipantManagement.jsx
│   ├── RandomOrdering.jsx
│   ├── ClubSelection.jsx
│   ├── TournamentTable.jsx
│   ├── GroupDraw.jsx
│   ├── KnockoutStage.jsx
│   └── QualifiedTeams.jsx
├── App.jsx             # Main app with routing
└── main.jsx            # App entry point
```

## Features Details

### Custom Photos & Avatars

- **Upload real photos** for each participant (JPG, PNG, GIF, etc.)
- Image validation (file type and 2MB size limit)
- Photos converted to base64 and stored in localStorage
- Fallback to **16 emoji avatars** with unique colors
- **Circular display** with professional styling
- Photos persist across all pages and sessions

### Random Selection Animations

- **Ordering**: Cycles through all participants 20 times before selecting final order
- **Club Selection**: Highlights clubs in sequence before randomly selecting one
- Both use smooth CSS animations for visual appeal

### Automatic Sorting

The tournament table automatically sorts teams by:

1. Points (3 for win, 1 for draw, 0 for loss)
2. Goal difference
3. Goals scored
4. Alphabetically by player name

### Data Persistence

All data is saved to browser's LocalStorage:

- `participantNames`: List of participant names
- `orderedParticipants`: Participants with their order numbers
- `participants`: Participants with their clubs
- `availableClubs`: Remaining clubs to select
- `standings`: Tournament standings and match history

### Responsive Design

The app is fully responsive and works on desktop, tablet, and mobile devices with adaptive layouts and touch-friendly interfaces.

## Navigation

The app features a persistent header with navigation to all four pages, allowing easy movement between different sections of the tournament management system.

## Reset Options (Admin Only)

- **Add Participants**: Clear all participants (resets entire tournament)
- **Random Ordering**: Reset the order (allows re-randomization)
- **Club Selection**: Reset club selections (keeps participants and order)
- **Tournament Table**: Reset standings (keeps participants and clubs, clears match results)
- **Knockout Stage**: Reset knockout bracket results

## Documentation

### Setup Guides

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Complete Firebase setup guide
- [FIRESTORE_RULES_SETUP.md](./FIRESTORE_RULES_SETUP.md) - **REQUIRED**: Firestore security rules setup
- [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) - Authentication implementation details

### Migration Guides

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - User guide for localStorage to Firestore migration
- [FIRESTORE_MIGRATION_SUMMARY.md](./FIRESTORE_MIGRATION_SUMMARY.md) - Technical migration details

## Security

- ✅ Admin authentication required for all data modifications
- ✅ User data isolation with Firebase security rules
- ✅ Automatic data migration from localStorage to Firestore
- ✅ Each user can only access their own tournament data
- ⚠️ **Firestore security rules MUST be configured** - See [FIRESTORE_RULES_SETUP.md](./FIRESTORE_RULES_SETUP.md)
- ⚠️ Never commit Firebase credentials to public repositories (use environment variables)
