import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

const dummyUsers = [
  { id: 1, username: "john_doe", status: "Online" },
  { id: 2, username: "emma_watson", status: "Offline" },
  { id: 3, username: "alex_raj", status: "Online" },
];

const ChatList = () => {
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const filteredUsers = dummyUsers.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const goToSearch = () => {
    navigate("/search");
  };

  return (
    <div className="chat-container">
      
      {/* Header */}
      <header className="chat-header">
        <div className="header-top">
          <h1 className="chat-title">ChatBox</h1>

          <div className="header-icons">

            {/* Notification Icon */}
            <div className="notification-icon">
              🔔
              <span className="notification-badge">0</span>
            </div>

            {/* Options Button */}
            <div className="options-wrapper">
              <button
                className="options-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                ⋮
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">👤 Profile</div>
                  <div className="dropdown-item">📇 Contact</div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Search */}
        <div className="chat-search">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Chat List */}
      <div className="chat-body">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="chat-item">
              <div className="avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="chat-info">
                <h4>{user.username}</h4>
                <p>{user.status}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-result">No users found</p>
        )}
      </div>

      <button className="chat-fab" onClick={goToSearch}>+</button>

    </div>
  );
};

export default ChatList;