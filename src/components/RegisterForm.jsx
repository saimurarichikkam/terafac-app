// src/components/RegisterForm.jsx
import React from "react";
import "./RegisterForm.css";
import { Link } from "react-router-dom";
import { indiaStates, indiaCities } from "../data/IndiaLocations";


const RegisterForm = () => {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    gender: "",
    state: "",
    city: "",
    pincode: "",
    company: "",
    email: ""
  });

  const [selectedState, setSelectedState] = React.useState("");
  const [cityOptions, setCityOptions] = React.useState([]);

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

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                placeholder="Enter Last name"
                value={formData.LastName}
                onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                />
            </div>
          </div>

          <div className="form-group">
            <label>Gender</label>
            <div className="radio-group">
              <label><input type="radio" name="gender" /> Female</label>
              <label><input type="radio" name="gender" /> Male</label>
              <label><input type="radio" name="gender" /> Other</label>
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
            <label>Company</label>
            <input
                type="text"
                placeholder="Enter company Name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
                type="text"
                placeholder="Enter Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    onClick={() => {
                        setFormData({
                        firstName: "",
                        lastName: "",
                        gender: "",
                        state: "",
                        city: "",
                        pincode: "",
                        company: "",
                        email: ""
                        });
                        setSelectedState("");
                        setCityOptions([]);
                    }}
                    >
                    Reset
                    </button>
                <button type="submit" className="btn submit">Submit</button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
