// src/pages/LoginScreen.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./LoginForm.css"; // We'll define the styles next

const LoginScreen = () => {
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

          <form>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" placeholder="Enter email" required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter password" required />
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
