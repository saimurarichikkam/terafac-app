// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginScreen from "./components/LoginScreen";
import RegisterForm from "./components/RegisterForm";
import HomePage from "./components/HomePage";
import Chat from "./components/Chat";
import PublicProfile from './components/PublicProfile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile/:uid" element={<PublicProfile />} />
        <Route path="/forgot-password" element={<div>Forgot Password</div>} />
        <Route path="/terms" element={<div>Terms of Use</div>} />
        <Route path="/privacy" element={<div>Privacy Policy</div>} />
      </Routes>
    </Router>
  );
}

export default App;