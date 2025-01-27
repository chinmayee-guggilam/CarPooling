import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/SideNav.css";
import { getAuth } from "firebase/auth";

const SideNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser; // Get current logged-in user

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  // Handle Logout
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        console.log("User logged out successfully.");
        navigate("/login"); // Redirect to login page
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  return (
    <>
      {/* Toggle Button */}
      <div className="toggle-btn" onClick={toggleNav}>
        {isOpen ? "✖" : "☰"}
      </div>

      {/* Side Navigation */}
      <div className={`side-nav ${isOpen ? "open" : "closed"}`}>
        <Link to="/dashboard/home" onClick={toggleNav}>
          Home
        </Link>
        <Link to="/dashboard/create-ride" onClick={toggleNav}>
          Create Ride
        </Link>
        <Link to="/dashboard/my-creations" onClick={toggleNav}>
          My Creations
        </Link>
        <Link to="/dashboard/time-line" onClick={toggleNav}>
          Time Line
        </Link>
        <Link to="/dashboard/rides-near-you" onClick={toggleNav}>
          Rides Near You
        </Link>
        
        {/* Dynamic Profile link */}
        {currentUser ? (
          <Link to={`/dashboard/profile/${currentUser.uid}`} onClick={toggleNav}>
            My Profile
          </Link>
        ) : (
          <Link to="/login" onClick={toggleNav}>
            Login
          </Link>
        )}

        <li className="logout" onClick={handleLogout}>
          Logout
        </li>

        {showLogoutModal && (
          <div className="logout-modal">
            <div className="modal-content">
              <p>Are you sure you want to logout?</p>
              <div className="modal-actions">
                <button onClick={handleLogout} className="confirm-btn">
                  Yes
                </button>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="cancel-btn"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SideNav;
