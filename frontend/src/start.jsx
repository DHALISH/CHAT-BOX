import React from "react";
import "./start.css";

const StartPage = () => {
  return (
    <div className="start-container">
      <div className="start-card">
        <h1>Welcome to CHAT BOX</h1>
        <p>
          Simple, reliable and private. Message privately, make calls and
          share files with your friends, family and colleagues.
        </p>

        <button className="login-btn" onClick={() => window.location.href = "/signin"}>Login</button>
      </div>
    </div>
  );
};

export default StartPage;