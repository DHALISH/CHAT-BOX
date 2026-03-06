import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ChatPage.css";

function ChatPage() {
  const { id } = useParams();
  const receiverId = id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("access");
  const currentUser = localStorage.getItem("username");
  

  useEffect(() => {
    fetchUser();
    fetchMessages();
  }, [receiverId]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/user/${receiverId}/`, {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch user");
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/messages/${receiverId}/`,
        {
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch messages");
        setMessages([]);
        return;
      }

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (text.trim() === "") return;

    try {
      const response = await fetch("http://127.0.0.1:8000/send-message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          receiver: receiverId,
          text: text,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        {user && user.username && (
          <div className="chat-user">
            <div className="chat-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="chat-username">{user.username}</div>
          </div>
        )}
      </div>

      <div className="messages">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isSender = msg.sender_username === currentUser;
            return (
              <div
                key={msg.id}
                className={`message-row ${isSender ? "right" : "left"}`}
              >
                <div
                  className={`message-bubble ${isSender ? "sent" : "received"}`}
                >
                  {msg.text}
                  {isSender && (
                    <div className="seen-status">
                      {msg.seen ? "✓✓ Seen" : "✓ Sent"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ textAlign: "center", color: "gray" }}>No messages yet</p>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatPage;