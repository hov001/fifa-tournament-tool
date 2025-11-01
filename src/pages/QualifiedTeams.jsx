import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Container from "../components/Container";
import Avatar from "../components/Avatar";
import ClubLogo from "../components/ClubLogo";
import { getKnockoutMatches, getGroupStandings } from "../firebase/dbService";
import "./QualifiedTeams.css";

function QualifiedTeams() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [teamsByStage, setTeamsByStage] = useState({
    finals: [],
    semifinals: [],
    quarterfinals: [],
    qualified: [],
  });

  useEffect(() => {
    const loadData = async () => {
      let knockoutMatches = {};
      let standings = [];

      // Load from Firestore (authenticated) or localStorage (non-authenticated)
      if (!currentUser) {
        try {
          const localKnockout = localStorage.getItem("knockoutMatches");
          if (localKnockout) {
            knockoutMatches = JSON.parse(localKnockout);
          }
          const localStandings = localStorage.getItem("groupStandings");
          if (localStandings) {
            standings = JSON.parse(localStandings);
          }
        } catch (error) {
          console.error("Error loading from localStorage:", error);
          return;
        }
      } else {
        try {
          knockoutMatches = (await getKnockoutMatches(currentUser.uid)) || {};
          standings = (await getGroupStandings(currentUser.uid)) || [];
        } catch (error) {
          console.error("Error loading from Firestore:", error);
          return;
        }
      }

      try {
        // Get all qualified teams from group stage
        const allQualified = [];
        standings.forEach((group) => {
          const sortedTeams = [...group.teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference)
              return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return a.participantName.localeCompare(b.participantName);
          });

          // Top 2 from each group
          if (sortedTeams[0]) {
            allQualified.push({
              ...sortedTeams[0],
              groupName: group.groupName,
            });
          }
          if (sortedTeams[1]) {
            allQualified.push({
              ...sortedTeams[1],
              groupName: group.groupName,
            });
          }
        });

        // Organize teams by stage
        const stages = {
          finals: [],
          semifinals: [],
          quarterfinals: [],
          qualified: allQualified,
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
      {team.groupName && <div className="group-badge">{team.groupName}</div>}
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

        {/* All Qualified Teams */}
        {teamsByStage.qualified.length > 0 &&
          teamsByStage.quarterfinals.length === 0 && (
            <div className="stage-section qualified-section">
              <div className="stage-header">
                <h3>✅ Qualified for Knockout Stage</h3>
                <span className="team-count">
                  {teamsByStage.qualified.length} Teams
                </span>
              </div>
              <div className="teams-grid">
                {teamsByStage.qualified.map((team, index) =>
                  renderTeamCard(team, index)
                )}
              </div>
            </div>
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
