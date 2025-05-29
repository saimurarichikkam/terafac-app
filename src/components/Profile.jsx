// src/components/Profile.jsx
import React, { useState, useRef, useEffect } from 'react';
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
import { query, where } from 'firebase/firestore';
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const Profile = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({ ...profileData });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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

    useEffect(() => {
      const fetchUserData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);

          // Initialize all 3 fields for the edit form
          setEditData({
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            title: data.role || "",
            company: data.company || ""
          });
        } else {
          console.log("No profile found.");
        }

        setLoading(false);
      };

      fetchUserData();
    }, []);

    useEffect(() => {
    const fetchAllUsers = async () => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const allUsers = snapshot.docs.map(doc => doc.data());

      const filtered = allUsers.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return (
          fullName.startsWith(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
      });

      setSearchResults(filtered);
    };

    if (searchTerm.length > 0) {
      fetchAllUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      const q = query(collection(db, "posts"), where("userId", "==", auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const userPosts = snapshot.docs.map(doc => doc.data());
      setUserPosts(userPosts);  // Add setUserPosts to state
    };

    if (auth.currentUser) {
      fetchUserPosts();
    }
  }, []);

  

  const saveSection = async (updates) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const updated = { ...profileData, ...updates };
    await setDoc(doc(db, "users", user.uid), updated);
    setProfileData(updated);
    setEditingSection(null);
    alert("Profile updated!");
  } catch (error) {
    console.error("Error saving section:", error);
    alert("Failed to save section.");
  }
};

  const handleEdit = () => {
    const name = `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim();
    setEditData({
      name,
      title: profileData.role || "",
      company: profileData.company || "",
      avatar: profileData.avatar || "",
    });
    setIsEditing(true);
  };


  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const fullName = editData.name || "";
    const [firstName, ...lastParts] = fullName.trim().split(" ");
    const lastName = lastParts.join(" ");

    const updatedProfile = {
      ...profileData,
      firstName: firstName || "",
      lastName: lastName || "",
      role: editData.title || "",
      company: editData.company || "",
      avatar: editData.avatar || profileData.avatar || "",
      city: editData.city || profileData.city || "",
      state: editData.state || profileData.state || "",
      createdAt: profileData.createdAt || new Date(),
    };

    try {
      await setDoc(doc(db, "users", user.uid), updatedProfile);
      setProfileData(updatedProfile);
      setEditData({
        name: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
        title: updatedProfile.role,
        company: updatedProfile.company,
        avatar: updatedProfile.avatar
      });
      setIsEditing(false);
      alert("Profile updated successfully!");
      localStorage.setItem("profileUpdated", Date.now());
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
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

if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              {profileData?.avatar ? (
                <img src={profileData.avatar} alt="Profile" className="profile-avatar-large" />
              ) : (
                <span className="profile-avatar-placeholder">
                  {profileData?.firstName[0]}{profileData?.lastName[0]}
                </span>
              )}
              {isUploadingPhoto && (
                <div className="upload-overlay"><div className="upload-spinner" /></div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                className="avatar-edit-btn"
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                title="Change profile photo"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="edit-input name-input"
                  />

                  <input
                    type="text"
                    value={editData.title || ""}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="edit-input title-input"
                  />

                  <input
                    type="text"
                    value={editData.company || ""}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="edit-input company-input"
                  />
                  <div className="edit-actions">
                    <button onClick={handleSave} className="save-btn"><Save size={16} />Save</button>
                    <button onClick={handleCancel} className="cancel-btn"><X size={16} />Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">{profileData.firstName} {profileData.lastName}</h1>
                  <h2 className="profile-title">{profileData.role}</h2>
                  <div className="profile-meta">
                    <span className="profile-company"><Building2 size={16} />{profileData.company}</span>
                    <span className="profile-location"><MapPin size={16} />{profileData.city}, {profileData.state}</span>
                  </div>
                  <button onClick={handleEdit} className="edit-profile-btn"><Edit size={16} /> Edit Profile</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          {profileStats.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <stat.icon size={20} />
              <div>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="profile-nav">
        {["overview", "posts", "connections", "settings"].map((section) => (
          <button
            key={section}
            className={`nav-item ${activeSection === section ? "active" : ""}`}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="profile-content">
        {activeSection === "overview" && (
          <div className="overview-section">
            <div className="overview-grid">
              {/* About */}
              <div className="profile-card">
                <div className="card-header">
                  <h3>About</h3>
                  <button onClick={() => setEditingSection("about")} className="edit-icon-btn">
                    <Edit size={16} />
                  </button>
                </div>

                {editingSection === "about" ? (
                  <>
                    <textarea
                      value={editData.bio || ""}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      className="edit-textarea"
                    />
                    <div className="edit-actions">
                      <button onClick={() => saveSection({ bio: editData.bio })} className="save-btn">Save</button>
                      <button onClick={() => setEditingSection(null)} className="cancel-btn">Cancel</button>
                    </div>
                  </>
                ) : (
                  <p>{profileData.bio || "No bio added yet."}</p>
                )}
              </div>

              {/* Contact */}
              <div className="profile-card">
                <div className="card-header">
                  <h3>Contact Information</h3>
                  <button onClick={() => setEditingSection("contact")} className="edit-icon-btn">
                    <Edit size={16} />
                  </button>
                </div>

                {editingSection === "contact" ? (
                  <>
                    <input
                      type="text"
                      value={editData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Phone"
                      className="edit-input"
                    />
                    <input
                      type="text"
                      value={editData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="City"
                      className="edit-input"
                    />
                    <input
                      type="text"
                      value={editData.state || ""}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder="State"
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() =>
                          saveSection({ phone: editData.phone, city: editData.city, state: editData.state })
                        }
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingSection(null)} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="contact-info">
                    <div><Mail size={18} /> {profileData.email}</div>
                    <div><Phone size={18} /> {profileData.phone || "N/A"}</div>
                    <div><MapPin size={18} /> {profileData.city}, {profileData.state}</div>
                    <div><Calendar size={18} /> Joined {new Date(profileData.createdAt.seconds * 1000).toLocaleDateString()}</div>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="profile-card">
                <div className="card-header">
                  <h3>Professional Experience</h3>
                  <button onClick={() => setEditingSection("experience")} className="edit-icon-btn">
                    <Edit size={16} />
                  </button>
                </div>
                {editingSection === "experience" ? (
                  <>
                    <input
                      type="text"
                      value={editData.title || ""}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Role"
                      className="edit-input"
                    />
                    <input
                      type="text"
                      value={editData.company || ""}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="Company"
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => saveSection({ role: editData.title, company: editData.company })}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingSection(null)} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <p>{profileData.role} at {profileData.company} (2023 - Present)</p>
                )}
              </div>


              {/* Skills */}
              <div className="profile-card">
                <div className="card-header">
                  <h3>Skills</h3>
                  <button onClick={() => setEditingSection("skills")} className="edit-icon-btn">
                    <Edit size={16} />
                  </button>
                </div>
                {editingSection === "skills" ? (
                  <>
                    <input
                      type="text"
                      value={editData.skills || ""}
                      onChange={(e) => handleInputChange("skills", e.target.value)}
                      placeholder="Comma-separated skills (e.g., React, JavaScript, IoT)"
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => saveSection({ skills: editData.skills.split(",").map(s => s.trim()) })}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingSection(null)} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="skills-grid">
                    {(profileData.skills || []).map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "posts" && (
         <div className="profile-posts">
            <h3>Your Posts</h3>
            {userPosts.map((post, idx) => (
              <div key={idx} className="post-card">
                <h4>{post.content}</h4>
                {post.image && <img src={post.image} alt="post" />}
                <p>{post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleString() : ''}</p>
              </div>
            ))}
          </div>
        )}

        {activeSection === "connections" && (
          <div className="connections-section">
            <h3>Your Connections (0)</h3>
            <p>No connections yet.</p>
          </div>
        )}

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