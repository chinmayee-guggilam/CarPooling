import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, update, remove } from "firebase/database";
import "../styles/MyCreations.css";

const MyCreations = () => {
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editedRide, setEditedRide] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userInfo, setUserInfo] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const db = getDatabase();
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetching the user's created rides
  useEffect(() => {
    const fetchRides = async () => {
      try {
        const ridesRef = ref(db, `users/${user.uid}/myCreations`);
        const ridesSnapshot = await get(ridesRef);

        if (ridesSnapshot.exists()) {
          const ridesList = [];
          ridesSnapshot.forEach((childSnapshot) => {
            const ride = { id: childSnapshot.key, ...childSnapshot.val() };
            ridesList.push(ride);
          });
          setRides(ridesList);
        } else {
          console.log("No rides found for the user.");
        }
      } catch (error) {
        console.error("Error fetching rides:", error);
      }
    };

    fetchRides();
  }, [user.uid]);

  // Handle editing of the ride (open the edit popup)
  const handleEditRide = (ride) => {
    setSelectedRide(ride);
    setEditedRide({ ...ride });
    setShowEditPopup(true);
  };

  // Handle the ride update form submission
  const handleUpdateRide = async () => {
    if (editedRide.noOfSeats < (selectedRide.soldSeats || 0)) {
      alert("The number of seats cannot be less than the seats already sold.");
      return;
    }

    try {
      // Update the user's creation ride details
      const rideRef = ref(db, `users/${user.uid}/myCreations/${selectedRide.id}`);
      await update(rideRef, editedRide);

      // Update the general ride details (rides/{rideId})
      const generalRideRef = ref(db, `rides/${selectedRide.id}`);
      await update(generalRideRef, {
        noOfSeats: editedRide.noOfSeats,
        availableSeats: editedRide.noOfSeats - (editedRide.soldSeats || 0), // Recalculate available seats
      });

      alert("Ride updated successfully!");
      setShowEditPopup(false);

      // Update the local state to modify the existing row
      setRides((prevRides) =>
        prevRides.map((ride) =>
          ride.id === selectedRide.id ? { ...ride, ...editedRide } : ride
        )
      );

      setSelectedRide(null);
      setEditedRide(null);
    } catch (error) {
      console.error("Error updating ride:", error);
      alert("Failed to update ride.");
    }
  };

  // Handle deleting the ride
  const handleDeleteRide = (ride) => {
    setSelectedRide(ride);
    setShowDeleteConfirmation(true);
  };

  // Confirm ride deletion
  const confirmDelete = async () => {
    if (selectedRide) {
      try {
        const rideRef = ref(db, `users/${user.uid}/myCreations/${selectedRide.id}`);
        await remove(rideRef);

        const generalRideRef = ref(db, `rides/${selectedRide.id}`);
        await remove(generalRideRef);

        alert("Ride deleted!");
        setRides((prevRides) => prevRides.filter((ride) => ride.id !== selectedRide.id));
        setShowDeleteConfirmation(false);
        setSelectedRide(null);
      } catch (error) {
        console.error("Error deleting ride:", error);
        alert("Failed to delete ride.");
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setSelectedRide(null);
  };

  // Show user booking information
  const handleShowUserInfo = (ride) => {
    const bookings = ride.bookings ? Object.values(ride.bookings) : [];
    setUserInfo(bookings);
    setShowUserInfo(true);
  };

  return (
    <div className="my-creations">
      <h1>My Created Rides</h1>

      {rides.length === 0 ? (
        <p>You have not created any rides yet.</p>
      ) : (
        <div className="table-container">
          <table className="rides-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Destination</th>
                <th>Date</th>
                <th>Time</th>
                <th>No. of Seats</th>
                <th>Seats Sold</th>
                <th>Available Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((ride) => (
                <tr key={ride.id}>
                  <td>{ride.source}</td>
                  <td>{ride.destination}</td>
                  <td>{ride.rideDate}</td>
                  <td>{ride.rideTime}</td>
                  <td>{ride.noOfSeats}</td>
                  <td>{ride.soldSeats || 0}</td>
                  <td>{ride.noOfSeats - (ride.soldSeats || 0)}</td>
                  <td>
                    <button onClick={() => handleEditRide(ride)}>Edit</button>
                    <button onClick={() => handleDeleteRide(ride)}>Delete</button>
                    <button onClick={() => handleShowUserInfo(ride)}>Show Info</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUserInfo && (
        <div className="user-info">
          <h3>Users Who Booked Seats</h3>
          {userInfo.length > 0 ? (
            <ul>
              {userInfo.map((booking, index) => (
                <li key={index}>
                  {booking.userName} - {booking.seatsBooked} seat(s)
                </li>
              ))}
            </ul>
          ) : (
            <p>No users have booked seats yet.</p>
          )}
          <button onClick={() => setShowUserInfo(false)} className="close-btn">
            Close
          </button>
        </div>
      )}

      {showDeleteConfirmation && (
        <div className="delete-confirmation">
          <div className="confirmation-box">
            <h3>Are you sure you want to delete this ride permanently?</h3>
            <div className="confirmation-buttons">
              <button onClick={confirmDelete} className="confirm-btn">
                Yes
              </button>
              <button onClick={cancelDelete} className="cancel-btn">
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div className="edit-form">
          <h3>Edit Ride</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Source:</label>
              <input
                type="text"
                value={editedRide.source}
                onChange={(e) =>
                  setEditedRide({ ...editedRide, source: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Destination:</label>
              <input
                type="text"
                value={editedRide.destination}
                onChange={(e) =>
                  setEditedRide({ ...editedRide, destination: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={editedRide.rideDate}
                onChange={(e) =>
                  setEditedRide({ ...editedRide, rideDate: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Time:</label>
              <input
                type="time"
                value={editedRide.rideTime}
                onChange={(e) =>
                  setEditedRide({ ...editedRide, rideTime: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>No. of Seats:</label>
              <input
                type="number"
                value={editedRide.noOfSeats}
                onChange={(e) =>
                  setEditedRide({
                    ...editedRide,
                    noOfSeats: Math.max(
                      Number(e.target.value),
                      selectedRide.soldSeats || 0
                    ),
                  })
                }
                min={selectedRide.soldSeats || 0}
              />
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleUpdateRide}>Save Changes</button>
            <button className="cancel-btn" onClick={() => setShowEditPopup(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCreations;
