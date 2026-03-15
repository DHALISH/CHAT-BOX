import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationPage.css";

function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("access");
  const ws = useRef(null);

  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [token]);

  const fetchNotifications = () => {
    // Mark notifications as seen when page opens
    fetch("http://127.0.0.1:8000/friend-requests/mark-seen/", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }).catch((err) => console.log(err));

    // Fetch notifications
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
    ws.current.onopen = () => {
      console.log("WebSocket connected to notifications");
    };
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "friend_request" || data.type === "friend_request_accepted" || data.type === "friend_request_rejected" || data.type === "friend_request_canceled") {
        // Refresh notifications when friend request status changes
        fetchNotifications();
      }
    };
    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    ws.current.onclose = () => {
      console.log("WebSocket closed, reconnecting...");
      setTimeout(connectWebSocket, 1000);
    };
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

  const cancelRequest = (id) => {
    fetch(`http://127.0.0.1:8000/friend-request/${id}/cancel/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${token}` },
    }).then(() => {
      setNotifications(notifications.filter((n) => n.id !== id));
    });
  };

  return (
    <div className="notification-container">
      <div className="notification-card">
        {/* Header */}
        <header className="notification-header">
          <h1 className="notification-title">Notifications</h1>
        </header>

        {/* Navigation Bar */}
        <nav className="notification-nav">
          <button onClick={() => navigate("/home")}>🏠 Home</button>
          <button onClick={() => navigate("/profile")}>👤 Profile</button>
          <button onClick={() => navigate("/chat")}>💬 Chats</button>
        </nav>

        {/* Notifications */}
        {notifications.length === 0 ? (
          <p className="empty">No notifications</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="request-item">
              <div className="text">
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

              <div className="actions">
                {n.type === "received" ? (
                  <>
                    <button
                      className="accept"
                      onClick={() => acceptRequest(n.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="reject"
                      onClick={() => rejectRequest(n.id)}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <span className="pending">Pending</span>
                    <button
                      className="cancel"
                      onClick={() => cancelRequest(n.id)}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationPage;