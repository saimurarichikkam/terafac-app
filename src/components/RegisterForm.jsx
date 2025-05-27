// src/components/RegisterForm.jsx
import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { indiaStates, indiaCities } from "../data/IndiaLocations";
import { Camera } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./RegisterForm.css";

const RegisterForm = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    state: "",
    city: "",
    pincode: "",
    company: "",
    role: "",
    email: "",
    password: "",
    profilePhoto: null
  });

  const [selectedState, setSelectedState] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);

  const roleOptions = [
    "CEO/Founder", "CTO/Chief Technology Officer", "Production Manager", "Quality Control Manager",
    "Manufacturing Engineer", "Software Developer", "Operations Manager", "Supply Chain Manager",
    "Safety Officer", "Maintenance Supervisor", "Plant Manager", "R&D Engineer", "Process Engineer",
    "Quality Assurance Engineer", "Industrial Engineer", "Project Manager", "Sales Manager",
    "Business Analyst", "Technical Lead", "Other"
  ];

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setFormData({ ...formData, profilePhoto: file });
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.company || !formData.role || !formData.gender) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log("User registered:", userCredential.user);
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      console.error("Error creating user:", error.message);
      alert(`Registration failed: ${error.message}`);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      state: "",
      city: "",
      pincode: "",
      company: "",
      role: "",
      email: "",
      password: "",
      profilePhoto: null
    });
    setSelectedState("");
    setCityOptions([]);
    setPhotoPreview(null);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Left Image */}
        <div className="register-image">
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/img4.webp"
            alt="registration"
          />
        </div>

        {/* Right Form */}
        <div className="register-form">
          <h3 className="form-title">User Registration</h3>

          <form onSubmit={handleSubmit}>
            {/* Profile Photo */}
            <div className="form-group photo-section">
              <label>Profile Photo</label>
              <div className="photo-upload-container">
                <div className="photo-preview">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="preview-image" />
                  ) : (
                    <div className="photo-placeholder">
                      <Camera size={32} />
                      <span>Add Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: "none" }}
                  />
                  <button type="button" className="photo-upload-btn" onClick={handlePhotoClick}>
                    <Camera size={16} />
                  </button>
                </div>
                <p className="photo-help-text">Upload a professional photo (max 5MB)</p>
              </div>
            </div>

            {/* Names */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Gender */}
            <div className="form-group">
              <label>Gender *</label>
              <div className="radio-group">
                {["female", "male", "other"].map(g => (
                  <label key={g}>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* State and City */}
            <div className="form-row">
              <div className="form-group">
                <label>State</label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFormData({ ...formData, state: selected, city: "" });
                    setSelectedState(selected);
                    setCityOptions(indiaCities[selected] || []);
                  }}
                >
                  <option value="">Select State</option>
                  {indiaStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>City</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.state}
                >
                  <option value="">Select City</option>
                  {cityOptions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pincode */}
            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>

            {/* Company */}
            <div className="form-group">
              <label>Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            {/* Role */}
            <div className="form-group">
              <label>Role/Position *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="">Select your role</option>
                {roleOptions.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Email & Password */}
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Footer */}
            <div className="form-footer">
              <div className="login-inline">
                <span>Already have an account? </span>
                <Link to="/login">Login</Link>
              </div>
              <div className="btns">
                <button type="button" className="btn reset" onClick={handleReset}>
                  Reset
                </button>
                <button type="submit" className="btn submit">
                  Register
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
