// src/components/Chat.jsx
import React, { useState } from 'react';
import { Search, Send, MessageCircle, ArrowLeft } from 'lucide-react';
import './Chat.css';

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // Chat data
  const [chats, setChats] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      company: "Tata Steel Manufacturing",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face",
      lastMessage: "Thanks for the production insights!",
      timestamp: "2 min ago",
      unread: 2,
      online: true,
      messages: [
        { id: 1, sender: "Sarah Johnson", text: "Hi Sai! I saw your post about manufacturing efficiency.", timestamp: "10:30 AM", sent: false },
        { id: 2, sender: "Sai Murari", text: "Hi Sarah! Yes, we've been implementing some new processes.", timestamp: "10:32 AM", sent: true },
        { id: 3, sender: "Sarah Johnson", text: "That's amazing! Could you share more details about the optimization techniques?", timestamp: "10:35 AM", sent: false },
        { id: 4, sender: "Sai Murari", text: "Sure! We focused on lean manufacturing principles and automated quality control.", timestamp: "10:38 AM", sent: true },
        { id: 5, sender: "Sarah Johnson", text: "Thanks for the production insights!", timestamp: "10:40 AM", sent: false }
      ]
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      company: "Mahindra Auto Parts",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      lastMessage: "Let's discuss the IoT implementation",
      timestamp: "5 min ago",
      unread: 1,
      online: true,
      messages: [
        { id: 1, sender: "Rajesh Kumar", text: "Hey Sai, I'm interested in your IoT sensor project.", timestamp: "9:15 AM", sent: false },
        { id: 2, sender: "Sai Murari", text: "Hi Rajesh! It's been really effective for quality control.", timestamp: "9:20 AM", sent: true },
        { id: 3, sender: "Rajesh Kumar", text: "Let's discuss the IoT implementation", timestamp: "9:25 AM", sent: false }
      ]
    },
    {
      id: 3,
      name: "Priya Sharma",
      company: "Green Tech Solutions",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      lastMessage: "Great work on sustainability!",
      timestamp: "1 hour ago",
      unread: 0,
      online: false,
      messages: [
        { id: 1, sender: "Priya Sharma", text: "I love your focus on sustainable manufacturing!", timestamp: "Yesterday", sent: false },
        { id: 2, sender: "Sai Murari", text: "Thanks Priya! Sustainability is crucial for our industry.", timestamp: "Yesterday", sent: true },
        { id: 3, sender: "Priya Sharma", text: "Great work on sustainability!", timestamp: "1 hour ago", sent: false }
      ]
    },
    {
      id: 4,
      name: "Amit Patel",
      company: "Innovation Metals Ltd",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      lastMessage: "Automated welding sounds impressive",
      timestamp: "3 hours ago",
      unread: 0,
      online: false,
      messages: [
        { id: 1, sender: "Amit Patel", text: "Saw your post about automated welding systems!", timestamp: "3 hours ago", sent: false },
        { id: 2, sender: "Sai Murari", text: "Yes! It's increased our precision significantly.", timestamp: "3 hours ago", sent: true },
        { id: 3, sender: "Amit Patel", text: "Automated welding sounds impressive", timestamp: "3 hours ago", sent: false }
      ]
    },
    {
      id: 5,
      name: "Manufacturing Team",
      company: "Terafac Technologies",
      avatar: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=50&h=50&fit=crop&crop=face",
      lastMessage: "Weekly team meeting at 3 PM",
      timestamp: "6 hours ago",
      unread: 0,
      online: true,
      messages: [
        { id: 1, sender: "Manufacturing Team", text: "Team, we have our weekly sync today.", timestamp: "6 hours ago", sent: false },
        { id: 2, sender: "Sai Murari", text: "Got it! I'll be there.", timestamp: "6 hours ago", sent: true },
        { id: 3, sender: "Manufacturing Team", text: "Weekly team meeting at 3 PM", timestamp: "6 hours ago", sent: false }
      ]
    },
    {
      id: 6,
      name: "Quality Control Team",
      company: "Terafac Technologies",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=50&h=50&fit=crop&crop=face",
      lastMessage: "New quality standards implemented",
      timestamp: "1 day ago",
      unread: 0,
      online: false,
      messages: [
        { id: 1, sender: "Quality Control Team", text: "New quality control protocols are now active.", timestamp: "1 day ago", sent: false },
        { id: 2, sender: "Sai Murari", text: "Perfect! I'll update the team.", timestamp: "1 day ago", sent: true },
        { id: 3, sender: "Quality Control Team", text: "New quality standards implemented", timestamp: "1 day ago", sent: false }
      ]
    }
  ]);

  // Chat functions
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim() && activeChatId) {
      const updatedChats = chats.map(chat => {
        if (chat.id === activeChatId) {
          const newMsg = {
            id: chat.messages.length + 1,
            sender: "Sai Murari",
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            sent: true
          };
          return {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMessage,
            timestamp: "Just now"
          };
        }
        return chat;
      });
      setChats(updatedChats);
      setNewMessage('');
    }
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChatId);
  };

  const handleBackToList = () => {
    setActiveChatId(null);
  };

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Chat List */}
        <div className={`chat-list ${activeChatId ? 'mobile-hidden' : 'mobile-visible'}`}>
          <div className="chat-header">
            <h2>Messages</h2>
            <div className="chat-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="chat-list-items">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="chat-avatar-container">
                  <img src={chat.avatar} alt="" className="chat-avatar" />
                  {chat.online && <div className="online-indicator"></div>}
                </div>
                <div className="chat-info">
                  <div className="chat-name-row">
                    <h4>{chat.name}</h4>
                    <span className="chat-time">{chat.timestamp}</span>
                  </div>
                  <div className="chat-preview-row">
                    <p className="chat-preview">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="unread-badge">{chat.unread}</span>
                    )}
                  </div>
                  <span className="chat-company">{chat.company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className={`chat-messages ${activeChatId ? 'mobile-visible' : 'mobile-hidden'}`}>
          {activeChatId ? (
            <>
              <div className="chat-messages-header">
                <button className="back-button mobile-only" onClick={handleBackToList}>
                  <ArrowLeft size={20} />
                </button>
                <div className="chat-contact-info">
                  <img src={getCurrentChat()?.avatar} alt="" className="chat-header-avatar" />
                  <div>
                    <h3>{getCurrentChat()?.name}</h3>
                    <p>{getCurrentChat()?.company}</p>
                    <span className={`status ${getCurrentChat()?.online ? 'online' : 'offline'}`}>
                      {getCurrentChat()?.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="messages-container">
                {getCurrentChat()?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sent ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{message.text}</p>
                      <span className="message-time">{message.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="message-input-container">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="message-input"
                />
                <button onClick={handleSendMessage} className="send-button">
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