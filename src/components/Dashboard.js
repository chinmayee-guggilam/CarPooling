import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SideNav from "./SideNav";
import TopNav from "./TopNav";
import ChatButton from "./ChatButton";
import { useAuth } from "./AuthProvider"; // Assuming you're using a custom AuthProvider
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { currentUser } = useAuth(); // Get the current user from AuthProvider
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      // If no user is logged in, navigate to the login page
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    // Display a loading state while checking for authentication
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <TopNav user={currentUser} />
      <div className="dashboard-main">
        <SideNav />
        <div className="dashboard-content">
          {/* Pass userId via Outlet context */}
          <Outlet context={{ userId: currentUser.uid }} />
        </div>
      </div>
      <ChatButton />
    </div>
  );
};

export default Dashboard;
