import React, { useState, useEffect } from "react"; // Import useState and useEffect
import { Link } from "react-router-dom";
import "../styles/TopNav.css";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";

const TopNav = () => {
  const [user, setUser] = useState(null); // Initialize user state
  const auth = getAuth();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;

    if (currentUserId) {
      const db = getDatabase();
      const userRef = ref(db, `users/${currentUserId}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        setUser(userData); // Update state with user data
      });
    }
  }, [auth]); // Dependency array includes auth to ensure it re-runs if auth changes

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <Link to="/dashboard/home" className="brand-link">
          <h2>Carpooling</h2>
        </Link>
      </div>
      <div className="top-nav-right">
        {/* Display user's profile image or fallback to placeholder */}
        <img
          src={user?.profilePhoto || "https://via.placeholder.com/40"}
          alt="Profile"
          className="profile-img"
        />
        {/* Display user's username or fallback to 'Guest' */}
        <span className="user-name">{user?.username || "Guest"}</span>
      </div>
    </div>
  );
};

export default TopNav;
