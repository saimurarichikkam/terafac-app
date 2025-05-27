// src/components/LoginScreen.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useDispatch } from "react-redux";
import { auth } from "../firebase";
import { loginUser } from "../redux/slices/userSlice";
import "./LoginForm.css";

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(''); // Reset error message

    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      dispatch(loginUser({ uid: user.uid, email: user.email }));
      navigate("/home"); // ✅ only on success
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === 'auth/user-not-found') {
        setErrorMsg("User not found. Please register first.");
      } else if (error.code === 'auth/wrong-password') {
        setErrorMsg("Incorrect password.");
      } else {
        setErrorMsg("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Left Image */}
        <div className="login-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img1.webp"
            alt="login"
          />
        </div>

        {/* Right Form */}
        <div className="login-form">
          <div className="logo-row">
            <i className="fa fa-cubes icon"></i>
            <div className="logo-text">
              <h1 className="brand">TERAFAC</h1>
              <p className="app-tagline">India's manufacturing networking platform</p>
            </div>
          </div>

          <h5 className="subtitle">Sign into your account</h5>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMsg && <p className="error-msg">{errorMsg}</p>}

            <button type="submit" className="login-btn">Login</button>

            <Link className="forgot" to="/forgot-password">Forgot password?</Link>

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
