import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MapPin, Building2, Mail, Phone, Calendar, Users, Heart, Eye, MessageSquare, Edit, Search, Bell, Home, AlertTriangle, User, LogOut } from 'lucide-react';
import './Profile.css';
import './PublicProfile.css';
import TerafacLogo from '../assets/icons/Terafac_Logo_bg.png';
import { addDoc, serverTimestamp } from 'firebase/firestore';

const PublicProfile = () => {
  const { uid } = useParams();  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [posts, setPosts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!uid) return;
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);

          // Fetch posts for this user
          const postsQuery = query(collection(db, 'posts'), where('userId', '==', uid));
          const postsSnapshot = await getDocs(postsQuery);
          const userPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPosts(userPosts);

          // Fetch connections for this user
          if (data.connections?.length) {
            const connPromises = data.connections.map(async connUid => {
              const connRef = doc(db, 'users', connUid);
              const connSnap = await getDoc(connRef);
              return connSnap.exists() ? { uid: connUid, ...connSnap.data() } : null;
            });
            const connResults = await Promise.all(connPromises);
            setConnections(connResults.filter(Boolean));
          } else {
            setConnections([]);
          }
        }
      } catch (error) {
        console.error('Error fetching public profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  const handleSearch = async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const query = searchQuery.toLowerCase();

    const matchedUser = allUsers.find(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase() === query ||
      user.email?.toLowerCase() === query
    );

    if (matchedUser) {
       navigate(`/profile/${matchedUser.id}`);
    } else {
      alert("No user found with that name or email.");
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      navigate('/login');
    }
  };

  const handleHomeNavigation = () => {
    navigate('/home');
  };

  if (loading) return <p>Loading profile...</p>;
  if (!userData) return <p>User not found.</p>;

  return (
    <div className="homepage-container">
      {/* Header - Same as HomePage */}
      <header className="homepage-header">
        <div className="header-content">
          <div className="logo-section" onClick={handleHomeNavigation} style={{cursor: 'pointer'}}>
            <img src={TerafacLogo} alt="Terafac Logo" className="logo-icon" />
            <div>
              <h1 className="brand-title">TERAFAC</h1>
              <p className="brand-subtitle">Manufacturing Hub</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="header-btn">
              <input
                type="text"
                placeholder="Search users..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </button>
            <button className="header-btn">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>
            <button 
              className="header-btn logout-btn" 
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        <div className="profile-container">
          {/* Profile Header */}
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
              <div className="stat-item"><MessageSquare size={20} /><div><span className="stat-value">{posts.length}</span><span className="stat-label">Posts</span></div></div>
              <div className="stat-item"><Users size={20} /><div><span className="stat-value">{connections.length}</span><span className="stat-label">Connections</span></div></div>
              <div className="stat-item"><Eye size={20} /><div><span className="stat-value">2.8K</span><span className="stat-label">Views</span></div></div>
              <div className="stat-item"><Heart size={20} /><div><span className="stat-value">856</span><span className="stat-label">Likes</span></div></div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="profile-nav">
            {['overview', 'posts', 'connections'].map(section => (
              <button
                key={section}
                className={`nav-item ${activeSection === section ? 'active' : ''}`}
                onClick={() => setActiveSection(section)}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="profile-content">
            {activeSection === 'overview' && (
              <>
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
                    <div><Calendar size={18} /> Joined {userData.createdAt?.seconds ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}</div>
                  </div>
                </div>

                <div className="profile-card">
                  <div className="card-header"><h3>Skills</h3></div>
                  <div className="skills-grid">
                    {(userData.skills || []).map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'posts' && (
              <div className="profile-card">
                <div className="card-header"><h3>Posts</h3></div>
                {posts.length === 0 ? (
                  <p>No posts yet.</p>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="post-item">
                      <p>{post.content}</p>
                      {post.image && <img src={post.image} alt="Post" className="post-image" />}
                      <small>{post.timestamp?.seconds ? new Date(post.timestamp.seconds * 1000).toLocaleString() : ''}</small>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeSection === 'connections' && (
              <div className="profile-card">
                <div className="card-header"><h3>Connections</h3></div>
                {connections.length === 0 ? (
                  <p>No connections yet.</p>
                ) : (
                  <div className="connections-list">
                    {connections.map(conn => (
                      <div key={conn.uid} className="connection-item">
                        <div className="connection-avatar">
                          {conn.avatar ? (
                            <img src={conn.avatar} alt={conn.firstName} />
                          ) : (
                            <span>{conn.firstName?.[0]}{conn.lastName?.[0]}</span>
                          )}
                        </div>
                        <div className="connection-info">
                          <p>{conn.firstName} {conn.lastName}</p>
                          <small>{conn.role} at {conn.company}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;