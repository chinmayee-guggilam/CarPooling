import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";
import "../styles/ChatButton.css";

const ChatButton = ({ currentUserId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId) {
      console.error("User ID is missing.");
      return;
    }

    // Reference to all chats for the current user
    const chatsRef = ref(db, `chats`);
    const calculateUnreadCount = (snapshot) => {
      const chats = snapshot.val();
      if (!chats) {
        setUnreadCount(0);
        return;
      }

      let totalUnread = 0;

      // Iterate through all chats
      Object.values(chats).forEach((chat) => {
        if (chat.messages) {
          Object.values(chat.messages).forEach((message) => {
            // Check if the message is unread and not sent by the current user
            if (!message.read && message.senderId !== currentUserId) {
              totalUnread += 1;
            }
          });
        }
      });

      setUnreadCount(totalUnread);
    };

    const unsubscribe = onValue(chatsRef, calculateUnreadCount);

    return () => unsubscribe();
  }, [currentUserId]);

  const handleClick = () => {
    navigate("/dashboard/chats"); // Navigate to ChatList component
  };

  return (
    <div className="chat-button-container">
      <div className="chat-button" onClick={handleClick}>
        Chat Here
      </div>
      {unreadCount > 0 && (
        <div className="unread-count">
          {unreadCount}
        </div>
      )}
    </div>
  );
};

export default ChatButton;
