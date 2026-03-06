import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

const ChatList = () => {
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("access");

      const response = await fetch("http://127.0.0.1:8000/home-friends/", {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const goToSearch = () => {
    navigate("/search");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

    navigate("/");
  };

  return (
    <div className="chat-container">
      
      {/* Header */}
      <header className="chat-header">
        <div className="header-top">
          <h1 className="chat-title">ChatBox</h1>

          <div className="header-icons">

            {/* Search */}
        <div className="chat-search">
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

            {/* Notification */}
            <div className="notification-icon" onClick={() => navigate("/notification")}>
              🔔
              <span className="notification-badge">0</span>
            </div>

            {/* Options */}
            <div className="options-wrapper">
              <button
                className="options-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                ⋮
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => navigate("/profile")}>
                    👤 Profile
                  </div>
                  <div className="dropdown-item">📇 Contact</div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    🚪 Logout
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        
      </header>

      {/* Chat List */}
      <div className="chat-body">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="chat-item" onClick={() => navigate(`/chat/${user.id}`)}>
              <div className="avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div className="chat-info">
                <h4>{user.username}</h4>
                <p>Friend</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-result">No friends yet</p>
        )}
      </div>

      <button className="chat-fab" onClick={goToSearch}>+</button>

    </div>
  );
};

export default ChatList;