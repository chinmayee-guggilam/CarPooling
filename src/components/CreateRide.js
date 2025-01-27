import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, push } from "firebase/database";
import "../styles/CreateRide.css";

const CreateRide = () => {
  const [source, setSource] = useState("");
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [rideTime, setRideTime] = useState("");
  const [noOfSeats, setNoOfSeats] = useState("");
  const [availableSeats,setAvailableSeats] = useState("");
  const [costPerSeat, setCostPerSeat] = useState("");
  const [petAllowed, setPetAllowed] = useState("No");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = getAuth();
  const db = getDatabase();

  const handleCreateRide = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const user = auth.currentUser;

    if (!user) {
      setError("You need to be logged in to create a ride.");
      setIsSubmitting(false);
      return;
    }

    if (parseInt(noOfSeats, 10) <= 0 || parseFloat(costPerSeat) <= 0) {
      setError("Seats and cost per seat must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    try {
      const rideData = {
        userId: user.uid,
        source,
        destination,
        startPoint,
        endPoint,
        rideDate,
        availableSeats,
        rideTime,
        noOfSeats: parseInt(noOfSeats, 10),
        costPerSeat: parseFloat(costPerSeat),
        petAllowed: petAllowed === "Yes",
      };

      // Save to global rides node
      const ridesRef = ref(db, "rides");
      const newRideRef = await push(ridesRef, rideData);

      // Save to user's myCreations node
      const userCreationsRef = ref(db, `users/${user.uid}/myCreations`);
      await push(userCreationsRef, {
        ...rideData,
        rideId: newRideRef.key, // Reference to the global ride ID
      });

      alert("Ride created successfully!");
      setSource("");
      setDestination("");
      setRideDate("");
      setStartPoint("");
      setEndPoint("");
      setRideTime("");
      setNoOfSeats("");
      setCostPerSeat("");
      setPetAllowed("No");
    } catch (err) {
      setError("Failed to create ride. Please try again.");
      console.error("Error creating ride:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-ride-container">
      <h1>Create a Ride</h1>
      <form onSubmit={handleCreateRide} className="create-ride-form">
        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
        <input
          type="date"
          value={rideDate}
          onChange={(e) => setRideDate(e.target.value)}
          required
        />
        <input
          type="time"
          value={rideTime}
          onChange={(e) => setRideTime(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Start Point"
          value={startPoint}
          onChange={(e) => setStartPoint(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="End Point"
          value={endPoint}
          onChange={(e) => setEndPoint(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Number of Seats Available"
          value={noOfSeats}
          onChange={(e) => {setNoOfSeats(e.target.value);setAvailableSeats(e.target.value)}}
          min="1"
          required
        />
        <input
          type="number"
          placeholder="Cost per Seat"
          value={costPerSeat}
          onChange={(e) => setCostPerSeat(e.target.value)}
          min="0"
          step="0.01"
          required
        />
        <div className="pet-allowance">
          <label>Pets Allowed:</label>
          <select
            value={petAllowed}
            onChange={(e) => setPetAllowed(e.target.value)}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Ride"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default CreateRide;
