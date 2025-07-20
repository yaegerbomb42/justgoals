import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import achievementService from '../services/achievementService';
import AchievementModal from '../components/ui/AchievementModal';
import firestoreService from '../services/firestoreService';

const AchievementContext = createContext(null);

export const AchievementProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSync, setLastSync] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [error, setError] = useState(null);

  // Load user achievements
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserAchievements();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user && user.id) {
      setSyncStatus('syncing');
      firestoreService.syncToLocalStorage(user.id)
        .then(() => {
          setSyncStatus('success');
          setLastSync(new Date());
        })
        .catch(error => {
          setSyncStatus('error');
          setLastSync(new Date());
          setErrorLogs(logs => [...logs, `Sync failed: ${error.message || error}`]);
          console.error('Data sync failed:', error);
        });
    }
  }, [user]);

  const loadUserAchievements = () => {
    if (!user?.id) return;
    try {
      const userAchievements = achievementService.getAllAchievementsWithProgress(user.id);
      const points = achievementService.getUserPoints(user.id);
      setAchievements(Array.isArray(userAchievements) ? userAchievements : []);
      setUserPoints(points);
    } catch (e) {
      setAchievements([]);
      setUserPoints(0);
      setError('Failed to load achievements. Please check your connection or permissions.');
    }
  };

  // Check for new achievements
  const checkAchievements = () => {
    if (!user?.id) return [];

    const newAchievements = achievementService.checkAchievements(user.id);
    
    if (newAchievements.length > 0) {
      setNewAchievements(newAchievements);
      setShowAchievementModal(true);
      
      // Update points
      const updatedPoints = achievementService.getUserPoints(user.id);
      setUserPoints(updatedPoints);
      
      // Reload achievements
      loadUserAchievements();
      
      // Play achievement sound
      playAchievementSound();
    }

    return newAchievements;
  };

  // Play achievement sound
  const playAchievementSound = () => {
    try {
      const audio = new Audio('/assets/sounds/chime.mp3'); // This file exists and is a supported format
      audio.volume = 0.3;
      audio.play().catch(e => {
        console.warn('Could not play achievement sound:', e);
        // Fallback: try another sound if chime fails
        const fallback = new Audio('/assets/sounds/cafe.mp3');
        fallback.volume = 0.2;
        fallback.play().catch(e2 => console.warn('No supported achievement sound could be played:', e2));
      });
    } catch (error) {
      console.warn('Achievement sound not available:', error);
    }
  };

  // Show all achievements modal
  const showAllAchievementsModal = () => {
    setShowAllAchievements(true);
    setShowAchievementModal(true);
  };

  // Close achievement modal
  const closeAchievementModal = () => {
    setShowAchievementModal(false);
    setNewAchievements([]);
    setShowAllAchievements(false);
  };

  // Get achievements by category
  const getAchievementsByCategory = () => {
    if (!user?.id) return {};
    return achievementService.getAchievementsByCategory(user.id);
  };

  // Get recent achievements
  const getRecentAchievements = () => {
    if (!user?.id) return [];
    const achievements = achievementService.getRecentAchievements(user.id);
    return Array.isArray(achievements) ? achievements : [];
  };

  // Get next achievable achievements
  const getNextAchievements = () => {
    if (!user?.id) return [];
    const achievements = achievementService.getNextAchievements(user.id);
    return Array.isArray(achievements) ? achievements : [];
  };

  // Get achievement progress
  const getAchievementProgress = (achievementId) => {
    if (!user?.id) return { progress: 0, total: 0, percentage: 0, state: 'not-started' };
    return achievementService.getAchievementProgress(user.id, achievementId);
  };

  // Get detailed achievement state
  const getAchievementState = (achievementId) => {
    if (!user?.id) return null;
    return achievementService.getAchievementState(user.id, achievementId);
  };

  // Get achievements by state
  const getAchievementsByState = () => {
    if (!user?.id) return { completed: [], inProgress: [], notStarted: [] };
    
    const allAchievements = Object.keys(achievementService.achievements);
    const categorized = { completed: [], inProgress: [], notStarted: [] };
    
    allAchievements.forEach(achievementId => {
      const state = getAchievementState(achievementId);
      if (state) {
        if (state.state === 'completed') {
          categorized.completed.push(state);
        } else if (state.state === 'in-progress') {
          categorized.inProgress.push(state);
        } else {
          categorized.notStarted.push(state);
        }
      }
    });
    
    return categorized;
  };

  // Get progress summary
  const getProgressSummary = () => {
    if (!user?.id) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, completionRate: 0 };
    
    const byState = getAchievementsByState();
    const total = byState.completed.length + byState.inProgress.length + byState.notStarted.length;
    const completionRate = total > 0 ? Math.round((byState.completed.length / total) * 100) : 0;
    
    return {
      total,
      completed: byState.completed.length,
      inProgress: byState.inProgress.length,
      notStarted: byState.notStarted.length,
      completionRate
    };
  };

  const value = {
    achievements,
    userPoints,
    newAchievements,
    showAchievementModal,
    showAllAchievements,
    checkAchievements,
    showAllAchievementsModal,
    closeAchievementModal,
    getAchievementsByCategory,
    getRecentAchievements,
    getNextAchievements,
    getAchievementProgress,
    getAchievementState,
    getAchievementsByState,
    getProgressSummary,
    syncStatus,
    lastSync,
    errorLogs,
    error,
    unreadCount: newAchievements.length, // Add unreadCount for Header
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
      
      {/* Achievement Modal */}
      <AchievementModal
        isOpen={showAchievementModal}
        onClose={closeAchievementModal}
        achievements={showAllAchievements ? achievements : newAchievements}
        showAll={showAllAchievements}
      />
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded text-error text-center mb-4">{error}</div>
      )}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
}; 