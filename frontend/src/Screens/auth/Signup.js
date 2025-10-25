import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../Component/Navbar";
import "../styles/Auth.css";


const Signup = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    geolocation: "",
    password: "",
    MobileNo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (password) => password.length >= 5;

  const validateMobileNo = (mobileNo) => /^\d{10}$/.test(mobileNo);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateMobileNo(credentials.MobileNo)) {
      setError("Mobile number must be exactly 10 digits long.");
      return;
    }

    if (!validatePassword(credentials.password)) {
      setError("Password must be at least 5 characters long");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://foodiii.onrender.com/api/creatuser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: credentials.name,
            email: credentials.email,
            location: credentials.geolocation,
            password: credentials.password,
            MobileNo: credentials.MobileNo,
          }),
        }
      );

      const json = await response.json();

      if (!json.success) {
        console.log(json.message)
        alert(json.message);
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <Navbar />

      <div className="auth-content">
        <div className="auth-card signup-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join cloud kitchen to start your journey</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon">
                <i className="fas fa-user"></i>
              </div>
              <input
                type="text"
                placeholder="Full Name"
                name="name"
                value={credentials.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="input-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="input-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <input
                type="text"
                placeholder="Your Address"
                name="geolocation"
                value={credentials.geolocation}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="input-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <input
                type="text"
                placeholder="Mobile Number (10 digits)"
                name="MobileNo"
                value={credentials.MobileNo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="input-icon">
                <i className="fas fa-lock"></i>
              </div>
              <input
                type="password"
                placeholder="Create Password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Please wait..." : "Sign Up"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Signup;
