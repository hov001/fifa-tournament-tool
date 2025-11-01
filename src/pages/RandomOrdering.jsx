import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../context/AuthContext";
import { avatarOptions } from "../data/avatars";
import Button from "../components/Button";
import Container from "../components/Container";
import Avatar from "../components/Avatar";
import {
  getParticipants,
  setParticipants as saveParticipants,
  deleteParticipants,
  getParticipantNames,
  setParticipantNames,
  deleteAvailableClubs,
  deleteGroups,
  deleteGroupStandings,
  deleteMatchHistory,
  deleteKnockoutMatches,
} from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./RandomOrdering.css";

function RandomOrdering() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [isOrdered, setIsOrdered] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentShuffle, setCurrentShuffle] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParticipants = async () => {
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        setLoading(false);
        navigate("/");
        return;
      }

      // Load from Firestore
      try {
        // First try to load from participants (if already ordered)
        let participantsData = await getParticipants(tournamentId);

        if (!participantsData) {
          // If no participants, load from participantNames
          const participantNames = await getParticipantNames(tournamentId);
          if (!participantNames) {
            navigate("/");
            return;
          }
          participantsData = participantNames;
        }

        if (participantsData.length === 0) {
          navigate("/");
          return;
        }

        // Handle both old format (strings) and new format (objects)
        const processedParticipants = participantsData.map((p, idx) => {
          if (typeof p === "string") {
            const userId = uuidv4();
            return {
              userId: userId,
              id: userId,
              name: p,
              avatar: avatarOptions[idx % avatarOptions.length],
              customImage: null,
              order: null,
              club: null,
            };
          }
          // Ensure userId exists for backward compatibility
          if (!p.userId) {
            const userId = uuidv4();
            return {
              ...p,
              userId: userId,
              id: p.id || userId,
              order: p.order !== undefined ? p.order : null,
              club: p.club !== undefined ? p.club : null,
            };
          }
          // Ensure order and club fields exist
          return {
            ...p,
            order: p.order !== undefined ? p.order : null,
            club: p.club !== undefined ? p.club : null,
          };
        });

        setParticipants(processedParticipants);

        // Check if participants have been ordered
        const hasOrder = processedParticipants.some(
          (p) => p.order !== null && p.order !== undefined
        );
        setIsOrdered(hasOrder);

        // Initialize current shuffle display
        if (!hasOrder) {
          setCurrentShuffle(
            processedParticipants.map((p, index) => ({
              ...p,
              order: index + 1,
            }))
          );
        } else {
          // Show ordered participants
          const sorted = [...processedParticipants].sort(
            (a, b) => a.order - b.order
          );
          setCurrentShuffle(sorted);
        }
      } catch (error) {
        console.error("Error loading participants:", error);
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [navigate, currentUser]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startRandomOrdering = () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to generate random order");
      return;
    }

    if (!currentUser) return;

    setIsShuffling(true);
    let counter = 0;
    const maxShuffles = 20;

    const interval = setInterval(async () => {
      const shuffled = shuffleArray(participants);
      setCurrentShuffle(
        shuffled.map((p, index) => ({ ...p, order: index + 1 }))
      );
      counter++;

      if (counter >= maxShuffles) {
        clearInterval(interval);
        const finalOrder = shuffleArray(participants);
        const finalOrdered = finalOrder.map((p, index) => ({
          ...p,
          order: index + 1,
        }));

        try {
          // Update participants with order and save to Firestore
          setParticipants(finalOrdered);
          setCurrentShuffle(finalOrdered);
          setIsOrdered(true);
          setIsShuffling(false);
          const tournamentId = getTournamentId(currentUser);
          if (tournamentId) {
            await saveParticipants(tournamentId, finalOrdered);
          }
        } catch (error) {
          console.error("Error saving ordered participants:", error);
          alert("Error saving order. Please try again.");
        }
      }
    }, 100);
  };

  const resetOrdering = async () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to reset ordering");
      return;
    }

    if (!currentUser) return;

    if (
      window.confirm(
        "Are you sure you want to reset the ordering?\n\nThis will also reset:\n- Club selections\n- Group draw\n- Tournament standings\n- Match history\n- Knockout stage"
      )
    ) {
      try {
        const resetParticipantsData = participants.map((p) => ({
          userId: p.userId,
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          customImage: p.customImage,
        }));
        setParticipants(
          resetParticipantsData.map((p) => ({ ...p, order: null, club: null }))
        );
        setCurrentShuffle(
          resetParticipantsData.map((p, index) => ({
            ...p,
            order: index + 1,
            club: null,
          }))
        );
        setIsOrdered(false);

        // Update participantNames and remove participants
        const tournamentId = getTournamentId(currentUser);
        if (tournamentId) {
          await setParticipantNames(tournamentId, resetParticipantsData);
          await deleteParticipants(tournamentId);

          // Clear all downstream data
          await deleteAvailableClubs(tournamentId);
          await deleteGroups(tournamentId);
          await deleteGroupStandings(tournamentId);
          await deleteMatchHistory(tournamentId);
          await deleteKnockoutMatches(tournamentId);
        }
      } catch (error) {
        console.error("Error resetting ordering:", error);
        alert("Error resetting order. Please try again.");
      }
    }
  };

  const proceedToClubSelection = () => {
    if (!isOrdered) {
      alert("Please generate random order first!");
      return;
    }

    navigate("/clubs");
  };

  return (
    <div className="random-ordering">
      <Container>
        <div className="header-section">
          <h2>Random Ordering</h2>
          <div className="header-actions">
            {isOrdered && isAuthenticated && (
              <Button onClick={resetOrdering} variant="danger">
                Reset Order
              </Button>
            )}
            <Button
              onClick={proceedToClubSelection}
              variant="success"
              disabled={!isOrdered}
            >
              Proceed to Club Selection
            </Button>
          </div>
        </div>

        <div className="shuffle-control">
          {!isAuthenticated && !isOrdered && (
            <div className="auth-notice" style={{ marginBottom: "1rem" }}>
              <p>🔒 Sign in as admin to generate random order</p>
            </div>
          )}
          <Button
            onClick={startRandomOrdering}
            variant="primary"
            className="shuffle-btn-large"
            disabled={isShuffling || isOrdered || !isAuthenticated}
          >
            {isShuffling
              ? "Shuffling..."
              : isOrdered
              ? "Order Generated!"
              : "Generate Random Order"}
          </Button>
        </div>

        <div className="ordering-display">
          {currentShuffle.length > 0 && (
            <div
              className={`participants-order ${isShuffling ? "shuffling" : ""}`}
            >
              {currentShuffle.map((participant, index) => (
                <div
                  key={`${participant.userId}-${index}`}
                  className={`order-item ${isShuffling ? "animate" : ""} ${
                    isOrdered && !isShuffling ? "final" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {participant.customImage ? (
                    <div className="order-avatar uploaded-avatar">
                      <img
                        src={participant.customImage}
                        alt={participant.name}
                      />
                    </div>
                  ) : (
                    <div
                      className="order-avatar default-order-avatar"
                      style={{ backgroundColor: "#e0e0e0", color: "#757575" }}
                    >
                      👤
                    </div>
                  )}
                  <div className="order-number">{participant.order}</div>
                  <div className="order-name">{participant.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isOrdered && !isShuffling && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            <p>
              Random ordering complete! You can now proceed to club selection.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}

export default RandomOrdering;
