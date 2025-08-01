import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import firestoreService from '../services/firestoreService';
import { applyThemeColors, initializeTheme } from '../utils/themeUtils';

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
    
    // Profile
    profile: {
      displayName: '',
    },
    
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
      schedules: {
        morningMotivation: '08:00',
        eveningReflection: '20:00',
        focusReminders: '14:00',
        streakProtection: '21:00',
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
    // API Key
    geminiApiKey: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMusicMuted, setMusicMuted] = useState(false);

  // Apply theme to document body and CSS variables
  useEffect(() => {
    const theme = settings.appearance?.theme || settings.theme || 'system';
    const accentColor = settings.appearance?.accentColor || 'indigo';
    
    // Apply comprehensive theme colors using the new utility
    applyThemeColors(accentColor, theme);
  }, [settings.appearance?.theme, settings.theme, settings.appearance?.accentColor]);

  // Initialize theme on mount
  useEffect(() => {
    if (isLoaded) {
      initializeTheme(settings);
    }
  }, [isLoaded, settings]);

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
    
    // Always save to localStorage immediately
    localStorage.setItem('justgoals-settings', JSON.stringify(settings));
    
    // Attempt to save to Firestore if authenticated, with error handling
    if (isAuthenticated && user && user.id) {
      firestoreService.saveAppSettings(user.id, settings)
        .catch(error => {
          console.warn('Failed to sync settings to Firestore:', error);
          // Settings are still saved in localStorage
        });
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
    setSettings(prev => {
      const newNotifications = {
        ...prev.notifications,
        ...updates,
      };
      
      // Save notification settings immediately to localStorage for reliability
      const newSettings = {
        ...prev,
        notifications: newNotifications,
      };
      
      try {
        localStorage.setItem('justgoals-settings', JSON.stringify(newSettings));
        
        // Also save to Firestore if authenticated
        if (isAuthenticated && user && user.id) {
          firestoreService.saveAppSettings(user.id, newSettings).catch(error => {
            console.warn('Failed to save notification settings to Firestore:', error);
          });
        }
      } catch (error) {
        console.error('Failed to save notification settings to localStorage:', error);
      }
      
      return newSettings;
    });
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

  // Update appearance settings with immediate CSS variable application
  const updateAppearanceSettings = (updates) => {
    setSettings(prev => {
      const newAppearance = {
        ...prev.appearance,
        ...updates,
      };
      
      // Apply theme changes immediately to CSS custom properties
      if (updates.theme || updates.accentColor) {
        applyThemeToDOM(newAppearance.theme || 'dark', newAppearance.accentColor || 'indigo');
      }
      
      return {
        ...prev,
        appearance: newAppearance,
      };
    });
  };

  // Helper function to apply theme to DOM immediately
  const applyThemeToDOM = (theme, accentColor) => {
    const root = document.documentElement;
    
    // Apply theme class
    root.className = root.className.replace(/\btheme-\w+/g, '');
    root.classList.add(`theme-${theme}`);
    
    // Apply accent color class
    root.className = root.className.replace(/\baccent-\w+/g, '');
    root.classList.add(`accent-${accentColor}`);
    
    // Force a gentle repaint without affecting layout
    root.style.visibility = 'visible';
  };

  // Add a robust updateApiKey method
  const updateApiKey = (apiKey) => {
    setSettings(prev => {
      const updated = { ...prev, geminiApiKey: apiKey };
      
      // Always update localStorage immediately
      localStorage.setItem('justgoals-settings', JSON.stringify(updated));
      
      // Attempt to save to Firestore if authenticated, but don't block on it
      if (isAuthenticated && user && user.id) {
        firestoreService.saveAppSettings(user.id, updated)
          .catch(error => {
            console.warn('Failed to save API key to Firestore:', error);
            // API key is still saved in localStorage and state
          });
      }
      
      return updated;
    });
  };

  const value = {
    settings,
    updateSettings,
    updateApiKey,
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