import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Corrected import
import Header from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import Icon from '../../components/AppIcon';

// Import all setting components
import ApiKeySection from './components/ApiKeySection';
import AppearanceSection from './components/AppearanceSection';
import NotificationSection from './components/NotificationSection';
import ProgressMeterSection from './components/ProgressMeterSection';
import FocusModeSection from './components/FocusModeSection';
import DataManagementSection from './components/DataManagementSection';
import { useSettings } from '../../context/SettingsContext'; // Correct import
import { useAchievements } from '../../context/AchievementContext';

const SettingsConfiguration = () => {
  const { settings, updateSettings, updateSetting } = useSettings();
  // Defensive: always provide a safe default settings object
  const safeSettings = settings && typeof settings === 'object' ? settings : {
    appearance: { theme: 'dark', accentColor: 'indigo', backgroundEffect: 'none' },
    notifications: { enabled: true, milestoneReminders: true, focusSessionAlerts: true, dailyGoalReminders: true, reminderTime: '09:00' },
    progressMeter: { autoUpdate: true, updateFrequency: 'daily', progressMode: 'auto', autoUpdateInterval: 15 },
    focusMode: { defaultDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, soundEnabled: true, selectedAmbientSound: 'none', autoStartBreaks: true },
    dataManagement: { autoBackup: false, backupFrequency: 'daily' }
  };
  const [activeSection, setActiveSection] = useState('api');
  const [selectedBackground, setSelectedBackground] = useState(safeSettings.appearance.backgroundEffect || 'none');
  const [selectedTheme, setSelectedTheme] = useState(safeSettings.appearance.theme || 'dark');
  const { user, isAuthenticated, factoryReset } = useAuth();
  const navigate = useNavigate();
  const { syncStatus, lastSync, errorLogs } = useAchievements();
  const [settingsError, setSettingsError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Robust updateSettings with error handling
  const robustUpdateSettings = async (newSettings) => {
    setIsSaving(true);
    setSettingsError(null);
    try {
      if (JSON.stringify(settings) !== JSON.stringify(newSettings)) {
        await updateSettings(newSettings);
        console.log('[Settings] Updated:', newSettings);
      }
    } catch (e) {
      setSettingsError('Failed to update settings. Please try again.');
      console.error('[Settings] Update error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const robustUpdateSetting = async (section, key, value) => {
    setIsSaving(true);
    setSettingsError(null);
    try {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: value
        }
      };
      if (JSON.stringify(settings) !== JSON.stringify(newSettings)) {
        await updateSettings(newSettings);
        console.log(`[Settings] Updated ${section}.${key}:`, value);
      }
    } catch (e) {
      setSettingsError('Failed to update setting. Please try again.');
      console.error('[Settings] Update error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const getAppSettingsKey = () => {
    if (user && user.id) {
      return `app_settings_${user.id}`;
    }
    return null;
  };

  const handleResetAllData = () => {
    if (window.confirm('This will permanently delete all your data and reset all settings. This action cannot be undone. Are you sure?')) {
      factoryReset();
      
      // Reset the settings to defaults
      const defaultSettings = {
        appearance: {
          theme: 'dark',
          accentColor: 'indigo',
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
        }
      };
      
      updateSettings(defaultSettings);

      alert('All data has been reset. The app will reload to apply changes.');
      window.location.reload();
    }
  };

  // Handle background effect change
  const handleBackgroundChange = (effect) => {
    setSelectedBackground(effect);
    robustUpdateSetting('appearance', 'backgroundEffect', effect);
  };

  // Handle theme change
  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    robustUpdateSetting('appearance', 'theme', theme);
  };

  const menuItems = [
    { id: 'api', label: 'AI Assistant', icon: 'Bot', color: 'text-primary' },
    { id: 'appearance', label: 'Theme & Appearance', icon: 'Palette', color: 'text-accent' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', color: 'text-secondary' },
    { id: 'progress', label: 'Progress Tracking', icon: 'TrendingUp', color: 'text-success' },
    { id: 'focus', label: 'Focus Mode', icon: 'Focus', color: 'text-warning' },
    { id: 'data', label: 'Data Management', icon: 'Database', color: 'text-error' }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'api':
        return <ApiKeySection />;
      case 'appearance':
        return (
          <AppearanceSection
            settings={safeSettings}
            onSettingChange={robustUpdateSetting}
          />
        );
      case 'notifications':
        return (
          <NotificationSection
            settings={safeSettings}
            onSettingChange={robustUpdateSetting}
          />
        );
      case 'progress':
        return (
          <ProgressMeterSection
            settings={safeSettings}
            onSettingChange={robustUpdateSetting}
          />
        );
      case 'focus':
        return (
          <FocusModeSection
            settings={safeSettings}
            onSettingChange={robustUpdateSetting}
          />
        );
      case 'data':
        return (
          <DataManagementSection
            autoBackup={safeSettings.dataManagement?.autoBackup || false}
            onAutoBackupChange={(value) => robustUpdateSetting('dataManagement', 'autoBackup', value)}
            backupFrequency={safeSettings.dataManagement?.backupFrequency || 'daily'}
            onBackupFrequencyChange={(value) => robustUpdateSetting('dataManagement', 'backupFrequency', value)}
            onExportData={() => {}} // Handled internally in DataManagementSection
            onImportData={() => {}} // Handled internally in DataManagementSection
            onResetAllData={handleResetAllData}
          />
        );
      case 'sync':
        return renderSyncStatusSection();
      case 'errors':
        return renderErrorLogsSection();
      default:
        return null;
    }
  };

  // Cross-Device Sync Status Section
  const renderSyncStatusSection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-heading-bold mb-4">Sync Status</h2>
      <div>
        <span className="font-body-medium">Status: </span>
        <span className={
          syncStatus === 'success' ? 'text-success' :
          syncStatus === 'syncing' ? 'text-info' :
          syncStatus === 'error' ? 'text-error' : 'text-text-secondary'
        }>
          {syncStatus === 'success' && 'Synced'}
          {syncStatus === 'syncing' && 'Syncing...'}
          {syncStatus === 'error' && 'Sync Error'}
          {syncStatus === 'idle' && 'Idle'}
        </span>
      </div>
      <div>
        <span className="font-body-medium">Last Sync: </span>
        <span>{lastSync ? lastSync.toLocaleString() : 'Never'}</span>
      </div>
    </div>
  );

  // Error Logs Section
  const renderErrorLogsSection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-heading-bold mb-4">Error Logs</h2>
      {errorLogs.length === 0 ? (
        <div className="text-text-secondary">No errors logged.</div>
      ) : (
        <ul className="space-y-2">
          {errorLogs.map((err, idx) => (
            <li key={idx} className="p-2 bg-error/10 border border-error/20 rounded text-error text-xs">
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {(!settings || typeof settings !== 'object') && (
        <div className="bg-error/10 border border-error/20 text-error text-center p-4 mb-4 rounded">
          <strong>Settings data is missing or corrupted.</strong> The app is using safe defaults. Please check your connection or try reloading.
        </div>
      )}
      {settingsError && (
        <div className="bg-error/10 border border-error/20 text-error text-center p-4 mb-4 rounded">
          <strong>{settingsError}</strong>
        </div>
      )}
      {isSaving && (
        <div className="bg-info/10 border border-info/20 text-info text-center p-4 mb-4 rounded">
          <strong>Saving settings...</strong>
        </div>
      )}
      
      <main className="pt-20 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-heading-bold text-text-primary mb-2">
              Settings & Configuration
            </h1>
            <p className="text-text-secondary">
              Customize your experience and configure integrations
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Menu */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-64"
            >
              <div className="bg-surface rounded-lg border border-border p-4">
                <h3 className="font-heading-medium text-text-primary mb-4">Settings</h3>
                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? 'bg-primary text-white' :'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                      }`}
                    >
                      <Icon name={item.icon} size={18} />
                      <span className="font-body text-sm">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderSection()}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <FloatingActionButton />
    </div>
  );
};

export default SettingsConfiguration;