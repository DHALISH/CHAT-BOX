import React from "react";
import "./Support.css";

function Support() {
  return (
    <div className="support-container">
      <div className="support-box">
        <h2>Support</h2>

        <form className="support-form">

          <div className="row">
            <input type="text" placeholder="First Name" required />
            <input type="text" placeholder="Last Name" required />
          </div>

          <input type="email" placeholder="Email Address" required />

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