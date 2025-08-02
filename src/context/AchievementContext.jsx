import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import achievementService from '../services/achievementService';
import inAppNotificationService from '../services/inAppNotificationService';
import AchievementModal from '../components/ui/AchievementModal';
import firestoreService from '../services/firestoreService';

const AchievementContext = createContext(null);

const AchievementProvider = React.memo(({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
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
    if (user && user.uid) {
      setSyncStatus('syncing');
      firestoreService.syncToLocalStorage(user.uid)
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

  const loadUserAchievements = async () => {
    if (!user?.uid) return;
    try {
      const userAchievements = await achievementService.getAllAchievementsWithProgress(user);
      const points = achievementService.getUserPoints(user.uid);
      setAchievements(Array.isArray(userAchievements) ? userAchievements : []);
      setUserPoints(points);
    } catch (e) {
      setAchievements([]);
      setUserPoints(0);
      setError('Failed to load achievements. Please check your connection or permissions.');
    }
  };

  // Check for new achievements
  const checkAchievements = async () => {
    if (!user?.uid) return [];

    const newAchievements = await achievementService.checkAchievements(user);
    
    if (newAchievements.length > 0) {
      setNewAchievements(newAchievements);
      // Don't show modal anymore - only in-app notifications
      
      // Update points
      const updatedPoints = achievementService.getUserPoints(user.uid);
      setUserPoints(updatedPoints);
      
      // Reload achievements
      await loadUserAchievements();
      
      // Play achievement sound
      playAchievementSound();
      
      // Show in-app notification for each new achievement
      newAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          inAppNotificationService.showAchievement(achievement);
        }, index * 1000); // Stagger notifications by 1 second
      });
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
    if (!user?.uid) return { progress: 0, total: 0, percentage: 0, state: 'not-started' };
    return achievementService.getAchievementProgress(user.uid, achievementId);
  };

  // Get detailed achievement state
  const getAchievementState = async (achievementId) => {
    if (!user?.uid) return null;
    return await achievementService.getAchievementState(user.uid, achievementId);
  };

  // Get achievements by state
  const getAchievementsByState = () => {
    if (!user?.uid) return { completed: [], inProgress: [], notStarted: [] };
    
    const categorized = { completed: [], inProgress: [], notStarted: [] };
    
    achievements.forEach(achievement => {
      if (achievement.state === 'completed') {
        categorized.completed.push(achievement);
      } else if (achievement.state === 'in-progress') {
        categorized.inProgress.push(achievement);
      } else {
        categorized.notStarted.push(achievement);
      }
    });
    
    return categorized;
  };

  // Get progress summary
  const getProgressSummary = () => {
    if (!user?.uid) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, completionRate: 0 };
    
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
});

// Add display name for debugging
AchievementProvider.displayName = 'AchievementProvider';

// Export the hook separately for better HMR compatibility
export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

// Default export the provider
export default AchievementProvider; 