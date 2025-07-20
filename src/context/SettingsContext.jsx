import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
    
    // Focus Mode
    focusMode: {
      defaultDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: true,
      autoStartSessions: false,
      ambientSounds: true,
      backgroundEffects: true,
      soundVolume: 0.5,
    },
    
    // Notifications
    notifications: {
      enabled: true,
      morningMotivation: true,
      eveningReflection: true,
      streakProtection: true,
      focusReminders: true,
      goalDeadlines: true,
      achievementCelebrations: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    },
    
    // Progress Tracking
    progressMeter: {
      showPercentage: true,
      showStreaks: true,
      showMilestones: true,
      autoSave: true,
    },
    
    // Mobile
    mobile: {
      detected: false,
      compactHeader: true,
      swipeNavigation: true,
      touchOptimized: true,
    },
  });

  // Mobile detection
  useEffect(() => {
    const detectMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth <= 768;
      
      setSettings(prev => ({
        ...prev,
        mobile: {
          ...prev.mobile,
          detected: isMobile,
        }
      }));
    };

    detectMobile();
    window.addEventListener('resize', detectMobile);
    
    return () => window.removeEventListener('resize', detectMobile);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('justgoals-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          mobile: {
            ...prev.mobile,
            ...parsed.mobile,
          }
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('justgoals-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const updateFocusModeSettings = (updates) => {
    setSettings(prev => ({
      ...prev,
      focusMode: {
        ...prev.focusMode,
        ...updates,
      },
    }));
  };

  const updateNotificationSettings = (updates) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...updates,
      },
    }));
  };

  const updateProgressMeterSettings = (updates) => {
    setSettings(prev => ({
      ...prev,
      progressMeter: {
        ...prev.progressMeter,
        ...updates,
      },
    }));
  };

  const value = {
    settings,
    updateSettings,
    updateFocusModeSettings,
    updateNotificationSettings,
    updateProgressMeterSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 