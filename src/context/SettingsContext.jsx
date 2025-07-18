import React, { useEffect, useCallback, createContext, useContext, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as backupService from '../services/backupService';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Define accent color mappings
const accentColorPalettes = {
  'blue-teal': { light: '#4F80E2', dark: '#3E54D3', foreground: '#FFFFFF', secondary: '#15CDCA', accent: '#4FE086' },
  indigo: { light: '#6366F1', dark: '#818CF8', foreground: '#FFFFFF' },
  violet: { light: '#8B5CF6', dark: '#A78BFA', foreground: '#FFFFFF' },
  emerald: { light: '#10B981', dark: '#34D399', foreground: '#FFFFFF' },
  blue: { light: '#3B82F6', dark: '#60A5FA', foreground: '#FFFFFF' },
  rose: { light: '#F43F5E', dark: '#FB7185', foreground: '#FFFFFF' },
  amber: { light: '#F59E0B', dark: '#FBBF24', foreground: '#000000' },
  dopamine: { light: '#FEF400', dark: '#FF05D0', foreground: '#000000' },
};

const defaultTheme = 'dark';
const defaultAccentColor = 'blue-teal';

export const SettingsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeout = useRef(null);

  const getAppSettingsKey = useCallback(() => {
    if (user && user.id) {
      return `app_settings_${user.id}`;
    }
    return 'app_settings_global';
  }, [user]);

  // Comprehensive default settings
  const getDefaultSettings = useCallback(() => {
    return {
      appearance: {
        theme: defaultTheme,
        accentColor: defaultAccentColor,
        backgroundEffect: 'none'
      },
      notifications: {
        enabled: true,
        milestoneReminders: true,
        focusSessionAlerts: true,
        dailyGoalReminders: true,
        reminderTime: '09:00'
      },
      progressMeter: {
        autoUpdate: true,
        updateFrequency: 'daily',
        progressMode: 'auto',
        autoUpdateInterval: 15
      },
      focusMode: {
        defaultDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        soundEnabled: true,
        selectedAmbientSound: 'none',
        autoStartBreaks: true
      },
      dataManagement: {
        autoBackup: false,
        backupFrequency: 'daily'
      },
      apiKey: '',
      connectionStatus: '',
    };
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const settingsKey = getAppSettingsKey();
      const defaultSettings = getDefaultSettings();
      try {
        let loadedSettings = defaultSettings;
        if (settingsKey) {
          let savedSettings = null;
          try {
            savedSettings = localStorage.getItem(settingsKey);
          } catch (e) {
            // If getItem fails, clear it
            localStorage.removeItem(settingsKey);
          }
          if (savedSettings) {
            try {
              const parsedSettings = JSON.parse(savedSettings);
              if (parsedSettings && typeof parsedSettings === 'object') {
                loadedSettings = { ...defaultSettings, ...parsedSettings };
              } else {
                // Not an object, clear
                localStorage.removeItem(settingsKey);
                loadedSettings = defaultSettings;
              }
            } catch (e) {
              // Corrupt JSON, clear
              localStorage.removeItem(settingsKey);
              loadedSettings = defaultSettings;
            }
          }
        }
        if (user && user.id) {
          let userApiKey = null;
          try {
            userApiKey = localStorage.getItem(`gemini_api_key_${user.id}`);
          } catch (e) {
            localStorage.removeItem(`gemini_api_key_${user.id}`);
          }
          if (userApiKey) {
            try {
              // If it's not a string, clear
              if (typeof userApiKey !== 'string') {
                localStorage.removeItem(`gemini_api_key_${user.id}`);
              } else {
                loadedSettings.apiKey = userApiKey;
              }
            } catch (e) {
              localStorage.removeItem(`gemini_api_key_${user.id}`);
            }
          }
        }
        setSettings(loadedSettings);
      } catch (e) {
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [getAppSettingsKey, user, getDefaultSettings]);

  // Apply accent colors to CSS variables
  useEffect(() => {
    const applyAccentColors = () => {
      const accentColor = settings?.appearance?.accentColor || defaultAccentColor;
      const theme = settings?.appearance?.theme || defaultTheme;
      const palette = accentColorPalettes[accentColor];
      
      if (palette) {
        const root = document.documentElement;
        const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        const primaryColor = isDark ? palette.dark : palette.light;
        const foregroundColor = palette.foreground;
        
        root.style.setProperty('--chosen-accent-light', palette.light);
        root.style.setProperty('--chosen-accent-dark', palette.dark);
        root.style.setProperty('--chosen-accent-foreground', foregroundColor);
        
        // Update primary color based on theme
        root.style.setProperty('--color-primary', primaryColor);
        root.style.setProperty('--color-primary-foreground', foregroundColor);
        
        // For blue-teal colors, also update secondary and accent colors
        if (accentColor === 'blue-teal') {
          root.style.setProperty('--color-secondary', palette.secondary);
          root.style.setProperty('--color-accent', palette.accent);
          root.style.setProperty('--color-secondary-foreground', '#FFFFFF');
          root.style.setProperty('--color-accent-foreground', '#FFFFFF');
        } else if (accentColor === 'dopamine') {
          root.style.setProperty('--color-secondary', '#FF05D0');
          root.style.setProperty('--color-accent', '#00DF60');
          root.style.setProperty('--color-secondary-foreground', '#000000');
          root.style.setProperty('--color-accent-foreground', '#000000');
        } else {
          // Reset to default colors for other schemes
          if (isDark) {
            root.style.setProperty('--color-secondary', '#a78bfa');
            root.style.setProperty('--color-accent', '#34d399');
            root.style.setProperty('--color-secondary-foreground', '#ffffff');
            root.style.setProperty('--color-accent-foreground', '#0f172a');
          } else {
            root.style.setProperty('--color-secondary', '#8b5cf6');
            root.style.setProperty('--color-accent', '#10b981');
            root.style.setProperty('--color-secondary-foreground', '#ffffff');
            root.style.setProperty('--color-accent-foreground', '#ffffff');
          }
        }
      }
    };

    applyAccentColors();
  }, [settings?.appearance?.accentColor, settings?.appearance?.theme]);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const theme = settings?.appearance?.theme || defaultTheme;
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('dark', 'light');
      
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.add('light');
      } else if (theme === 'auto') {
        // Auto theme - check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.add('light');
        }
      }
    };

    applyTheme();
    
    // Listen for system theme changes when auto theme is selected
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (settings?.appearance?.theme === 'auto') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [settings?.appearance?.theme]);

  // Apply background effect to body
  useEffect(() => {
    if (settings?.appearance?.backgroundEffect) {
      document.body.setAttribute('data-bg-effect', settings.appearance.backgroundEffect);
    }
  }, [settings?.appearance?.backgroundEffect]);

  // Save settings to localStorage (debounced)
  const updateSettings = useCallback((newSettings) => {
    const settingsKey = getAppSettingsKey();
    try {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        // Save user-specific settings (excluding API key)
        if (settingsKey) {
          const { apiKey, ...settingsToSave } = newSettings;
          localStorage.setItem(settingsKey, JSON.stringify(settingsToSave));
        }
        // Save API key to user-specific storage
        if (user && user.id && newSettings.apiKey !== undefined) {
          localStorage.setItem(`gemini_api_key_${user.id}`, newSettings.apiKey);
        }
      }, 200);
      setSettings(newSettings);
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  }, [getAppSettingsKey, user]);

  const updateSetting = useCallback((section, key, value) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    };
    updateSettings(newSettings);
  }, [settings, updateSettings]);

  const value = {
    settings,
    updateSettings,
    updateSetting,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 