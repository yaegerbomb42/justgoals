import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import inAppNotificationService from '../services/inAppNotificationService';

const DriftCharacterContext = createContext();

export const useDriftCharacter = () => {
  const context = useContext(DriftCharacterContext);
  if (!context) {
    throw new Error('useDriftCharacter must be used within a DriftCharacterProvider');
  }
  return context;
};

export const DriftCharacterProvider = ({ children }) => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(null);
  const [characterMood, setCharacterMood] = useState('happy'); // happy, thinking, excited, helpful
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Show welcome message on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('drift-welcome-seen');
    if (!hasSeenWelcome && user) {
      setTimeout(() => {
        inAppNotificationService.showInfo(
          "👋 Welcome! Meet Drift, your AI assistant. Click the floating character in the bottom right for help!",
          { duration: 5000 }
        );
        localStorage.setItem('drift-welcome-seen', 'true');
      }, 3000);
    }
  }, [user]);

  // Track user activity to show/hide character
  useEffect(() => {
    let timeout;
    
    const handleActivity = () => {
      setIsVisible(true);
      setLastInteraction(Date.now());
      
      // Hide character after 30 seconds of inactivity
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (!isChatOpen) {
          setIsVisible(false);
        }
      }, 30000);
    };

    // Show character on mouse movement or clicks
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('keydown', handleActivity);

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      clearTimeout(timeout);
    };
  }, [isChatOpen]);

  // Show character when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setIsVisible(true);
    }
  }, [isChatOpen]);

  const openChat = () => {
    setIsChatOpen(true);
    setCharacterMood('excited');
    setHasUnreadMessages(false);
    
    // Navigate to chat page
    window.location.href = '/ai-assistant-chat-drift';
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setCharacterMood('happy');
  };

  const setMood = (mood) => {
    setCharacterMood(mood);
  };

  const markAsUnread = () => {
    setHasUnreadMessages(true);
  };

  const showHelpfulTip = (tip) => {
    setCharacterMood('helpful');
    inAppNotificationService.showInfo(tip, { duration: 4000 });
  };

  const showAchievement = (achievement) => {
    setCharacterMood('excited');
    inAppNotificationService.showSuccess(
      `🎉 ${achievement.title}! ${achievement.description}`,
      { duration: 5000 }
    );
  };

  const showGoalReminder = (goal) => {
    setCharacterMood('thinking');
    inAppNotificationService.showWarning(
      `📝 Don't forget about your goal: "${goal.title}"`,
      { duration: 4000 }
    );
  };

  const value = {
    isChatOpen,
    isVisible,
    characterMood,
    hasUnreadMessages,
    lastInteraction,
    openChat,
    closeChat,
    setMood,
    markAsUnread,
    showHelpfulTip,
    showAchievement,
    showGoalReminder,
  };

  return (
    <DriftCharacterContext.Provider value={value}>
      {children}
    </DriftCharacterContext.Provider>
  );
}; 