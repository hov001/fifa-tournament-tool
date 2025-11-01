import Avatar from "./Avatar";
import OrderBadge from "./OrderBadge";
import "./PlayerCard.css";

function PlayerCard({ participant, children, className = "" }) {
  return (
    <div className={`player-card ${className}`}>
      <div className="player-card-header">
        <Avatar participant={participant} size="medium" />
        <div className="player-card-info">
          <OrderBadge order={participant.order} />
          <h4 className="player-card-name">{participant.name}</h4>
        </div>
      </div>
      {children && <div className="player-card-content">{children}</div>}
    </div>
  );
}

export default PlayerCard;
