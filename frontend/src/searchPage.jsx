import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchPage.css";

function SearchPage() {
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [friendRequests, setFriendRequests] = useState({}); 

  const token = localStorage.getItem("token");

  // 🔎 Search users
  const handleSearch = async (value) => {
    setSearch(value);

    if (value.trim() === "") {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:8000/search-user/?username=${value}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data);

      // ✅ preload request status from backend
      const statusMap = {};
      data.forEach((user) => {
        if (user.request_status) {
          statusMap[user.id] = user.request_status;
        }
      });
      setFriendRequests(statusMap);

      setError("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ➕ Send friend request
  const handleRequest = async (id) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/friend-request/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ receiver_id: id }),
      });

      if (response.ok) {
        setFriendRequests({ ...friendRequests, [id]: "pending" });
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  // ❌ Cancel friend request
  const handleCancel = async (requestId, userId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/friend-request/${requestId}/cancel/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.ok) {
        setFriendRequests({ ...friendRequests, [userId]: null });
      }
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  // ✅ Accept friend request
  const handleAccept = async (requestId, userId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/friend-request/${requestId}/accept/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.ok) {
        setFriendRequests({ ...friendRequests, [userId]: "accepted" });
      }
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  // 🚫 Reject friend request
  const handleReject = async (requestId, userId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/friend-request/${requestId}/reject/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.ok) {
        setFriendRequests({ ...friendRequests, [userId]: "rejected" });
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  // 👋 Unfriend
  const handleUnfriend = async (requestId, userId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/friend/${requestId}/unfriend/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.ok) {
        setFriendRequests({ ...friendRequests, [userId]: null });
      }
    } catch (err) {
      console.error("Unfriend error:", err);
    }
  };

  return (
    <div className="search-container">
      <div className="search-card">

        {/* 🔝 Header with Left Corner Home Button */}
        <div className="search-header">
          <button
            className="home-btn-inside"
            onClick={() => navigate("/home")}
          >
            🏠
          </button>
          <h2>Search Users</h2>
        </div>

        {/* 🔎 Search Input */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter username..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>


        {loading && <p className="loading">Searching...</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="search-results">
          {users.length > 0 ? (
            users.map((user) => {
              const status = friendRequests[user.id];

              return (
                <div key={user.id} className="user-item">
                  <div className="left-section">
                    <div className="avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h4>{user.username}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>

                  {/* ✅ Button logic */}
                  {status === "pending" ? (
                    <button
                      className="friend-btn"
                      onClick={() =>
                        handleCancel(user.request_id, user.id)
                      }
                    >
                      Cancel Request
                    </button>
                  ) : status === "accepted" ? (
                    <button
                      className="friend-btn"
                      onClick={() =>
                        handleUnfriend(user.request_id, user.id)
                      }
                    >
                      Unfriend
                    </button>
                  ) : status === "rejected" ? (
                    <button
                      className="friend-btn"
                      onClick={() => handleRequest(user.id)}
                    >
                      Add Again
                    </button>
                  ) : (
                    <button
                      className="friend-btn"
                      onClick={() => handleRequest(user.id)}
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            !loading && <p className="no-result">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;