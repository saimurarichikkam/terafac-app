import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, MessageCircle, Home, Award, User, Heart, MessageSquare, Share2, Camera, FileText, BarChart3, MapPin, Send, LogOut, Check, X, UserPlus } from 'lucide-react';
import './HomePage.css';
import TerafacLogo from '../assets/icons/Terafac_Logo_bg.png';
import Profile from './Profile';
import Rewards, { useRewardsActions } from './Rewards';
import Chat from './Chat'; // Import the new Chat component
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, writeBatch } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { addDoc, serverTimestamp } from 'firebase/firestore';

const HomePage = () => {
  // State declarations (removed chat-related states)
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

  // Navigation
  const navigate = useNavigate();

  // Posts and comments states
  const [posts, setPosts] = useState([]);
  const [postComments, setPostComments] = useState({}); // Store comments for each post
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState({}); // Track which posts show comments
  const fileInputRef = useRef(null);

  // Get rewards actions hook for awarding points
  const { awardPoints } = useRewardsActions();

  const tabIcons = {
    'Home': Home,
    'Chat': MessageCircle,
    'Rewards': Award,
    'Profile': User
  };

  const quickStats = [
    { label: "Active Companies", value: "2.3K", trend: "+12%" },
    { label: "This Month's Posts", value: "45.6K", trend: "+8%" },
    { label: "Manufacturing Jobs", value: "1.2K", trend: "+15%" }
  ];

  // Fetch comments for a specific post
  const fetchCommentsForPost = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(commentsQuery);
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPostComments(prev => ({
        ...prev,
        [postId]: comments
      }));

      return comments;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      // Fallback: try without orderBy if index doesn't exist
      try {
        const simpleQuery = query(
          collection(db, 'comments'),
          where('postId', '==', postId)
        );
        const snapshot = await getDocs(simpleQuery);
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const aTime = a.timestamp?.seconds || 0;
          const bTime = b.timestamp?.seconds || 0;
          return aTime - bTime;
        });

        setPostComments(prev => ({
          ...prev,
          [postId]: comments
        }));

        return comments;
      } catch (fallbackError) {
        console.error(`Fallback error fetching comments for post ${postId}:`, fallbackError);
        return [];
      }
    }
  };

  // Fetch all comments for all posts
  const fetchAllComments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'comments'));
      const allComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group comments by postId
      const commentsByPost = {};
      allComments.forEach(comment => {
        if (!commentsByPost[comment.postId]) {
          commentsByPost[comment.postId] = [];
        }
        commentsByPost[comment.postId].push(comment);
      });

      // Sort comments by timestamp for each post
      Object.keys(commentsByPost).forEach(postId => {
        commentsByPost[postId].sort((a, b) => {
          const aTime = a.timestamp?.seconds || 0;
          const bTime = b.timestamp?.seconds || 0;
          return aTime - bTime;
        });
      });

      setPostComments(commentsByPost);
    } catch (error) {
      console.error('Error fetching all comments:', error);
    }
  };

  // Submit a new comment
  const submitComment = async () => {
    if (!newComment.trim() || !activePostId || !auth.currentUser) return;

    try {
      const commentData = {
        postId: activePostId,
        userId: auth.currentUser.uid,
        userName: `${profileData?.firstName || ''} ${profileData?.lastName || ''}`,
        userAvatar: profileData?.avatar || '',
        content: newComment.trim(),
        timestamp: serverTimestamp(),
        likes: 0
      };

      // Add comment to Firebase
      const commentRef = await addDoc(collection(db, 'comments'), commentData);

      // Update post's comment count
      const postRef = doc(db, 'posts', activePostId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentComments = postSnap.data().comments || 0;
        await updateDoc(postRef, {
          comments: currentComments + 1
        });
      }

      // Update local state immediately
      const newCommentWithId = {
        id: commentRef.id,
        ...commentData,
        timestamp: { seconds: Date.now() / 1000 } // Temporary timestamp for UI
      };

      setPostComments(prev => ({
        ...prev,
        [activePostId]: [...(prev[activePostId] || []), newCommentWithId]
      }));

      // Update posts state to reflect new comment count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === activePostId
            ? { ...post, comments: (post.comments || 0) + 1 }
            : post
        )
      );

      // Clear form and close modal
      setNewComment('');
      setShowCommentModal(false);

      // Show comments section for this post
      setShowComments(prev => ({ ...prev, [activePostId]: true }));

      // Award points for commenting
      await awardPoints(20, 'commenting on a post');

      // Send notification to post owner if it's not their own comment
      const post = posts.find(p => p.id === activePostId);
      if (post && post.userId !== auth.currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: post.userId,
          senderId: auth.currentUser.uid,
          senderName: `${profileData?.firstName} ${profileData?.lastName}`,
          senderAvatar: profileData?.avatar || '',
          type: 'comment',
          message: `${profileData?.firstName} commented on your post`,
          postId: activePostId,
          read: false,
          timestamp: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  // Toggle comments visibility for a post
  const toggleComments = async (postId) => {
    const isCurrentlyShowing = showComments[postId];

    if (!isCurrentlyShowing) {
      // Fetch comments if not already loaded
      if (!postComments[postId]) {
        await fetchCommentsForPost(postId);
      }
    }

    setShowComments(prev => ({
      ...prev,
      [postId]: !isCurrentlyShowing
    }));
  };

  // Handle comment button click
  const handleComment = (postId) => {
    setActivePostId(postId);
    setShowCommentModal(true);
  };

  // Updated fetchNotifications function
  const fetchNotifications = async () => {
    if (!auth.currentUser) return;

    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', auth.currentUser.uid),
        limit(20)
      );

      const snapshot = await getDocs(notificationsQuery);
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const sortedNotifications = userNotifications.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime;
      });

      setNotifications(sortedNotifications);
      const unread = sortedNotifications.filter(notif => !notif.read).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Updated handleAcceptFollowRequest with proper connection counting
  const handleAcceptFollowRequest = async (notification) => {
    try {
      if (!auth.currentUser || !notification.senderId) {
        throw new Error('Missing user information');
      }

      console.log('Processing follow request acceptance...');

      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const senderRef = doc(db, 'users', notification.senderId);

      const currentUserSnap = await getDoc(currentUserRef);
      const currentUserData = currentUserSnap.data() || {};

      const senderSnap = await getDoc(senderRef);
      const senderData = senderSnap.data() || {};

      const currentUserConnections = currentUserData.connections || 0;
      const senderConnections = senderData.connections || 0;

      const batch = writeBatch(db);

      batch.update(currentUserRef, {
        followers: arrayUnion(notification.senderId),
        followRequests: arrayRemove(notification.senderId),
        connections: currentUserConnections + 1
      });

      batch.update(senderRef, {
        following: arrayUnion(auth.currentUser.uid),
        connections: senderConnections + 1
      });

      const notificationRef = doc(db, 'notifications', notification.id);
      batch.delete(notificationRef);

      await batch.commit();

      // Award points for new connection
      await awardPoints(100, 'accepting a connection request');

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

      setUserData(prevData => ({
        ...prevData,
        connections: currentUserConnections + 1
      }));

      if (profileData) {
        setProfileData(prevData => ({
          ...prevData,
          connections: currentUserConnections + 1
        }));
      }

      await fetchNotifications();
      localStorage.setItem("profileUpdated", Date.now().toString());
      localStorage.setItem("connectionsUpdated", Date.now().toString());

      alert(`Follow request accepted! You now have ${currentUserConnections + 1} connection${currentUserConnections + 1 !== 1 ? 's' : ''}.`);

    } catch (error) {
      console.error('Error accepting follow request:', error);
      alert('Failed to accept follow request. Please try again.');
    }
  };

  const handleRejectFollowRequest = async (notification) => {
    try {
      if (!auth.currentUser || !notification.senderId) {
        throw new Error('Missing user information');
      }

      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(currentUserRef, {
        followRequests: arrayRemove(notification.senderId)
      });

      await deleteDoc(doc(db, 'notifications', notification.id));
      await fetchNotifications();
      alert('Follow request rejected');

    } catch (error) {
      console.error('Error rejecting follow request:', error);
      alert('Failed to reject follow request. Please try again.');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

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

      // Award points for creating a post
      await awardPoints(50, 'creating a post');

      const connections = profileData?.followers || [];
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

  const handleLike = async (postId) => {
    // Award points for receiving likes (you might want to implement this differently)
    await awardPoints(10, 'receiving a like');
    
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

    if (navigator.share) {
      navigator.share({
        title: 'TERAFAC Manufacturing Hub',
        text: 'Check out this post on TERAFAC',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      navigate('/login');
    }
  };

  const fetchPosts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'posts'));
      const allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        liked: false,
        commentsList: doc.data().commentsList || []
      }));

      const sortedPosts = allPosts.sort((a, b) => {
        if (a.timestamp?.seconds && b.timestamp?.seconds) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
      });

      setPosts(sortedPosts);

      // Fetch comments for all posts
      await fetchAllComments();
    } catch (error) {
      console.error("Error fetching posts:", error);
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

    fetchUserProfile();

    if (auth.currentUser) {
      fetchNotifications();
    }

    const interval = setInterval(() => {
      if (localStorage.getItem("profileUpdated")) {
        fetchUserProfile();
        localStorage.removeItem("profileUpdated");
      }

      if (localStorage.getItem("postsUpdated")) {
        fetchPosts();
        localStorage.removeItem("postsUpdated");
      }

      if (auth.currentUser) {
        fetchNotifications();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
              <h1 className="brand-title">TERATALK</h1>
              <p className="brand-subtitle">Powered by Terafac</p>
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

            {/* Notifications dropdown */}
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
                              {notification.type === 'comment' && (
                                <div className="comment-notification">
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

      {/* Main Content */}
      <div className="main-content">
        {/* Use the new Chat component */}
        {activeTab === 'Chat' && <Chat profileData={profileData} />}

        {activeTab === 'Home' && (
          <>
            {/* Desktop layout */}
            <div className="desktop-layout">
              <div className="sidebar">
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

              <div className="feed-section">
                {/* Create Post section */}
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

                {/* Posts with Comments */}
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

                          {/* Comments Section */}
                          {postComments[post.id] && postComments[post.id].length > 0 && (
                            <div className="comments-section">
                              <button
                                className="toggle-comments-btn"
                                onClick={() => toggleComments(post.id)}
                              >
                                {showComments[post.id] ? 'Hide' : 'View'} {postComments[post.id].length} comment{postComments[post.id].length !== 1 ? 's' : ''}
                              </button>

                              {showComments[post.id] && (
                                <div className="comments-container">
                                  {/* First 3 comments - always visible */}
                                  <div className="comments-preview">
                                    {postComments[post.id].slice(0, 3).map((comment) => (
                                      <div key={comment.id} className="comment-item">
                                        <div className="comment-avatar">
                                          {comment.userAvatar ? (
                                            <img src={comment.userAvatar} alt={comment.userName} />
                                          ) : (
                                            <div className="comment-avatar-placeholder">
                                              {comment.userName ?
                                                comment.userName.split(' ').map(n => n[0]).join('').toUpperCase() :
                                                'U'
                                              }
                                            </div>
                                          )}
                                        </div>
                                        <div className="comment-content">
                                          <div className="comment-header">
                                            <span className="comment-author">{comment.userName}</span>
                                            <span className="comment-time">
                                              {comment.timestamp?.seconds ?
                                                new Date(comment.timestamp.seconds * 1000).toLocaleDateString() :
                                                'Just now'
                                              }
                                            </span>
                                          </div>
                                          <p className="comment-text">{comment.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Scrollable container for additional comments */}
                                  {postComments[post.id].length > 3 && (
                                    <div className="comments-scroll-container">
                                      <div className="comments-scroll-header">
                                        <span className="scroll-indicator">
                                          {postComments[post.id].length - 3} more comment{postComments[post.id].length - 3 !== 1 ? 's' : ''} ↓
                                        </span>
                                      </div>
                                      <div className="comments-scrollable">
                                        {postComments[post.id].slice(3).map((comment) => (
                                          <div key={comment.id} className="comment-item">
                                            <div className="comment-avatar">
                                              {comment.userAvatar ? (
                                                <img src={comment.userAvatar} alt={comment.userName} />
                                              ) : (
                                                <div className="comment-avatar-placeholder">
                                                  {comment.userName ?
                                                    comment.userName.split(' ').map(n => n[0]).join('').toUpperCase() :
                                                    'U'
                                                  }
                                                </div>
                                              )}
                                            </div>
                                            <div className="comment-content">
                                              <div className="comment-header">
                                                <span className="comment-author">{comment.userName}</span>
                                                <span className="comment-time">
                                                  {comment.timestamp?.seconds ?
                                                    new Date(comment.timestamp.seconds * 1000).toLocaleDateString() :
                                                    'Just now'
                                                  }
                                                </span>
                                              </div>
                                              <p className="comment-text">{comment.content}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="mobile-layout">
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

                        {/* Mobile Comments Section */}
                        {postComments[post.id] && postComments[post.id].length > 0 && (
                          <div className="mobile-comments-section">
                            <button
                              className="mobile-toggle-comments-btn"
                              onClick={() => toggleComments(post.id)}
                            >
                              {showComments[post.id] ? 'Hide' : 'View'} {postComments[post.id].length} comment{postComments[post.id].length !== 1 ? 's' : ''}
                            </button>

                            {showComments[post.id] && (
                              <div className="mobile-comments-container">
                                {/* First 3 comments - always visible */}
                                <div className="mobile-comments-preview">
                                  {postComments[post.id].slice(0, 3).map((comment) => (
                                    <div key={comment.id} className="mobile-comment-item">
                                      <div className="mobile-comment-avatar">
                                        {comment.userAvatar ? (
                                          <img src={comment.userAvatar} alt={comment.userName} />
                                        ) : (
                                          <div className="mobile-comment-avatar-placeholder">
                                            {comment.userName ?
                                              comment.userName.split(' ').map(n => n[0]).join('').toUpperCase() :
                                              'U'
                                            }
                                          </div>
                                        )}
                                      </div>
                                      <div className="mobile-comment-content">
                                        <div className="mobile-comment-header">
                                          <span className="mobile-comment-author">{comment.userName}</span>
                                          <span className="mobile-comment-time">
                                            {comment.timestamp?.seconds ?
                                              new Date(comment.timestamp.seconds * 1000).toLocaleDateString() :
                                              'Just now'
                                            }
                                          </span>
                                        </div>
                                        <p className="mobile-comment-text">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Scrollable container for additional comments */}
                                {postComments[post.id].length > 3 && (
                                  <div className="mobile-comments-scroll-container">
                                    <div className="mobile-comments-scroll-header">
                                      <span className="mobile-scroll-indicator">
                                        {postComments[post.id].length - 3} more comment{postComments[post.id].length - 3 !== 1 ? 's' : ''} ↓
                                      </span>
                                    </div>
                                    <div className="mobile-comments-scrollable">
                                      {postComments[post.id].slice(3).map((comment) => (
                                        <div key={comment.id} className="mobile-comment-item">
                                          <div className="mobile-comment-avatar">
                                            {comment.userAvatar ? (
                                              <img src={comment.userAvatar} alt={comment.userName} />
                                            ) : (
                                              <div className="mobile-comment-avatar-placeholder">
                                                {comment.userName ?
                                                  comment.userName.split(' ').map(n => n[0]).join('').toUpperCase() :
                                                  'U'
                                              }
                                              </div>
                                            )}
                                          </div>
                                          <div className="mobile-comment-content">
                                            <div className="mobile-comment-header">
                                              <span className="mobile-comment-author">{comment.userName}</span>
                                              <span className="mobile-comment-time">
                                                {comment.timestamp?.seconds ?
                                                  new Date(comment.timestamp.seconds * 1000).toLocaleDateString() :
                                                  'Just now'
                                                }
                                              </span>
                                            </div>
                                            <p className="mobile-comment-text">{comment.content}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Use the Rewards component */}
        {activeTab === 'Rewards' && <Rewards profileData={profileData} />}

        {activeTab === 'Alerts' && (
          <div className="alerts-container">
            <h2>Notifications & Alerts</h2>
            <p>Your notifications will appear here.</p>
          </div>
        )}

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
                  disabled={!newComment.trim()}
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