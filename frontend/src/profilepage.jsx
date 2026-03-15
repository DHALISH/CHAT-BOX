import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/profile/", {
      headers: {
        "Authorization": `Token ${localStorage.getItem("access")}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => console.error(err));
  }, []);
    const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

    navigate("/");
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate("/home")}>
            ←
          </button>
          <h1 className="profile-title">Profile</h1>
        </div>

        {/* Dropdown Menu */}
        <div className="dropdown">
          <button
            className="dropdown-toggle"
            onClick={() => setOpen(!open)}
          >
            ⋮
          </button>
          {open && (
            <div className="dropdown-menu">
              <button onClick={() => navigate("/notification")}>🔔 Notifications</button>
              <button onClick={handleLogout}>🚪 Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Profile Details */}
      <div className="profile-body">
        <div className="profile-avatar">
          {user?.username ? user.username.charAt(0).toUpperCase() : "?"}
        </div>
        <h2 className="profile-username">{user.username}</h2>

        <div className="profile-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>First Name:</strong> {user.first_name || "N/A"}</p>
          <p><strong>Last Name:</strong> {user.last_name || "N/A"}</p>
          <p><strong>Joined:</strong> {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "N/A"}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;