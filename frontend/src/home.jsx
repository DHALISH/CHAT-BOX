import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

const ChatList = () => {
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [users, setUsers] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);

  const navigate = useNavigate();
  const ws = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      navigate("/");
      return;
    }

    let cancelled = false;

    const fetchFriends = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/home-friends/", {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching friends:", error);
        if (!cancelled) setUsers([]);
      }
    };

    const fetchUnseenNotifications = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/friend-requests/unseen/",
          {
            method: "GET",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        if (!cancelled) setUnseenCount(data.count || 0);
      } catch (error) {
        console.error("Error fetching unseen notifications:", error);
      }
    };

    fetchFriends();
    fetchUnseenNotifications();

    /* ---------- WEBSOCKET ---------- */
    console.log("Attempting WebSocket connection with token:", token ? "Token exists" : "No token");
    const socketUrl = `ws://127.0.0.1:8000/ws/notifications/?token=${token}`;
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      if (cancelled) {
        socket.close();
        return;
      }
      console.log("Notification WebSocket connected");
    };

    socket.onmessage = (event) => {
      if (cancelled) return;
      const data = JSON.parse(event.data);
      console.log("Notification:", data);

      if (data.type === "new_message" || data.type === "seen_update") {
        fetchFriends();
      }

      if (data.type === "friend_request") {
        fetchUnseenNotifications();
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      console.error("Error details:", error.type, error.event);
    };

    socket.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
    };

    ws.current = socket;

    return () => {
      cancelled = true;
      socket.close();
    };
  }, [navigate]);

  /* ---------- SEARCH FILTER ---------- */
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------- HANDLERS ---------- */
  const goToSearch = () => navigate("/search");

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <header className="chat-header">
        <div className="header-top">
          <h1 className="chat-title">ChatBox</h1>

          <div className="header-icons">
            {/* SEARCH */}
            <div className="chat-search">
              <input
                type="text"
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* NOTIFICATION */}
            <div
              className="notification-icon"
              onClick={() => navigate("/notification")}
            >
              🔔
              {unseenCount > 0 && (
                <span className="notification-badge">{unseenCount}</span>
              )}
            </div>

            {/* OPTIONS */}
            <div className="options-wrapper">
              <button
                className="options-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                ⋮
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <div
                    className="dropdown-item"
                    onClick={() => navigate("/profile")}
                  >
                    👤 Profile
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => navigate("/support")}
                  >
                    📇 Contact
                  </div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    🚪 Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CHAT LIST */}
      <div className="chat-body">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="chat-item"
              onClick={() => navigate(`/chat/${user.id}`)}
            >
              <div className="avatar">
                {user.username.charAt(0).toUpperCase()}
                {user.unseen_count > 0 && (
                  <span className="chat-badge">{user.unseen_count}</span>
                )}
              </div>

              <div className="chat-info">
                <h4>{user.username}</h4>
                <p>
                  {user.unseen_count > 0
                    ? "New message"
                    : user.last_message || "No messages yet"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-result">No friends yet</p>
        )}
      </div>

      <button className="chat-fab" onClick={goToSearch}>
        +
      </button>
    </div>
  );
};

export default ChatList;
