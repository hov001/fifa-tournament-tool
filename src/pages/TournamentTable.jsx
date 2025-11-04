import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Container from "../components/Container";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import ClubLogo from "../components/ClubLogo";
import {
  getGroups,
  getGroupStandings,
  setGroupStandings as saveGroupStandings,
  getMatchHistory,
  setMatchHistory as saveMatchHistory,
  deleteMatchHistory,
} from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./TournamentTable.css";
import classNames from "classnames";

function TournamentTable() {
  const { isAuthenticated, currentUser } = useAuth();

  // Helper function to sort teams by tournament rules
  const sortTeams = (teams) => {
    return [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.participantName.localeCompare(b.participantName);
    });
  };

  const [groupStandings, setGroupStandings] = useState([]);
  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [matchData, setMatchData] = useState({
    homeTeamId: "",
    awayTeamId: "",
    homeGoals: 0,
    awayGoals: 0,
  });
  const [matchHistory, setMatchHistory] = useState([]);
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize fresh standings from groups
  const initializeStandings = (groups) => {
    return groups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      teams: group.teams.map((participant, index) => ({
        id: index + 1,
        participantId: participant.id,
        participantName: participant.name,
        avatar: participant.avatar,
        customImage: participant.customImage,
        club: participant.club.name,
        clubLogo: participant.club.logo,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      })),
    }));
  };

  // Load data from Firestore (both authenticated and non-authenticated)
  useEffect(() => {
    const loadData = async () => {
      // Get tournament ID for both authenticated and non-authenticated users
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        setLoading(false);
        return;
      }

      // Load from Firestore using tournament ID (works for both authenticated and non-authenticated)
      try {
        const groups = await getGroups(tournamentId);

        if (!groups) {
          setGroupStandings([]);
          setLoading(false);
          return;
        }

        const saved = await getGroupStandings(tournamentId);

        // If no saved standings, initialize fresh
        if (!saved) {
          const newStandings = initializeStandings(groups);
          setGroupStandings(newStandings);
          setLoading(false);
          return;
        }

        // Check if saved standings match current groups structure
        const groupsMatch =
          saved.length === groups.length &&
          saved.every((savedGroup) => {
            const currentGroup = groups.find(
              (g) => g.id === savedGroup.groupId
            );
            if (!currentGroup) return false;

            if (savedGroup.teams.length !== currentGroup.teams.length)
              return false;

            return savedGroup.teams.every((savedTeam) => {
              return currentGroup.teams.some(
                (p) => p.id === savedTeam.participantId
              );
            });
          });

        // If groups changed, reinitialize
        if (!groupsMatch) {
          const newStandings = initializeStandings(groups);
          setGroupStandings(newStandings);
          setLoading(false);
          return;
        }

        // Merge saved statistics with current participant data
        const mergedStandings = groups.map((group) => {
          const savedGroup = saved.find((g) => g.groupId === group.id);

          const teams = group.teams.map((participant, index) => {
            const savedTeam = savedGroup?.teams.find(
              (t) => t.participantId === participant.id
            );

            return {
              id: index + 1,
              participantId: participant.id,
              participantName: participant.name,
              avatar: participant.avatar,
              customImage: participant.customImage,
              club: participant.club.name,
              clubLogo: participant.club.logo,
              played: Number(savedTeam?.played) || 0,
              won: Number(savedTeam?.won) || 0,
              drawn: Number(savedTeam?.drawn) || 0,
              lost: Number(savedTeam?.lost) || 0,
              goalsFor: Number(savedTeam?.goalsFor) || 0,
              goalsAgainst: Number(savedTeam?.goalsAgainst) || 0,
              goalDifference: Number(savedTeam?.goalDifference) || 0,
              points: Number(savedTeam?.points) || 0,
            };
          });

          const sortedTeams = sortTeams(teams);

          return {
            groupId: group.id,
            groupName: group.name,
            teams: sortedTeams,
          };
        });

        setGroupStandings(mergedStandings);

        // Load match history
        const savedHistory = await getMatchHistory(tournamentId);
        if (savedHistory) {
          setMatchHistory(savedHistory);
        }
      } catch (error) {
        console.error("Error loading tournament data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Save standings to Firestore when they change (only for authenticated users)
  useEffect(() => {
    const saveStandings = async () => {
      if (!currentUser || loading || groupStandings.length === 0) return;

      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;

      try {
        await saveGroupStandings(tournamentId, groupStandings);
      } catch (error) {
        console.error("Error saving group standings:", error);
      }
    };

    saveStandings();
  }, [groupStandings, currentUser, loading]);

  // Save match history to Firestore when it changes (only for authenticated users)
  useEffect(() => {
    const saveHistory = async () => {
      if (!currentUser || loading) return;

      const tournamentId = getTournamentId(currentUser);
      if (!tournamentId) return;

      try {
        if (matchHistory.length > 0) {
          await saveMatchHistory(tournamentId, matchHistory);
        }
      } catch (error) {
        console.error("Error saving match history:", error);
      }
    };

    saveHistory();
  }, [matchHistory, currentUser, loading]);

  const addMatch = () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to add matches");
      return;
    }

    if (!matchData.homeTeamId || !matchData.awayTeamId) {
      alert("Please select both teams");
      return;
    }

    if (matchData.homeTeamId === matchData.awayTeamId) {
      alert("Teams must be different");
      return;
    }

    // Parse goals and validate
    const homeGoals = Number(matchData.homeGoals);
    const awayGoals = Number(matchData.awayGoals);

    if (isNaN(homeGoals) || isNaN(awayGoals)) {
      alert("Please enter valid goal numbers");
      return;
    }

    if (homeGoals < 0 || awayGoals < 0) {
      alert("Goals cannot be negative");
      return;
    }

    console.log("Adding match by team IDs:", {
      homeTeamId: matchData.homeTeamId,
      awayTeamId: matchData.awayTeamId,
      homeGoals,
      awayGoals,
      groupId: selectedGroup,
    });

    // Update group standings
    const updatedGroupStandings = groupStandings.map((group) => {
      if (group.groupId !== selectedGroup) return group;

      const updatedTeams = group.teams.map((team) => {
        if (team.participantId === matchData.homeTeamId) {
          const won = homeGoals > awayGoals ? 1 : 0;
          const drawn = homeGoals === awayGoals ? 1 : 0;
          const lost = homeGoals < awayGoals ? 1 : 0;
          const matchPoints = won * 3 + drawn;

          const newGoalsFor = team.goalsFor + homeGoals;
          const newGoalsAgainst = team.goalsAgainst + awayGoals;

          return {
            ...team,
            played: team.played + 1,
            won: team.won + won,
            drawn: team.drawn + drawn,
            lost: team.lost + lost,
            goalsFor: newGoalsFor,
            goalsAgainst: newGoalsAgainst,
            goalDifference: newGoalsFor - newGoalsAgainst,
            points: team.points + matchPoints,
          };
        } else if (team.participantId === matchData.awayTeamId) {
          const won = awayGoals > homeGoals ? 1 : 0;
          const drawn = awayGoals === homeGoals ? 1 : 0;
          const lost = awayGoals < homeGoals ? 1 : 0;
          const matchPoints = won * 3 + drawn;

          const newGoalsFor = team.goalsFor + awayGoals;
          const newGoalsAgainst = team.goalsAgainst + homeGoals;

          return {
            ...team,
            played: team.played + 1,
            won: team.won + won,
            drawn: team.drawn + drawn,
            lost: team.lost + lost,
            goalsFor: newGoalsFor,
            goalsAgainst: newGoalsAgainst,
            goalDifference: newGoalsFor - newGoalsAgainst,
            points: team.points + matchPoints,
          };
        }
        return team;
      });

      // Sort teams by tournament rules
      const sortedTeams = sortTeams(updatedTeams);

      return { ...group, teams: sortedTeams };
    });

    console.log("Updated standings:", updatedGroupStandings);

    // Find participant details for match history from updated standings
    const currentGroup = updatedGroupStandings.find(
      (g) => g.groupId === selectedGroup
    );

    console.log("Current group:", currentGroup);
    console.log("Looking for home team ID:", matchData.homeTeamId);
    console.log("Looking for away team ID:", matchData.awayTeamId);
    console.log(
      "Available teams in group:",
      currentGroup?.teams.map((t) => ({
        teamId: t.participantId,
        name: t.participantName,
        club: t.club,
      }))
    );

    const homeTeamData = currentGroup?.teams.find(
      (t) => t.participantId === matchData.homeTeamId
    );
    const awayTeamData = currentGroup?.teams.find(
      (t) => t.participantId === matchData.awayTeamId
    );

    console.log("Home team found:", homeTeamData);
    console.log("Away team found:", awayTeamData);

    setGroupStandings(updatedGroupStandings);

    // Add match to history
    const newMatch = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      groupId: selectedGroup,
      groupName: currentGroup?.groupName || "Unknown Group",
      homeTeam: {
        id: matchData.homeTeamId,
        name: homeTeamData?.participantName || "Unknown",
        club: homeTeamData?.club || "Unknown",
        clubLogo: homeTeamData?.clubLogo,
        avatar: homeTeamData?.avatar,
        customImage: homeTeamData?.customImage,
      },
      awayTeam: {
        id: matchData.awayTeamId,
        name: awayTeamData?.participantName || "Unknown",
        club: awayTeamData?.club || "Unknown",
        clubLogo: awayTeamData?.clubLogo,
        avatar: awayTeamData?.avatar,
        customImage: awayTeamData?.customImage,
      },
      homeGoals,
      awayGoals,
      result:
        homeGoals > awayGoals
          ? "home"
          : awayGoals > homeGoals
          ? "away"
          : "draw",
    };

    setMatchHistory([newMatch, ...matchHistory]);

    setShowAddMatchModal(false);
    setMatchData({
      homeTeamId: "",
      awayTeamId: "",
      homeGoals: 0,
      awayGoals: 0,
    });
    setSelectedGroup(null);
  };

  const removeMatch = async (match) => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to remove matches");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this match?")) {
      return;
    }

    const homeGoals = match.homeGoals;
    const awayGoals = match.awayGoals;

    // Reverse the statistics for both teams
    const updatedGroupStandings = groupStandings.map((group) => {
      if (group.groupId !== match.groupId) return group;

      const updatedTeams = group.teams.map((team) => {
        if (team.participantId === match.homeTeam.id) {
          // Reverse home team stats
          const won = homeGoals > awayGoals ? 1 : 0;
          const drawn = homeGoals === awayGoals ? 1 : 0;
          const lost = homeGoals < awayGoals ? 1 : 0;
          const matchPoints = won * 3 + drawn;

          const newGoalsFor = team.goalsFor - homeGoals;
          const newGoalsAgainst = team.goalsAgainst - awayGoals;

          return {
            ...team,
            played: team.played - 1,
            won: team.won - won,
            drawn: team.drawn - drawn,
            lost: team.lost - lost,
            goalsFor: newGoalsFor,
            goalsAgainst: newGoalsAgainst,
            goalDifference: newGoalsFor - newGoalsAgainst,
            points: team.points - matchPoints,
          };
        } else if (team.participantId === match.awayTeam.id) {
          // Reverse away team stats
          const won = awayGoals > homeGoals ? 1 : 0;
          const drawn = awayGoals === homeGoals ? 1 : 0;
          const lost = awayGoals < homeGoals ? 1 : 0;
          const matchPoints = won * 3 + drawn;

          const newGoalsFor = team.goalsFor - awayGoals;
          const newGoalsAgainst = team.goalsAgainst - homeGoals;

          return {
            ...team,
            played: team.played - 1,
            won: team.won - won,
            drawn: team.drawn - drawn,
            lost: team.lost - lost,
            goalsFor: newGoalsFor,
            goalsAgainst: newGoalsAgainst,
            goalDifference: newGoalsFor - newGoalsAgainst,
            points: team.points - matchPoints,
          };
        }
        return team;
      });

      // Sort teams by tournament rules
      const sortedTeams = sortTeams(updatedTeams);

      return { ...group, teams: sortedTeams };
    });

    setGroupStandings(updatedGroupStandings);

    // Remove match from history
    const updatedHistory = matchHistory.filter((m) => m.id !== match.id);
    setMatchHistory(updatedHistory);

    if (updatedHistory.length === 0) {
      if (currentUser) {
        const tournamentId = getTournamentId(currentUser);
        if (tournamentId) {
          try {
            await deleteMatchHistory(tournamentId);
          } catch (error) {
            console.error("Error deleting match history:", error);
          }
        }
      }
    }
  };

  const resetStandings = async () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to reset standings");
      return;
    }

    if (!currentUser) return;

    if (
      window.confirm(
        "Are you sure you want to reset all group standings and match history?"
      )
    ) {
      try {
        const resetGroupStandings = groupStandings.map((group) => ({
          ...group,
          teams: group.teams.map((team) => ({
            ...team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          })),
        }));
        setGroupStandings(resetGroupStandings);
        setMatchHistory([]);
        const tournamentId = getTournamentId(currentUser);
        if (tournamentId) {
          await deleteMatchHistory(tournamentId);
        }
      } catch (error) {
        console.error("Error resetting standings:", error);
        alert("Error resetting standings. Please try again.");
      }
    }
  };

  const openMatchModal = (groupId) => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to add matches");
      return;
    }
    setSelectedGroup(groupId);
    setShowAddMatchModal(true);
  };

  return (
    <div className="tournament-table">
      <Container>
        <div
          className={classNames("header-section", {
            "without-margin": groupStandings.length,
          })}
        >
          <h2>Tournament Standings</h2>
          <div className="header-actions">
            {groupStandings.length > 0 && matchHistory.length > 0 && (
              <Button
                onClick={() => setShowMatchHistory(!showMatchHistory)}
                variant="primary"
              >
                {showMatchHistory ? "Hide" : "Show"} Match History (
                {matchHistory.length})
              </Button>
            )}
            {groupStandings.length > 0 && isAuthenticated && (
              <Button onClick={resetStandings} variant="danger">
                Reset All Standings
              </Button>
            )}
          </div>
        </div>

        {groupStandings.length === 0 && (
          <div className="empty-state">
            <p>No groups created yet. Please complete the group draw first!</p>
          </div>
        )}
      </Container>

      {groupStandings.length > 0 && (
        <>
          <div className="groups-tables">
            {groupStandings.map((group) => (
              <div key={group.groupId} className="group-table-section">
                <div className="group-header">
                  <h3>{group.groupName}</h3>
                  {isAuthenticated && (
                    <Button
                      onClick={() => openMatchModal(group.groupId)}
                      variant="primary"
                      className="add-match-btn-small"
                    >
                      Add Match
                    </Button>
                  )}
                </div>
                <div className="table-container">
                  <div className="standings-grid">
                    {/* Header Row */}
                    <div className="grid-header">
                      <div className="grid-cell th-rank">#</div>
                      <div className="grid-cell th-participant">
                        Participant
                      </div>
                      <div className="grid-cell th-stat">Pld</div>
                      <div className="grid-cell th-stat">W</div>
                      <div className="grid-cell th-stat">D</div>
                      <div className="grid-cell th-stat">L</div>
                      <div className="grid-cell th-stat">GF</div>
                      <div className="grid-cell th-stat">GA</div>
                      <div className="grid-cell th-stat">GD</div>
                      <div className="grid-cell th-points">Pts</div>
                    </div>

                    {/* Data Rows */}
                    {group.teams.map((team, index) => (
                      <div
                        key={team.id}
                        className={`grid-row ${index < 2 ? "top-three" : ""}`}
                      >
                        <div className="grid-cell position">{index + 1}</div>
                        <div className="grid-cell participant-cell">
                          <ClubLogo
                            club={{ name: team.club, logo: team.clubLogo }}
                            size="large"
                          />
                          <Avatar
                            participant={{
                              name: team.participantName,
                              avatar: team.avatar,
                              customImage: team.customImage,
                            }}
                            size="large"
                          />
                        </div>
                        <div className="grid-cell">{team.played}</div>
                        <div className="grid-cell">{team.won}</div>
                        <div className="grid-cell">{team.drawn}</div>
                        <div className="grid-cell">{team.lost}</div>
                        <div className="grid-cell">{team.goalsFor}</div>
                        <div className="grid-cell">{team.goalsAgainst}</div>
                        <div
                          className={`grid-cell ${
                            team.goalDifference > 0
                              ? "positive"
                              : team.goalDifference < 0
                              ? "negative"
                              : ""
                          }`}
                        >
                          {team.goalDifference > 0 ? "+" : ""}
                          {team.goalDifference}
                        </div>
                        <div className="grid-cell points">{team.points}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showMatchHistory && matchHistory.length > 0 && (
            <Container>
              <div className="match-history-section">
                <h3>Match History</h3>
                <div className="groups-match-container">
                  {groupStandings.map((group) => {
                    // Filter matches for this group
                    const groupMatches = matchHistory.filter(
                      (match) => match.groupId === group.groupId
                    );

                    // Skip if no matches for this group
                    if (groupMatches.length === 0) return null;

                    return (
                      <div key={group.groupId} className="group-match-history">
                        <h4 className="group-match-title">{group.groupName}</h4>
                        <div className="match-history-list">
                          {groupMatches.map((match) => (
                            <div key={match.id} className="match-history-item">
                              <div className="match-header">
                                <span className="match-group-badge">
                                  {match.groupName}
                                </span>
                                <div className="match-header-right">
                                  <span className="match-timestamp">
                                    {new Date(match.timestamp).toLocaleString()}
                                  </span>
                                  {isAuthenticated && (
                                    <button
                                      className="delete-match-btn"
                                      onClick={() => removeMatch(match)}
                                      title="Remove match"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="match-details">
                                <div
                                  className={`match-team ${
                                    match.result === "home" ? "winner" : ""
                                  }`}
                                >
                                  <div className="team-info">
                                    <ClubLogo
                                      club={{
                                        name: match.homeTeam.club,
                                        logo: match.homeTeam.clubLogo,
                                      }}
                                      size="large"
                                    />
                                    <Avatar
                                      participant={{
                                        name: match.homeTeam.name,
                                        avatar: match.homeTeam.avatar,
                                        customImage: match.homeTeam.customImage,
                                      }}
                                      size="large"
                                    />
                                    {/* <span className="team-name">
                                      {match.homeTeam.name}
                                    </span> */}
                                  </div>
                                  <span className="team-score">
                                    {match.homeGoals}
                                  </span>
                                </div>
                                <div className="match-separator">-</div>
                                <div
                                  className={`match-team ${
                                    match.result === "away" ? "winner" : ""
                                  }`}
                                >
                                  <span className="team-score">
                                    {match.awayGoals}
                                  </span>
                                  <div className="team-info">
                                    <ClubLogo
                                      club={{
                                        name: match.awayTeam.club,
                                        logo: match.awayTeam.clubLogo,
                                      }}
                                      size="large"
                                    />
                                    <Avatar
                                      participant={{
                                        name: match.awayTeam.name,
                                        avatar: match.awayTeam.avatar,
                                        customImage: match.awayTeam.customImage,
                                      }}
                                      size="large"
                                    />
                                    {/* <span className="team-name">
                                      {match.awayTeam.name}
                                    </span> */}
                                  </div>
                                </div>
                              </div>
                              {match.result === "draw" && (
                                <div className="match-result-badge draw">
                                  Draw
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Container>
          )}
        </>
      )}

      <Modal
        isOpen={showAddMatchModal}
        onClose={() => {
          setShowAddMatchModal(false);
          setSelectedGroup(null);
        }}
        title={`Add Match Result - ${
          groupStandings.find((g) => g.groupId === selectedGroup)?.groupName ||
          "Group"
        }`}
      >
        <div className="match-form">
          <div className="form-row">
            <div className="form-group">
              <label>Home Team</label>
              <select
                value={matchData.homeTeamId}
                onChange={(e) =>
                  setMatchData({
                    ...matchData,
                    homeTeamId: e.target.value,
                  })
                }
              >
                <option value="">Select team</option>
                {selectedGroup &&
                  groupStandings
                    .find((g) => g.groupId === selectedGroup)
                    ?.teams.map((team) => (
                      <option key={team.id} value={team.participantId}>
                        {team.participantName} ({team.club})
                      </option>
                    ))}
              </select>
            </div>
            <div className="form-group score-input">
              <label>Score</label>
              <div className="score-inputs">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={matchData.homeGoals}
                  onChange={(e) =>
                    setMatchData({
                      ...matchData,
                      homeGoals: Number(e.target.value) || 0,
                    })
                  }
                />
                <span className="vs">-</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={matchData.awayGoals}
                  onChange={(e) =>
                    setMatchData({
                      ...matchData,
                      awayGoals: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Away Team</label>
              <select
                value={matchData.awayTeamId}
                onChange={(e) =>
                  setMatchData({
                    ...matchData,
                    awayTeamId: e.target.value,
                  })
                }
              >
                <option value="">Select team</option>
                {selectedGroup &&
                  groupStandings
                    .find((g) => g.groupId === selectedGroup)
                    ?.teams.map((team) => (
                      <option key={team.id} value={team.participantId}>
                        {team.participantName} ({team.club})
                      </option>
                    ))}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <Button onClick={addMatch} variant="primary">
              Add Match
            </Button>
            <Button
              onClick={() => setShowAddMatchModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TournamentTable;
