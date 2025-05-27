// src/components/RegisterForm.jsx
import React, { useRef } from "react";
import "./RegisterForm.css";
import { Link, useNavigate } from "react-router-dom";
import { indiaStates, indiaCities } from "../data/IndiaLocations";
import { Camera } from "lucide-react";

const RegisterForm = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    gender: "",
    state: "",
    city: "",
    pincode: "",
    company: "",
    role: "",
    email: "",
    profilePhoto: null
  });

  const [selectedState, setSelectedState] = React.useState("");
  const [cityOptions, setCityOptions] = React.useState([]);
  const [photoPreview, setPhotoPreview] = React.useState(null);

  // Role options for different industries
  const roleOptions = [
    "CEO/Founder",
    "CTO/Chief Technology Officer",
    "Production Manager",
    "Quality Control Manager",
    "Manufacturing Engineer",
    "Software Developer",
    "Operations Manager",
    "Supply Chain Manager",
    "Safety Officer",
    "Maintenance Supervisor",
    "Plant Manager",
    "R&D Engineer",
    "Process Engineer",
    "Quality Assurance Engineer",
    "Industrial Engineer",
    "Project Manager",
    "Sales Manager",
    "Business Analyst",
    "Technical Lead",
    "Other"
  ];

  // Handle photo upload
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }

      // Validate file size (max 5MB)
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
    }
    
    // Reset input to allow selecting same file again
    event.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.company) {
      alert("Please fill in all required fields");
      return;
    }

    if (!formData.gender) {
      alert("Please select a gender");
      return;
    }

    if (!formData.role) {
      alert("Please select your role");
      return;
    }

    // Here you would typically send data to your backend
    console.log("Registration data:", formData);
    
    // Navigate to homepage after successful registration
    navigate("/home");
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
            {/* Profile Photo Section */}
            <div className="form-group photo-section">
              <label>Profile Photo</label>
              <div className="photo-upload-container">
                <div className="photo-preview">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile Preview" className="preview-image" />
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
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="photo-upload-btn"
                    onClick={handlePhotoClick}
                    title="Upload photo"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <p className="photo-help-text">Upload a professional photo (max 5MB)</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gender *</label>
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="gender" 
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  /> 
                  Female
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="gender" 
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  /> 
                  Male
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="gender" 
                    value="other"
                    checked={formData.gender === "other"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  /> 
                  Other
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>State</label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    const stateValue = e.target.value;
                    setFormData({
                      ...formData,
                      state: stateValue,
                      city: ""
                    });
                    setSelectedState(stateValue);
                    setCityOptions(indiaCities[stateValue] || []);
                  }}
                >
                  <option value="">Select State</option>
                  {indiaStates.map((state) => (
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
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                placeholder="eg..123456"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Company *</label>
              <input
                type="text"
                placeholder="Enter company name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Role/Position *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="">Select your role</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-footer">
              <div className="login-inline">
                <span>Already have an account? </span>
                <Link to="/login">Login</Link>
              </div>
              <div className="btns">
                <button
                  type="button"
                  className="btn reset"
                  onClick={handleReset}
                >
                  Reset
                </button>
                <button type="submit" className="btn submit">Submit</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;