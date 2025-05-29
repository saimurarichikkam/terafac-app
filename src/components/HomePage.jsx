// src/components/HomePage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, MessageCircle, Home, AlertTriangle, User, Heart, MessageSquare, Share2, Camera, FileText, BarChart3, MapPin, Send, LogOut } from 'lucide-react';
import './HomePage.css';
import TerafacLogo from '../assets/icons/Terafac_Logo_bg.png';
import Chat from './Chat';
import Profile from './Profile';
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { addDoc, serverTimestamp } from 'firebase/firestore';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [profileData, setProfileData] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const navigate = useNavigate();

  const [posts, setPosts] = useState([
    {
      id: 1,
      user: "Sarah Johnson",
      company: "Tata Steel Manufacturing",
      location: "Mumbai, Maharashtra",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face",
      time: "2 hours ago",
      content: "Production efficiency increased by 12% this quarter! Great teamwork on optimizing the assembly line process. 🚀",
      likes: 24,
      comments: 8,
      shares: 3,
      liked: false,
      commentsList: []
    },
    {
      id: 2,
      user: "Rajesh Kumar",
      company: "Mahindra Auto Parts",
      location: "Chennai, Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      time: "4 hours ago",
      content: "Implementing new quality control measures using IoT sensors. Defect rate down by 35% in just 2 weeks! #QualityFirst #IoT",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop",
      likes: 47,
      comments: 12,
      shares: 8,
      liked: false,
      commentsList: []
    },
    {
      id: 3,
      user: "Priya Sharma",
      company: "Green Tech Solutions",
      location: "Bangalore, Karnataka",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      time: "6 hours ago",
      content: "Excited to announce our partnership with local suppliers for sustainable packaging solutions. Together we're reducing our carbon footprint by 40%! 🌱",
      likes: 89,
      comments: 23,
      shares: 15,
      liked: false,
      commentsList: []
    },
    {
      id: 4,
      user: "Amit Patel",
      company: "Innovation Metals Ltd",
      location: "Pune, Maharashtra",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      time: "8 hours ago",
      content: "Our new automated welding system is performing beyond expectations. Precision increased by 28% and production time reduced by 20%. The future of manufacturing is here!",
      likes: 156,
      comments: 34,
      shares: 22,
      liked: false,
      commentsList: []
    }
  ]);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const tabIcons = {
    'Home': Home,
    'Chat': MessageCircle,
    'Alerts': AlertTriangle,
    'Profile': User
  };

  const quickStats = [
    { label: "Active Companies", value: "2.3K", trend: "+12%" },
    { label: "This Month's Posts", value: "45.6K", trend: "+8%" },
    { label: "Manufacturing Jobs", value: "1.2K", trend: "+15%" }
  ];

  // Handle photo selection
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
  const user = auth.currentUser;
  if (!user || (!newPostText.trim() && !selectedImage)) return;

  // Handle posting
    const post = {
      userId: user.uid,
      userName: `${profileData.firstName} ${profileData.lastName}`,
      company: profileData.company,
      role: profileData.role,
      city: profileData.city || '',
      state: profileData.state || '',
      avatar: profileData.avatar || '',
      content: newPostText,
      image: selectedImage || '',
      likes: 0,
      shares: 0,
      comments: [],
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "posts"), post);  // Save to Firestore
      setNewPostText('');
      setSelectedImage(null);
      setShowCreatePost(false);
      fetchPosts(); // Refresh posts from Firestore
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post.");
    }
  };

  // Handle like
  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  // Handle comment
  const handleComment = (postId) => {
    setActivePostId(postId);
    setShowCommentModal(true);
  };

  const submitComment = () => {
    if (newComment.trim()) {
      setPosts(posts.map(post => {
        if (post.id === activePostId) {
          return {
            ...post,
            comments: post.comments + 1,
            commentsList: [
              ...post.commentsList,
              {
                id: Date.now(),
                user: "Sai Murari",
                text: newComment,
                time: "Just now"
              }
            ]
          };
        }
        return post;
      }));
      setNewComment('');
      setShowCommentModal(false);
    }
  };

  // Handle share
  const handleShare = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          shares: post.shares + 1
        };
      }
      return post;
    }));
    
    // You can add actual sharing functionality here
    if (navigator.share) {
      navigator.share({
        title: 'TERAFAC Manufacturing Hub',
        text: 'Check out this post on TERAFAC',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Confirm logout
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear any stored user data (if using localStorage/sessionStorage)
      // localStorage.removeItem('userToken');
      
      // Navigate back to login page
      navigate('/login');
    }
  };

   useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfileData(data);  
        setUserData(data);
      }
      setLoading(false);
    };

    // Initial fetch
    fetchUserProfile();

    // Listen for localStorage updates
    const interval = setInterval(() => {
      if (localStorage.getItem("profileUpdated")) {
        fetchUserProfile();
        localStorage.removeItem("profileUpdated");
      }
    }, 1000); // checks every second

    return () => clearInterval(interval);
  }, []);

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
     navigate(`/profile/${matchedUser.id}`); // Either use user.uid or doc.id
  } else {
    alert("No user found with that name or email.");
  }
};

