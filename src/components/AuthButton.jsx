import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import AuthModal from "./AuthModal";
import "./AuthButton.css";

function AuthButton() {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  if (isAuthenticated) {
    return (
      <div className="auth-status">
        <span className="auth-user-badge">
          <span className="auth-user-icon">👤</span>
          <span className="auth-user-email">{currentUser.email}</span>
        </span>
        <Button
          onClick={handleLogout}
          variant="secondary"
          disabled={loggingOut}
          className="logout-btn"
        >
          {loggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setShowLoginModal(true)} variant="primary">
        Admin Login
      </Button>
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

export default AuthButton;
