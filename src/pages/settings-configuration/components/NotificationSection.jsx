import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import Icon from '../../../components/ui/Icon';

const NotificationSection = () => {
  const { settings, updateNotificationSettings } = useSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggle = (key) => {
    updateNotificationSettings({
      [key]: !settings.notifications[key]
    });
  };

  const handleQuietHoursToggle = () => {
    updateNotificationSettings({
      quietHours: {
        ...settings.notifications.quietHours,
        enabled: !settings.notifications.quietHours.enabled
      }
    });
  };

  const handleTimeChange = (field, value) => {
    updateNotificationSettings({
      quietHours: {
        ...settings.notifications.quietHours,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="Bell" className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Notifications</h3>
          <p className="text-sm text-text-secondary">Configure when and how you receive notifications</p>
        </div>
      </div>

      {/* Main Notification Toggle */}
      <div className="bg-surface-700 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-text-primary">Enable Notifications</h4>
            <p className="text-sm text-text-secondary">Turn on all notification features</p>
          </div>
          <button
            onClick={() => handleToggle('enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              settings.notifications.enabled ? 'bg-primary' : 'bg-surface-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        <h4 className="font-medium text-text-primary">Notification Types</h4>
        
        {/* Morning Motivation */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Icon name="Sun" className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h5 className="font-medium text-text-primary">Morning Motivation</h5>
              <p className="text-sm text-text-secondary">Daily inspiration to start your day</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('morningMotivation')}
            disabled={!settings.notifications.enabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              settings.notifications.enabled && settings.notifications.morningMotivation 
                ? 'bg-yellow-500' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled && settings.notifications.morningMotivation 
                  ? 'translate-x-5' 
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Evening Reflection */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Icon name="Moon" className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h5 className="font-medium text-text-primary">Evening Reflection</h5>
              <p className="text-sm text-text-secondary">End-of-day check-in prompts</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('eveningReflection')}
            disabled={!settings.notifications.enabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              settings.notifications.enabled && settings.notifications.eveningReflection 
                ? 'bg-blue-500' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled && settings.notifications.eveningReflection 
                  ? 'translate-x-5' 
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Streak Protection */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Icon name="Shield" className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h5 className="font-medium text-text-primary">Streak Protection</h5>
              <p className="text-sm text-text-secondary">Alerts when habits are about to break</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('streakProtection')}
            disabled={!settings.notifications.enabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              settings.notifications.enabled && settings.notifications.streakProtection 
                ? 'bg-red-500' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled && settings.notifications.streakProtection 
                  ? 'translate-x-5' 
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Focus Reminders */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Icon name="Zap" className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <h5 className="font-medium text-text-primary">Focus Reminders</h5>
              <p className="text-sm text-text-secondary">Optimal focus time notifications</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('focusReminders')}
            disabled={!settings.notifications.enabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              settings.notifications.enabled && settings.notifications.focusReminders 
                ? 'bg-green-500' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled && settings.notifications.focusReminders 
                  ? 'translate-x-5' 
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Goal Deadlines */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Icon name="Clock" className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h5 className="font-medium text-text-primary">Goal Deadlines</h5>
              <p className="text-sm text-text-secondary">Reminders for approaching deadlines</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('goalDeadlines')}
            disabled={!settings.notifications.enabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              settings.notifications.enabled && settings.notifications.goalDeadlines 
                ? 'bg-orange-500' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled && settings.notifications.goalDeadlines 
                  ? 'translate-x-5' 
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Achievement Celebrations */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Icon name="Award" className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h5 className="font-medium text-text-primary">Achievement Celebrations</h5>
              <p className="text-sm text-text-secondary">Celebrate your accomplishments</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('achievementCelebrations')}
            disabled={!settings.notifications.enabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              settings.notifications.enabled && settings.notifications.achievementCelebrations 
                ? 'bg-purple-500' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled && settings.notifications.achievementCelebrations 
                  ? 'translate-x-5' 
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <Icon name={showAdvanced ? "ChevronUp" : "ChevronDown"} className="w-4 h-4" />
          <span>Advanced Settings</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-surface-700 rounded-lg border border-border">
            {/* Quiet Hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-text-primary">Quiet Hours</h5>
                  <p className="text-sm text-text-secondary">Pause notifications during specific hours</p>
                </div>
                <button
                  onClick={handleQuietHoursToggle}
                  disabled={!settings.notifications.enabled}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                    settings.notifications.enabled && settings.notifications.quietHours.enabled 
                      ? 'bg-primary' 
                      : 'bg-surface-600'
                  } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                      settings.notifications.enabled && settings.notifications.quietHours.enabled 
                        ? 'translate-x-5' 
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.notifications.quietHours.enabled && (
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Start Time</label>
                    <input
                      type="time"
                      value={settings.notifications.quietHours.start}
                      onChange={(e) => handleTimeChange('start', e.target.value)}
                      className="px-3 py-2 bg-surface-600 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">End Time</label>
                    <input
                      type="time"
                      value={settings.notifications.quietHours.end}
                      onChange={(e) => handleTimeChange('end', e.target.value)}
                      className="px-3 py-2 bg-surface-600 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="Info" className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-primary mb-1">About Notifications</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Notifications help you stay on track with your goals. Morning motivation gets you started, 
              evening reflection helps you review your day, and streak protection ensures you don't break 
              your momentum. You can customize quiet hours to avoid interruptions during specific times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSection;