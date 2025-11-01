import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../context/AuthContext";
import { avatarOptions } from "../data/avatars";
import Button from "../components/Button";
import Container from "../components/Container";
import Avatar from "../components/Avatar";
import {
  getParticipantNames,
  setParticipantNames,
  getParticipants,
  setParticipants,
  deleteParticipants,
  getGroups,
  setGroups,
  deleteGroups,
  getGroupStandings,
  setGroupStandings,
  deleteGroupStandings,
  getMatchHistory,
  setMatchHistory,
  deleteMatchHistory,
  getAvailableClubs,
  setAvailableClubs,
  clearAllTournamentData,
} from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./ParticipantManagement.css";

function ParticipantManagement() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();

  // Function to generate unique userId using UUID
  const generateUserId = () => {
    return uuidv4();
  };

  const [participants, setParticipantsState] = useState([]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load participants from Firestore (both authenticated and non-authenticated users)
  useEffect(() => {
    const loadParticipants = async () => {
      // Get the tournament ID to load from
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        setLoading(false);
        return;
      }

      // Load from Firestore using the tournament ID
      try {
        const savedParticipants = await getParticipantNames(tournamentId);

        if (savedParticipants && savedParticipants.length > 0) {
          // Add userId to existing participants that don't have one (backward compatibility)
          const normalizedParticipants = savedParticipants.map((p) => {
            if (typeof p === "string") {
              const userId = generateUserId();
              return {
                userId: userId,
                id: userId,
                name: p,
                avatar: avatarOptions[0],
                customImage: null,
              };
            } else if (!p.userId) {
              const newUserId = generateUserId();
              return {
                ...p,
                userId: newUserId,
                id: p.id || newUserId,
              };
            }
            return p;
          });
          setParticipantsState(normalizedParticipants);
        }
      } catch (error) {
        console.error("Error loading participants:", error);
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [currentUser]);

  // Save participants to Firestore when they change (only for authenticated users)
  useEffect(() => {
    const saveParticipants = async () => {
      if (!currentUser || loading) return;

      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;

      try {
        await setParticipantNames(tournamentId, participants);
      } catch (error) {
        console.error("Error saving participants:", error);
      }
    };

    saveParticipants();
  }, [participants, currentUser, loading]);

  const setParticipants = (newParticipants) => {
    setParticipantsState(newParticipants);
  };

  const addParticipant = () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to add participants");
      return;
    }

    if (!newParticipantName.trim()) {
      alert("Please enter a participant name");
      return;
    }

    const nameExists = participants.some(
      (p) => (typeof p === "string" ? p : p.name) === newParticipantName.trim()
    );

    if (nameExists) {
      alert("This participant already exists");
      return;
    }

    const userId = generateUserId();
    const newParticipant = {
      userId: userId,
      id: userId,
      name: newParticipantName.trim(),
      avatar: selectedAvatar,
      customImage: imageUrl || null,
    };

    setParticipants([...participants, newParticipant]);
    setNewParticipantName("");
    setImageUrl("");
    setShowUrlInput(false);
  };

  const handleAvatarClick = () => {
    setShowUrlInput(true);
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      // Basic URL validation
      if (!imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        const proceed = window.confirm(
          "This doesn't look like a valid image URL. Continue anyway?"
        );
        if (!proceed) return;
      }
      setShowUrlInput(false);
    }
  };

  const clearImageUrl = () => {
    setImageUrl("");
    setShowUrlInput(false);
  };

  const removeParticipant = async (index) => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to remove participants");
      return;
    }

    if (!currentUser) return;

    const participantToRemove = participants[index];
    const updatedParticipants = participants.filter((_, i) => i !== index);

    setParticipants(updatedParticipants);

    try {
      // Remove from participantNames
      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;
      await setParticipantNames(tournamentId, updatedParticipants);

      // Check if participant had a club before removing
      const savedParticipants = await getParticipants(tournamentId);
      let removedParticipantClub = null;

      if (savedParticipants) {
        const removedParticipant = savedParticipants.find(
          (p) => p.userId === participantToRemove.userId
        );

        if (removedParticipant && removedParticipant.club) {
          removedParticipantClub = removedParticipant.club;
        }

        // Remove from participants (ordered list)
        const filteredParticipants = savedParticipants.filter(
          (p) => p.userId !== participantToRemove.userId
        );

        if (filteredParticipants.length > 0) {
          await setParticipants(tournamentId, filteredParticipants);
        } else {
          await deleteParticipants(tournamentId);
        }
      }

      // Remove from groups
      const savedGroups = await getGroups(tournamentId);
      if (savedGroups) {
        const updatedGroups = savedGroups
          .map((group) => ({
            ...group,
            teams: group.teams.filter(
              (team) => team.userId !== participantToRemove.userId
            ),
          }))
          .filter((group) => group.teams.length > 0);

        if (updatedGroups.length > 0) {
          await setGroups(tournamentId, updatedGroups);
        } else {
          await deleteGroups(tournamentId);
        }
      }

      // Remove from groupStandings
      const savedStandings = await getGroupStandings(tournamentId);
      if (savedStandings) {
        const updatedStandings = savedStandings
          .map((group) => ({
            ...group,
            teams: group.teams.filter(
              (team) => team.participantId !== participantToRemove.userId
            ),
          }))
          .filter((group) => group.teams.length > 0);

        if (updatedStandings.length > 0) {
          await setGroupStandings(tournamentId, updatedStandings);
        } else {
          await deleteGroupStandings(tournamentId);
        }
      }

      // Remove from matchHistory
      const savedMatches = await getMatchHistory(tournamentId);
      if (savedMatches) {
        const filteredMatches = savedMatches.filter(
          (match) =>
            match.homeTeam.id !== participantToRemove.userId &&
            match.awayTeam.id !== participantToRemove.userId
        );

        if (filteredMatches.length > 0) {
          await setMatchHistory(tournamentId, filteredMatches);
        } else {
          await deleteMatchHistory(tournamentId);
        }
      }

      // If participant had a club, return it to available clubs
      if (removedParticipantClub) {
        const savedAvailableClubs = await getAvailableClubs(tournamentId);
        if (savedAvailableClubs) {
          const availableClubs = [
            ...savedAvailableClubs,
            removedParticipantClub,
          ];
          await setAvailableClubs(tournamentId, availableClubs);
        }
      }
    } catch (error) {
      console.error("Error removing participant:", error);
      alert("Error removing participant. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addParticipant();
    }
  };

  const proceedToOrdering = () => {
    if (participants.length < 2) {
      alert("Please add at least 2 participants");
      return;
    }
    navigate("/ordering");
  };

  const clearAll = async () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to clear all data");
      return;
    }

    if (!currentUser) return;

    if (
      window.confirm(
        "Are you sure you want to clear ALL tournament data? This will reset the entire application including participants, ordering, club selections, and tournament standings."
      )
    ) {
      try {
        // Clear all state
        setParticipants([]);

        // Clear all Firestore data
        const tournamentId = getTournamentId(currentUser);
        if (!tournamentId) return;
        await clearAllTournamentData(tournamentId);

        // Show confirmation
        alert("All tournament data has been cleared successfully!");
      } catch (error) {
        console.error("Error clearing tournament data:", error);
        alert("Error clearing data. Please try again.");
      }
    }
  };

  return (
    <div className="participant-management">
      <Container>
        <div className="header-section">
          <h2>Add Participants</h2>
          <div className="header-actions">
            {isAuthenticated && (
              <Button
                onClick={clearAll}
                variant="danger"
                disabled={participants.length === 0}
              >
                Clear All
              </Button>
            )}
            <Button
              onClick={proceedToOrdering}
              variant="success"
              disabled={participants.length < 2}
            >
              Proceed to Ordering ({participants.length})
            </Button>
          </div>
        </div>

        <div className="add-participant-section">
          <div className="input-group">
            <div className="avatar-upload-wrapper">
              <div
                className="avatar-upload-label"
                onClick={isAuthenticated ? handleAvatarClick : undefined}
                style={
                  !isAuthenticated
                    ? { cursor: "not-allowed", opacity: 0.5 }
                    : {}
                }
              >
                {imageUrl ? (
                  <div className="selected-avatar-preview uploaded-preview">
                    <img src={imageUrl} alt="Custom" />
                    <div className="avatar-overlay">
                      <span className="plus-icon">+</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="selected-avatar-preview default-avatar-preview"
                    style={{ backgroundColor: "#e0e0e0" }}
                  >
                    <span style={{ fontSize: "2rem", color: "#757575" }}>
                      👤
                    </span>
                    <div className="avatar-overlay">
                      <span className="plus-icon">+</span>
                    </div>
                  </div>
                )}
              </div>
              {imageUrl && isAuthenticated && (
                <button onClick={clearImageUrl} className="clear-photo-btn">
                  ✕
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Enter participant name..."
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="participant-input"
              disabled={!isAuthenticated}
            />
            <Button
              onClick={addParticipant}
              variant="primary"
              disabled={!isAuthenticated}
            >
              Add Participant
            </Button>
          </div>

          {showUrlInput && (
            <div className="url-input-modal">
              <div className="url-input-content">
                <h4>Enter Image URL</h4>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleUrlSubmit()}
                  className="url-input"
                  autoFocus
                />
                <div className="url-input-actions">
                  <Button onClick={handleUrlSubmit} variant="primary">
                    Confirm
                  </Button>
                  <Button
                    onClick={() => setShowUrlInput(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="participants-list-section">
          <h3>Participants List ({participants.length})</h3>
          {participants.length === 0 ? (
            <div className="empty-state">
              <p>
                No participants added yet. Start by adding participants above!
              </p>
            </div>
          ) : (
            <div className="participants-grid">
              {participants.map((participant, index) => {
                const participantData =
                  typeof participant === "string"
                    ? {
                        userId: generateUserId(),
                        name: participant,
                        avatar: avatarOptions[index % avatarOptions.length],
                      }
                    : participant;

                return (
                  <div
                    key={participantData.userId}
                    className="participant-item"
                  >
                    {participantData.customImage ? (
                      <div className="participant-avatar uploaded-avatar">
                        <img
                          src={participantData.customImage}
                          alt={participantData.name}
                        />
                      </div>
                    ) : (
                      <div
                        className="participant-avatar default-participant-avatar"
                        style={{
                          backgroundColor: "#e0e0e0",
                          color: "#757575",
                        }}
                      >
                        👤
                      </div>
                    )}
                    <div className="participant-number">{index + 1}</div>
                    <div className="participant-name">
                      {participantData.name}
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={() => removeParticipant(index)}
                        className="remove-btn"
                        title="Remove participant"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default ParticipantManagement;
