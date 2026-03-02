import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ combine imports
import "./Sign.css";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });

  const navigate = useNavigate(); // ✅ initialize navigate

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: formData.username,
      password: formData.password,
      email: formData.email,
    };

    console.log("Submitting:", payload);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("User created ✅");
        console.log(data);
        navigate("/home"); // ✅ now works
      } else {
        alert(JSON.stringify(data));
        console.log(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  return (
    <div className="login-page">
      <div className="glass-container">
        <Link to="/">
          <button className="top-btn">X</button>
        </Link>

        <h2>Sign Up</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <label>Username</label>
          </div>

          <div className="input-box">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label>Password</label>
          </div>

          <div className="input-box">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label>Email</label>
          </div>

          <button type="submit" className="btn">Sign Up</button>
        </form>

        <p>
          have an account? <Link to="/signin">login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;