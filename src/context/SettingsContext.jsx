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
    appearance: {
      theme: 'system',
      accentColor: 'indigo',
      backgroundEffect: 'none',
    },
    theme: 'system', // legacy, for migration
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
      // New notification channels
      email: {
        enabled: false,
        address: '',
        provider: 'gmail', // gmail, sendgrid, mailgun
      },
      sms: {
        enabled: false,
        phoneNumber: '',
        carrier: '', // att, verizon, tmobile, sprint, etc.
        provider: 'email-sms', // email-sms, telegram, discord
      },
      discord: {
        enabled: false,
        webhookUrl: '',
      },
      ntfy: {
        enabled: false,
        topic: '',
        username: '',
        password: '',
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

  // Apply theme to document body
  useEffect(() => {
    const theme = settings.appearance?.theme || settings.theme || 'system';
    document.body.classList.remove('dark', 'light');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'dark' : 'light');
    }
  }, [settings.appearance?.theme, settings.theme]);

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
          },
          // Ensure new notification channels are initialized
          notifications: {
            ...prev.notifications,
            ...parsed.notifications,
            email: {
              ...prev.notifications.email,
              ...parsed.notifications?.email,
            },
            sms: {
              ...prev.notifications.sms,
              ...parsed.notifications?.sms,
            },
            discord: {
              ...prev.notifications.discord,
              ...parsed.notifications?.discord,
            },
            ntfy: {
              ...prev.notifications.ntfy,
              ...parsed.notifications?.ntfy,
            },
          },
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

  // Update appearance settings
  const updateAppearanceSettings = (updates) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
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
    updateAppearanceSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 