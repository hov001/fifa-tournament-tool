import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Container from "../components/Container";
import Avatar from "../components/Avatar";
import ClubLogo from "../components/ClubLogo";
import { getKnockoutMatches, getGroupStandings } from "../firebase/dbService";
import { getTournamentId } from "../utils/tournamentContext";
import "./QualifiedTeams.css";

function QualifiedTeams() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [teamsByStage, setTeamsByStage] = useState({
    finals: [],
    semifinals: [],
    quarterfinals: [],
    qualified: [],
    pot1: [],
    pot2: [],
  });

  useEffect(() => {
    const loadData = async () => {
      const tournamentId = getTournamentId(currentUser);

      if (!tournamentId) {
        return;
      }

      let knockoutMatches = {};
      let standings = [];

      // Load from Firestore
      try {
        knockoutMatches = (await getKnockoutMatches(tournamentId)) || {};
        standings = (await getGroupStandings(tournamentId)) || [];
      } catch (error) {
        console.error("Error loading from Firestore:", error);
        return;
      }

      try {
        // Helper to sort teams by tournament rules
        const sortTeamsByRanking = (teams) => {
          return [...teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference)
              return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return a.participantName.localeCompare(b.participantName);
          });
        };

        // Helper to sort 3rd place teams (only by points and goal difference)
        const sortThirdPlaceTeams = (teams) => {
          return [...teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference)
              return b.goalDifference - a.goalDifference;
            return 0;
          });
        };

        // Get all qualified teams from group stage
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

        // Sort 3rd place teams and take best 2
        const bestThirdPlace = sortThirdPlaceTeams(thirdPlaceTeams).slice(0, 2);

        // Combine all qualified teams
        const allQualified = [...topTwoTeams, ...bestThirdPlace];

        // Determine Pot 1 and Pot 2
        const firstPlaceTeams = allQualified.filter(t => t.position === 1);
        const secondPlaceTeams = allQualified.filter(t => t.position === 2);
        const thirdPlaceQualified = allQualified.filter(t => t.position === 3);

        // Sort 2nd place teams to find the best one
        const sortedSecondPlace = sortTeamsByRanking(secondPlaceTeams);

        // Pot 1: All 1st place + best 2nd place
        const pot1 = [...firstPlaceTeams, sortedSecondPlace[0]].filter(Boolean);
        
        // Pot 2: Remaining 2nd place + 3rd place teams
        const pot2 = [...sortedSecondPlace.slice(1), ...thirdPlaceQualified].filter(Boolean);

        // Mark teams with pot information
        allQualified.forEach(team => {
          if (pot1.find(t => t.participantId === team.participantId)) {
            team.pot = 1;
          } else if (pot2.find(t => t.participantId === team.participantId)) {
            team.pot = 2;
          }
        });

        // Organize teams by stage
        const stages = {
          finals: [],
          semifinals: [],
          quarterfinals: [],
          qualified: allQualified,
          pot1: pot1,
          pot2: pot2,
        };

        // Finals teams - only the 2 finalists
        if (knockoutMatches.final?.homeTeam) {
          stages.finals.push(knockoutMatches.final.homeTeam);
        }
        if (knockoutMatches.final?.awayTeam) {
          stages.finals.push(knockoutMatches.final.awayTeam);
        }

        // Semifinals teams (quarterfinalists winners)
        if (knockoutMatches.semifinals) {
          knockoutMatches.semifinals.forEach((match) => {
            if (match.homeTeam) stages.semifinals.push(match.homeTeam);
            if (match.awayTeam) stages.semifinals.push(match.awayTeam);
          });
        }

        // Quarterfinals teams
        if (knockoutMatches.quarterfinals) {
          knockoutMatches.quarterfinals.forEach((match) => {
            if (match.homeTeam) stages.quarterfinals.push(match.homeTeam);
            if (match.awayTeam) stages.quarterfinals.push(match.awayTeam);
          });
        }

        setTeamsByStage(stages);
      } catch (error) {
        console.error("Error loading qualified teams:", error);
      }
    };

    loadData();
  }, [currentUser]);

  const renderTeamCard = (team, index) => (
    <div key={team.participantId || index} className="qualified-team-card">
      <div className="seed-number">{index + 1}</div>
      <ClubLogo club={{ name: team.club, logo: team.clubLogo }} size="medium" />
      <Avatar
        participant={{
          name: team.participantName,
          avatar: team.avatar,
          customImage: team.customImage,
        }}
        size="small"
      />
      <div className="team-name">{team.participantName}</div>
      <div className="team-badges">
        {team.groupName && <div className="group-badge">{team.groupName}</div>}
        {team.position && <div className="position-badge">Pos {team.position}</div>}
        {team.pot && <div className={`pot-badge pot-${team.pot}`}>Pot {team.pot}</div>}
      </div>
    </div>
  );

  return (
    <div className="qualified-teams-page">
      <Container>
        <div className="header-section">
          <h2>Qualified Teams by Stage</h2>
          <div className="header-actions">
            <Button onClick={() => navigate("/knockout")} variant="primary">
              Go to Knockout Stage
            </Button>
          </div>
        </div>

        {/* Finals */}
        {teamsByStage.finals.length > 0 && (
          <div className="stage-section finals-section">
            <div className="stage-header">
              <h3>🏆 Finals</h3>
              <span className="team-count">
                {teamsByStage.finals.length} Teams
              </span>
            </div>
            <div className="teams-grid">
              {teamsByStage.finals.map((team, index) =>
                renderTeamCard(team, index)
              )}
            </div>
          </div>
        )}

        {/* Semifinals */}
        {teamsByStage.semifinals.length > 0 && (
          <div className="stage-section semifinals-section">
            <div className="stage-header">
              <h3>🥈 Semifinals</h3>
              <span className="team-count">
                {teamsByStage.semifinals.length} Teams
              </span>
            </div>
            <div className="teams-grid">
              {teamsByStage.semifinals.map((team, index) =>
                renderTeamCard(team, index)
              )}
            </div>
          </div>
        )}

        {/* Quarterfinals */}
        {teamsByStage.quarterfinals.length > 0 && (
          <div className="stage-section quarterfinals-section">
            <div className="stage-header">
              <h3>🥉 Quarterfinals</h3>
              <span className="team-count">
                {teamsByStage.quarterfinals.length} Teams
              </span>
            </div>
            <div className="teams-grid">
              {teamsByStage.quarterfinals.map((team, index) =>
                renderTeamCard(team, index)
              )}
            </div>
          </div>
        )}

        {/* All Qualified Teams - Show Pots */}
        {teamsByStage.qualified.length > 0 &&
          teamsByStage.quarterfinals.length === 0 && (
            <>
              <div className="pots-explanation">
                <p>
                  <strong>Pot 1:</strong> All 1st place teams + Best 2nd place (by points, goal difference)
                </p>
                <p>
                  <strong>Pot 2:</strong> Remaining 2nd place teams + Best 3rd place teams
                </p>
                <p className="note">
                  Teams from the same group will not face each other in quarterfinals
                </p>
              </div>

              {/* Pot 1 */}
              {teamsByStage.pot1.length > 0 && (
                <div className="stage-section pot1-section">
                  <div className="stage-header">
                    <h3>🌟 Pot 1 (Seeded)</h3>
                    <span className="team-count">
                      {teamsByStage.pot1.length} Teams
                    </span>
                  </div>
                  <div className="teams-grid">
                    {teamsByStage.pot1.map((team, index) =>
                      renderTeamCard(team, index)
                    )}
                  </div>
                </div>
              )}

              {/* Pot 2 */}
              {teamsByStage.pot2.length > 0 && (
                <div className="stage-section pot2-section">
                  <div className="stage-header">
                    <h3>⚽ Pot 2</h3>
                    <span className="team-count">
                      {teamsByStage.pot2.length} Teams
                    </span>
                  </div>
                  <div className="teams-grid">
                    {teamsByStage.pot2.map((team, index) =>
                      renderTeamCard(team, index)
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        {teamsByStage.qualified.length === 0 && (
          <div className="empty-state">
            <p>Complete the group stage first to see qualified teams!</p>
            <Button onClick={() => navigate("/tournament")} variant="primary">
              Go to Tournament Table
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

export default QualifiedTeams;
