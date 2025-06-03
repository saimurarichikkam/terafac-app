import React, { useState, useEffect } from 'react';
import { Award, X } from 'lucide-react';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const Rewards = ({ profileData }) => {
  // Rewards/Events states
  const [userPoints, setUserPoints] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

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
    userPoints < reward.pointsRequired && !claimedRewards.includes(reward.id)
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

  // Award points for activities (exported function that can be called from HomePage)
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

  return (
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
    </div>
  );
};

// Export the awardPoints function so it can be used in HomePage
export { Rewards as default };
export const useRewardsActions = () => {
  const awardPoints = async (points, activity) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Get current points
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const currentPoints = userSnap.data().points || 0;
      const newPoints = currentPoints + points;

      await updateDoc(userRef, {
        points: newPoints
      });

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

  return { awardPoints };
};