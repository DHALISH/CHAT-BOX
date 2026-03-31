import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationPage.css";

function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const token = localStorage.getItem("access");
  const ws = useRef(null);

  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    const handleClickOutside = (event) => {
      if (!event.target.closest(".options-wrapper")) {
        setShowMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      if (ws.current) ws.current.close();
      document.removeEventListener("click", handleClickOutside);
    };
  }, [token]);

  const fetchNotifications = () => {
    fetch("http://127.0.0.1:8000/friend-requests/mark-seen/", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }).catch((err) => console.log(err));

    fetch("http://127.0.0.1:8000/friend-requests/", {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const received = data.received.map((r) => ({
          id: r.id,
          username: r.sender_username,
          type: "received",
          created_at: r.created_at,
        }));

        const sent = data.sent.map((r) => ({
          id: r.id,
          username: r.receiver_username,
          type: "sent",
          created_at: r.created_at,
        }));

        const all = [...received, ...sent].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setNotifications(all);
      })
      .catch((err) => console.log(err));
  };

  const connectWebSocket = () => {
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);
    ws.current.onmessage = () => fetchNotifications();
    ws.current.onclose = () => setTimeout(connectWebSocket, 1000);
  };

  const acceptRequest = (id) => {
    fetch(`http://127.0.0.1:8000/friend-request/${id}/accept/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
    }).then(() => {
      setNotifications(notifications.filter((n) => n.id !== id));
    });
  };

  const rejectRequest = (id) => {
    fetch(`http://127.0.0.1:8000/friend-request/${id}/reject/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
    }).then(() => {
      setNotifications(notifications.filter((n) => n.id !== id));
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <header className="chat-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate("/home")}>
            ←
          </button>
          <h1 className="chat-title">Notifications</h1>
        </div>

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
                onClick={() => navigate("/home")}
              >
                🏠 Home
              </div>

              <div
                className="dropdown-item"
                onClick={() => navigate("/profile")}
              >
                👤 Profile
              </div>

              <div className="dropdown-item" onClick={handleLogout}>
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </header>

      {/* NOTIFICATIONS */}
      <div className="chat-body">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="notification-item">
              <div className="notification-avatar">
                {n.username.charAt(0).toUpperCase()}
              </div>

              <div className="notification-content">
                <div className="notification-text">
                  {n.type === "received" ? (
                    <span>
                      <b>{n.username}</b> sent you a friend request
                    </span>
                  ) : (
                    <span>
                      You sent a friend request to <b>{n.username}</b>
                    </span>
                  )}
                </div>
                <div className="notification-time">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>

              <div className="notification-actions">
                {n.type === "received" ? (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() => acceptRequest(n.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => rejectRequest(n.id)}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <div className="pending-badge">Pending</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <button className="chat-fab" onClick={() => navigate("/search")}>
        +
      </button>
    </div>
  );
}

export default NotificationPage;