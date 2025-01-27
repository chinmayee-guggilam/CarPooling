import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "../styles/ChatList.css";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const db = getDatabase();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    // Fetch all user names and profile photos
    const usersRef = ref(db, "users");
    onValue(
      usersRef,
      (snapshot) => {
        const usersData = snapshot.val();
        if (usersData) {
          setUserNames(usersData);
        } else {
          setError("Failed to load user data.");
        }
      },
      (error) => {
        setError("Failed to load user data.");
        setLoading(false);
      }
    );

    // Fetch the chat list and calculate unread counts
    const chatsRef = ref(db, "chats");
    onValue(
      chatsRef,
      (snapshot) => {
        const chatData = snapshot.val();
        if (chatData) {
          const userChats = Object.keys(chatData).filter((chatId) => {
            const [user1, user2] = chatId.split("_");
            return user1 === currentUserId || user2 === currentUserId;
          });

          const chatsWithUnreadCounts = userChats.map((chatId) => {
            const messages = Object.values(chatData[chatId].messages || {});
            const unreadCount = messages.filter(
              (msg) => msg.senderId !== currentUserId && !msg.read
            ).length;

            return {
              id: chatId,
              ...chatData[chatId],
              unreadCount,
            };
          });

          setChats(chatsWithUnreadCounts);
        } else {
          setChats([]);
        }
        setLoading(false);
      },
      (error) => {
        setError("Failed to load chats.");
        setLoading(false);
      }
    );
  }, [db, currentUserId, navigate]);

  const handleOpenChat = (chatId) => {
    navigate(`/dashboard/chat/${chatId}`);
  };

  const getChatPartnerDetails = (chatId) => {
    const [user1, user2] = chatId.split("_");
    const partnerId = user1 === currentUserId ? user2 : user1;
    const partnerData = userNames[partnerId];
    return {
      username: partnerData?.username || "Unknown User",
      profilePhoto:
        partnerData?.profilePhoto ||
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s",
    };
  };

  return (
    <div className="chat-list">
      <h2>Your Chats</h2>
      {loading ? (
        <p>Loading chats...</p>
      ) : error ? (
        <p>{error}</p>
      ) : chats.length > 0 ? (
        <ul className="chat-list-items">
          {chats.map((chat) => {
            const { username, profilePhoto } = getChatPartnerDetails(chat.id);
            const lastMessage = chat.lastMessage;
            const unreadCount = chat.unreadCount;

            const messageContent =
              typeof lastMessage === "object"
                ? lastMessage.content
                : lastMessage;

            return (
              <li
                key={chat.id}
                className={`chat-item ${unreadCount > 0 ? "unread" : ""}`}
                onClick={() => handleOpenChat(chat.id)}
              >
                <img
                  src={profilePhoto}
                  alt={`${username}'s profile`}
                  className="chat-profile-photo"
                />
                <div className="chat-details">
                  <h3 className="chat-username">{username}</h3>
                  <p className="chat-last-message">
                    {messageContent || "Start the conversation!"}
                  </p>
                  {unreadCount > 0 && (
                    <div className="unread-count">{unreadCount}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No chats available.</p>
      )}
    </div>
  );
};

export default ChatList;
