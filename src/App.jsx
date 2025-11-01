import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import ParticipantManagement from "./pages/ParticipantManagement";
import RandomOrdering from "./pages/RandomOrdering";
import ClubSelection from "./pages/ClubSelection";
import GroupDraw from "./pages/GroupDraw";
import TournamentTable from "./pages/TournamentTable";
import QualifiedTeams from "./pages/QualifiedTeams";
import KnockoutStage from "./pages/KnockoutStage";
import Settings from "./pages/Settings";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthButton from "./components/AuthButton";
import { checkAndMigrateIfNeeded } from "./utils/userIdMigration";
import { getTournamentSettings } from "./firebase/dbService";
import { getTournamentId } from "./utils/tournamentContext";
import "./App.css";

// Conditional Route wrapper that redirects if feature is disabled
function ConditionalRoute({ isEnabled, element, redirectTo = "/" }) {
  if (!isEnabled) {
    // Show a message instead of infinite redirects if we're already at the redirect target
    if (window.location.pathname === redirectTo) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            color: "#fff",
            fontSize: "1.2rem",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div>
            <p>This page has been disabled by the tournament administrator.</p>
            <p style={{ fontSize: "1rem", marginTop: "1rem", opacity: 0.7 }}>
              Please contact the admin or check the navigation menu for
              available pages.
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to={redirectTo} replace />;
  }
  return element;
}

function Navigation() {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    participantManagementEnabled: true,
    randomOrderingEnabled: true,
    clubSelectionEnabled: true,
    groupDrawEnabled: true,
    tournamentTableEnabled: true,
    knockoutStageEnabled: true,
    qualifiedTeamsEnabled: true,
  });

  // Load settings from Firestore on mount and when user changes
  useEffect(() => {
    const loadSettings = async () => {
      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;

      try {
        const savedSettings = await getTournamentSettings(tournamentId);
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error("Error loading tournament settings:", error);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Listen for settings changes from Settings page
  useEffect(() => {
    const handleSettingsChange = async () => {
      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;

      try {
        const saved = await getTournamentSettings(tournamentId);
        if (saved) {
          setSettings(saved);
        }
      } catch (error) {
        console.error("Error reloading settings:", error);
      }
    };

    window.addEventListener("tournamentSettingsChanged", handleSettingsChange);
    return () => {
      window.removeEventListener(
        "tournamentSettingsChanged",
        handleSettingsChange
      );
    };
  }, [currentUser]);

  // Show loading screen while auth is initializing (after all hooks)
  if (loading) {
    return (
      <div className="app">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "1.5rem",
            color: "#fff",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div className="header-logos">
              <img
                src="/adobe-logo.png"
                alt="Adobe"
                className="header-logo adobe-logo"
              />
              <img
                src="/eafc-logo.png"
                alt="EA Sports FC"
                className="header-logo ea-logo"
              />
            </div>
            <div className="header-right">
              <AuthButton />
              <button
                className={`hamburger ${menuOpen ? "active" : ""}`}
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
          <nav className={`nav ${menuOpen ? "open" : ""}`}>
            {settings.participantManagementEnabled && (
              <Link to="/" className="nav-link" onClick={closeMenu}>
                Add Participants
              </Link>
            )}
            {settings.randomOrderingEnabled && (
              <Link to="/ordering" className="nav-link" onClick={closeMenu}>
                Random Order
              </Link>
            )}
            {settings.clubSelectionEnabled && (
              <Link to="/clubs" className="nav-link" onClick={closeMenu}>
                Club Selection
              </Link>
            )}
            {settings.groupDrawEnabled && (
              <Link to="/groups" className="nav-link" onClick={closeMenu}>
                Group Draw
              </Link>
            )}
            {settings.tournamentTableEnabled && (
              <Link to="/tournament" className="nav-link" onClick={closeMenu}>
                Tournament Table
              </Link>
            )}
            {settings.knockoutStageEnabled && (
              <Link to="/knockout" className="nav-link" onClick={closeMenu}>
                Knockout Stage
              </Link>
            )}
            {settings.qualifiedTeamsEnabled && (
              <Link to="/qualified" className="nav-link" onClick={closeMenu}>
                Qualified Teams
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/settings" className="nav-link" onClick={closeMenu}>
                ⚙️ Settings
              </Link>
            )}
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route
              path="/"
              element={
                <ConditionalRoute
                  isEnabled={settings.participantManagementEnabled}
                  element={<ParticipantManagement />}
                />
              }
            />
            <Route
              path="/ordering"
              element={
                <ConditionalRoute
                  isEnabled={settings.randomOrderingEnabled}
                  element={<RandomOrdering />}
                />
              }
            />
            <Route
              path="/clubs"
              element={
                <ConditionalRoute
                  isEnabled={settings.clubSelectionEnabled}
                  element={<ClubSelection />}
                />
              }
            />
            <Route
              path="/groups"
              element={
                <ConditionalRoute
                  isEnabled={settings.groupDrawEnabled}
                  element={<GroupDraw />}
                />
              }
            />
            <Route
              path="/tournament"
              element={
                <ConditionalRoute
                  isEnabled={settings.tournamentTableEnabled}
                  element={<TournamentTable />}
                />
              }
            />
            <Route
              path="/qualified"
              element={
                <ConditionalRoute
                  isEnabled={settings.qualifiedTeamsEnabled}
                  element={<QualifiedTeams />}
                />
              }
            />
            <Route
              path="/knockout"
              element={
                <ConditionalRoute
                  isEnabled={settings.knockoutStageEnabled}
                  element={<KnockoutStage />}
                />
              }
            />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  // Run userId migration on app initialization
  useEffect(() => {
    checkAndMigrateIfNeeded();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Navigation />
      </Router>
    </AuthProvider>
  );
}

export default App;
