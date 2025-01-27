import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database"; // Realtime Database imports
import "../styles/MyProfile.css";

const MyProfile = ({ userId }) => {  // Accept userId as a prop
  const [userData, setUserData] = useState(null);
  const [editable, setEditable] = useState(false);
  const [updatedData, setUpdatedData] = useState({
    username: "",
    email: "",
    phone: "",
    profilePhoto: "",
    upiDetails: "", // Add UPI details field
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Track loading state
  const [imageFile, setImageFile] = useState(null); // State to hold the selected image
  const [imageURL, setImageURL] = useState(""); // State for profile photo URL (Base64)

  const auth = getAuth();
  const db = getDatabase();

  // Fetch user data when component mounts or when userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      const targetUserId = userId || user?.uid; // Use the passed userId or the current logged-in user's UID
      if (targetUserId) {
        setLoading(true); // Start loading
        try {
          const userRef = ref(db, "users/" + targetUserId); // Get the reference to the user data in Realtime Database
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            setUserData(snapshot.val());
            setUpdatedData({
              username: snapshot.val().username,
              email: snapshot.val().email,
              phone: snapshot.val().phone,
              profilePhoto: snapshot.val().profilePhoto || "", // Default to empty string if not set
              upiDetails: snapshot.val().upiDetails || "", // Default to empty string if not set
            });
            if (snapshot.val().profilePhoto) {
              setImageURL(snapshot.val().profilePhoto); // Set Base64 string if available
            }
          } else {
            setError("No user data found.");
          }
        } catch (error) {
          setError("Error fetching user data.");
        } finally {
          setLoading(false); // Stop loading
        }
      } else {
        setError("User not logged in.");
      }
    };

    fetchUserData();
  }, [auth, db, userId]); // Add userId as a dependency to refetch data when it changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Store the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageURL(reader.result); // Set preview image URL (Base64)
      };
      reader.readAsDataURL(file); // Convert image to Base64
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    const targetUserId = userId || user?.uid; // Use the passed userId or the current logged-in user's UID
    if (targetUserId) {
      setLoading(true); // Start loading while saving
      try {
        const userRef = ref(db, "users/" + targetUserId); // Get the reference to the user data in Realtime Database

        // If an image was selected, convert it to Base64 and update the profilePhoto field
        if (imageFile) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Image = reader.result;
            const updatedUserData = {
              ...updatedData,
              profilePhoto: base64Image, // Add Base64 image to data
            };
            await update(userRef, updatedUserData); // Update user data in Firebase
            setUserData(updatedUserData); // Update local state
            setEditable(false);
          };
          reader.readAsDataURL(imageFile); // Convert to Base64
        } else {
          // If no image was selected, just update text data
          await update(userRef, updatedData);
          setUserData(updatedData); // Update local state
          setEditable(false);
        }
      } catch (error) {
        setError("Error updating user data.");
      } finally {
        setLoading(false); // Stop loading
      }
    }
  };

  return (
    <div className="my-profile">
      <div className="profile-container">
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : userData ? (
          <div className="profile-info">
            <h1>Profile</h1>
            <div className="profile-field">
              <label>Profile Photo:</label>
              {editable ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              ) : (
                <img
                  src={
                    imageURL ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
                  } // Display placeholder if no image is set
                  alt="Profile"
                  className="profile-photo"
                />
              )}
            </div>
            <div>
              <div className="profile-field">
                <label>Username:</label>
                {editable ? (
                  <input
                    type="text"
                    name="username"
                    value={updatedData.username}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.username}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Email:</label>
                {editable ? (
                  <input
                    type="email"
                    name="email"
                    value={updatedData.email}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.email}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Phone:</label>
                {editable ? (
                  <input
                    type="text"
                    name="phone"
                    value={updatedData.phone}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.phone}</p>
                )}
              </div>
              <div className="profile-field">
                <label>UPI Details:</label>
                {editable ? (
                  <input
                    type="text"
                    name="upiDetails"
                    placeholder="Enter UPI ID (e.g., user@upi)"
                    value={updatedData.upiDetails}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.upiDetails || "Not provided"}</p>
                )}
              </div>
            </div>
            {auth.currentUser?.uid === (userId || auth.currentUser?.uid) && ( // Show Edit button if the current user is viewing their own profile
              <div className="profile-buttons">
                {editable ? (
                  <>
                    <button onClick={handleSave}>Save</button>
                    <button onClick={() => setEditable(false)}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setEditable(true)}>Edit</button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>Loading user data...</p>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
