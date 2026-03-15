import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ChatPage.css";

function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const receiverId = id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);

  const token = localStorage.getItem("access");
  const currentUser = localStorage.getItem("username");

  const ws = useRef(null);
  const pollInterval = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchUser();
    fetchMessages();
    fetchCurrentUser();
  }, [receiverId]);

  useEffect(() => {
    if (currentUserId && receiverId) {
      // Ensure we don't have an old socket open when switching chats
      if (ws.current) ws.current.close();

      connectWebSocket();
      pollInterval.current = setInterval(fetchMessages, 1500);
    }

    return () => {
      if (ws.current) ws.current.close();
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [currentUserId, receiverId]);

  /* ---------------- SCROLL LOGIC ---------------- */

  const isUserAtBottom = () => {
    const container = containerRef.current;
    if (!container) return true;

    return (
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 50
    );
  };

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  };

  const handleScroll = () => {
    if (isUserAtBottom()) {
      setShowNewMsgBtn(false);
    }
  };

  const updateMessages = (newMessages) => {
    const shouldScroll = isUserAtBottom();

    setMessages(newMessages);

    if (shouldScroll) {
      setTimeout(scrollToBottom, 100);
    } else {
      setShowNewMsgBtn(true);
    }
  };

  /* ---------------- API CALLS ---------------- */

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/profile/", {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();
      setCurrentUserId(data.id);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/user/${receiverId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/messages/${receiverId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        updateMessages(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* ---------------- WEBSOCKET ---------------- */

  const connectWebSocket = () => {
    const user1 = Math.min(currentUserId, parseInt(receiverId));
    const user2 = Math.max(currentUserId, parseInt(receiverId));

    const socketUrl = `ws://127.0.0.1:8000/ws/chat/${user1}/${user2}/`;

    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected", socketUrl);
    };

    ws.current.onclose = (event) => {
      console.warn("WebSocket closed", event);
      // If we closed unexpectedly, try reconnecting after a delay.
      if (event.code !== 1000) {
        setTimeout(() => {
          if (currentUserId && receiverId) connectWebSocket();
        }, 2000);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        setMessages((prev) => {
          const next = [...prev, data.message];
          const shouldScroll = isUserAtBottom();

          if (shouldScroll) {
            setTimeout(scrollToBottom, 100);
          } else {
            setShowNewMsgBtn(true);
          }

          return next;
        });
      }

      if (data.type === "seen_update") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id ? { ...msg, seen: true } : msg
          )
        );
      }
    };
  };

  /* ---------------- SEND MESSAGE ---------------- */

  const sendMessage = async () => {
    if (!text.trim()) return;

    const messageText = text;
    setText("");

    try {
      await fetch("http://127.0.0.1:8000/send-message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          receiver: receiverId,
          text: messageText,
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="chat-page">

      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate("/home")}>
          ←
        </button>

        {user && (
          <div className="header-user-info">
            <div className="chat-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="chat-username">
              {user.username}
            </span>
          </div>
        )}
      </div>

      <div
        className="messages-container"
        ref={containerRef}
        onScroll={handleScroll}
      >

        {messages.length === 0 && (
          <div className="empty-chat-placeholder">
            <p>Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isSender = msg.sender_username === currentUser;

          return (
            <div
              key={msg.id}
              className={`message-row ${isSender ? "sent" : "received"}`}
            >
              <div className="message-bubble">

                <p className="message-text">{msg.text}</p>

                {isSender && (
                  <div className="message-status">
                    {msg.seen ? "✓✓ Seen" : "✓ Sent"}
                  </div>
                )}

              </div>
            </div>
          );
        })}

      </div>

      {showNewMsgBtn && (
        <button
          className="new-msg-btn"
          onClick={() => {
            scrollToBottom();
            setShowNewMsgBtn(false);
          }}
        >
          New Messages ↓
        </button>
      )}

      <div className="chat-input-area">

        <input
          type="text"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage} disabled={!text.trim()}>
          Send
        </button>

      </div>

    </div>
  );
}

export default ChatPage;