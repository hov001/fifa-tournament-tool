import "./Avatar.css";

function Avatar({ participant, size = "medium", showOrder = false }) {
  const sizes = {
    small: { width: "32px", height: "32px", fontSize: "1rem" },
    medium: { width: "48px", height: "48px", fontSize: "1.5rem" },
    large: { width: "60px", height: "60px", fontSize: "2rem" },
  };

  const sizeStyle = sizes[size] || sizes.medium;

  return (
    <div className="avatar-container">
      {participant.customImage ? (
        <div
          className="avatar uploaded-avatar"
          style={{ width: sizeStyle.width, height: sizeStyle.height }}
        >
          <img src={participant.customImage} alt={participant.name} />
        </div>
      ) : (
        <div
          className="avatar default-avatar"
          style={{
            width: sizeStyle.width,
            height: sizeStyle.height,
            fontSize: sizeStyle.fontSize,
            backgroundColor: "#e0e0e0",
            color: "#757575",
          }}
        >
          👤
        </div>
      )}
    </div>
  );
}

export default Avatar;
