import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { clubs } from "../data/clubs";
import { avatarOptions } from "../data/avatars";
import Button from "../components/Button";
import Container from "../components/Container";
import Avatar from "../components/Avatar";
import ClubCard from "../components/ClubCard";
import ClubLogo from "../components/ClubLogo";
import OrderBadge from "../components/OrderBadge";
import {
  getParticipants,
  setParticipants as saveParticipants,
  getAvailableClubs,
  setAvailableClubs as saveAvailableClubs,
  deleteGroups,
  deleteGroupStandings,
  deleteMatchHistory,
  deleteKnockoutMatches,
} from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./ClubSelection.css";

function ClubSelection() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [availableClubs, setAvailableClubs] = useState(clubs);
  const [spinning, setSpinning] = useState(null);
  const [currentClubIndex, setCurrentClubIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load data from Firestore
  useEffect(() => {
    const loadData = async () => {
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        setLoading(false);
        navigate("/ordering");
        return;
      }

      // Load from Firestore
      try {
        const savedParticipants = await getParticipants(tournamentId);
        if (savedParticipants) {
          // Ensure participants have order set (ordered)
          const hasOrder = savedParticipants.some(
            (p) => p.order !== null && p.order !== undefined
          );
          if (!hasOrder) {
            navigate("/ordering");
            return;
          }
          setParticipants(savedParticipants);
        } else {
          navigate("/ordering");
          return;
        }

        const savedClubs = await getAvailableClubs(tournamentId);
        if (savedClubs) {
          setAvailableClubs(savedClubs);
        } else {
          // Initialize with all clubs if not set
          setAvailableClubs(clubs);
          await saveAvailableClubs(tournamentId, clubs);
        }
      } catch (error) {
        console.error("Error loading club selection data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, navigate]);

  // Save data to Firestore when it changes
  useEffect(() => {
    const saveData = async () => {
      if (!currentUser || loading) return;

      try {
        const tournamentId = getTournamentId(currentUser);
        if (tournamentId) {
          if (participants.length > 0) {
            await saveParticipants(tournamentId, participants);
          }
          await saveAvailableClubs(tournamentId, availableClubs);
        }
      } catch (error) {
        console.error("Error saving club selection data:", error);
      }
    };

    saveData();
  }, [participants, availableClubs, currentUser, loading]);

  const handleSelectClub = (participantIndex) => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to select clubs");
      return;
    }

    if (availableClubs.length === 0) {
      alert("No more clubs available!");
      return;
    }

    if (participants[participantIndex].club) {
      alert("This participant already has a club!");
      return;
    }

    setSpinning(participantIndex);
    setCurrentClubIndex(0);

    let counter = 0;
    const maxSpins = 30;
    const interval = setInterval(() => {
      setCurrentClubIndex((prev) => (prev + 1) % availableClubs.length);
      counter++;

      if (counter >= maxSpins) {
        clearInterval(interval);

        // Select random club
        const randomIndex = Math.floor(Math.random() * availableClubs.length);
        const selectedClub = availableClubs[randomIndex];

        // Update participant with club
        const newParticipants = [...participants];
        newParticipants[participantIndex].club = selectedClub;
        setParticipants(newParticipants);

        // Remove club from available clubs
        setAvailableClubs(
          availableClubs.filter((_, index) => index !== randomIndex)
        );
        setSpinning(null);
      }
    }, 100);
  };

  const resetAll = async () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to reset club selections");
      return;
    }

    if (!currentUser) return;

    if (
      window.confirm(
        "Are you sure you want to reset all club selections?\n\nThis will also reset:\n- Group draw\n- Tournament standings\n- Match history\n- Knockout stage"
      )
    ) {
      try {
        const resetParticipantsData = participants.map((p) => ({
          ...p,
          club: null,
        }));
        setParticipants(resetParticipantsData);
        const tournamentId = getTournamentId(currentUser);
        if (tournamentId) {
          await saveParticipants(tournamentId, resetParticipantsData);
          setAvailableClubs(clubs);
          await saveAvailableClubs(tournamentId, clubs);
          setSpinning(null);

          // Clear all downstream data
          await deleteGroups(tournamentId);
          await deleteGroupStandings(tournamentId);
          await deleteMatchHistory(tournamentId);
          await deleteKnockoutMatches(tournamentId);
        }
      } catch (error) {
        console.error("Error resetting club selections:", error);
        alert("Error resetting. Please try again.");
      }
    }
  };

  const proceedToGroupDraw = () => {
    const allHaveClubs = participants.every((p) => p.club !== null);
    if (!allHaveClubs) {
      alert("Please select clubs for all participants first!");
      return;
    }
    navigate("/groups");
  };

  return (
    <div className="club-selection">
      <Container>
        <div className="header-section">
          <h2>Club Selection</h2>
          <div className="header-actions">
            {isAuthenticated && (
              <Button onClick={resetAll} variant="danger">
                Reset All
              </Button>
            )}
            <Button
              onClick={proceedToGroupDraw}
              variant="success"
              disabled={!participants.every((p) => p.club !== null)}
            >
              Proceed to Group Draw
            </Button>
          </div>
        </div>

        <div className="available-clubs">
          <h3>Available Clubs ({availableClubs.length})</h3>
          <div className="clubs-grid">
            {availableClubs.map((club, index) => (
              <ClubCard
                key={club.id}
                club={club}
                isHighlighted={spinning !== null && index === currentClubIndex}
              />
            ))}
          </div>
        </div>

        <div className="participants-section">
          <h3>Participants</h3>
          {participants.length === 0 ? (
            <div className="empty-state">
              <p>No participants found. Please add participants first!</p>
            </div>
          ) : (
            <div className="participants-list">
              {participants.map((participant, index) => (
                <div key={index} className="participant-card">
                  <div className="participant-info">
                    <div className="participant-header">
                      <Avatar participant={participant} size="medium" />
                      <div className="participant-header-text">
                        <OrderBadge order={participant.order} />
                        <h4>{participant.name}</h4>
                      </div>
                    </div>
                    {participant.club ? (
                      <div className="selected-club">
                        <ClubLogo club={participant.club} size="large" />
                        <div className="selected-club-details">
                          <div className="club-name-large">
                            {participant.club.name}
                          </div>
                          <div className="club-details">
                            <span>{participant.club.league}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-club">
                        {spinning === index ? (
                          <div className="spinning-text">
                            Selecting...{" "}
                            {availableClubs[currentClubIndex]?.name}
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleSelectClub(index)}
                            variant="primary"
                            fullWidth={true}
                            disabled={spinning !== null || !isAuthenticated}
                          >
                            Select Random Club
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default ClubSelection;
