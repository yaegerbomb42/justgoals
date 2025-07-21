import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import firestoreService from '../services/firestoreService';

const SettingsContext = createContext();

// Global music mute state
let globalMusicMuted = false;

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    // Appearance
    appearance: {
      theme: 'system',
      accentColor: 'indigo',
      backgroundEffect: 'none',
      backgroundMusic: 'none', // new
      backgroundMusicVolume: 0.5, // new
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMusicMuted, setMusicMuted] = useState(false);

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

  // On mount or user change, load settings from Firestore if logged in, else from localStorage
  useEffect(() => {
    async function loadSettings() {
      if (isAuthenticated && user && user.id) {
        try {
          const remoteSettings = await firestoreService.getAppSettings(user.id);
          if (remoteSettings && Object.keys(remoteSettings).length > 0) {
            setSettings(prev => ({ ...prev, ...remoteSettings }));
            localStorage.setItem('justgoals-settings', JSON.stringify(remoteSettings));
            setIsLoaded(true);
            return;
          }
        } catch (error) {
          // Fallback to localStorage
        }
      }
      // Fallback: load from localStorage
      const savedSettings = localStorage.getItem('justgoals-settings');
      if (savedSettings) {
        try {
          setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
        } catch {}
      }
      setIsLoaded(true);
    }
    loadSettings();
  }, [isAuthenticated, user]);

  // Save settings to localStorage and Firestore (if logged in) whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('justgoals-settings', JSON.stringify(settings));
    if (isAuthenticated && user && user.id) {
      firestoreService.saveAppSettings(user.id, settings).catch(() => {});
    }
  }, [settings, isAuthenticated, user, isLoaded]);

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
    isMusicMuted,
    setMusicMuted,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 