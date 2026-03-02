import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sign.css";

function Signin() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("username", data.username);
      localStorage.setItem("is_admin", data.is_admin); // ✅ store admin flag

      alert("Login successful ✅");

      // ✅ Redirect based on role
      if (data.is_admin) {
        navigate("/adminpage");       // admin page
      } else {
        navigate("/home");   // normal user
      }
    } else {
      alert(data.error || "Invalid username or password ❌");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Server error. Try again later.");
  }
};


  return (
    <div className="login-page">
      <div className="glass-container">
        <Link to="/">
          <button className="top-btn">X</button>
        </Link>

        <h2>Sign In</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
            />
            <label>Username</label>
          </div>

          <div className="input-box">
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <label>Password</label>
          </div>

          <button type="submit" className="btn">
            Sign In
          </button>
        </form>

        <p>
          Don’t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Signin;
