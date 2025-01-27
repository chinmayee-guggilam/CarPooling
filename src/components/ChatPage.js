import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, push, update, set, get } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db } from "../firebase"; // Firebase config and initialization
import { generateChatId } from "../utils"; // Utility function to generate chat IDs
import "../styles/ChatPage.css";

const ChatPage = () => {
  const { chatId: paramChatId } = useParams(); // Chat ID from URL params
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatPartner, setChatPartner] = useState({});
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const messagesEndRef = useRef(null); // Reference to scroll to the latest message
  const currentUserId = auth.currentUser?.uid;
  const [chatId, setChatId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId) {
      console.error("User is not authenticated.");
      return;
    }

    const [user1, user2] = paramChatId.split("_"); // Parse user IDs from URL chatId
    const calculatedChatId = generateChatId(user1, user2);
    setChatId(calculatedChatId);

    // Fetch chat partner data
    const usersRef = ref(db, "users");
    onValue(
      usersRef,
      (snapshot) => {
        const usersData = snapshot.val();
        const partnerId = user1 === currentUserId ? user2 : user1;
        if (usersData && usersData[partnerId]) {
          setChatPartner(usersData[partnerId]); // Set chat partner data
        }
      },
      () => setError("Failed to load user data.")
    );

    // Fetch messages and mark as read
    const messagesRef = ref(db, `chats/${calculatedChatId}/messages`);
    onValue(
      messagesRef,
      (snapshot) => {
        const messagesData = snapshot.val();
        if (messagesData) {
          const messagesList = Object.entries(messagesData).map(([id, data]) => ({
            id,
            ...data,
          }));
          setMessages(messagesList);

          // Mark unread messages as read
          const updates = {};
          messagesList.forEach((message) => {
            if (message.senderId !== currentUserId && !message.read) {
              updates[`${message.id}/read`] = true;
            }
          });

          if (Object.keys(updates).length > 0) {
            update(messagesRef, updates).catch(() =>
              setError("Failed to mark messages as read.")
            );
          }
        } else {
          setMessages([]);
        }
      },
      () => setError("Failed to load messages.")
    );

    // Reset unread count for the current user
    const participantRef = ref(
      db,
      `chats/${calculatedChatId}/participants/${currentUserId}`
    );
    update(participantRef, { unreadCount: 0 }).catch(() =>
      setError("Failed to reset unread count.")
    );
  }, [paramChatId, currentUserId]);

  useEffect(() => {
    // Scroll to the latest message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content, type = "text") => {
    if (!content || !currentUserId || !chatId) return;

    if (type === "text" && content.trim().length > 500) {
      alert("Message is too long. Please limit to 500 characters.");
      return;
    }

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);

    const newMessageData = {
      senderId: currentUserId,
      content,
      type,
      timestamp: Date.now(),
      read: false, // Mark message as unread initially
    };

    await set(newMessageRef, newMessageData);

    // Increment unread count for the chat partner
    const participantRef = ref(
      db,
      `chats/${chatId}/participants/${chatPartner.userId}`
    );
    const participantSnapshot = await get(participantRef);
    const unreadCount = (participantSnapshot.val()?.unreadCount || 0) + 1;

    const chatUpdates = {
      [`chats/${chatId}/lastMessage`]: newMessageData,
      [`chats/${chatId}/lastUpdated`]: newMessageData.timestamp,
      [`chats/${chatId}/participants/${chatPartner.userId}/unreadCount`]:
        unreadCount,
    };

    await update(ref(db), chatUpdates);
    setNewMessage("");
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        uploadAudio(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (audioBlob) => {
    if (!audioBlob) return;

    if (!chatId) {
      alert("Chat ID is not available. Please try again later.");
      return;
    }

    const storage = getStorage();
    const audioRef = storageRef(storage, `chats/${chatId}/${Date.now()}.webm`);

    try {
      await uploadBytes(audioRef, audioBlob);
      const downloadURL = await getDownloadURL(audioRef);
      sendMessage(downloadURL, "audio");
    } catch (error) {
      console.error("Failed to upload audio:", error);
      alert("Failed to send the voice message.");
    }
  };

  const goToProfile = () => {
    if (chatPartner && chatPartner.userId) {
      navigate(`/dashboard/profile/${chatPartner.userId}`);
      console.log("Chat Partner ID:", chatPartner.userId); // Navigate to the profile of the chat partner
    } else {
      console.error("Chat partner user ID is not available.");
    }
  };

  return (
    <div className="chat-page-container">
      <div className="chat-page-root">
        {/* Chat header */}
        <div className="chat-header" onClick={goToProfile}>
          <button className="back-button" onClick={() => navigate("/dashboard/chats")}>
            &#8592; {/* Back arrow icon */}
          </button>
          <img
            src={
              chatPartner.profilePhoto ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
            }
            alt={`${chatPartner.username || "Unknown User"}'s profile`}
          />
          <span className="username">{chatPartner.username || "Unknown User"}</span>
        </div>

        {/* Messages container */}
        <div className="messages">
          {error && <div className="error">{error}</div>}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg.senderId === currentUserId ? "sent" : "received"
              }`}
            >
              {msg.type === "audio" ? (
                <audio controls src={msg.content} />
              ) : (
                <p>{msg.content}</p>
              )}
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="message-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button onClick={() => sendMessage(newMessage, "text")}>Send</button>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            className={isRecording ? "recording" : ""}
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
