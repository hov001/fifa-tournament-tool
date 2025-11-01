import "./OrderBadge.css";

function OrderBadge({ order, variant = "default" }) {
  return <span className={`order-badge order-badge-${variant}`}>#{order}</span>;
}

export default OrderBadge;
