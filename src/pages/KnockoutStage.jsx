import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Container from "../components/Container";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import ClubLogo from "../components/ClubLogo";
import {
  getKnockoutMatches,
  setKnockoutMatches as saveKnockoutMatches,
  getGroupStandings,
} from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./KnockoutStage.css";

function KnockoutStage() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [qualifiedTeams, setQualifiedTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [knockoutMatches, setKnockoutMatches] = useState({
    quarterfinals: Array(4)
      .fill(null)
      .map((_, i) => ({
        id: `qf${i + 1}`,
        homeTeam: null,
        awayTeam: null,
        homeGoals: null,
        awayGoals: null,
        winner: null,
      })),
    semifinals: Array(2)
      .fill(null)
      .map((_, i) => ({
        id: `sf${i + 1}`,
        homeTeam: null,
        awayTeam: null,
        homeGoals: null,
        awayGoals: null,
        winner: null,
      })),
    final: {
      id: "final",
      homeTeam: null,
      awayTeam: null,
      homeGoals: null,
      awayGoals: null,
      winner: null,
    },
    thirdPlace: {
      id: "thirdPlace",
      homeTeam: null,
      awayTeam: null,
      homeGoals: null,
      awayGoals: null,
      winner: null,
    },
    champion: null,
    runnerUp: null,
    thirdPlaceWinner: null,
  });
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchData, setMatchData] = useState({
    homeGoals: 0,
    awayGoals: 0,
    homeExtraTimeGoals: 0,
    awayExtraTimeGoals: 0,
    homePenalties: 0,
    awayPenalties: 0,
  });

  // Helper function to sort teams by tournament rules
  const sortTeamsByRanking = (teams) => {
    return [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.participantName.localeCompare(b.participantName);
    });
  };

  // Helper function to sort 3rd place teams (only by points and goal difference)
  const sortThirdPlaceTeams = (teams) => {
    return [...teams].sort((a, b) => {
      // 1. Higher points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Higher goal difference
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      // If still tied, keep original order
      return 0;
    });
  };

  // Helper function to shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Helper function to create knockout bracket with pot system
  // Pot 1: 1st from each group + best 2nd place (by points, then goal diff)
  // Pot 2: Remaining qualified teams
  // Rule: Teams from same group cannot face each other in quarterfinals
  const createBracketMatchups = (qualifiedTeams) => {
    // Separate teams by position
    const firstPlaceTeams = qualifiedTeams.filter((t) => t.position === 1);
    const secondPlaceTeams = qualifiedTeams.filter((t) => t.position === 2);
    const thirdPlaceTeams = qualifiedTeams.filter((t) => t.position === 3);

    // Sort 2nd place teams to find the best one
    const sortedSecondPlace = sortTeamsByRanking(secondPlaceTeams);

    // Pot 1: All 1st place + best 2nd place (shuffled for random matchups)
    const pot1 = shuffleArray([...firstPlaceTeams, sortedSecondPlace[0]]);

    // Pot 2: Remaining 2nd place + 3rd place teams (shuffled for random matchups)
    const pot2 = shuffleArray([...sortedSecondPlace.slice(1), ...thirdPlaceTeams]);

    console.log(
      "Pot 1:",
      pot1.map(
        (t) => `${t.participantName} (${t.groupName}, Pos ${t.position})`
      )
    );
    console.log(
      "Pot 2:",
      pot2.map(
        (t) => `${t.participantName} (${t.groupName}, Pos ${t.position})`
      )
    );

    // Create matchups avoiding same group
    const matchups = [];
    const usedPot2 = new Set();

    for (const pot1Team of pot1) {
      // Find a Pot 2 team from a different group
      const pot2Team = pot2.find(
        (t) =>
          !usedPot2.has(t.participantId) && t.groupName !== pot1Team.groupName
      );

      if (!pot2Team) {
        // Fallback: if no different group available, take any available team
        const fallbackTeam = pot2.find((t) => !usedPot2.has(t.participantId));
        if (fallbackTeam) {
          matchups.push({ home: pot1Team, away: fallbackTeam });
          usedPot2.add(fallbackTeam.participantId);
        }
      } else {
        matchups.push({ home: pot1Team, away: pot2Team });
        usedPot2.add(pot2Team.participantId);
      }
    }

    console.log(
      "Quarterfinal Matchups:",
      matchups.map(
        (m) =>
          `${m.home.participantName} (${m.home.groupName}) vs ${m.away.participantName} (${m.away.groupName})`
      )
    );

    return matchups;
  };

  useEffect(() => {
    // Load knockout matches and group standings from Firestore
    const loadData = async () => {
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        setLoading(false);
        return;
      }

      // Load from Firestore
      try {
        // Load group standings and determine qualified teams
        const standings = await getGroupStandings(tournamentId);
        if (!standings) {
          setLoading(false);
          return;
        }

        // Qualification Rules:
        // - ALL 1st place teams from all groups
        // - ALL 2nd place teams from all groups
        // - Best 2 third place teams (sorted by: 1. points, 2. goal difference)
        const topTwoTeams = [];
        const thirdPlaceTeams = [];

        standings.forEach((group) => {
          const sortedTeams = sortTeamsByRanking(group.teams);

          // Add ALL 1st place teams
          if (sortedTeams[0]) {
            topTwoTeams.push({
              ...sortedTeams[0],
              groupName: group.groupName,
              position: 1,
            });
          }
          // Add ALL 2nd place teams
          if (sortedTeams[1]) {
            topTwoTeams.push({
              ...sortedTeams[1],
              groupName: group.groupName,
              position: 2,
            });
          }

          // Collect all 3rd place teams for comparison
          if (sortedTeams[2]) {
            thirdPlaceTeams.push({
              ...sortedTeams[2],
              groupName: group.groupName,
              position: 3,
            });
          }
        });

        // Sort 3rd place teams by points and goal difference, then take best 2
        const bestThirdPlace = sortThirdPlaceTeams(thirdPlaceTeams).slice(0, 2);

        // Combine all qualified teams (1st + 2nd from all groups + best 2 third place)
        const qualified = [...topTwoTeams, ...bestThirdPlace];
        setQualifiedTeams(qualified);

        // Load knockout matches if they exist
        const saved = await getKnockoutMatches(tournamentId);
        if (saved) {
          // Migrate old data to include new fields
          setKnockoutMatches({
            ...saved,
            thirdPlace: saved.thirdPlace || {
              id: "thirdPlace",
              homeTeam: null,
              awayTeam: null,
              homeGoals: null,
              awayGoals: null,
              winner: null,
            },
            runnerUp: saved.runnerUp || null,
            thirdPlaceWinner: saved.thirdPlaceWinner || null,
          });
        } else if (qualified.length >= 8) {
          // Initialize quarterfinals if no saved matches and we have enough qualified teams
          const newMatches = {
            quarterfinals: Array(4)
              .fill(null)
              .map((_, i) => ({
                id: `qf${i + 1}`,
                homeTeam: null,
                awayTeam: null,
                homeGoals: null,
                awayGoals: null,
                winner: null,
              })),
            semifinals: Array(2)
              .fill(null)
              .map((_, i) => ({
                id: `sf${i + 1}`,
                homeTeam: null,
                awayTeam: null,
                homeGoals: null,
                awayGoals: null,
                winner: null,
              })),
            final: {
              id: "final",
              homeTeam: null,
              awayTeam: null,
              homeGoals: null,
              awayGoals: null,
              winner: null,
            },
            thirdPlace: {
              id: "thirdPlace",
              homeTeam: null,
              awayTeam: null,
              homeGoals: null,
              awayGoals: null,
              winner: null,
            },
            champion: null,
            runnerUp: null,
            thirdPlaceWinner: null,
          };

          // Create quarterfinal matchups using pot system (avoiding same group)
          const matchups = createBracketMatchups(qualified);

          matchups.forEach((matchup, index) => {
            if (index < 4) {
              newMatches.quarterfinals[index].homeTeam = matchup.home;
              newMatches.quarterfinals[index].awayTeam = matchup.away;
            }
          });

          setKnockoutMatches(newMatches);
        }
      } catch (error) {
        console.error("Error loading knockout stage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Save knockout matches to Firestore when they change
  useEffect(() => {
    const saveMatches = async () => {
      if (!currentUser || loading) return;

      try {
        const tournamentId = getTournamentId(currentUser);
        if (tournamentId) {
          await saveKnockoutMatches(tournamentId, knockoutMatches);
        }
      } catch (error) {
        console.error("Error saving knockout matches:", error);
      }
    };

    saveMatches();
  }, [knockoutMatches, currentUser, loading]);

  const openMatchModal = (matchId, stage) => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to add or edit match results");
      return;
    }

    let match;
    if (stage === "quarterfinals") {
      match = knockoutMatches.quarterfinals.find((m) => m.id === matchId);
    } else if (stage === "semifinals") {
      match = knockoutMatches.semifinals.find((m) => m.id === matchId);
    } else if (stage === "final") {
      match = knockoutMatches.final;
    } else if (stage === "thirdPlace") {
      match = knockoutMatches.thirdPlace;
    }

    if (!match || !match.homeTeam || !match.awayTeam) {
      alert("Both teams must be determined before adding a result!");
      return;
    }

    setSelectedMatch({ ...match, stage });
    setMatchData({
      homeGoals: match.homeGoals ?? 0,
      awayGoals: match.awayGoals ?? 0,
      homeExtraTimeGoals: match.homeExtraTimeGoals ?? 0,
      awayExtraTimeGoals: match.awayExtraTimeGoals ?? 0,
      homePenalties: match.homePenalties ?? 0,
      awayPenalties: match.awayPenalties ?? 0,
    });
    setShowMatchModal(true);
  };

  const saveMatchResult = () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to save match results");
      return;
    }

    const homeGoals = Number(matchData.homeGoals);
    const awayGoals = Number(matchData.awayGoals);
    const homeExtraTimeGoals = Number(matchData.homeExtraTimeGoals);
    const awayExtraTimeGoals = Number(matchData.awayExtraTimeGoals);
    const homePenalties = Number(matchData.homePenalties);
    const awayPenalties = Number(matchData.awayPenalties);

    if (isNaN(homeGoals) || isNaN(awayGoals)) {
      alert("Please enter valid goal numbers");
      return;
    }

    if (homeGoals < 0 || awayGoals < 0) {
      alert("Goals cannot be negative");
      return;
    }

    // Check if regular time is a draw
    const regularTimeDraw = homeGoals === awayGoals;

    if (regularTimeDraw) {
      // If it's a draw, check extra time
      if (isNaN(homeExtraTimeGoals) || isNaN(awayExtraTimeGoals)) {
        alert("Regular time ended in a draw. Please enter extra time scores.");
        return;
      }

      if (homeExtraTimeGoals < 0 || awayExtraTimeGoals < 0) {
        alert("Extra time goals cannot be negative");
        return;
      }

      const extraTimeDraw = homeExtraTimeGoals === awayExtraTimeGoals;

      if (extraTimeDraw) {
        // If extra time is also a draw, check penalties
        if (isNaN(homePenalties) || isNaN(awayPenalties)) {
          alert(
            "Extra time also ended in a draw. Please enter penalty scores."
          );
          return;
        }

        if (homePenalties < 0 || awayPenalties < 0) {
          alert("Penalty scores cannot be negative");
          return;
        }

        if (homePenalties === awayPenalties) {
          alert("Penalties cannot be equal. One team must win!");
          return;
        }
      }
    }

    // Determine winner based on the progression
    let winner;
    if (!regularTimeDraw) {
      winner =
        homeGoals > awayGoals ? selectedMatch.homeTeam : selectedMatch.awayTeam;
    } else if (homeExtraTimeGoals !== awayExtraTimeGoals) {
      winner =
        homeExtraTimeGoals > awayExtraTimeGoals
          ? selectedMatch.homeTeam
          : selectedMatch.awayTeam;
    } else {
      winner =
        homePenalties > awayPenalties
          ? selectedMatch.homeTeam
          : selectedMatch.awayTeam;
    }

    const newMatches = { ...knockoutMatches };

    // Update the match
    if (selectedMatch.stage === "quarterfinals") {
      const matchIndex = newMatches.quarterfinals.findIndex(
        (m) => m.id === selectedMatch.id
      );
      newMatches.quarterfinals[matchIndex] = {
        ...newMatches.quarterfinals[matchIndex],
        homeGoals,
        awayGoals,
        homeExtraTimeGoals: regularTimeDraw ? homeExtraTimeGoals : null,
        awayExtraTimeGoals: regularTimeDraw ? awayExtraTimeGoals : null,
        homePenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? homePenalties
            : null,
        awayPenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? awayPenalties
            : null,
        winner,
      };

      // Update semifinals
      const qfIndex = parseInt(selectedMatch.id.replace("qf", "")) - 1;
      const sfIndex = Math.floor(qfIndex / 2);
      const isHomeTeam = qfIndex % 2 === 0;

      if (isHomeTeam) {
        newMatches.semifinals[sfIndex].homeTeam = winner;
      } else {
        newMatches.semifinals[sfIndex].awayTeam = winner;
      }
    } else if (selectedMatch.stage === "semifinals") {
      const matchIndex = newMatches.semifinals.findIndex(
        (m) => m.id === selectedMatch.id
      );
      const loser =
        winner.participantId === selectedMatch.homeTeam.participantId
          ? selectedMatch.awayTeam
          : selectedMatch.homeTeam;

      newMatches.semifinals[matchIndex] = {
        ...newMatches.semifinals[matchIndex],
        homeGoals,
        awayGoals,
        homeExtraTimeGoals: regularTimeDraw ? homeExtraTimeGoals : null,
        awayExtraTimeGoals: regularTimeDraw ? awayExtraTimeGoals : null,
        homePenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? homePenalties
            : null,
        awayPenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? awayPenalties
            : null,
        winner,
      };

      // Update final and third place match
      const sfIndex = parseInt(selectedMatch.id.replace("sf", "")) - 1;
      if (sfIndex === 0) {
        newMatches.final.homeTeam = winner;
        newMatches.thirdPlace.homeTeam = loser;
      } else {
        newMatches.final.awayTeam = winner;
        newMatches.thirdPlace.awayTeam = loser;
      }
    } else if (selectedMatch.stage === "final") {
      // Final
      const loser =
        winner.participantId === selectedMatch.homeTeam.participantId
          ? selectedMatch.awayTeam
          : selectedMatch.homeTeam;
      newMatches.final = {
        ...newMatches.final,
        homeGoals,
        awayGoals,
        homeExtraTimeGoals: regularTimeDraw ? homeExtraTimeGoals : null,
        awayExtraTimeGoals: regularTimeDraw ? awayExtraTimeGoals : null,
        homePenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? homePenalties
            : null,
        awayPenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? awayPenalties
            : null,
        winner,
      };
      newMatches.champion = winner;
      newMatches.runnerUp = loser;
    } else if (selectedMatch.stage === "thirdPlace") {
      // Third Place
      newMatches.thirdPlace = {
        ...newMatches.thirdPlace,
        homeGoals,
        awayGoals,
        homeExtraTimeGoals: regularTimeDraw ? homeExtraTimeGoals : null,
        awayExtraTimeGoals: regularTimeDraw ? awayExtraTimeGoals : null,
        homePenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? homePenalties
            : null,
        awayPenalties:
          regularTimeDraw && homeExtraTimeGoals === awayExtraTimeGoals
            ? awayPenalties
            : null,
        winner,
      };
      newMatches.thirdPlaceWinner = winner;
    }

    setKnockoutMatches(newMatches);
    setShowMatchModal(false);
    setSelectedMatch(null);
  };

  const resetKnockout = async () => {
    if (!isAuthenticated) {
      alert("Please sign in as admin to reset knockout stage");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to reset all knockout stage results and reload qualified teams?"
      )
    ) {
      try {
        const tournamentId = getTournamentId(currentUser);
        if (!tournamentId) return;

        // Reload current group standings to get fresh qualified teams
        const standings = await getGroupStandings(tournamentId);
        if (!standings) {
          alert(
            "No group standings found. Please complete the group stage first."
          );
          return;
        }

        // Get top 2 from each group
        const topTwoTeams = [];
        const thirdPlaceTeams = [];

        standings.forEach((group) => {
          const sortedTeams = sortTeamsByRanking(group.teams);

          // Add ALL 1st place teams
          if (sortedTeams[0]) {
            topTwoTeams.push({
              ...sortedTeams[0],
              groupName: group.groupName,
              position: 1,
            });
          }
          // Add ALL 2nd place teams
          if (sortedTeams[1]) {
            topTwoTeams.push({
              ...sortedTeams[1],
              groupName: group.groupName,
              position: 2,
            });
          }

          // Collect all 3rd place teams for comparison
          if (sortedTeams[2]) {
            thirdPlaceTeams.push({
              ...sortedTeams[2],
              groupName: group.groupName,
              position: 3,
            });
          }
        });

        // Sort 3rd place teams by points and goal difference, then take best 2
        const bestThirdPlace = sortThirdPlaceTeams(thirdPlaceTeams).slice(0, 2);

        // Combine all qualified teams (1st + 2nd from all groups + best 2 third place)
        const qualified = [...topTwoTeams, ...bestThirdPlace];

        if (qualified.length < 8) {
          alert(
            `Only ${qualified.length} teams qualified. Need at least 8 teams for knockout stage.`
          );
          return;
        }

        // Set up fresh bracket with new qualified teams
        const resetMatches = {
          quarterfinals: Array(4)
            .fill(null)
            .map((_, i) => ({
              id: `qf${i + 1}`,
              homeTeam: null,
              awayTeam: null,
              homeGoals: null,
              awayGoals: null,
              winner: null,
            })),
          semifinals: Array(2)
            .fill(null)
            .map((_, i) => ({
              id: `sf${i + 1}`,
              homeTeam: null,
              awayTeam: null,
              homeGoals: null,
              awayGoals: null,
              winner: null,
            })),
          final: {
            id: "final",
            homeTeam: null,
            awayTeam: null,
            homeGoals: null,
            awayGoals: null,
            winner: null,
          },
          thirdPlace: {
            id: "thirdPlace",
            homeTeam: null,
            awayTeam: null,
            homeGoals: null,
            awayGoals: null,
            winner: null,
          },
          champion: null,
          runnerUp: null,
          thirdPlaceWinner: null,
        };

        // Create quarterfinal matchups using pot system (avoiding same group)
        const matchups = createBracketMatchups(qualified);

        matchups.forEach((matchup, index) => {
          if (index < 4) {
            resetMatches.quarterfinals[index].homeTeam = matchup.home;
            resetMatches.quarterfinals[index].awayTeam = matchup.away;
          }
        });

        setKnockoutMatches(resetMatches);
        setQualifiedTeams(qualified);

        alert(
          "Knockout stage reset successfully with updated qualified teams!"
        );
      } catch (error) {
        console.error("Error resetting knockout stage:", error);
        alert("Error resetting knockout stage. Please try again.");
      }
    }
  };

  const renderMatch = (match, stage, matchLabel) => {
    const hasResult = match.homeGoals !== null && match.awayGoals !== null;
    const isFinal = stage === "final";
    const isThirdPlace = stage === "thirdPlace";

    return (
      <div
        className={`knockout-match ${isFinal ? "final-match" : ""} ${
          isThirdPlace ? "third-place-match" : ""
        }`}
        key={match.id}
      >
        <div className="match-label">{matchLabel}</div>
        <div className="match-container">
          {match.homeTeam ? (
            <div
              className={`match-team ${
                hasResult &&
                match.winner?.participantId === match.homeTeam.participantId
                  ? "winner"
                  : ""
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
                    name: match.homeTeam.participantName,
                    avatar: match.homeTeam.avatar,
                    customImage: match.homeTeam.customImage,
                  }}
                  size="large"
                />
              </div>
              <div className="team-score">
                {hasResult ? (
                  <>
                    <span className="score-main">{match.homeGoals}</span>
                    {match.homeExtraTimeGoals !== null &&
                      match.homeExtraTimeGoals !== undefined && (
                        <span className="score-extra">
                          {" "}
                          (+{match.homeExtraTimeGoals})
                        </span>
                      )}
                    {match.homePenalties !== null &&
                      match.homePenalties !== undefined && (
                        <span className="score-penalties">
                          {" "}
                          ({match.homePenalties})
                        </span>
                      )}
                  </>
                ) : (
                  "-"
                )}
              </div>
            </div>
          ) : (
            <div className="match-team tbd">
              <span className="tbd-text">TBD</span>
            </div>
          )}

          <div className="match-divider" />

          {match.awayTeam ? (
            <div
              className={`match-team ${
                hasResult &&
                match.winner?.participantId === match.awayTeam.participantId
                  ? "winner"
                  : ""
              }`}
            >
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
                    name: match.awayTeam.participantName,
                    avatar: match.awayTeam.avatar,
                    customImage: match.awayTeam.customImage,
                  }}
                  size="large"
                />
              </div>
              <div className="team-score">
                {hasResult ? (
                  <>
                    <span className="score-main">{match.awayGoals}</span>
                    {match.awayExtraTimeGoals !== null &&
                      match.awayExtraTimeGoals !== undefined && (
                        <span className="score-extra">
                          {" "}
                          (+{match.awayExtraTimeGoals})
                        </span>
                      )}
                    {match.awayPenalties !== null &&
                      match.awayPenalties !== undefined && (
                        <span className="score-penalties">
                          {" "}
                          ({match.awayPenalties})
                        </span>
                      )}
                  </>
                ) : (
                  "-"
                )}
              </div>
            </div>
          ) : (
            <div className="match-team tbd">
              <span className="tbd-text">TBD</span>
            </div>
          )}
        </div>

        {match.homeTeam && match.awayTeam && isAuthenticated && (
          <Button
            onClick={() => openMatchModal(match.id, stage)}
            variant="primary"
            className="match-btn"
          >
            {hasResult ? "Edit Result" : "Add Result"}
          </Button>
        )}
      </div>
    );
  };

  if (qualifiedTeams.length === 0) {
    return (
      <div className="knockout-stage">
        <Container>
          <div className="header-section">
            <h2>Knockout Stage</h2>
          </div>
          <div className="empty-state">
            <p>Complete the group stage first to determine qualified teams!</p>
            <Button onClick={() => navigate("/tournament")} variant="primary">
              Go to Tournament Table
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="knockout-stage">
      <Container>
        <div className="header-section">
          <h2>Knockout Stage</h2>
          <div className="header-actions">
            <Button onClick={() => navigate("/qualified")} variant="secondary">
              View Qualified Teams
            </Button>
            {isAuthenticated && (
              <Button onClick={resetKnockout} variant="danger">
                Reset & Reload Bracket
              </Button>
            )}
          </div>
        </div>

        {/* Bracket */}
        <div className="bracket-section">
          <h3>Tournament Bracket</h3>

          <div className="bracket-explanation">
            <p>
              <strong>Seeding System:</strong> Teams are divided into Pot 1 (all
              1st place + best 2nd place) and Pot 2 (remaining teams). Matchups
              avoid teams from the same group.
            </p>
          </div>

          <div className="bracket-container">
            {/* Left Quarterfinals */}
            <div className="bracket-round quarterfinals-left">
              <h4>Quarterfinals</h4>
              <div className="matches-column">
                {knockoutMatches.quarterfinals
                  .slice(0, 2)
                  .map((match, index) =>
                    renderMatch(match, "quarterfinals", `QF ${index + 1}`)
                  )}
              </div>
            </div>

            {/* Left Semifinal */}
            <div className="bracket-round semifinals-left">
              <h4>Semifinals</h4>
              <div className="matches-column">
                {renderMatch(
                  knockoutMatches.semifinals[0],
                  "semifinals",
                  "SF 1"
                )}
              </div>
            </div>

            {/* Final & 3rd Place (center) */}
            <div className="bracket-round final">
              <h4>Final & 3rd Place</h4>
              <div className="matches-column">
                {renderMatch(knockoutMatches.final, "final", "🏆 FINAL 🏆")}

                {/* Third Place Match */}
                {knockoutMatches.thirdPlace &&
                  (knockoutMatches.thirdPlace.homeTeam ||
                    knockoutMatches.thirdPlace.awayTeam) &&
                  renderMatch(
                    knockoutMatches.thirdPlace,
                    "thirdPlace",
                    "🥉 3RD PLACE 🥉"
                  )}
              </div>
            </div>

            {/* Right Semifinal */}
            <div className="bracket-round semifinals-right">
              <h4>Semifinals</h4>
              <div className="matches-column">
                {renderMatch(
                  knockoutMatches.semifinals[1],
                  "semifinals",
                  "SF 2"
                )}
              </div>
            </div>

            {/* Right Quarterfinals */}
            <div className="bracket-round quarterfinals-right">
              <h4>Quarterfinals</h4>
              <div className="matches-column">
                {knockoutMatches.quarterfinals
                  .slice(2, 4)
                  .map((match, index) =>
                    renderMatch(match, "quarterfinals", `QF ${index + 3}`)
                  )}
              </div>
            </div>
          </div>

          {/* Winners Podium */}
          {knockoutMatches.champion && (
            <div className="winners-section">
              <h3 className="winners-title">🏆 Tournament Winners 🏆</h3>
              <div className="podium-container">
                {/* Second Place */}
                {knockoutMatches.runnerUp && (
                  <div className="podium-place second-place">
                    <div className="place-number">2</div>
                    <div className="place-card">
                      <div className="medal-icon">🥈</div>
                      <ClubLogo
                        club={{
                          name: knockoutMatches.runnerUp.club,
                          logo: knockoutMatches.runnerUp.clubLogo,
                        }}
                        size="large"
                      />
                      <Avatar
                        participant={{
                          name: knockoutMatches.runnerUp.participantName,
                          avatar: knockoutMatches.runnerUp.avatar,
                          customImage: knockoutMatches.runnerUp.customImage,
                        }}
                        size="medium"
                      />
                      <h4>{knockoutMatches.runnerUp.participantName}</h4>
                      <p className="place-club">
                        {knockoutMatches.runnerUp.club}
                      </p>
                      <div className="prize-label">Runner-Up</div>
                    </div>
                  </div>
                )}

                {/* First Place */}
                <div className="podium-place first-place">
                  <div className="place-number">1</div>
                  <div className="place-card">
                    <div className="medal-icon">🥇</div>
                    <ClubLogo
                      club={{
                        name: knockoutMatches.champion.club,
                        logo: knockoutMatches.champion.clubLogo,
                      }}
                      size="large"
                    />
                    <Avatar
                      participant={{
                        name: knockoutMatches.champion.participantName,
                        avatar: knockoutMatches.champion.avatar,
                        customImage: knockoutMatches.champion.customImage,
                      }}
                      size="medium"
                    />
                    <h4>{knockoutMatches.champion.participantName}</h4>
                    <p className="place-club">
                      {knockoutMatches.champion.club}
                    </p>
                    <div className="prize-label">Champion</div>
                  </div>
                </div>

                {/* Third Place */}
                {knockoutMatches.thirdPlaceWinner && (
                  <div className="podium-place third-place">
                    <div className="place-number">3</div>
                    <div className="place-card">
                      <div className="medal-icon">🥉</div>
                      <ClubLogo
                        club={{
                          name: knockoutMatches.thirdPlaceWinner.club,
                          logo: knockoutMatches.thirdPlaceWinner.clubLogo,
                        }}
                        size="large"
                      />
                      <Avatar
                        participant={{
                          name: knockoutMatches.thirdPlaceWinner
                            .participantName,
                          avatar: knockoutMatches.thirdPlaceWinner.avatar,
                          customImage:
                            knockoutMatches.thirdPlaceWinner.customImage,
                        }}
                        size="medium"
                      />
                      <h4>
                        {knockoutMatches.thirdPlaceWinner.participantName}
                      </h4>
                      <p className="place-club">
                        {knockoutMatches.thirdPlaceWinner.club}
                      </p>
                      <div className="prize-label">Third Place</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* Match Result Modal */}
      <Modal
        isOpen={showMatchModal}
        onClose={() => {
          setShowMatchModal(false);
          setSelectedMatch(null);
        }}
        title={`Match Result - ${
          selectedMatch?.stage === "quarterfinals"
            ? "Quarterfinal"
            : selectedMatch?.stage === "semifinals"
            ? "Semifinal"
            : selectedMatch?.stage === "final"
            ? "Final"
            : "3rd Place Match"
        }`}
      >
        {selectedMatch && (
          <div className="match-form">
            <div className="form-row">
              <div className="form-group">
                <label>Home Team</label>
                <div className="team-display">
                  <ClubLogo
                    club={{
                      name: selectedMatch.homeTeam.club,
                      logo: selectedMatch.homeTeam.clubLogo,
                    }}
                    size="large"
                  />
                  <Avatar
                    participant={{
                      name: selectedMatch.homeTeam.participantName,
                      avatar: selectedMatch.homeTeam.avatar,
                      customImage: selectedMatch.homeTeam.customImage,
                    }}
                    size="large"
                  />
                  <span>{selectedMatch.homeTeam.participantName}</span>
                </div>
              </div>

              <div className="form-group score-input">
                <label>Regular Time Score</label>
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
                <small className="help-text">90 minutes score</small>
              </div>

              <div className="form-group">
                <label>Away Team</label>
                <div className="team-display">
                  <ClubLogo
                    club={{
                      name: selectedMatch.awayTeam.club,
                      logo: selectedMatch.awayTeam.clubLogo,
                    }}
                    size="large"
                  />
                  <Avatar
                    participant={{
                      name: selectedMatch.awayTeam.participantName,
                      avatar: selectedMatch.awayTeam.avatar,
                      customImage: selectedMatch.awayTeam.customImage,
                    }}
                    size="large"
                  />
                  <span>{selectedMatch.awayTeam.participantName}</span>
                </div>
              </div>
            </div>

            {/* Extra Time and Penalties Container */}
            {matchData.homeGoals === matchData.awayGoals && (
              <div className="overtime-container">
                {/* Extra Time Section */}
                <div className="extra-time-section">
                  <div className="section-divider">
                    <span className="divider-text">⏱️ Extra Time</span>
                  </div>
                  <div className="form-group score-input">
                    <label>Extra Time Score</label>
                    <div className="score-inputs">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={matchData.homeExtraTimeGoals}
                        onChange={(e) =>
                          setMatchData({
                            ...matchData,
                            homeExtraTimeGoals: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <span className="vs">-</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={matchData.awayExtraTimeGoals}
                        onChange={(e) =>
                          setMatchData({
                            ...matchData,
                            awayExtraTimeGoals: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <small className="help-text">30 minutes extra time</small>
                  </div>
                </div>

                {/* Penalties Section */}
                {matchData.homeExtraTimeGoals ===
                  matchData.awayExtraTimeGoals && (
                  <div className="penalties-section">
                    <div className="section-divider">
                      <span className="divider-text">⚽ Penalties</span>
                    </div>
                    <div className="form-group score-input">
                      <label>Penalty Shootout</label>
                      <div className="score-inputs">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={matchData.homePenalties}
                          onChange={(e) =>
                            setMatchData({
                              ...matchData,
                              homePenalties: Number(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="vs">-</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={matchData.awayPenalties}
                          onChange={(e) =>
                            setMatchData({
                              ...matchData,
                              awayPenalties: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <small className="help-text">Cannot be equal</small>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <Button onClick={saveMatchResult} variant="primary">
                Save Result
              </Button>
              <Button
                onClick={() => setShowMatchModal(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default KnockoutStage;
