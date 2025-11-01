import "./ClubLogo.css";

function ClubLogo({ club, size = "medium", showName = false }) {
  if (!club || !club.logo) {
    return showName ? (
      <span className="no-club-text">No club selected</span>
    ) : (
      <span className="no-club-icon" title="No club selected">
        —
      </span>
    );
  }

  const sizes = {
    small: "32px",
    medium: "40px",
    large: "60px",
  };

  const logoSize = sizes[size] || sizes.medium;

  return (
    <div className={`club-logo-container ${showName ? "with-name" : ""}`}>
      <img
        src={club.logo}
        alt={club.name}
        className={`club-logo club-logo-${size}`}
        style={{ width: logoSize, height: logoSize }}
        title={club.name}
      />
      {showName && <span className="club-name-text">{club.name}</span>}
    </div>
  );
}

export default ClubLogo;
