import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Support.css";

const Support = () => {
  const [user, setUser] = useState("");
  
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
  

  return (
    <div className="support-container">

      {/* Header */}
      <div className="support-header">

        <button
          className="back-btn"
          onClick={() => navigate("/home")}
        >
          ←
        </button>

        <h2 className="support-title">Support Center</h2>

      </div>


      {/* Support Form */}
      <div className="support-box">

        <form className="support-form">

          {/* <div className="row">
            <input type="text" placeholder="First Name" required />
            <input type="text" placeholder="Last Name" required />
          </div> */}

          <input type="email" placeholder="Email Address" value={user.email} required />

          <textarea
            placeholder="Describe your problem..."
            rows="5"
            required
          ></textarea>

          <button type="submit">Submit</button>

        </form>

      </div>

    </div>
  );
}

export default Support;