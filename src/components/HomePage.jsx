// Updated HomePage.jsx with better error handling and Firebase fixes

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, MessageCircle, Home, AlertTriangle, User, Heart, MessageSquare, Share2, Camera, FileText, BarChart3, MapPin, Send, LogOut, Check, X, UserPlus } from 'lucide-react';
import './HomePage.css';
import TerafacLogo from '../assets/icons/Terafac_Logo_bg.png';
import Chat from './Chat';
import Profile from './Profile';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
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

  // Notification system states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  // Remove the static posts array - we'll fetch from Firebase
  const [posts, setPosts] = useState([]);

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



  // Fetch notifications for current user with better error handling
  const fetchNotifications = async () => {
    if (!auth.currentUser) return;

    try {
      // First, try to get notifications without orderBy to avoid index issues
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', auth.currentUser.uid),
        limit(20) // Limit to prevent too much data
      );

      const snapshot = await getDocs(notificationsQuery);
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort on client side to avoid index requirements
      const sortedNotifications = userNotifications.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime;
      });

      setNotifications(sortedNotifications);

      // Count unread notifications
      const unread = sortedNotifications.filter(notif => !notif.read).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback: Set empty notifications to prevent UI issues
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Handle follow request acceptance with better error handling
  const handleAcceptFollowRequest = async (notification) => {
    try {
      if (!auth.currentUser || !notification.senderId) {
        throw new Error('Missing user information');
      }

      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const senderRef = doc(db, 'users', notification.senderId);

      // Get current user data first to check existing arrays
      const currentUserSnap = await getDoc(currentUserRef);
      const currentUserData = currentUserSnap.data() || {};

      // Add to followers/following with safety checks
      await updateDoc(currentUserRef, {
        followers: arrayUnion(notification.senderId),
        followRequests: arrayRemove(notification.senderId),
        connections: arrayUnion(notification.senderId)
      });

      await updateDoc(senderRef, {
        following: arrayUnion(auth.currentUser.uid),
        connections: arrayUnion(auth.currentUser.uid)
      });

      // Delete the notification
      await deleteDoc(doc(db, 'notifications', notification.id));

      // Create acceptance notification for sender
      if (userData?.firstName && userData?.lastName) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: notification.senderId,
          senderId: auth.currentUser.uid,
          senderName: `${userData.firstName} ${userData.lastName}`,
          senderAvatar: userData.avatar || '',
          type: 'follow_accepted',
          message: `${userData.firstName} ${userData.lastName} accepted your follow request`,
          read: false,
          timestamp: serverTimestamp()
        });
      }

      // Refresh notifications
      await fetchNotifications();
      alert('Follow request accepted!');

    } catch (error) {
      console.error('Error accepting follow request:', error);
      alert('Failed to accept follow request. Please try again.');
    }
  };

  // Handle follow request rejection with better error handling
  const handleRejectFollowRequest = async (notification) => {
    try {
      if (!auth.currentUser || !notification.senderId) {
        throw new Error('Missing user information');
      }

      const currentUserRef = doc(db, 'users', auth.currentUser.uid);

      // Remove from follow requests
      await updateDoc(currentUserRef, {
        followRequests: arrayRemove(notification.senderId)
      });

      // Delete the notification
      await deleteDoc(doc(db, 'notifications', notification.id));

      // Refresh notifications
      await fetchNotifications();
      alert('Follow request rejected');

    } catch (error) {
      console.error('Error rejecting follow request:', error);
      alert('Failed to reject follow request. Please try again.');
    }
  };

  // Mark notification as read with error handling
  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Don't show alert for this as it's not critical
    }
  };

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

    const post = {
      userId: user.uid,
      userName: `${profileData?.firstName || ''} ${profileData?.lastName || ''}`,
      company: profileData?.company || '',
      role: profileData?.role || '',
      city: profileData?.city || '',
      state: profileData?.state || '',
      avatar: profileData?.avatar || '',
      content: newPostText,
      image: selectedImage || '',
      likes: 0,
      shares: 0,
      comments: 0,
      timestamp: serverTimestamp(),
    };

    try {
      const postRef = await addDoc(collection(db, "posts"), post);
      const postId = postRef.id;

      // Send notifications to all connections
      const connections = profileData?.connections || [];
      const truncatedText = newPostText.substring(0, 100) + (newPostText.length > 100 ? "..." : "");

      await Promise.all(
        connections.map(connId =>
          addDoc(collection(db, 'notifications'), {
            recipientId: connId,
            senderId: user.uid,
            senderName: `${profileData?.firstName} ${profileData?.lastName}`,
            senderAvatar: profileData?.avatar || '',
            type: 'new_post',
            message: `${profileData?.firstName} posted: "${truncatedText}"`,
            postId: postId,
            read: false,
            timestamp: serverTimestamp()
          })
        )
      );

      setNewPostText('');
      setSelectedImage(null);
      setShowCreatePost(false);
      fetchPosts();

    } catch (error) {
      console.error("Error saving post or sending notifications:", error);
      alert("Failed to save post.");
    }
  };

  // Handle like - Update this to work with Firebase posts
  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? (post.likes || 1) - 1 : (post.likes || 0) + 1
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
            comments: (post.comments || 0) + 1,
            commentsList: [
              ...(post.commentsList || []),
              {
                id: Date.now(),
                user: `${profileData?.firstName || ''} ${profileData?.lastName || ''}`,
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
          shares: (post.shares || 0) + 1
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

  // FIXED: Fetch posts from Firebase with better error handling
  const fetchPosts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'posts'));
      const allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        liked: false, // Add default liked state for UI
        commentsList: doc.data().commentsList || []
      }));

      // Sort by timestamp descending (newest first)
      const sortedPosts = allPosts.sort((a, b) => {
        if (a.timestamp?.seconds && b.timestamp?.seconds) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
      });

      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      // Set empty posts array to prevent UI issues
      setPosts([]);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUserProfile();

    // Only fetch notifications if user is logged in
    if (auth.currentUser) {
      fetchNotifications();
    }

    // Listen for localStorage updates (profile changes)
    const interval = setInterval(() => {
      if (localStorage.getItem("profileUpdated")) {
        fetchUserProfile();
        localStorage.removeItem("profileUpdated");
      }

      // ADDED: Listen for post deletions
      if (localStorage.getItem("postsUpdated")) {
        fetchPosts();
        localStorage.removeItem("postsUpdated");
      }

      // Refresh notifications periodically (only if user is logged in)
      if (auth.currentUser) {
        fetchNotifications();
      }
    }, 5000); // Reduced frequency to every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Initial posts fetch
  useEffect(() => {
    if (auth.currentUser) {
      fetchPosts();
    }
  }, []);

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
      console.error("Error searching users:", error);
      alert("Search failed. Please try again.");
    }
  };

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

            {/* Notifications Button */}
            <div className="notifications-container">
              <button
                className="header-btn notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button
                      className="close-notifications"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            if (notification.type === 'new_post' && notification.postId) {
                              setActiveTab('Home');
                              setTimeout(() => {
                                const postElement = document.getElementById(`post-${notification.postId}`);
                                if (postElement) {
                                  postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  postElement.classList.add('highlight');
                                  setTimeout(() => postElement.classList.remove('highlight'), 2000);
                                }
                              }, 200);
                            }
                          }}
                        >
                          <div className="notification-avatar">
                            {notification.senderAvatar ? (
                              <img src={notification.senderAvatar} alt={notification.senderName} />
                            ) : (
                              <div className="avatar-placeholder">
                                {notification.senderName?.split(' ').map(n => n[0]).join('') || 'U'}
                              </div>
                            )}
                          </div>

                          <div className="notification-content">
                            <div className="notification-message">

                              {notification.type === 'new_post' && (
                                <div className="new-post-notification">
                                  <MessageSquare size={16} className="notification-icon" />
                                  <span>{notification.message}</span>
                                </div>
                              )}
                              {notification.type === 'follow_request' && (
                                <div className="follow-request">
                                  <UserPlus size={16} className="notification-icon" />
                                  <span>{notification.message}</span>
                                </div>
                              )}
                              {notification.type === 'follow_accepted' && (
                                <div className="follow-accepted">
                                  <Check size={16} className="notification-icon" />
                                  <span>{notification.message}</span>
                                </div>
                              )}
                            </div>

                            <div className="notification-time">
                              {notification.timestamp?.seconds ?
                                new Date(notification.timestamp.seconds * 1000).toLocaleString() :
                                'Just now'
                              }
                            </div>

                            {notification.type === 'follow_request' && (
                              <div className="follow-request-actions">
                                <button
                                  className="accept-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptFollowRequest(notification);
                                  }}
                                >
                                  <Check size={14} />
                                  Accept
                                </button>
                                <button
                                  className="reject-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectFollowRequest(notification);
                                  }}
                                >
                                  <X size={14} />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

      {/* Rest of the component remains the same... */}
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
                    {userData?.avatar ? (
                      <img
                        src={userData.avatar}
                        alt="Profile"
                        className="profile-avatar-image"
                      />
                    ) : (
                      <span>
                        {userData?.firstName && userData?.lastName
                          ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                          : "SM"}
                      </span>
                    )}
                  </div>
                  <h3 className="profile-name">{profileData?.firstName} {profileData?.lastName}</h3>
                  <p className="profile-role">{profileData?.role}</p>
                  <p className="profile-company">{profileData?.company}</p>
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
                      {userData?.avatar ? (
                        <img
                          src={userData.avatar}
                          alt="Profile"
                          className="user-avatar-image"
                        />
                      ) : (
                        <span>
                          {userData?.firstName && userData?.lastName
                            ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                            : "SM"}
                        </span>
                      )}
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
                  {posts.length === 0 ? (
                    <div className="no-posts">
                      <p>No posts available. Be the first to share something!</p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} id={`post-${post.id}`} className="post-card">
                        <div className="post-content">
                          <div className="post-header">
                            {post.avatar ? (
                              <img
                                src={post.avatar}
                                alt=""
                                className="post-avatar"
                              />
                            ) : (
                              <div className="post-avatar-fallback">
                                {post.userName ?
                                  post.userName.split(' ').map(n => n[0]).join('').toUpperCase() :
                                  'MP'
                                }
                              </div>
                            )}
                            <div className="post-user-info">
                              <h3 className="post-username">{post.userName || post.user}</h3>
                              <p className="post-role-company">
                                {post.role && post.company ? `${post.role} at ${post.company}` :
                                  post.company || 'Manufacturing Professional'}
                              </p>
                              {(post.city && post.state) && (
                                <div className="post-meta">
                                  <MapPin size={12} />
                                  <span>{post.city}, {post.state}</span>
                                </div>
                              )}
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
                              <span>{post.likes || 0} Like</span>
                            </button>
                            <button
                              className="action-btn comment-btn"
                              onClick={() => handleComment(post.id)}
                            >
                              <MessageSquare size={20} />
                              <span>{post.comments || 0} Comment</span>
                            </button>
                            <button
                              className="action-btn share-btn"
                              onClick={() => handleShare(post.id)}
                            >
                              <Share2 size={20} />
                              <span>{post.shares || 0} Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Mobile/Tablet layout and rest of component... */}
            <div className="mobile-layout">
              {/* Create Post - Mobile */}
              <div className="mobile-create-post">
                <div className="mobile-create-row">
                  <div className="user-avatar">
                    {userData?.avatar ? (
                      <img
                        src={userData.avatar}
                        alt="Profile"
                        className="user-avatar-image"
                      />
                    ) : (
                      <span>
                        {userData?.firstName && userData?.lastName
                          ? `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase()
                          : "SM"}
                      </span>
                    )}
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
                {posts.length === 0 ? (
                  <div className="no-posts">
                    <p>No posts available. Be the first to share something!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="mobile-post-card">
                      <div className="mobile-post-content">
                        <div className="mobile-post-header">
                          {post.avatar ? (
                            <img
                              src={post.avatar}
                              alt=""
                              className="mobile-post-avatar"
                            />
                          ) : (
                            <div className="mobile-post-avatar-fallback">
                              {post.userName ?
                                post.userName.split(' ').map(n => n[0]).join('').toUpperCase() :
                                'MP'
                              }
                            </div>
                          )}
                          <div className="post-user-info">
                            <h3 className="mobile-post-username">{post.userName || post.user}</h3>
                            <p className="mobile-post-time">
                              {post.timestamp?.seconds ?
                                new Date(post.timestamp.seconds * 1000).toLocaleString() :
                                post.time || 'Unknown time'
                              }
                            </p>
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
                  ))
                )}
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