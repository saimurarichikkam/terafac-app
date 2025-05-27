// src/components/Profile.jsx
import React, { useState, useRef } from 'react';
import { 
  User, 
  MapPin, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Edit, 
  Camera, 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Globe, 
  Users, 
  Award, 
  Briefcase,
  GraduationCap,
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Save,
  X
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Sai Murari',
    title: 'Software Developer',
    company: 'Terafac Technologies',
    location: 'Chandigarh, India',
    email: 'sai.murari@terafac.com',
    phone: '+91 98765 43210',
    joinDate: 'January 2023',
    bio: 'Passionate software developer with expertise in manufacturing technology solutions. Focused on creating innovative platforms that connect the manufacturing industry.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  });

  const [editData, setEditData] = useState({ ...profileData });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const profileStats = [
    { label: 'Posts', value: '47', icon: MessageSquare },
    { label: 'Connections', value: '1.2K', icon: Users },
    { label: 'Profile Views', value: '2.8K', icon: Eye },
    { label: 'Likes Received', value: '856', icon: Heart }
  ];

  const recentPosts = [
    {
      id: 1,
      content: 'Excited to share our latest manufacturing efficiency improvements...',
      timestamp: '2 days ago',
      likes: 34,
      comments: 12
    },
    {
      id: 2,
      content: 'Great networking event at the Manufacturing Summit 2025...',
      timestamp: '1 week ago',
      likes: 67,
      comments: 23
    },
    {
      id: 3,
      content: 'Thoughts on sustainable manufacturing practices in 2025...',
      timestamp: '2 weeks ago',
      likes: 89,
      comments: 31
    }
  ];

  const connections = [
    {
      id: 1,
      name: 'Sarah Johnson',
      title: 'Production Manager',
      company: 'Tata Steel Manufacturing',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      mutual: 15
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      title: 'Quality Engineer',
      company: 'Mahindra Auto Parts',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      mutual: 23
    },
    {
      id: 3,
      name: 'Priya Sharma',
      title: 'Sustainability Lead',
      company: 'Green Tech Solutions',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      mutual: 8
    }
  ];

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
  };

  const handleSave = () => {
    setProfileData({ ...editData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...profileData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  // Handle profile photo upload
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

      setIsUploadingPhoto(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const newAvatar = e.target.result;
        setProfileData({ ...profileData, avatar: newAvatar });
        setEditData({ ...editData, avatar: newAvatar });
        setIsUploadingPhoto(false);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = 'Profile photo updated successfully!';
        successMsg.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      };
      
      reader.onerror = () => {
        setIsUploadingPhoto(false);
        alert('Error reading the file. Please try again.');
      };
      
      reader.readAsDataURL(file);
    }
    
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              <img src={profileData.avatar} alt="Profile" className="profile-avatar-large" />
              {isUploadingPhoto && (
                <div className="upload-overlay">
                  <div className="upload-spinner"></div>
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
                className="avatar-edit-btn" 
                onClick={handlePhotoClick} 
                title="Change profile photo"
                disabled={isUploadingPhoto}
              >
                <Camera size={16} />
              </button>
            </div>
            
            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="edit-input name-input"
                  />
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="edit-input title-input"
                  />
                  <input
                    type="text"
                    value={editData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="edit-input company-input"
                  />
                  <div className="edit-actions">
                    <button onClick={handleSave} className="save-btn">
                      <Save size={16} />
                      Save
                    </button>
                    <button onClick={handleCancel} className="cancel-btn">
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">{profileData.name}</h1>
                  <h2 className="profile-title">{profileData.title}</h2>
                  <div className="profile-meta">
                    <span className="profile-company">
                      <Building2 size={16} />
                      {profileData.company}
                    </span>
                    <span className="profile-location">
                      <MapPin size={16} />
                      {profileData.location}
                    </span>
                  </div>
                  <button onClick={handleEdit} className="edit-profile-btn">
                    <Edit size={16} />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="profile-stats">
          {profileStats.map((stat, index) => (
            <div key={index} className="stat-item">
              <stat.icon size={20} className="stat-icon" />
              <div>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Navigation */}
      <div className="profile-nav">
        <button 
          className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-item ${activeSection === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveSection('posts')}
        >
          Posts
        </button>
        <button 
          className={`nav-item ${activeSection === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveSection('connections')}
        >
          Connections
        </button>
        <button 
          className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          Settings
        </button>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              
              {/* About Card */}
              <div className="profile-card">
                <h3>About</h3>
                {isEditing ? (
                  <textarea
                    value={editData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="edit-textarea"
                    rows="4"
                  />
                ) : (
                  <p className="bio-text">{profileData.bio}</p>
                )}
              </div>

              {/* Contact Info Card */}
              <div className="profile-card">
                <h3>Contact Information</h3>
                <div className="contact-info">
                  <div className="contact-item">
                    <Mail size={18} />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{profileData.email}</span>
                    )}
                  </div>
                  <div className="contact-item">
                    <Phone size={18} />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{profileData.phone}</span>
                    )}
                  </div>
                  <div className="contact-item">
                    <MapPin size={18} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{profileData.location}</span>
                    )}
                  </div>
                  <div className="contact-item">
                    <Calendar size={18} />
                    <span>Joined {profileData.joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Experience Card */}
              <div className="profile-card">
                <h3>Professional Experience</h3>
                <div className="experience-item">
                  <Briefcase size={18} />
                  <div>
                    <h4>Software Developer</h4>
                    <p>Terafac Technologies • 2023 - Present</p>
                    <p className="experience-desc">Developing manufacturing networking platform and industrial solutions.</p>
                  </div>
                </div>
              </div>

              {/* Skills Card */}
              <div className="profile-card">
                <h3>Skills & Expertise</h3>
                <div className="skills-grid">
                  <span className="skill-tag">React.js</span>
                  <span className="skill-tag">JavaScript</span>
                  <span className="skill-tag">Manufacturing Tech</span>
                  <span className="skill-tag">Industrial IoT</span>
                  <span className="skill-tag">Quality Control</span>
                  <span className="skill-tag">Automation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Section */}
        {activeSection === 'posts' && (
          <div className="posts-section">
            <h3>Recent Posts</h3>
            <div className="posts-list">
              {recentPosts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="post-content">
                    <p>{post.content}</p>
                    <span className="post-timestamp">{post.timestamp}</span>
                  </div>
                  <div className="post-stats">
                    <span><Heart size={16} /> {post.likes}</span>
                    <span><MessageSquare size={16} /> {post.comments}</span>
                    <button><MoreHorizontal size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections Section */}
        {activeSection === 'connections' && (
          <div className="connections-section">
            <h3>Your Connections ({connections.length})</h3>
            <div className="connections-grid">
              {connections.map((connection) => (
                <div key={connection.id} className="connection-card">
                  <img src={connection.avatar} alt="" className="connection-avatar" />
                  <div className="connection-info">
                    <h4>{connection.name}</h4>
                    <p>{connection.title}</p>
                    <p className="connection-company">{connection.company}</p>
                    <span className="mutual-connections">{connection.mutual} mutual connections</span>
                  </div>
                  <button className="message-btn">Message</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="settings-section">
            <h3>Account Settings</h3>
            <div className="settings-grid">
              
              <div className="setting-card">
                <div className="setting-header">
                  <Shield size={20} />
                  <h4>Privacy & Security</h4>
                </div>
                <div className="setting-options">
                  <label className="setting-option">
                    <input type="checkbox" defaultChecked />
                    <span>Make profile public</span>
                  </label>
                  <label className="setting-option">
                    <input type="checkbox" defaultChecked />
                    <span>Allow connection requests</span>
                  </label>
                  <label className="setting-option">
                    <input type="checkbox" />
                    <span>Show email to connections</span>
                  </label>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-header">
                  <Bell size={20} />
                  <h4>Notifications</h4>
                </div>
                <div className="setting-options">
                  <label className="setting-option">
                    <input type="checkbox" defaultChecked />
                    <span>Email notifications</span>
                  </label>
                  <label className="setting-option">
                    <input type="checkbox" defaultChecked />
                    <span>Push notifications</span>
                  </label>
                  <label className="setting-option">
                    <input type="checkbox" />
                    <span>Marketing emails</span>
                  </label>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-header">
                  <Globe size={20} />
                  <h4>Preferences</h4>
                </div>
                <div className="setting-options">
                  <div className="setting-row">
                    <span>Language</span>
                    <select className="setting-select">
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Tamil</option>
                    </select>
                  </div>
                  <div className="setting-row">
                    <span>Time Zone</span>
                    <select className="setting-select">
                      <option>IST (India Standard Time)</option>
                      <option>UTC</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;