import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MapPin, Building2, Mail, Phone, Calendar, Users, Heart, Eye, MessageSquare, Edit, Search, Bell, Home, AlertTriangle, User, LogOut, UserPlus, UserCheck } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [followStatus, setFollowStatus] = useState('none'); // 'none', 'pending', 'following'
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCurrentUser({ uid: user.uid, ...userSnap.data() });
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!uid) return;
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);

          // Check follow status
          if (currentUser) {
            checkFollowStatus(data, currentUser.uid);
          }

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

    if (currentUser) {
      fetchUserData();
    } else if (!auth.currentUser) {
      // If no user is authenticated, still fetch the profile data
      fetchUserData();
    }
  }, [uid, currentUser]);

  const checkFollowStatus = (profileUser, currentUserId) => {
    // Check if current user is already following this user
    if (profileUser.followers?.includes(currentUserId)) {
      setFollowStatus('following');
    }
    // Check if current user has sent a follow request
    else if (profileUser.followRequests?.includes(currentUserId)) {
      setFollowStatus('pending');
    }
    else {
      setFollowStatus('none');
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userData || isFollowLoading) return;

    setIsFollowLoading(true);

    try {
      const profileUserRef = doc(db, 'users', uid);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      if (followStatus === 'none') {
        // Send follow request
        console.log('Sending follow request...');
        
        // Add to follow requests
        await updateDoc(profileUserRef, {
          followRequests: arrayUnion(currentUser.uid)
        });

        // Create notification
        const notificationData = {
          recipientId: uid,
          senderId: currentUser.uid,
          senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
          senderAvatar: currentUser.avatar || '',
          type: 'follow_request',
          message: `${currentUser.firstName || 'Someone'} wants to follow you`,
          read: false,
          timestamp: serverTimestamp()
        };

        await addDoc(collection(db, 'notifications'), notificationData);

        setFollowStatus('pending');
        
        // Update local state immediately for better UX
        setUserData(prev => ({
          ...prev,
          followRequests: [...(prev.followRequests || []), currentUser.uid]
        }));
        
        alert('Follow request sent!');

      } else if (followStatus === 'pending') {
        // Cancel follow request
        console.log('Cancelling follow request...');
        
        await updateDoc(profileUserRef, {
          followRequests: arrayRemove(currentUser.uid)
        });

        // Remove notification
        try {
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('recipientId', '==', uid),
            where('senderId', '==', currentUser.uid),
            where('type', '==', 'follow_request')
          );
          const notificationsSnapshot = await getDocs(notificationsQuery);
          
          const deletePromises = notificationsSnapshot.docs.map(docSnapshot => 
            deleteDoc(doc(db, 'notifications', docSnapshot.id))
          );
          await Promise.all(deletePromises);
        } catch (notifError) {
          console.error('Error removing notification:', notifError);
        }

        setFollowStatus('none');
        
        // Update local state
        setUserData(prev => ({
          ...prev,
          followRequests: (prev.followRequests || []).filter(id => id !== currentUser.uid)
        }));
        
        alert('Follow request cancelled');

      } else if (followStatus === 'following') {
        // Unfollow
        console.log('Unfollowing user...');
        
        await updateDoc(profileUserRef, {
          followers: arrayRemove(currentUser.uid)
        });

        await updateDoc(currentUserRef, {
          following: arrayRemove(uid)
        });

        setFollowStatus('none');
        
        // Update local state
        setUserData(prev => ({
          ...prev,
          followers: (prev.followers || []).filter(id => id !== currentUser.uid)
        }));
        
        alert('Unfollowed successfully');
      }

    } catch (error) {
      console.error('Error handling follow:', error);
      alert(`Follow operation failed: ${error.message}`);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const getFollowButtonText = () => {
    if (isFollowLoading) return 'Loading...';
    
    switch (followStatus) {
      case 'pending':
        return 'Request Sent';
      case 'following':
        return 'Following';
      default:
        return 'Follow';
    }
  };

  const getFollowButtonIcon = () => {
    if (isFollowLoading) return null;
    
    switch (followStatus) {
      case 'following':
        return <UserCheck size={16} />;
      default:
        return <UserPlus size={16} />;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const query = searchQuery.toLowerCase();

      const matchedUser = allUsers.find(user =>
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );

      if (matchedUser) {
         navigate(`/profile/${matchedUser.id}`);
      } else {
        alert("No user found with that name or email.");
      }
    } catch (error) {
      console.error('Error searching users:', error);
      alert('Search failed. Please try again.');
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

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading profile...</div>;
  if (!userData) return <div style={{padding: '2rem', textAlign: 'center'}}>User not found.</div>;

  // Don't show follow button if viewing own profile
  const isOwnProfile = currentUser && currentUser.uid === uid;

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
                      {userData.firstName?.[0] || 'U'}{userData.lastName?.[0] || 'U'}
                    </span>
                  )}
                </div>

                <div className="profile-info">
                  <h1 className="profile-name">{userData.firstName} {userData.lastName}</h1>
                  <h2 className="profile-title">{userData.role}</h2>
                  <div className="profile-meta">
                    <span className="profile-company">
                      <Building2 size={16} /> {userData.company}
                    </span>
                    <span className="profile-location">
                      <MapPin size={16} /> {userData.city}, {userData.state}
                    </span>
                  </div>
                  
                  {/* Follow Button - Only show if not own profile and user is logged in */}
                  {!isOwnProfile && currentUser && (
                    <button 
                      className={`follow-btn ${
                        followStatus === 'following' ? 'following' : 
                        followStatus === 'pending' ? 'pending' : ''
                      }`}
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                    >
                      {getFollowButtonIcon()}
                      {getFollowButtonText()}
                    </button>
                  )}
                  
                  {!isOwnProfile && !currentUser && (
                    <p style={{marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem'}}>
                      Please log in to follow this user
                    </p>
                  )}

                  {isOwnProfile && (
                    <p style={{marginTop: '1rem', color: '#10b981', fontSize: '0.875rem'}}>
                      ✅ This is your profile
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <MessageSquare size={20} />
                <div>
                  <span className="stat-value">{posts.length}</span>
                  <span className="stat-label">Posts</span>
                </div>
              </div>
              <div className="stat-item">
                <Users size={20} />
                <div>
                  <span className="stat-value">{userData.followers?.length || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
              </div>
              <div className="stat-item">
                <Users size={20} />
                <div>
                  <span className="stat-value">{userData.following?.length || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
              <div className="stat-item">
                <Eye size={20} />
                <div>
                  <span className="stat-value">2.8K</span>
                  <span className="stat-label">Views</span>
                </div>
              </div>
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
                    <div>
                      <Calendar size={18} /> 
                      Joined {userData.createdAt?.seconds ? 
                        new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 
                        "Unknown"
                      }
                    </div>
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
                <div className="card-header"><h3>Posts ({posts.length})</h3></div>
                {posts.length === 0 ? (
                  <p>No posts yet.</p>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="post-item">
                      <p>{post.content}</p>
                      {post.image && <img src={post.image} alt="Post" className="post-image" />}
                      <small>
                        {post.timestamp?.seconds ? 
                          new Date(post.timestamp.seconds * 1000).toLocaleString() : 
                          'Unknown date'
                        }
                      </small>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeSection === 'connections' && (
              <div className="profile-card">
                <div className="card-header"><h3>Followers & Following</h3></div>
                
                <div className="connections-section">
                  <h4>Followers ({userData.followers?.length || 0})</h4>
                  {userData.followers?.length === 0 || !userData.followers ? (
                    <p>No followers yet.</p>
                  ) : (
                    <div className="connections-list">
                      <p>Followers list coming soon...</p>
                    </div>
                  )}
                </div>

                <div className="connections-section">
                  <h4>Following ({userData.following?.length || 0})</h4>
                  {userData.following?.length === 0 || !userData.following ? (
                    <p>Not following anyone yet.</p>
                  ) : (
                    <div className="connections-list">
                      <p>Following list coming soon...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;