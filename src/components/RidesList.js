import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "../styles/RidesList.css";

const RidesList = ({ userId }) => {
  const [rides, setRides] = useState([]);
  const db = getDatabase();
  const navigate = useNavigate();

  useEffect(() => {
    const ridesRef = ref(db, "rides");

    // Real-time listener for the rides node
    const unsubscribe = onValue(ridesRef, (snapshot) => {
      if (snapshot.exists()) {
        const ridesList = [];
        const now = new Date();

        snapshot.forEach((childSnapshot) => {
          const ride = { id: childSnapshot.key, ...childSnapshot.val() };
          const rideDateTime = new Date(`${ride.rideDate}T${ride.rideTime}`);
          const noOfSeats = isNaN(Number(ride.availableSeats)) ? 0 : Number(ride.availableSeats);

          // Add only valid rides (future rides with available seats)
          if (noOfSeats > 0 && rideDateTime > now) {
            ridesList.push(ride);
          }
        });

        // Sort rides by date and time (soonest first)
        ridesList.sort((a, b) => {
          const dateTimeA = new Date(`${a.rideDate}T${a.rideTime}`);
          const dateTimeB = new Date(`${b.rideDate}T${b.rideTime}`);
          return dateTimeA - dateTimeB;
        });

        setRides(ridesList);
      } else {
        setRides([]); // Reset if no rides exist
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [db]);

  const handleKnowMore = (ride) => {
    // Navigate to the Ride Details page with the ride ID as a parameter
    navigate(`/dashboard/ride-details/${ride.id}`);
  };

  const scrollLeft = () => {
    const container = document.getElementById("rides-container");
    if (container) {
      container.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById("rides-container");
    if (container) {
      container.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="rides-list-container">
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Carpooling Services</h1>
          <p>
            Join a community of eco-conscious commuters. Share rides, reduce carbon
            footprints, and save on transportation costs. <br></br>Find a carpool that fits
            your schedule and preferences.
          </p>
          <input
            type="text"
            className="search-input"
            placeholder="Search for rides..."
            onChange={(e) => {
              const query = e.target.value.toLowerCase();
              setRides((prevRides) =>
                prevRides.filter(
                  (ride) =>
                    ride.source.toLowerCase().includes(query) ||
                    ride.destination.toLowerCase().includes(query)
                )
              );
            }}
          />
        </div>
      </div>
      <div className="rides-list-section">
        <h2>Upcoming Rides</h2>
        <div className="rides-controls">
          <button className="scroll-button scroll-left" onClick={scrollLeft}>
            {"<"}
          </button>
          <div className="rides-container" id="rides-container">
            {rides.length > 0 ? (
              rides.map((ride) => (
                <div className="ride-card" key={ride.id}>
                  <div className="ride-info">
                    <h3>
                      {ride.source} → {ride.destination}
                    </h3>
                    <p>
                      {ride.rideDate} | {ride.rideTime}
                    </p>
                    <p>Available Seats: {ride.availableSeats || 0}</p>
                  </div>
                  <div className="ride-actions">
                    <button
                      className="know-more-button"
                      onClick={() => handleKnowMore(ride)}
                    >
                      Know More
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-rides-message">No upcoming rides available.</p>
            )}
          </div>
          <button className="scroll-button scroll-right" onClick={scrollRight}>
            {">"}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default RidesList;