const fetchPosts = async () => {
  const snapshot = await getDocs(collection(db, 'posts'));
  const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort by timestamp descending
  setPosts(allPosts.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
};

useEffect(() => {
  fetchPosts();
}, []);



if (loading) return <div>Loading...</div>;

  return (
    
    <div className="homepage-container">
      {/* Header */}
      <header className="homepage-header">
        <div className="header-content">
          <div className="logo-section">
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
        
        {/* Chat Section */}
        {activeTab === 'Chat' && <Chat />}

        {/* Home Section */}
        {activeTab === 'Home' && (
          <>
            {/* Desktop: Side-by-side layout */}
            <div className="desktop-layout">
              {/* Left Sidebar - Desktop */}
              <div className="sidebar">
                {/* Profile Card */}
                <div className="card profile-card">
                  <div className="profile-avatar">
                    <span>
                      {userData?.firstName && userData?.lastName
                        ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                        : "SM"}
                    </span>
                  </div>
                  <h3 className="profile-name">{profileData.firstName} {profileData.lastName}</h3>
                  <p className="profile-role">{profileData.role} </p>
                  <p className="profile-company">{profileData.company}</p>
                </div>

                {/* Quick Stats */}
                <div className="card stats-card">
                  <h4>Industry Overview</h4>
                  {quickStats.map((stat, index) => (
                    <div key={index} className="stat-row">
                      <span className="stat-label">{stat.label}</span>
                      <div>
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-trend">{stat.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Feed - Desktop */}
              <div className="feed-section">
                {/* Create Post */}
                <div className="create-post">
                  <div className="create-post-row">
                    <div className="user-avatar">
                      <span>
                      {userData?.firstName && userData?.lastName
                        ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                        : "SM"}
                    </span>
                    </div>
                    <button 
                      className="create-post-input"
                      onClick={() => setShowCreatePost(!showCreatePost)}
                    >
                      Share an update with your team...
                    </button>
                  </div>
                  {showCreatePost && (
                    <div className="create-post-expanded">
                      <textarea 
                        className="create-post-textarea"
                        rows="3"
                        placeholder="Share your manufacturing insights..."
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                      />
                      {selectedImage && (
                        <div className="selected-image-preview">
                          <img src={selectedImage} alt="Selected" className="preview-image" />
                          <button 
                            className="remove-image-btn"
                            onClick={() => setSelectedImage(null)}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <div className="create-post-actions">
                        <div className="media-options">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                          />
                          <button className="media-btn" onClick={handlePhotoClick}>
                            <Camera size={16} />
                            <span>Photo</span>
                          </button>
                          <button className="media-btn">
                            <FileText size={16} />
                            <span>Document</span>
                          </button>
                          <button className="media-btn">
                            <BarChart3 size={16} />
                            <span>Analytics</span>
                          </button>
                        </div>
                        <button className="post-btn" onClick={handlePost}>
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Posts */}
                <div className="posts-container">
                  {posts.map((post) => (
                    <div key={post.id} className="post-card">
                      <div className="post-content">
                        <div className="post-header">
                          <img src={post.avatar} alt="" className="post-avatar" />
                          <div className="post-user-info">
                            <h3 className="post-username">{post.userName}</h3>
                              <p className="post-role-company">{post.role} at {post.company}</p>
                              <div className="post-meta">
                                <MapPin size={12} />
                                <span>{post.city}, {post.state}</span>
                              </div>
                          </div>
                        </div>
                        
                        <div className="post-text">
                          <p>{post.content}</p>
                          {post.image && (
                            <img src={post.image} alt="" className="post-image" />
                          )}
                        </div>
                        
                        <div className="post-actions">
                          <button 
                            className={`action-btn like-btn ${post.liked ? 'liked' : ''}`}
                            onClick={() => handleLike(post.id)}
                          >
                            <Heart size={20} fill={post.liked ? '#ef4444' : 'none'} />
                            <span>{post.likes} Like</span>
                          </button>
                          <button 
                            className="action-btn comment-btn"
                            onClick={() => handleComment(post.id)}
                          >
                            <MessageSquare size={20} />
                            <span>{post.comments} Comment</span>
                          </button>
                          <button 
                            className="action-btn share-btn"
                            onClick={() => handleShare(post.id)}
                          >
                            <Share2 size={20} />
                            <span>{post.shares} Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile/Tablet: Single column layout */}
            <div className="mobile-layout">
              {/* Create Post - Mobile */}
              <div className="mobile-create-post">
                <div className="mobile-create-row">
                  <div className="user-avatar">
                    <span>SM</span>
                  </div>
                  <input
                    type="text"
                    className="mobile-post-input"
                    placeholder="Share an update with your team..."
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                  />
                  <button className="mobile-post-btn" onClick={handlePost}>
                    Post
                  </button>
                </div>
              </div>

              {/* Posts - Mobile */}
              <div className="posts-container">
                {posts.map((post) => (
                  <div key={post.id} className="mobile-post-card">
                    <div className="mobile-post-content">
                      <div className="mobile-post-header">
                        <img src={post.avatar} alt="" className="mobile-post-avatar" />
                        <div className="post-user-info">
                          <h3 className="mobile-post-username">{post.user}</h3>
                          <p className="mobile-post-time">{post.time}</p>
                        </div>
                      </div>
                      
                      <div className="mobile-post-text">
                        <p>{post.content}</p>
                        {post.image && (
                          <img src={post.image} alt="" className="mobile-post-image" />
                        )}
                      </div>
                      
                      <div className="mobile-post-actions">
                        <button 
                          className={`mobile-action-btn ${post.liked ? 'liked' : ''}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart size={16} fill={post.liked ? '#ef4444' : 'none'} />
                          <span>Like</span>
                        </button>
                        <button 
                          className="mobile-action-btn"
                          onClick={() => handleComment(post.id)}
                        >
                          <MessageSquare size={16} />
                          <span>Comment</span>
                        </button>
                        <button 
                          className="mobile-action-btn"
                          onClick={() => handleShare(post.id)}
                        >
                          <Share2 size={16} />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Alerts Section */}
        {activeTab === 'Alerts' && (
          <div className="alerts-container">
            <h2>Notifications & Alerts</h2>
            <p>Your notifications will appear here.</p>
          </div>
        )}

        {/* Profile Section */}
        {activeTab === 'Profile' && <Profile />}
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Comment</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCommentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <textarea
                className="comment-textarea"
                placeholder="Write your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="3"
              />
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowCommentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="submit-comment-btn"
                  onClick={submitComment}
                >
                  <Send size={16} />
                  Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <div className="nav-grid">
            {Object.entries(tabIcons).map(([tab, Icon]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{tab}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;