import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import notificationManager from '../../../utils/notificationUtils';

const NotificationSection = ({ 
  settings, 
  onSettingChange 
}) => {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);

  // Extract notification settings
  const notifications = settings?.notifications || {};

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handlePermissionRequest = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationManager.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted) {
        // Test notification
        await notificationManager.sendNotification('Notifications Enabled!', {
          body: 'You will now receive reminders and updates from your goals app.',
          tag: 'permission-test'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSettingChange = (key, value) => {
    onSettingChange('notifications', key, value);
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked';
      default:
        return 'Permission not set';
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'text-success';
      case 'denied':
        return 'text-error';
      default:
        return 'text-warning';
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-warning to-error rounded-lg flex items-center justify-center">
          <Icon name="Bell" size={16} color="#FFFFFF" />
        </div>
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary">Notifications</h3>
          <p className="text-sm text-text-secondary">Manage your notification preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Permission Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm font-body-medium text-text-primary">
                Notification Permission
              </label>
              <p className="text-xs text-text-secondary">
                {getPermissionStatusText()}
              </p>
            </div>
            <span className={`text-sm font-caption ${getPermissionStatusColor()}`}>
              {permissionStatus.toUpperCase()}
            </span>
          </div>
          
          {permissionStatus !== 'granted' && (
            <Button
              variant="outline"
              onClick={handlePermissionRequest}
              loading={isRequesting}
              iconName="Bell"
              iconPosition="left"
              className="w-full"
            >
              {permissionStatus === 'denied' ? 'Enable in Browser Settings' : 'Enable Notifications'}
            </Button>
          )}
        </div>

        {/* Notification Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-body-medium text-text-primary">
                Milestone Reminders
              </label>
              <p className="text-xs text-text-secondary">
                Get reminded about upcoming milestones
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications?.milestoneReminders || false}
                onChange={(e) => handleSettingChange('milestoneReminders', e.target.checked)}
                disabled={permissionStatus !== 'granted'}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-surface-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-body-medium text-text-primary">
                Focus Session Alerts
              </label>
              <p className="text-xs text-text-secondary">
                Notifications when focus sessions start/end
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications?.focusSessionAlerts || false}
                onChange={(e) => handleSettingChange('focusSessionAlerts', e.target.checked)}
                disabled={permissionStatus !== 'granted'}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-surface-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-body-medium text-text-primary">
                Daily Goal Reminders
              </label>
              <p className="text-xs text-text-secondary">
                Daily check-ins for your active goals
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications?.dailyGoalReminders || false}
                onChange={(e) => handleSettingChange('dailyGoalReminders', e.target.checked)}
                disabled={permissionStatus !== 'granted'}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-surface-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Reminder Time */}
        <div>
          <label className="block text-sm font-body-medium text-text-primary mb-2">
            Daily Reminder Time
          </label>
          <input
            type="time"
            value={notifications?.reminderTime || '09:00'}
            onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
            disabled={permissionStatus !== 'granted'}
            className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Test Notification */}
        {permissionStatus === 'granted' && (
          <div>
            <Button
              variant="outline"
              onClick={() => notificationManager.sendNotification('Test Notification', {
                body: 'This is a test notification from your goals app!',
                tag: 'test-notification'
              })}
              iconName="Bell"
              iconPosition="left"
              className="w-full"
            >
              Send Test Notification
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSection;