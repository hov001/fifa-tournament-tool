import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Container from "../components/Container";
import {
  getTournamentSettings,
  setTournamentSettings,
} from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./Settings.css";

function Settings() {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    participantManagementEnabled: true,
    randomOrderingEnabled: true,
    clubSelectionEnabled: true,
    groupDrawEnabled: true,
    tournamentTableEnabled: true,
    knockoutStageEnabled: true,
    qualifiedTeamsEnabled: true,
  });

  // Load settings from Firestore on mount (both authenticated and non-authenticated can view)
  useEffect(() => {
    const loadSettings = async () => {
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        setLoading(false);
        return;
      }

      try {
        const savedSettings = await getTournamentSettings(tournamentId);
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Save settings to Firestore when they change (only for authenticated users)
  useEffect(() => {
    const saveSettings = async () => {
      if (!currentUser || loading) return;

      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;

      try {
        await setTournamentSettings(tournamentId, settings);
        // Dispatch event so other components can react to settings changes
        window.dispatchEvent(new Event("tournamentSettingsChanged"));
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    };

    saveSettings();
  }, [settings, currentUser, loading]);

  const toggleFeature = (featureName) => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to modify settings");
      return;
    }
    setSettings({
      ...settings,
      [featureName]: !settings[featureName],
    });
  };

  if (loading) {
    return (
      <div className="settings">
        <Container>
          <p>Loading settings...</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="settings">
      <Container>
        <div className="header-section">
          <h2>Tournament Settings</h2>
          <Button onClick={() => navigate("/")} variant="secondary">
            Back to Tournament
          </Button>
        </div>

        <div className="settings-section">
          <h3>Tournament Flow</h3>
          {!isAuthenticated && (
            <div className="auth-notice" style={{ marginBottom: "1rem" }}>
              <p>🔒 Sign in as admin to modify settings</p>
            </div>
          )}
          <p className="settings-description">
            Enable or disable tournament pages. Disabling a page will hide it
            from navigation but preserve any existing data. Pages are shown in
            tournament order.
          </p>

          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Add Participants</h4>
                <p>Manage tournament participants and their information</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.participantManagementEnabled}
                  onChange={() => toggleFeature("participantManagementEnabled")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Random Order</h4>
                <p>
                  Generate random order for participants before club selection
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.randomOrderingEnabled}
                  onChange={() => toggleFeature("randomOrderingEnabled")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Club Selection</h4>
                <p>Random club selection for each participant</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.clubSelectionEnabled}
                  onChange={() => toggleFeature("clubSelectionEnabled")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Group Draw</h4>
                <p>Conduct random group stage draw for the tournament</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.groupDrawEnabled}
                  onChange={() => toggleFeature("groupDrawEnabled")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Tournament Table</h4>
                <p>Group stage standings and match results</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.tournamentTableEnabled}
                  onChange={() => toggleFeature("tournamentTableEnabled")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Knockout Stage</h4>
                <p>Quarterfinals, semifinals, third place, and final matches</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.knockoutStageEnabled}
                  onChange={() => toggleFeature("knockoutStageEnabled")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Qualified Teams</h4>
                <p>View qualified teams with rankings and statistics</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.qualifiedTeamsEnabled}
                  onChange={() => toggleFeature("qualifiedTeamsEnabled")}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-note">
          <p>
            <strong>Note:</strong> These settings only affect visibility.
            Existing data will be preserved and can be accessed again by
            re-enabling the features.
          </p>
        </div>
      </Container>
    </div>
  );
}

export default Settings;
