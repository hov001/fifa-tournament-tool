import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Container from "../components/Container";
import ClubLogo from "../components/ClubLogo";
import Avatar from "../components/Avatar";
import {
  getParticipants,
  getGroups,
  setGroups as saveGroups,
  deleteGroups,
  deleteGroupStandings,
  deleteMatchHistory,
  deleteKnockoutMatches,
} from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./GroupDraw.css";

function GroupDraw() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [groups, setGroups] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShuffle, setCurrentShuffle] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Get tournament ID for both authenticated and non-authenticated users
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        setLoading(false);
        navigate("/");
        return;
      }

      // Load from Firestore using tournament ID (works for both authenticated and non-authenticated)
      try {
        // Load participants with their selected clubs
        const participantsData = await getParticipants(tournamentId);
        if (participantsData) {
          // Check if participants have clubs selected
          const hasClubs = participantsData.some(
            (p) => p.club !== null && p.club !== undefined
          );
          if (!hasClubs) {
            navigate("/clubs");
            return;
          }
          setParticipants(participantsData);

          // Load groups if they exist
          const savedGroups = await getGroups(tournamentId);
          if (savedGroups) {
            setGroups(savedGroups);
          } else {
            // Initialize shuffle display with participant clubs if no groups exist
            const clubsList = participantsData
              .filter((p) => p.club)
              .map((p) => p.club);
            setCurrentShuffle(clubsList);
          }
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading group draw data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate]);

  useEffect(() => {
    const saveGroupsData = async () => {
      if (!currentUser || loading || !groups) return;

      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;

      try {
        await saveGroups(tournamentId, groups);
      } catch (error) {
        console.error("Error saving groups:", error);
      }
    };

    saveGroupsData();
  }, [groups, currentUser, loading]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const conductDraw = async () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to conduct group draw");
      return;
    }

    setIsDrawing(true);

    // Get all participants with their selected clubs
    const participantsWithClubs = participants.filter((p) => p.club);

    if (participantsWithClubs.length === 0) {
      alert("No participants with selected clubs found!");
      setIsDrawing(false);
      return;
    }

    // Shuffle all participants randomly
    const shuffledParticipants = shuffleArray(participantsWithClubs);

    // Number of groups and teams per group
    const numGroups = 3;
    const teamsPerGroup = 6;

    // Create draw order with group assignments (participants, not clubs)
    const drawOrder = [];
    for (let i = 0; i < shuffledParticipants.length; i++) {
      const groupId = (i % numGroups) + 1;
      drawOrder.push({
        participant: shuffledParticipants[i],
        groupId,
      });
    }

    // Initialize empty groups
    const newGroups = [
      { id: 1, name: "Group A", teams: [] },
      { id: 2, name: "Group B", teams: [] },
      { id: 3, name: "Group C", teams: [] },
    ];

    // Draw participants one by one with animation
    for (let i = 0; i < drawOrder.length; i++) {
      const { participant, groupId } = drawOrder[i];
      const remainingClubs = drawOrder.slice(i).map((d) => d.participant.club);

      // Shuffle remaining clubs for 8 cycles
      for (let j = 0; j < 8; j++) {
        setCurrentShuffle(shuffleArray(remainingClubs));
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      // Add participant to its group
      const groupIndex = groupId - 1;
      newGroups[groupIndex].teams.push(participant);
      setGroups([...newGroups]);

      // Brief pause to show the added participant
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setCurrentShuffle([]);
    setIsDrawing(false);
  };

  const resetDraw = async () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to reset group draw");
      return;
    }

    if (!currentUser) return;

    if (
      window.confirm(
        "Are you sure you want to reset the group draw?\n\nThis will also reset:\n- Tournament standings\n- Match history\n- Knockout stage"
      )
    ) {
      try {
        const tournamentId = getTournamentId(currentUser);
        if (!tournamentId) return;

        setGroups(null);
        await deleteGroups(tournamentId);
        setCurrentShuffle([]);

        // Clear all downstream data
        await deleteGroupStandings(tournamentId);
        await deleteMatchHistory(tournamentId);
        await deleteKnockoutMatches(tournamentId);
      } catch (error) {
        console.error("Error resetting group draw:", error);
        alert("Error resetting draw. Please try again.");
      }
    }
  };

  const proceedToClubSelection = () => {
    if (!groups) {
      alert("Please conduct the draw first!");
      return;
    }
    navigate("/tournament");
  };

  return (
    <div className="group-draw">
      <Container>
        <div className="header-section">
          <h2>Group Stage Draw</h2>
          <div className="header-actions">
            {groups && isAuthenticated && (
              <Button onClick={resetDraw} variant="danger">
                Reset Draw
              </Button>
            )}
            <Button
              onClick={proceedToClubSelection}
              variant="success"
              disabled={!groups}
            >
              Proceed to Tournament
            </Button>
          </div>
        </div>

        <div className="draw-info">
          <p>
            18 teams will be randomly drawn into 3 groups of 6 teams each
            <br />
            <span className="draw-info-subtitle">
              (Pure random draw - each team has equal chance of being in any
              group)
            </span>
          </p>
        </div>

        {!groups && (
          <div className="draw-control">
            {!isAuthenticated && (
              <div className="auth-notice" style={{ marginBottom: "1rem" }}>
                <p>🔒 Sign in as admin to conduct group draw</p>
              </div>
            )}
            <Button
              onClick={conductDraw}
              variant="primary"
              className="draw-btn-large"
              disabled={isDrawing || !isAuthenticated}
            >
              {isDrawing ? "Drawing..." : "Conduct Group Draw"}
            </Button>
          </div>
        )}

        {isDrawing && currentShuffle.length > 0 && (
          <div className="shuffling-clubs">
            <h3>Shuffling...</h3>
            <div className="clubs-shuffle-grid">
              {currentShuffle.map((club, index) => (
                <div key={`${club.id}-${index}`} className="shuffle-club-item">
                  <ClubLogo club={club} size="small" />
                  <span className="shuffle-club-name">{club.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {groups && (
          <div className="groups-section">
            <h3>Groups</h3>
            <div className="groups-grid">
              {groups.map((group) => {
                return (
                  <div key={group.id} className="group-card">
                    <h4 className="group-title">{group.name}</h4>

                    {/* Participants with their club logos */}
                    <div className="group-teams">
                      {group.teams.length === 0 ? (
                        <p className="no-teams">No teams drawn yet</p>
                      ) : (
                        group.teams.map((participant, index) => {
                          return (
                            <div
                              key={participant.id}
                              className="group-team-item"
                            >
                              <span className="team-number">{index + 1}</span>
                              <ClubLogo club={participant.club} size="medium" />
                              <div className="group-team-participant">
                                <Avatar
                                  participant={participant}
                                  size="small"
                                />
                                <span className="participant-name-small">
                                  {participant.name}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default GroupDraw;
