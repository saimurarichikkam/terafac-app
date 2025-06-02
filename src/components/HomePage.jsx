import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, MessageCircle, Home, Award, User, Heart, MessageSquare, Share2, Camera, FileText, BarChart3, MapPin, Send, LogOut, Check, X, UserPlus, Phone, Video, MoreHorizontal, ArrowLeft, Circle, Medal } from 'lucide-react';
import './HomePage.css';
import TerafacLogo from '../assets/icons/Terafac_Logo_bg.png';
import Profile from './Profile';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, writeBatch, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { addDoc, serverTimestamp } from 'firebase/firestore';

const HomePage = () => {
  // State declarations
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
  
  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const chatMessagesEndRef = useRef(null);
  
  // Navigation
  const navigate = useNavigate();

  // Rewards/Events states
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  // Posts and comments states
  const [posts, setPosts] = useState([]);
  const [postComments, setPostComments] = useState({}); // Store comments for each post
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState({}); // Track which posts show comments
  const fileInputRef = useRef(null);

  const tabIcons = {
    'Home': Home,
    'Chat': MessageCircle,
    'Rewards': Award,
    'Profile': User
  };

  // Manufacturing events and rewards data
  const manufacturingRewards = [
    {
      id: 1,
      title: "Manufacturing Summit 2025",
      description: "Join industry leaders discussing the future of smart manufacturing and Industry 4.0 technologies.",
      location: "Detroit, MI",
      date: "March 15, 2025",
      time: "9:00 AM - 5:00 PM",
      pointsRequired: 500,
      category: "Conference",
      image: "🏭",
      benefits: ["Networking with 500+ professionals", "Latest tech demos", "Expert workshops", "Lunch included"],
      organizer: "Manufacturing Excellence Institute",
      availability: "25 tickets left"
    },
    {
      id: 2,
      title: "Automation & Robotics Expo",
      description: "Discover cutting-edge automation solutions and robotics innovations transforming manufacturing.",
      location: "Chicago, IL",
      date: "April 8-10, 2025",
      time: "10:00 AM - 6:00 PM",
      pointsRequired: 750,
      category: "Exhibition",
      image: "🤖",
      benefits: ["Hands-on robot demos", "AI workshops", "Startup showcase", "3-day access"],
      organizer: "Robotics Innovation Alliance",
      availability: "15 tickets left"
    },
    {
      id: 3,
      title: "Sustainable Manufacturing Workshop",
      description: "Learn about eco-friendly manufacturing processes and sustainable supply chain management.",
      location: "Portland, OR",
      date: "March 22, 2025",
      time: "1:00 PM - 6:00 PM",
      pointsRequired: 300,
      category: "Workshop",
      image: "♻️",
      benefits: ["Certification included", "Green tech showcase", "Policy insights", "Networking dinner"],
      organizer: "Green Manufacturing Council",
      availability: "40 tickets left"
    },
    {
      id: 4,
      title: "3D Printing & Additive Manufacturing",
      description: "Explore the latest in 3D printing technologies and their applications in modern manufacturing.",
      location: "Austin, TX",
      date: "April 18, 2025",
      time: "9:00 AM - 4:00 PM",
      pointsRequired: 400,
      category: "Technical Session",
      image: "🖨️",
      benefits: ["Live 3D printing demos", "Material samples", "Design workshops", "Tech talks"],
      organizer: "Additive Manufacturing Society",
      availability: "30 tickets left"
    },
    {
      id: 5,
      title: "Supply Chain Optimization Summit",
      description: "Master the art of efficient supply chain management and logistics in manufacturing.",
      location: "Atlanta, GA",
      date: "May 5, 2025",
      time: "8:00 AM - 5:00 PM",
      pointsRequired: 600,
      category: "Summit",
      image: "📦",
      benefits: ["Case study sessions", "Software demos", "Expert panels", "Networking lunch"],
      organizer: "Supply Chain Excellence Forum",
      availability: "20 tickets left"
    },
    {
      id: 6,
      title: "Quality Control & Testing Masterclass",
      description: "Advanced techniques in quality assurance and testing methodologies for manufacturing.",
      location: "Cleveland, OH",
      date: "March 28, 2025",
      time: "10:00 AM - 4:00 PM",
      pointsRequired: 350,
      category: "Masterclass",
      image: "✅",
      benefits: ["Hands-on testing labs", "Certification", "Equipment demos", "Expert guidance"],
      organizer: "Quality Assurance Institute",
      availability: "35 tickets left"
    }
  ];

  const quickStats = [
    { label: "Active Companies", value: "2.3K", trend: "+12%" },
    { label: "This Month's Posts", value: "45.6K", trend: "+8%" },
    { label: "Manufacturing Jobs", value: "1.2K", trend: "+15%" }
  ];  // Auto scroll to bottom of chat messages
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);// Updated HomePage.jsx with integrated chat functionality

  // Fetch user points and claimed rewards
  useEffect(() => {
    const fetchUserRewards = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserPoints(userData.points || 0);
          setClaimedRewards(userData.claimedRewards || []);
        }
      } catch (error) {
        console.error('Error fetching user rewards:', error);
      }
    };

    fetchUserRewards();
  }, []);

  // Calculate available rewards based on user points
  const availableRewards = manufacturingRewards.filter(reward => 
    userPoints >= reward.pointsRequired && !claimedRewards.includes(reward.id)
  );

  const unclaimedRewards = manufacturingRewards.filter(reward => 
    userPoints < reward.pointsRequired && !claimedRewards.rewards?.includes(reward.id)
  );

  // Claim reward function
  const claimReward = async (reward) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newPoints = userPoints - reward.pointsRequired;
      const newClaimedRewards = [...claimedRewards, reward.id];

      await updateDoc(userRef, {
        points: newPoints,
        claimedRewards: newClaimedRewards
      });

      // Add notification about claimed reward
      await addDoc(collection(db, 'notifications'), {
        recipientId: auth.currentUser.uid,
        senderId: 'system',
        senderName: 'TERAFAC Rewards',
        senderAvatar: '',
        type: 'reward_claimed',
        message: `Congratulations! You've claimed a ticket to ${reward.title}`,
        read: false,
        timestamp: serverTimestamp()
      });

      setUserPoints(newPoints);
      setClaimedRewards(newClaimedRewards);
      setShowRewardModal(false);
      setSelectedReward(null);

      alert(`🎉 Congratulations! You've successfully claimed your ticket to ${reward.title}!`);
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward. Please try again.');
    }
  };

  // Award points for activities (you can call these functions when users perform actions)
  const awardPoints = async (points, activity) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newPoints = userPoints + points;

      await updateDoc(userRef, {
        points: newPoints
      });

      setUserPoints(newPoints);

      // Add notification about earned points
      await addDoc(collection(db, 'notifications'), {
        recipientId: auth.currentUser.uid,
        senderId: 'system',
        senderName: 'TERAFAC Rewards',
        senderAvatar: '',
        type: 'points_earned',
        message: `You earned ${points} points for ${activity}!`,
        read: false,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  // Fetch user connections for chat with real last messages and unread counts
  useEffect(() => {
    const fetchConnections = async () => {
      if (!auth.currentUser) {
        setChatLoading(false);
        return;
      }

      try {
        // Get current user's data to find followers/following
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          setChatLoading(false);
          return;
        }

        const userData = userSnap.data();
        const followers = userData.followers || [];
        const following = userData.following || [];
        
        // Combine followers and following to get all connections
        const allConnectionIds = [...new Set([...followers, ...following])];
        
        if (allConnectionIds.length === 0) {
          setConnections([]);
          setChatLoading(false);
          return;
        }

        // Fetch connection details with last messages
        const connectionPromises = allConnectionIds.map(async (connectionId) => {
          try {
            const connectionRef = doc(db, 'users', connectionId);
            const connectionSnap = await getDoc(connectionRef);
            
            if (connectionSnap.exists()) {
              const connectionData = connectionSnap.data();
              const chatId = [auth.currentUser.uid, connectionId].sort().join('_');
              
              // Get last message for this chat
              let lastMessage = 'Start a conversation';
              let lastMessageTime = 'now';
              let unreadCount = 0;
              
              try {
                const lastMessageQuery = query(
                  collection(db, 'messages'),
                  where('chatId', '==', chatId),
                  orderBy('timestamp', 'desc'),
                  limit(1)
                );
                
                const lastMessageSnap = await getDocs(lastMessageQuery);
                
                if (!lastMessageSnap.empty) {
                  const lastMsg = lastMessageSnap.docs[0].data();
                  lastMessage = lastMsg.content;
                  lastMessageTime = lastMsg.timestamp?.seconds ? 
                    new Date(lastMsg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                    'now';
                }
                
                // Count unread messages from this user
                const unreadQuery = query(
                  collection(db, 'messages'),
                  where('chatId', '==', chatId),
                  where('senderId', '==', connectionId),
                  where('read', '==', false)
                );
                
                const unreadSnap = await getDocs(unreadQuery);
                unreadCount = unreadSnap.size;
                
              } catch (msgError) {
                console.log('Could not fetch messages for', connectionId, '- using defaults');
              }
              
              return {
                id: connectionId,
                name: `${connectionData.firstName || ''} ${connectionData.lastName || ''}`.trim() || 'Unknown User',
                role: connectionData.role || 'Professional',
                company: connectionData.company || '',
                avatar: connectionData.avatar || '',
                isOnline: Math.random() > 0.5, // Random online status - you can implement real presence later
                lastMessage: lastMessage,
                lastMessageTime: lastMessageTime,
                unreadCount: unreadCount,
                chatId: chatId
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
        
        // Sort connections by last message time (most recent first)
        validConnections.sort((a, b) => {
          if (a.lastMessage === 'Start a conversation' && b.lastMessage !== 'Start a conversation') return 1;
          if (b.lastMessage === 'Start a conversation' && a.lastMessage !== 'Start a conversation') return -1;
          return 0; // Keep original order for conversations with same status
        });
        
        setConnections(validConnections);
      } catch (error) {
        console.error('Error fetching connections:', error);
        setConnections([]);
      } finally {
        setChatLoading(false);
      }
    };

    if (activeTab === 'Chat') {
      fetchConnections();
    }
  }, [activeTab]);

  // Filter connections based on search
  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
    connection.role.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
    connection.company.toLowerCase().includes(chatSearchTerm.toLowerCase())
  );

  // Fetch messages for selected chat with real-time updates
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = () => {
      try {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatId', '==', selectedChat.chatId),
          orderBy('timestamp', 'asc'),
          limit(50)
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messageList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(messageList);
          
          // Mark messages as read when viewing the chat
          const unreadMessages = messageList.filter(msg => 
            msg.senderId !== auth.currentUser.uid && !msg.read
          );
          
          if (unreadMessages.length > 0) {
            // Mark all unread messages as read
            unreadMessages.forEach(async (msg) => {
              try {
                await updateDoc(doc(db, 'messages', msg.id), {
                  read: true
                });
              } catch (error) {
                console.error('Error marking message as read:', error);
              }
            });
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching messages:', error);
        // If there's an error (like missing index), just show empty messages
        setMessages([]);
        return () => {};
      }
    };

    const unsubscribe = fetchMessages();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedChat]);

  // Update connections when messages change or when switching to chat tab
  useEffect(() => {
    const updateConnectionsWithLatestMessages = async () => {
      if (!auth.currentUser || connections.length === 0) return;

      try {
        const updatedConnections = await Promise.all(
          connections.map(async (connection) => {
            try {
              // Get last message for this chat
              const lastMessageQuery = query(
                collection(db, 'messages'),
                where('chatId', '==', connection.chatId),
                orderBy('timestamp', 'desc'),
                limit(1)
              );
              
              const lastMessageSnap = await getDocs(lastMessageQuery);
              
              let lastMessage = null;
              let lastMessageTime = 'now';
              let unreadCount = 0;
              
              if (!lastMessageSnap.empty) {
                const lastMsg = lastMessageSnap.docs[0].data();
                lastMessage = lastMsg.content;
                lastMessageTime = lastMsg.timestamp?.seconds ? 
                  new Date(lastMsg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                  'now';
              }
              
              // Count unread messages from this user (messages they sent that current user hasn't read)
              const unreadQuery = query(
                collection(db, 'messages'),
                where('chatId', '==', connection.chatId),
                where('senderId', '==', connection.id),
                where('read', '==', false)
              );
              
              const unreadSnap = await getDocs(unreadQuery);
              unreadCount = unreadSnap.size;
              
              return {
                ...connection,
                lastMessage: lastMessage || 'Start a conversation',
                lastMessageTime,
                unreadCount,
                hasMessages: lastMessage !== null
              };
            } catch (error) {
              console.error('Error updating connection:', connection.id, error);
              return {
                ...connection,
                lastMessage: 'Start a conversation',
                lastMessageTime: 'now',
                unreadCount: 0,
                hasMessages: false
              };
            }
          })
        );

        // Sort connections: conversations with messages first, then by most recent
        updatedConnections.sort((a, b) => {
          // First, prioritize conversations with actual messages
          if (a.hasMessages && !b.hasMessages) return -1;
          if (!a.hasMessages && b.hasMessages) return 1;
          
          // If both have messages or both don't, sort by last message time
          if (a.hasMessages && b.hasMessages) {
            // For conversations with messages, sort by timestamp
            const aTime = a.lastMessageTime === 'now' ? 0 : new Date(`1970-01-01 ${a.lastMessageTime}`).getTime();
            const bTime = b.lastMessageTime === 'now' ? 0 : new Date(`1970-01-01 ${b.lastMessageTime}`).getTime();
            return bTime - aTime;
          }
          
          // If neither has messages, maintain original order
          return 0;
        });

        setConnections(updatedConnections);
      } catch (error) {
        console.error('Error updating connections:', error);
      }
    };

    // Update when switching to chat tab or when messages change
    if (activeTab === 'Chat') {
      updateConnectionsWithLatestMessages();
    }
  }, [messages, activeTab, connections.length]);

  // Real-time listener for connection updates
  useEffect(() => {
    if (activeTab !== 'Chat' || !auth.currentUser) return;

    const connectionUpdaters = connections.map(connection => {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', connection.chatId)
      );

      return onSnapshot(messagesQuery, async (snapshot) => {
        try {
          // Get the latest message
          const messages = snapshot.docs.map(doc => doc.data()).sort((a, b) => {
            const aTime = a.timestamp?.seconds || 0;
            const bTime = b.timestamp?.seconds || 0;
            return bTime - aTime;
          });
          
          const lastMessage = messages[0];
          const unreadMessages = messages.filter(msg => 
            msg.senderId === connection.id && !msg.read
          );

          // Update this specific connection
          setConnections(prevConnections => 
            prevConnections.map(conn => 
              conn.id === connection.id ? {
                ...conn,
                lastMessage: lastMessage ? lastMessage.content : 'Start a conversation',
                lastMessageTime: lastMessage?.timestamp?.seconds ? 
                  new Date(lastMessage.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                  'now',
                unreadCount: unreadMessages.length,
                hasMessages: !!lastMessage
              } : conn
            )
          );
        } catch (error) {
          console.error('Error in real-time connection update:', error);
        }
      });
    });

    return () => {
      connectionUpdaters.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [activeTab, connections.map(c => c.id).join(',')]);

  // Send chat message with immediate UI update and connection list update
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedChat || !auth.currentUser) return;

    const messageContent = chatMessage.trim();
    setChatMessage(''); // Clear input immediately

    try {
      const tempId = Date.now().toString(); // Temporary ID for immediate UI update
      const tempMessage = {
        id: tempId,
        chatId: selectedChat.chatId,
        senderId: auth.currentUser.uid,
        senderName: `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim(),
        senderAvatar: profileData?.avatar || '',
        receiverId: selectedChat.id,
        content: messageContent,
        timestamp: { seconds: Date.now() / 1000 }, // Temporary timestamp
        read: false
      };

      // Add message to local state immediately for instant UI feedback
      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // Update the connection's last message immediately in the UI
      setConnections(prevConnections => 
        prevConnections.map(conn => 
          conn.id === selectedChat.id ? {
            ...conn,
            lastMessage: messageContent,
            lastMessageTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            hasMessages: true
          } : conn
        )
      );

      // Send to Firebase
      const messageData = {
        chatId: selectedChat.chatId,
        senderId: auth.currentUser.uid,
        senderName: `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim(),
        senderAvatar: profileData?.avatar || '',
        receiverId: selectedChat.id,
        content: messageContent,
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'messages'), messageData);
      
      // The real-time listener will replace the temp message with the real one
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the temporary message if send failed
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempId)
      );
      
      // Restore the message in input
      setChatMessage(messageContent);
      
      alert('Failed to send message. Please try again.');
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

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

  // Rest of your existing functions remain the same...
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
      {/* Header - keeping existing header code */}
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
            
            {/* Notifications dropdown - keeping existing notifications code */}
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
        {/* Chat Tab Content */}
        {activeTab === 'Chat' && (
          <div className="chat-container">
            {!selectedChat ? (
              <div className="chat-list">
                <div className="chat-header">
                  <h2>Messages</h2>
                  <div className="chat-search">
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Search connections..."
                      value={chatSearchTerm}
                      onChange={(e) => setChatSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="connections-list">
                  {chatLoading ? (
                    <div className="chat-loading">
                      <p>Loading your connections...</p>
                    </div>
                  ) : filteredConnections.length === 0 ? (
                    <div className="no-connections">
                      {connections.length === 0 ? (
                        <div className="empty-state">
                          <p>No connections yet</p>
                          <span>Connect with manufacturing professionals to start chatting</span>
                        </div>
                      ) : (
                        <div className="no-results">
                          <p>No connections found</p>
                          <span>Try a different search term</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredConnections.map((connection) => (
                      <div
                        key={connection.id}
                        className="connection-item"
                        onClick={() => setSelectedChat(connection)}
                      >
                        <div className="connection-avatar">
                          {connection.avatar ? (
                            <img src={connection.avatar} alt={connection.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {connection.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          {connection.isOnline && <div className="online-indicator"></div>}
                        </div>
                        
                        <div className="connection-info">
                          <div className="connection-main">
                            <h3>{connection.name}</h3>
                            <span className="connection-role">
                              {connection.role}{connection.company ? ` at ${connection.company}` : ''}
                            </span>
                          </div>
                          <div className="connection-meta">
                            <span className="last-message">{connection.lastMessage}</span>
                            <div className="message-meta">
                              <span className="message-time">{connection.lastMessageTime}</span>
                              {connection.unreadCount > 0 && (
                                <span className="unread-badge">{connection.unreadCount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="chat-conversation">
                <div className="conversation-header">
                  <button 
                    className="back-btn"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  
                  <div className="conversation-user">
                    <div className="conversation-avatar">
                      {selectedChat.avatar ? (
                        <img src={selectedChat.avatar} alt={selectedChat.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {selectedChat.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      {selectedChat.isOnline && <Circle size={8} className="online-dot" fill="currentColor" />}
                    </div>
                    
                    <div className="conversation-details">
                      <h3>{selectedChat.name}</h3>
                      <span className="user-status">
                        {selectedChat.isOnline ? 'Online' : 'Offline'} • {selectedChat.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="conversation-actions">
                    <button className="action-btn">
                      <Phone size={20} />
                    </button>
                    <button className="action-btn">
                      <Video size={20} />
                    </button>
                    <button className="action-btn">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>

                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <div className="conversation-starter">
                        <div className="starter-avatar">
                          {selectedChat.avatar ? (
                            <img src={selectedChat.avatar} alt={selectedChat.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {selectedChat.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <h3>Start a conversation with {selectedChat.name}</h3>
                        <p>You're connected with {selectedChat.name}. Send them a message to get started!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="messages-list">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`message ${msg.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}
                        >
                          {msg.senderId !== auth.currentUser.uid && (
                            <div className="message-avatar">
                              {msg.senderAvatar ? (
                                <img src={msg.senderAvatar} alt={msg.senderName} />
                              ) : (
                                <div className="avatar-placeholder">
                                  {msg.senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="message-content">
                            <div className="message-bubble">
                              <p>{msg.content}</p>
                            </div>
                            <span className="message-time">
                              {msg.timestamp?.seconds ? 
                                new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                                'Sending...'
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={chatMessagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="message-input-container">
                  <div className="message-input">
                    <input
                      type="text"
                      placeholder={`Message ${selectedChat.name}...`}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={handleChatKeyPress}
                    />
                    <button 
                      className="send-btn"
                      onClick={sendChatMessage}
                      disabled={!chatMessage.trim()}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
                {/* Create Post section - keeping existing code */}
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

        {activeTab === 'Rewards' && (
          <div className="rewards-container">
            <div className="rewards-header">
              <div className="rewards-title-section">
                <h2>🎁 Manufacturing Rewards</h2>
                <p>Earn points and claim exclusive tickets to manufacturing events</p>
              </div>
              <div className="points-display">
                <div className="points-card">
                  <span className="points-label">Your Points</span>
                  <span className="points-value">{userPoints.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="points-info">
              <h3>💡 How to Earn Points</h3>
              <div className="points-methods">
                <div className="method-item">
                  <span className="method-icon">📝</span>
                  <span>Create a post: +50 points</span>
                </div>
                <div className="method-item">
                  <span className="method-icon">💬</span>
                  <span>Comment on posts: +20 points</span>
                </div>
                <div className="method-item">
                  <span className="method-icon">🤝</span>
                  <span>New connection: +100 points</span>
                </div>
                <div className="method-item">
                  <span className="method-icon">❤️</span>
                  <span>Receive likes: +10 points</span>
                </div>
              </div>
            </div>

            {availableRewards.length > 0 && (
              <div className="rewards-section">
                <h3>🎯 Available Rewards</h3>
                <div className="rewards-grid">
                  {availableRewards.map(reward => (
                    <div key={reward.id} className="reward-card available">
                      <div className="reward-header">
                        <span className="reward-emoji">{reward.image}</span>
                        <span className="reward-category">{reward.category}</span>
                      </div>
                      <h4>{reward.title}</h4>
                      <p className="reward-description">{reward.description}</p>
                      <div className="reward-details">
                        <div className="reward-info">
                          <span>📍 {reward.location}</span>
                          <span>📅 {reward.date}</span>
                          <span>⏰ {reward.time}</span>
                          <span>🎫 {reward.availability}</span>
                        </div>
                        <div className="reward-organizer">
                          <span>by {reward.organizer}</span>
                        </div>
                      </div>
                      <div className="reward-benefits">
                        <h5>What's Included:</h5>
                        <ul>
                          {reward.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="reward-footer">
                        <span className="points-required">{reward.pointsRequired.toLocaleString()} points</span>
                        <button 
                          className="claim-btn"
                          onClick={() => {
                            setSelectedReward(reward);
                            setShowRewardModal(true);
                          }}
                        >
                          Claim Ticket
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unclaimedRewards.length > 0 && (
              <div className="rewards-section">
                <h3>🔒 Unlock More Rewards</h3>
                <div className="rewards-grid">
                  {unclaimedRewards.map(reward => (
                    <div key={reward.id} className="reward-card locked">
                      <div className="reward-header">
                        <span className="reward-emoji">{reward.image}</span>
                        <span className="reward-category">{reward.category}</span>
                      </div>
                      <h4>{reward.title}</h4>
                      <p className="reward-description">{reward.description}</p>
                      <div className="reward-details">
                        <div className="reward-info">
                          <span>📍 {reward.location}</span>
                          <span>📅 {reward.date}</span>
                          <span>⏰ {reward.time}</span>
                        </div>
                      </div>
                      <div className="reward-footer">
                        <span className="points-required">{reward.pointsRequired.toLocaleString()} points</span>
                        <span className="points-needed">
                          Need {(reward.pointsRequired - userPoints).toLocaleString()} more points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {claimedRewards.length > 0 && (
              <div className="rewards-section">
                <h3>🏆 Your Claimed Tickets</h3>
                <div className="rewards-grid">
                  {manufacturingRewards
                    .filter(reward => claimedRewards.includes(reward.id))
                    .map(reward => (
                    <div key={reward.id} className="reward-card claimed">
                      <div className="reward-header">
                        <span className="reward-emoji">{reward.image}</span>
                        <span className="reward-category">{reward.category}</span>
                        <span className="claimed-badge">✓ Claimed</span>
                      </div>
                      <h4>{reward.title}</h4>
                      <p className="reward-description">{reward.description}</p>
                      <div className="reward-details">
                        <div className="reward-info">
                          <span>📍 {reward.location}</span>
                          <span>📅 {reward.date}</span>
                          <span>⏰ {reward.time}</span>
                        </div>
                      </div>
                      <div className="reward-footer">
                        <span className="claimed-text">Ticket secured! Check your email for details.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableRewards.length === 0 && unclaimedRewards.length === 0 && claimedRewards.length === 0 && (
              <div className="no-rewards">
                <h3>🚀 Start Earning Points!</h3>
                <p>Engage with the community to earn points and unlock exclusive manufacturing event tickets.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Alerts' && (
          <div className="alerts-container">
            <h2>Notifications & Alerts</h2>
            <p>Your notifications will appear here.</p>
          </div>
        )}

        {activeTab === 'Profile' && <Profile />}
      </div>

      {/* Reward Claim Modal */}
      {showRewardModal && selectedReward && (
        <div className="modal-overlay" onClick={() => setShowRewardModal(false)}>
          <div className="reward-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎫 Claim Event Ticket</h3>
              <button 
                className="close-btn"
                onClick={() => setShowRewardModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="reward-modal-details">
                <div className="reward-modal-header">
                  <span className="reward-modal-emoji">{selectedReward.image}</span>
                  <div>
                    <h4>{selectedReward.title}</h4>
                    <span className="reward-modal-category">{selectedReward.category}</span>
                  </div>
                </div>
                
                <div className="reward-modal-info">
                  <p><strong>📍 Location:</strong> {selectedReward.location}</p>
                  <p><strong>📅 Date:</strong> {selectedReward.date}</p>
                  <p><strong>⏰ Time:</strong> {selectedReward.time}</p>
                  <p><strong>🏢 Organizer:</strong> {selectedReward.organizer}</p>
                  <p><strong>🎫 Availability:</strong> {selectedReward.availability}</p>
                </div>

                <div className="reward-modal-benefits">
                  <h5>What's Included:</h5>
                  <ul>
                    {selectedReward.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>

                <div className="points-transaction">
                  <div className="points-breakdown">
                    <span>Current Points: {userPoints.toLocaleString()}</span>
                    <span>Cost: -{selectedReward.pointsRequired.toLocaleString()}</span>
                    <span className="points-after">
                      After Claim: {(userPoints - selectedReward.pointsRequired).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowRewardModal(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-claim-btn"
                onClick={() => claimReward(selectedReward)}
              >
                Confirm & Claim Ticket
              </button>
            </div>
          </div>
        </div>
      )}

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