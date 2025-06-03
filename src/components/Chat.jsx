import React, { useState, useRef, useEffect } from 'react';
import { Search, Phone, Video, MoreHorizontal, ArrowLeft, Circle, Send, MessageCircle } from 'lucide-react';
import './Chat.css';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { addDoc, serverTimestamp } from 'firebase/firestore';

const Chat = ({ profileData }) => {
  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const chatMessagesEndRef = useRef(null);

  // Auto scroll to bottom of chat messages
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                    new Date(lastMsg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
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

    fetchConnections();
  }, []); // Remove activeTab dependency since this component is only shown when chat is active

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
        return () => { };
      }
    };

    const unsubscribe = fetchMessages();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedChat]);

  // Update connections when messages change
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
                  new Date(lastMsg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
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

    updateConnectionsWithLatestMessages();
  }, [messages, connections.length]);

  // Real-time listener for connection updates
  useEffect(() => {
    if (!auth.currentUser) return;

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
                  new Date(lastMessage.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
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
  }, [connections.map(c => c.id).join(',')]);

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
            lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Chat List */}
        <div className={`chat-list ${selectedChat ? 'mobile-hidden' : 'mobile-visible'}`}>
          <div className="chat-header">
            <h2>Messages</h2>
            <div className="chat-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search connections..."
                value={chatSearchTerm}
                onChange={(e) => setChatSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="chat-list-items">
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
                  className={`chat-item ${selectedChat?.id === connection.id ? 'active' : ''}`}
                  onClick={() => setSelectedChat(connection)}
                >
                  <div className="chat-avatar-container">
                    {connection.avatar ? (
                      <img src={connection.avatar} alt="" className="chat-avatar" />
                    ) : (
                      <div className="chat-avatar avatar-placeholder">
                        {connection.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    {connection.isOnline && <div className="online-indicator"></div>}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name-row">
                      <h4>{connection.name}</h4>
                      <span className="chat-time">{connection.lastMessageTime}</span>
                    </div>
                    <div className="chat-preview-row">
                      <p className="chat-preview">{connection.lastMessage}</p>
                      {connection.unreadCount > 0 && (
                        <span className="unread-badge">{connection.unreadCount}</span>
                      )}
                    </div>
                    <span className="chat-company">
                      {connection.role}{connection.company ? ` at ${connection.company}` : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className={`chat-messages ${selectedChat ? 'mobile-visible' : 'mobile-hidden'}`}>
          {selectedChat ? (
            <>
              <div className="chat-messages-header">
                <button className="back-button mobile-only" onClick={() => setSelectedChat(null)}>
                  <ArrowLeft size={20} />
                </button>
                <div className="chat-contact-info">
                  {selectedChat.avatar ? (
                    <img src={selectedChat.avatar} alt="" className="chat-header-avatar" />
                  ) : (
                    <div className="chat-header-avatar avatar-placeholder">
                      {selectedChat.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h3>{selectedChat.name}</h3>
                    <p>{selectedChat.role}{selectedChat.company ? ` at ${selectedChat.company}` : ''}</p>
                    <span className={`status ${selectedChat.isOnline ? 'online' : 'offline'}`}>
                      {selectedChat.isOnline ? 'Online' : 'Offline'}
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
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{message.content}</p>
                        <span className="message-time">
                          {message.timestamp?.seconds ?
                            new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                            'Sending...'
                          }
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatMessagesEndRef} />
              </div>
              
              <div className="message-input-container">
                <input
                  type="text"
                  placeholder={`Message ${selectedChat.name}...`}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  className="message-input"
                />
                <button 
                  onClick={sendChatMessage} 
                  className="send-button"
                  disabled={!chatMessage.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageCircle size={64} className="no-chat-icon" />
              <h3>Select a conversation</h3>
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;