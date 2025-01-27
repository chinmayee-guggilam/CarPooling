import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, onValue } from "firebase/database";
import "../styles/SearchRides.css";

const SearchRides = () => {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();
  const db = getDatabase();

  useEffect(() => {
    const ridesRef = ref(db, "rides");
    onValue(ridesRef, (snapshot) => {
      if (snapshot.exists()) {
        const ridesData = Object.entries(snapshot.val()).map(([id, ride]) => ({
          id,
          ...ride,
        }));
        setRides(ridesData);
      } else {
        setRides([]);
      }
    });
  }, [db]);

  const handleSearch = () => {
    if (!source && !destination && !date) {
      alert("Please fill at least one field.");
      return;
    }

    const filtered = rides.filter((ride) => {
      const matchesSource = source
        ? ride.source.toLowerCase().includes(source.toLowerCase())
        : true;
      const matchesDestination = destination
        ? ride.destination.toLowerCase().includes(destination.toLowerCase())
        : true;
      const matchesDate = date ? ride.rideDate === date : true;

      return matchesSource && matchesDestination && matchesDate;
    });

    setFilteredRides(filtered);
  };

  const navigateToRideDetails = (rideId) => {
    navigate(`/dashboard/ride-details/${rideId}`);
  };

  return (
    <div className="search-rides-container">
      <h2>Search for Rides</h2>
      <input
        type="text"
        className="search-field"
        placeholder="Enter Source"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <input
        type="text"
        className="search-field"
        placeholder="Enter Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        type="date"
        className="search-field"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button className="search-button" onClick={handleSearch}>
        Search
      </button>

      <div className="rides-list">
        {filteredRides.length === 0 ? (
          <p>No rides found.</p>
        ) : (
          filteredRides.map((ride) => (
            <div key={ride.id} className="ride-card">
              <p>
                <strong>{ride.source}</strong> → <strong>{ride.destination}</strong>
              </p>
              <p>
                <strong>Date:</strong> {ride.rideDate} <strong>Time:</strong>{" "}
                {ride.rideTime}
              </p>
              <p>
                <strong>Seats Available:</strong> {ride.noOfSeats}
              </p>
              {ride.noOfSeats > 0 ? (
                <button
                  className="know-more-button"
                  onClick={() => navigateToRideDetails(ride.id)}
                >
                  Know More
                </button>
              ) : (
                <p className="not-available">Not Available</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchRides;
