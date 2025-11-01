import ClubLogo from "./ClubLogo";
import "./ClubCard.css";

function ClubCard({ club, isHighlighted = false, onClick }) {
  return (
    <div
      className={`club-card ${isHighlighted ? "highlighted" : ""}`}
      onClick={onClick}
    >
      <ClubLogo club={club} size="large" />
      <div className="club-card-details">
        <div className="club-card-name">{club.name}</div>
        <div className="club-card-info">
          <span className="club-league">{club.league}</span>
        </div>
      </div>
    </div>
  );
}

export default ClubCard;
