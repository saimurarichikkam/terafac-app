// src/components/PublicProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, Building2, Mail, Phone, Calendar, Users, Heart, Eye, MessageSquare } from 'lucide-react';
import './Profile.css';
import './PublicProfile.css';

const PublicProfile = () => {
  const { uid } = useParams();  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!uid) return;
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error('Error fetching public profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  if (loading) return <p>Loading profile...</p>;
  if (!userData) return <p>User not found.</p>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              {userData.avatar ? (
                <img src={userData.avatar} alt="Profile" className="profile-avatar-large" />
              ) : (
                <span className="profile-avatar-placeholder">
                  {userData.firstName[0]}{userData.lastName[0]}
                </span>
              )}
            </div>

            <div className="profile-info">
              <h1 className="profile-name">{userData.firstName} {userData.lastName}</h1>
              <h2 className="profile-title">{userData.role}</h2>
              <div className="profile-meta">
                <span className="profile-company"><Building2 size={16} /> {userData.company}</span>
                <span className="profile-location"><MapPin size={16} /> {userData.city}, {userData.state}</span>
              </div>
              <button className="follow-btn">Follow</button>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item"><MessageSquare size={20} /><div><span className="stat-value">47</span><span className="stat-label">Posts</span></div></div>
          <div className="stat-item"><Users size={20} /><div><span className="stat-value">1.2K</span><span className="stat-label">Connections</span></div></div>
          <div className="stat-item"><Eye size={20} /><div><span className="stat-value">2.8K</span><span className="stat-label">Views</span></div></div>
          <div className="stat-item"><Heart size={20} /><div><span className="stat-value">856</span><span className="stat-label">Likes</span></div></div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="card-header"><h3>About</h3></div>
          <p>{userData.bio || "No bio available."}</p>
        </div>

        <div className="profile-card">
          <div className="card-header"><h3>Contact</h3></div>
          <div className="contact-info">
            <div><Mail size={18} /> {userData.email}</div>
            <div><Phone size={18} /> {userData.phone || "N/A"}</div>
            <div><MapPin size={18} /> {userData.city}, {userData.state}</div>
            <div><Calendar size={18} /> Joined {userData.createdAt?.seconds ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"} </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header"><h3>Skills</h3></div>
          <div className="skills-grid">
            {(userData.skills || []).map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
