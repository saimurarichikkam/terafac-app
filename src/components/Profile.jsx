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
  X,
  Trash2,
  Search,
  UserMinus,
  MessageCircle
} from 'lucide-react';
import './Profile.css';
import { query, where, deleteDoc } from 'firebase/firestore';
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, arrayRemove } from "firebase/firestore";

const Profile = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Real connections states
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionSearchTerm, setConnectionSearchTerm] = useState('');
  
  const fileInputRef = useRef(null);
  
  const profileStats = [
    { label: 'Posts', value: userPosts.length.toString(), icon: MessageSquare },
    { label: 'Connections', value: connections.length.toString(), icon: Users },
    { label: 'Profile Views', value: '2.8K', icon: Eye },
    { label: 'Likes Received', value: '856', icon: Heart }
  ];

  // Fetch user's connections
  const fetchConnections = async () => {
    if (!auth.currentUser || !profileData) return;
    
    setConnectionsLoading(true);
    try {
      const followers = profileData.followers || [];
      const following = profileData.following || [];
      
      // Combine followers and following to get all connections
      const allConnectionIds = [...new Set([...followers, ...following])];
      
      if (allConnectionIds.length === 0) {
        setConnections([]);
        setConnectionsLoading(false);
        return;
      }

      // Fetch connection details
      const connectionPromises = allConnectionIds.map(async (connectionId) => {
        try {
          const connectionRef = doc(db, 'users', connectionId);
          const connectionSnap = await getDoc(connectionRef);
          
          if (connectionSnap.exists()) {
            const connectionData = connectionSnap.data();
            
            // Calculate mutual connections
            const connectionFollowers = connectionData.followers || [];
            const connectionFollowing = connectionData.following || [];
            const connectionConnections = [...new Set([...connectionFollowers, ...connectionFollowing])];
            
            const mutualConnections = allConnectionIds.filter(id => 
              id !== connectionId && connectionConnections.includes(id)
            );
            
            return {
              id: connectionId,
              name: `${connectionData.firstName || ''} ${connectionData.lastName || ''}`.trim() || 'Unknown User',
              firstName: connectionData.firstName || '',
              lastName: connectionData.lastName || '',
              title: connectionData.role || 'Professional',
              company: connectionData.company || 'Company not specified',
              avatar: connectionData.avatar || '',
              email: connectionData.email || '',
              city: connectionData.city || '',
              state: connectionData.state || '',
              mutual: mutualConnections.length,
              isFollower: followers.includes(connectionId),
              isFollowing: following.includes(connectionId),
              connectionType: followers.includes(connectionId) && following.includes(connectionId) ? 'mutual' : 
                            followers.includes(connectionId) ? 'follower' : 'following'
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching connection ${connectionId}:`, error);
          return null;
        }
      });

      const connectionResults = await Promise.all(connectionPromises);
      const validConnections = connectionResults.filter(conn => conn !== null);
      
      // Sort connections: mutual first, then by name
      validConnections.sort((a, b) => {
        if (a.connectionType === 'mutual' && b.connectionType !== 'mutual') return -1;
        if (b.connectionType === 'mutual' && a.connectionType !== 'mutual') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setConnections(validConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setConnections([]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  // Remove connection
  const removeConnection = async (connectionId, connectionName) => {
    const confirmRemove = window.confirm(`Are you sure you want to remove ${connectionName} from your connections?`);
    
    if (!confirmRemove) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const connectionRef = doc(db, 'users', connectionId);

      // Remove from current user's followers and following
      await updateDoc(userRef, {
        followers: arrayRemove(connectionId),
        following: arrayRemove(connectionId)
      });

      // Remove current user from connection's followers and following
      await updateDoc(connectionRef, {
        followers: arrayRemove(auth.currentUser.uid),
        following: arrayRemove(auth.currentUser.uid)
      });

      // Update local state
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
      // Update profile data
      const updatedFollowers = (profileData.followers || []).filter(id => id !== connectionId);
      const updatedFollowing = (profileData.following || []).filter(id => id !== connectionId);
      
      setProfileData(prev => ({
        ...prev,
        followers: updatedFollowers,
        following: updatedFollowing,
        connections: updatedFollowers.length + updatedFollowing.length - new Set([...updatedFollowers, ...updatedFollowing]).size
      }));

      alert(`${connectionName} has been removed from your connections.`);
    } catch (error) {
      console.error('Error removing connection:', error);
      alert('Failed to remove connection. Please try again.');
    }
  };

  // Filter connections based on search
  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(connectionSearchTerm.toLowerCase()) ||
    connection.title.toLowerCase().includes(connectionSearchTerm.toLowerCase()) ||
    connection.company.toLowerCase().includes(connectionSearchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfileData(data);

        // Initialize all fields for the edit form
        setEditData({
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          title: data.role || "",
          company: data.company || "",
          phone: data.phone || "",
          city: data.city || "",
          state: data.state || "",
          skills: (data.skills || []).join(", "),
          avatar: data.avatar || ""
        });
      } else {
        console.log("No profile found.");
      }

      setLoading(false);
    };

    fetchUserData();
  }, []);

  // Fetch connections when profile data is loaded or when connections section is active
  useEffect(() => {
    if (profileData && activeSection === 'connections') {
      fetchConnections();
    }
  }, [profileData, activeSection]);

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
      if (!auth.currentUser) return;
      
      const q = query(collection(db, "posts"), where("userId", "==", auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const userPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserPosts(userPosts);
    };

    fetchUserPosts();
  }, []);

  // FIXED: Delete post from Firebase completely
  const handleDeletePost = async (postId) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    
    if (!confirmDelete) return;

    try {
      // Delete from Firestore completely
      await deleteDoc(doc(db, "posts", postId));
      
      // Update local state immediately for better UX
      setUserPosts(userPosts.filter(post => post.id !== postId));
      
      // Set a flag in localStorage to notify HomePage to refresh
      localStorage.setItem("postsUpdated", Date.now().toString());
      
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const saveSection = async (updates) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const updated = { ...profileData, ...updates };
      await setDoc(doc(db, "users", user.uid), updated);
      setProfileData(updated);
      setEditingSection(null);
      
      // ADDED: Notify HomePage of profile updates
      localStorage.setItem("profileUpdated", Date.now().toString());
      
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
      phone: profileData.phone || "",
      city: profileData.city || "",
      state: profileData.state || "",
      skills: (profileData.skills || []).join(", ")
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
      
      // ADDED: Notify HomePage of profile updates including avatar
      localStorage.setItem("profileUpdated", Date.now().toString());
      
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditData({ 
      name: `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim(),
      title: profileData.role || "",
      company: profileData.company || "",
      avatar: profileData.avatar || ""
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  // Handle profile photo upload
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // FIXED: Save avatar updates to Firebase and notify HomePage
  const handlePhotoChange = async (event) => {
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
      reader.onload = async (e) => {
        const newAvatar = e.target.result;
        
        try {
          const user = auth.currentUser;
          if (!user) return;

          // Update profile data with new avatar
          const updatedProfile = {
            ...profileData,
            avatar: newAvatar
          };

          // Save to Firebase immediately
          await setDoc(doc(db, "users", user.uid), updatedProfile);
          
          // Update local state
          setProfileData(updatedProfile);
          setEditData({ ...editData, avatar: newAvatar });
          setIsUploadingPhoto(false);
          
          // CRITICAL: Notify HomePage to refresh user data
          localStorage.setItem("profileUpdated", Date.now().toString());
          
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
            if (document.body.contains(successMsg)) {
              document.body.removeChild(successMsg);
            }
          }, 3000);
          
        } catch (error) {
          console.error("Error updating avatar:", error);
          setIsUploadingPhoto(false);
          alert('Failed to update profile photo. Please try again.');
        }
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
                  {profileData?.firstName?.[0]}{profileData?.lastName?.[0]}
                </span>
              )}
              {isUploadingPhoto && (
                <div className="upload-overlay">
                  <div className="upload-spinner" />
                </div>
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
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    value={editData.title || ""}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="edit-input title-input"
                    placeholder="Job Title"
                  />
                  <input
                    type="text"
                    value={editData.company || ""}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="edit-input company-input"
                    placeholder="Company"
                  />
                  <div className="edit-actions">
                    <button onClick={handleSave} className="save-btn">
                      <Save size={16} />Save
                    </button>
                    <button onClick={handleCancel} className="cancel-btn">
                      <X size={16} />Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="profile-name">
                    {profileData?.firstName} {profileData?.lastName}
                  </h1>
                  <h2 className="profile-title">{profileData?.role}</h2>
                  <div className="profile-meta">
                    <span className="profile-company">
                      <Building2 size={16} />{profileData?.company}
                    </span>
                    <span className="profile-location">
                      <MapPin size={16} />{profileData?.city}, {profileData?.state}
                    </span>
                  </div>
                  <button onClick={handleEdit} className="edit-profile-btn">
                    <Edit size={16} /> Edit Profile
                  </button>
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
            <div className="overview-cards-horizontal">
              {/* Contact */}
              <div className="profile-card horizontal-card">
                <div className="card-header">
                  <h3>Contact Information</h3>
                  <button onClick={() => setEditingSection("contact")} className="edit-icon-btn">
                    <Edit size={16} />
                  </button>
                </div>

                {editingSection === "contact" ? (
                  <div className="edit-section">
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
                          saveSection({ 
                            phone: editData.phone, 
                            city: editData.city, 
                            state: editData.state 
                          })
                        }
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingSection(null)} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="contact-info horizontal-info">
                    <div className="info-item"><Mail size={16} /> {profileData?.email}</div>
                    <div className="info-item"><Phone size={16} /> {profileData?.phone || "N/A"}</div>
                    <div className="info-item"><MapPin size={16} /> {profileData?.city}, {profileData?.state}</div>
                    <div className="info-item">
                      <Calendar size={16} /> 
                      Joined {profileData?.createdAt?.seconds ? 
                        new Date(profileData.createdAt.seconds * 1000).toLocaleDateString() : 
                        "Unknown"
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="profile-card horizontal-card">
                <div className="card-header">
                  <h3>Professional Experience</h3>
                  <button onClick={() => setEditingSection("experience")} className="edit-icon-btn">
                    <Edit size={16} />
                  </button>
                </div>
                {editingSection === "experience" ? (
                  <div className="edit-section">
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
                        onClick={() => saveSection({ 
                          role: editData.title, 
                          company: editData.company 
                        })}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingSection(null)} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="experience-info horizontal-info">
                    <div className="experience-item">
                      <div className="experience-role">{profileData?.role}</div>
                      <div className="experience-company">at {profileData?.company}</div>
                      <div className="experience-duration">(2023 - Present)</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="profile-card horizontal-card">
                <div className="card-header">
                  <h3>Skills</h3>
                  <button onClick={() => setEditingSection("skills")} className="edit-icon-btn">
                    <Edit size={16} />
                  </button>
                </div>
                {editingSection === "skills" ? (
                  <div className="edit-section">
                    <input
                      type="text"
                      value={editData.skills || ""}
                      onChange={(e) => handleInputChange("skills", e.target.value)}
                      placeholder="Comma-separated skills (e.g., React, JavaScript, IoT)"
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => saveSection({ 
                          skills: editData.skills.split(",").map(s => s.trim()) 
                        })}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingSection(null)} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="skills-grid horizontal-skills">
                    {(profileData?.skills || []).map((skill, index) => (
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
            <div className="posts-header">
              <h3>Your Posts ({userPosts.length})</h3>
              <div className="posts-stats">
                <span className="posts-count">Total: {userPosts.length}</span>
              </div>
            </div>
            {userPosts.length === 0 ? (
              <div className="no-posts-gallery">
                <MessageSquare size={48} className="no-posts-icon" />
                <h4>No posts yet</h4>
                <p>Start sharing your manufacturing insights!</p>
              </div>
            ) : (
              <div className="posts-gallery">
                {userPosts.map((post) => (
                  <div key={post.id} className="gallery-post-card">
                    <div className="gallery-post-header">
                      <div className="post-date">
                        {post.timestamp?.seconds ? 
                          new Date(post.timestamp.seconds * 1000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          }) : 
                          'Unknown'
                        }
                      </div>
                      <button
                        className="delete-post-btn gallery-delete"
                        onClick={() => handleDeletePost(post.id)}
                        title="Delete Post"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {post.image && (
                      <div className="gallery-post-image">
                        <img src={post.image} alt="post" />
                      </div>
                    )}

                    <div className="gallery-post-content">
                      <p className="gallery-post-text">
                        {post.content.length > 100 ? 
                          `${post.content.substring(0, 100)}...` : 
                          post.content
                        }
                      </p>
                    </div>

                    <div className="gallery-post-stats">
                      <div className="stat-item">
                        <Heart size={12} />
                        <span>{post.likes || 0}</span>
                      </div>
                      <div className="stat-item">
                        <MessageSquare size={12} />
                        <span>{post.comments || 0}</span>
                      </div>
                      <div className="stat-item">
                        <Share2 size={12} />
                        <span>{post.shares || 0}</span>
                      </div>
                    </div>

                    <div className="gallery-post-time">
                      {post.timestamp?.seconds ? 
                        new Date(post.timestamp.seconds * 1000).toLocaleTimeString([], {
                          hour: '2-digit', 
                          minute: '2-digit'
                        }) : 
                        'Unknown time'
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "connections" && (
          <div className="connections-section">
            <div className="connections-header">
              <h3>Your Connections ({connections.length})</h3>
              {connections.length > 0 && (
                <div className="connections-search">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search connections..."
                    value={connectionSearchTerm}
                    onChange={(e) => setConnectionSearchTerm(e.target.value)}
                    className="connections-search-input"
                  />
                </div>
              )}
            </div>

            {connectionsLoading ? (
              <div className="connections-loading">
                <p>Loading your connections...</p>
              </div>
            ) : connections.length === 0 ? (
              <div className="no-connections">
                <Users size={48} className="no-connections-icon" />
                <h4>No connections yet</h4>
                <p>Start connecting with other professionals in the manufacturing industry!</p>
              </div>
            ) : (
              <div className="connections-grid">
                {filteredConnections.map((connection) => (
                  <div key={connection.id} className="connection-card">
                    <div className="connection-header">
                      <div className="connection-avatar">
                        {connection.avatar ? (
                          <img src={connection.avatar} alt={connection.name} />
                        ) : (
                          <div className="connection-avatar-placeholder">
                            {connection.firstName?.[0]}{connection.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="connection-type-badge">
                        {connection.connectionType === 'mutual' ? (
                          <span className="mutual-badge">Mutual</span>
                        ) : connection.connectionType === 'follower' ? (
                          <span className="follower-badge">Follower</span>
                        ) : (
                          <span className="following-badge">Following</span>
                        )}
                      </div>
                    </div>

                    <div className="connection-info">
                      <h4 className="connection-name">{connection.name}</h4>
                      <p className="connection-title">{connection.title}</p>
                      <p className="connection-company">{connection.company}</p>
                      {connection.city && connection.state && (
                        <p className="connection-location">
                          <MapPin size={12} />
                          {connection.city}, {connection.state}
                        </p>
                      )}
                      {connection.mutual > 0 && (
                        <p className="mutual-connections">
                          {connection.mutual} mutual connection{connection.mutual !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    <div className="connection-actions">
                      <button
                        className="message-btn"
                        onClick={() => {
                          // You can implement navigation to chat here
                          // For now, we'll just show an alert
                          alert(`Opening chat with ${connection.name}`);
                        }}
                        title={`Message ${connection.name}`}
                      >
                        <MessageCircle size={16} />
                        Message
                      </button>
                      <button
                        className="remove-connection-btn"
                        onClick={() => removeConnection(connection.id, connection.name)}
                        title={`Remove ${connection.name} from connections`}
                      >
                        <UserMinus size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {connectionSearchTerm && filteredConnections.length === 0 && connections.length > 0 && (
              <div className="no-search-results">
                <p>No connections found matching "{connectionSearchTerm}"</p>
              </div>
            )}
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