import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, remove, update, onValue } from "firebase/database";
import { useOutletContext } from "react-router-dom"; // Import useOutletContext
import jsPDF from "jspdf"; // Import jsPDF
import autoTable from "jspdf-autotable"; // Import autoTable plugin for tables
import "../styles/TimeLine.css";

const TimeLine = () => {
  const { userId } = useOutletContext(); // Get userId from Outlet context
  const [myRides, setMyRides] = useState([]);

  useEffect(() => {
    if (!userId) {
      console.log("No user ID provided");
      return;
    }

    const db = getDatabase();
    const myRidesRef = ref(db, `users/${userId}/myRides`);

    const unsubscribe = onValue(myRidesRef, (snapshot) => {
      console.log("Snapshot data:", snapshot.val());

      if (snapshot.exists()) {
        const rides = [];
        const now = new Date();

        snapshot.forEach((childSnapshot) => {
          const ride = { id: childSnapshot.key, ...childSnapshot.val() };
          console.log("Ride data:", ride);

          const rideDateTime = new Date(`${ride.rideDate}T${ride.rideTime}`);
          const status = rideDateTime < now ? "Completed" : "Pending";
          rides.push({ ...ride, status });
        });

        setMyRides(rides);
        console.log("My Rides updated:", rides);
      } else {
        console.log("No rides found for the user.");
        setMyRides([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDelete = async (rideId) => {
    try {
      const db = getDatabase();
      const rideRef = ref(db, `rides/${rideId}`);
      const rideSnapshot = await get(rideRef);

      if (rideSnapshot.exists()) {
        const rideData = rideSnapshot.val();
        const availableSeats = isNaN(Number(rideData.availableSeats)) ? 0 : Number(rideData.availableSeats);
        const bookedSeats = isNaN(Number(rideData.seatsBooked)) ? 0 : Number(rideData.seatsBooked);

        const updatedSeats = availableSeats + bookedSeats;
        await update(rideRef, { availableSeats: updatedSeats, seatsBooked: rideData.noOfSeats - rideData.availableSeats });
        console.log(updatedSeats);

        const userRideRef = ref(db, `users/${userId}/myRides/${rideId}`);
        await remove(userRideRef);

        setMyRides((prevRides) => prevRides.filter((ride) => ride.id !== rideId));

        alert("Booking canceled successfully.");
      } else {
        alert("Ride not found.");
      }
    } catch (error) {
      console.error("Error canceling the ride:", error);
      alert("Failed to cancel the booking. Please try again.");
    }
  };

  const handleDownloadPDF = (ride) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Carpooling Ride Receipt", 14, 20);

    // Subheader
    doc.setFontSize(12);
    doc.text("Thank you for choosing our carpooling service.", 14, 30);
    doc.text("Here are the details of your ride:", 14, 40);

    // Table Content
    const tableData = [
      ["Source", ride.source],
      ["Destination", ride.destination],
      ["Date", ride.rideDate],
      ["Time", ride.rideTime],
      ["Seats Booked", ride.seatsBooked],
      ["Status", ride.status],
    ];

    // Using autoTable for tabular format
    autoTable(doc, {
      head: [["Field", "Details"]],
      body: tableData,
      startY: 50,
    });

    // Footer
    doc.setFontSize(10);
    doc.text("We appreciate your trust in our service.", 14, doc.lastAutoTable.finalY + 20);

    // Trigger the download
    doc.save(`Ride_Receipt_${ride.id}.pdf`);
  };

  return (
    <div className="my-rides-container">
      <h2>My journey in carpooling</h2>
      {myRides.length === 0 ? (
        <p>No rides booked yet.</p>
      ) : (
        <table className="my-rides-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Date</th>
              <th>Time</th>
              <th>No. of Seats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myRides.map((ride) => (
              <tr key={ride.id}>
                <td>{ride.source}</td>
                <td>{ride.destination}</td>
                <td>{ride.rideDate}</td>
                <td>{ride.rideTime}</td>
                <td>{ride.seatsBooked}</td>
                <td className={ride.status.toLowerCase()}>{ride.status}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(ride.id)}
                  >
                    Cancel
                  </button>
                  <button
                    className="receipt-button"
                    onClick={() => handleDownloadPDF(ride)}
                  >
                    Download Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TimeLine;
