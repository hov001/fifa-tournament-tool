import "./Button.css";

function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  fullWidth = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${
        fullWidth ? "btn-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
