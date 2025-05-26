// src/components/LoginScreen.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginForm.css";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      alert("Please fill in all fields");
      return;
    }

    // Here you would typically validate credentials with your backend
    // For now, we'll just navigate to the homepage
    console.log("Login attempt:", formData);
    
    // Navigate to homepage after successful login
    navigate("/home");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left Image Section */}
        <div className="login-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img1.webp"
            alt="login"
          />
        </div>

        {/* Right Form Section */}
        <div className="login-form">
          <div className="logo-row">
            <i className="fa fa-cubes icon"></i>
            <div className="logo-text">
              <h1 className="brand">TERAFAC</h1>
              <p className="app-tagline">India's manufacturing networking platform</p>
            </div>
          </div>

          <h5 className="subtitle">Sign into your account</h5>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input 
                type="email" 
                name="email"
                placeholder="Enter email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password"
                placeholder="Enter password" 
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>

            <button type="submit" className="login-btn">Login</button>

            <Link className="forgot" to="/forgot-password">
              Forgot password?
            </Link>

            <p className="register-link">
              Don't have an account? <Link to="/register">Register here</Link>
            </p>

            <div className="policy-links">
              <Link to="/terms">Terms of use.</Link>
              <Link to="/privacy">Privacy policy</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;