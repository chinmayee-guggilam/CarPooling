import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { generateChatId } from "../utils";
import { getDatabase, ref, get, set, push } from "firebase/database";
import { jsPDF } from "jspdf";
import "../styles/RideDetails.css";

const RideDetails = ({ userId }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [ride, setRide] = useState(null);
  const [numSeats, setNumSeats] = useState(1);
  const [showModal, setShowModal] = useState(false); // State for showing booking modal
  const [showReceiptPrompt, setShowReceiptPrompt] = useState(false); // Show receipt prompt
  const { rideId } = useParams(); // Get ride ID from URL
  const db = getDatabase();
  const currentUserId = userId || (user ? user.uid : null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      const rideRef = ref(db, `rides/${rideId}`);
      const rideSnapshot = await get(rideRef);

      if (rideSnapshot.exists()) {
        const rideData = { id: rideId, ...rideSnapshot.val() };
        setRide(rideData);
      } else {
        console.log("Ride not found");
      }
    };

    fetchRideDetails();
  }, [db, rideId]);

  const handleBookRide = () => {
    setShowModal(true); // Show the modal when the "Book Now" button is clicked
  };

  const handleConfirmBooking = async () => {
    if (numSeats > ride.noOfSeats || numSeats <= 0) {
      alert("Invalid number of seats.");
      return;
    }

    if (!currentUserId) {
      alert("User not authenticated!");
      return;
    }

    if (currentUserId === ride.userId) {
      alert("You cannot book your own ride.");
      return;
    }

    const userRef = ref(db, `users/${currentUserId}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      const currentUserData = userSnapshot.val();

      if (!currentUserData || !currentUserData.username) {
        alert("Your username is not available. Please update your profile.");
        return;
      }

      // Update ride details
      const updatedSeats = ride.noOfSeats - numSeats;
      const rideRef = ref(db, `rides/${ride.id}`);
      const updatedRideData = { ...ride, noOfSeats: updatedSeats };
      await set(rideRef, updatedRideData);

      // Add booking details to user and ride creator nodes
      const userRidesRef = ref(db, `users/${currentUserId}/myRides/${ride.id}`);
      const rideBookingData = {
        source: ride.source,
        destination: ride.destination,
        rideDate: ride.rideDate,
        rideTime: ride.rideTime,
        seatsBooked: numSeats,
        status: "Pending",
        userName: currentUserData.username,
      };
      await set(userRidesRef, rideBookingData);

      if (ride.userId) {
        const rideCreatorRef = ref(db, `users/${ride.userId}/myCreations/${ride.id}`);
        const creatorBookingData = {
          ...ride,
          soldSeats: (ride.soldSeats || 0) + numSeats,
          bookings: {
            ...ride.bookings,
            [currentUserId]: { userName: currentUserData.username, seatsBooked: numSeats },
          },
        };
        await set(rideCreatorRef, creatorBookingData);

        // Add default message in chat
        const chatId = generateChatId(currentUserId, ride.userId);
        const messagesRef = ref(db, `chats/${chatId}/messages`);
        const newMessageRef = push(messagesRef);

        const defaultMessage = `Hi ${ride.userName || "Ride Creator"}, I booked ${numSeats} seats for your ride from ${ride.source} to ${ride.destination} on ${ride.rideDate}. Looking forward to the journey!`;
      
        const newMessageData = {
          senderId: currentUserId,
          content: defaultMessage,
          timestamp: Date.now(),
          read: false,
        };

        await set(newMessageRef, newMessageData);
      }

      alert("Booking Confirmed!");
      setShowModal(false); // Close the modal
      setShowReceiptPrompt(false); // Show the receipt prompt
    } else {
      alert("User data not found.");
    }
  };

  const handleDownloadReceipt = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Ride Booking Receipt", 10, 20);
    doc.setFontSize(12);
    doc.text(`Ride Name: ${ride.source} → ${ride.destination}`, 10, 30);
    doc.text(`Date: ${ride.rideDate}`, 10, 40);
    doc.text(`Time: ${ride.rideTime}`, 10, 50);
    doc.text(`Seats Booked: ${numSeats}`, 10, 60);
    doc.text(`Cost Per Seat: ${ride.costPerSeat}`, 10, 70);
    doc.text(`Total Cost: ${numSeats * ride.costPerSeat}`, 10, 80);
    doc.text("Thank you for booking!", 10, 100);
    doc.save(`${ride.id}.pdf`);
    setShowReceiptPrompt(false); // Close the receipt prompt
  };

  const handleChatWithCreator = () => {
    if (!currentUserId || !ride.userId) {
      console.error("User is not authenticated or ride data is missing.");
      return;
    }

    const chatId = generateChatId(currentUserId, ride.userId); // Ensure this function is accurate
    navigate(`/dashboard/chat/${chatId}`);
  };

  return (
    <div className="ride-details-page">
      {ride ? (
        <div className="ride-details-content">
          <h2>Ride Details</h2>
          <p><strong>Pickup:</strong> {ride.source}</p>
          <p><strong>Drop:</strong> {ride.destination}</p>
          <p><strong>Date:</strong> {ride.rideDate}</p>
          <p><strong>Time:</strong> {ride.rideTime}</p>
          <p><strong>Seats Available:</strong> {ride.noOfSeats || 0}</p>
          <p><strong>Cost per Seat:</strong> {ride.costPerSeat}</p>

          <div className="booking-section">
            <button className="book-now-btn" onClick={handleBookRide}>Book Now</button>
            <button className="chat-now-btn" onClick={handleChatWithCreator}>Chat with Creator</button>
          </div>
        </div>
      ) : (
        <p>Loading ride details...</p>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>How many seats do you want to book?</h3>
            <input
              type="number"
              value={numSeats}
              onChange={(e) => setNumSeats(Number(e.target.value))}
              min="1"
              max={ride.noOfSeats || 0}
            />
            <div className="modal-buttons">
              <button
                onClick={handleConfirmBooking}
                disabled={numSeats > ride.noOfSeats || numSeats <= 0}
              >
                Confirm Booking
              </button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showReceiptPrompt && (
        <div className="modal">
          <div className="modal-content">
            <h3>Do you want to download the receipt?</h3>
            <div className="modal-buttons">
              <button onClick={handleDownloadReceipt}>Yes</button>
              <button onClick={() => setShowReceiptPrompt(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideDetails;
