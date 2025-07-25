import React, { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useNotificationContext } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../../../components/ui/Icon';
import emailNotificationService from '../../../services/emailNotificationService';
import smsNotificationService from '../../../services/smsNotificationService';
import discordNotificationService from '../../../services/discordNotificationService';
import ntfyNotificationService from '../../../services/ntfyNotificationService';
import inAppNotificationService from '../../../services/inAppNotificationService';
import notificationSchedulerService from '../../../services/notificationSchedulerService';
import firestoreService from '../../../services/firestoreService';

const NotificationSection = () => {
  const { settings, updateNotificationSettings } = useSettings();
  const notificationContext = useNotificationContext();
  const { user } = useAuth();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testStatus, setTestStatus] = useState({});

  // In-app notification settings - use default values if context not available
  const inAppSettings = notificationContext?.settings || {
    enabled: true,
    position: 'top-left',
    animation: 'slide',
    maxConcurrent: 3,
    defaultTimeout: 5000
  };

  // Handle in-app notification settings
  const handleInAppSettingChange = (key, value) => {
    if (notificationContext?.updateSettings) {
      notificationContext.updateSettings({ [key]: value });
    }
  };

  const handleTestInAppNotification = (type) => {
    setTestStatus(prev => ({ ...prev, [`inapp-${type}`]: 'sending' }));
    
    try {
      switch (type) {
        case 'success':
          inAppNotificationService.showSuccess('Test success notification!');
          break;
        case 'warning':
          inAppNotificationService.showWarning('Test warning notification!');
          break;
        case 'error':
          inAppNotificationService.showError('Test error notification!');
          break;
        case 'achievement':
          inAppNotificationService.showAchievement({
            id: 'test',
            title: 'Test Achievement',
            description: 'You successfully tested the notification system!'
          });
          break;
        case 'habit':
          inAppNotificationService.showHabitReminder({
            id: 'test',
            title: 'Test Habit'
          });
          break;
        case 'goal':
          inAppNotificationService.showGoalDeadline({
            id: 'test',
            title: 'Test Goal'
          }, 2);
          break;
        default:
          inAppNotificationService.showTest();
      }
      
      setTestStatus(prev => ({ 
        ...prev, 
        [`inapp-${type}`]: 'success' 
      }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [`inapp-${type}`]: null }));
      }, 3000);
      
    } catch (error) {
      console.error(`Test in-app ${type} notification failed:`, error);
      setTestStatus(prev => ({ ...prev, [`inapp-${type}`]: 'error' }));
    }
  };

  const handleToggle = (key) => {
    updateNotificationSettings({
      [key]: !settings.notifications[key]
    });
    // Sync to backend for scheduled notifications
    syncToBackend();
  };

  const handleQuietHoursToggle = () => {
    updateNotificationSettings({
      quietHours: {
        ...settings.notifications.quietHours,
        enabled: !settings.notifications.quietHours.enabled
      }
    });
    syncToBackend();
  };

  const handleTimeChange = (field, value) => {
    updateNotificationSettings({
      quietHours: {
        ...settings.notifications.quietHours,
        [field]: value
      }
    });
    syncToBackend();
  };

  // Sync notification settings to backend for scheduled notifications
  const syncToBackend = async () => {
    if (!user) return;
    
    try {
      await notificationSchedulerService.saveUserNotificationSettings(user.id, settings.notifications);
      console.log('Notification settings synced to backend');
    } catch (error) {
      console.error('Failed to sync notification settings to backend:', error);
    }
  };

  // Test backend notification system
  const testBackendNotifications = async () => {
    if (!user) return;
    
    setTestStatus(prev => ({ ...prev, 'backend': 'sending' }));
    
    try {
      const success = await notificationSchedulerService.testBackendConnection(
        user.id, 
        "🧪 Backend notification test! Your scheduled notifications will work even when the browser is closed."
      );
      
      setTestStatus(prev => ({ 
        ...prev, 
        'backend': success ? 'success' : 'error' 
      }));
      
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, 'backend': null }));
      }, 3000);
      
    } catch (error) {
      console.error('Backend notification test failed:', error);
      setTestStatus(prev => ({ ...prev, 'backend': 'error' }));
    }
  };

  const handleSMSChange = (phoneNumber, carrier) => {
    updateNotificationSettings({
      sms: {
        ...settings.notifications.sms,
        phoneNumber,
        carrier,
        enabled: !!(phoneNumber && carrier)
      }
    });
    
    if (phoneNumber && carrier) {
      smsNotificationService.init(phoneNumber, carrier);
    }
  };

  const handleDiscordChange = async (webhookUrl) => {
    const discordSettings = {
      ...settings.notifications.discord,
      webhookUrl,
      enabled: !!webhookUrl
    };

    updateNotificationSettings({
      discord: discordSettings
    });
    
    if (webhookUrl) {
      discordNotificationService.init(webhookUrl);
    }

    // Persist Discord settings to Firebase
    try {
      await firestoreService.saveNotificationSettings(user?.uid, {
        ...settings.notifications,
        discord: discordSettings
      });
      console.log('Discord webhook settings saved to Firebase');
    } catch (error) {
      console.error('Failed to save Discord settings to Firebase:', error);
    }
  };

  const handleNtfyChange = (topic) => {
    updateNotificationSettings({
      ntfy: {
        ...settings.notifications.ntfy,
        topic,
        enabled: !!topic
      }
    });
    
    if (topic) {
      ntfyNotificationService.init(topic);
    }
    
    // Sync to backend for scheduled notifications
    syncToBackend();
  };

  const handleScheduleTimeChange = (notificationType, time) => {
    updateNotificationSettings({
      schedules: {
        ...settings.notifications.schedules,
        [notificationType]: time
      }
    });
    
    // Sync to backend for scheduled notifications
    syncToBackend();
  };

  const handleTestNotification = async (type) => {
    setTestStatus(prev => ({ ...prev, [type]: 'sending' }));
    
    try {
      let success = false;
      
      switch (type) {
        case 'sms':
          success = await smsNotificationService.sendTestSMS();
          break;
        case 'discord':
          success = await discordNotificationService.sendSimpleNotification('🧪 Test notification from JustGoals!');
          break;
        case 'browser':
          // Test browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('JustGoals', {
              body: 'Browser notifications are working!',
              icon: '/assets/images/app-icon.png',
              badge: '/assets/images/app-icon.png',
              data: { theme: 'justgoals' }
            });
            success = true;
          }
          break;
        case 'ntfy':
          success = await ntfyNotificationService.sendTestNotification();
          break;
      }
      
      setTestStatus(prev => ({ 
        ...prev, 
        [type]: success ? 'success' : 'error' 
      }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [type]: null }));
      }, 3000);
      
    } catch (error) {
      console.error(`Test ${type} notification failed:`, error);
      setTestStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  const getTestButtonContent = (type) => {
    const status = testStatus[type];
    if (status === 'sending') return 'Sending...';
    if (status === 'success') return '✓ Sent';
    if (status === 'error') return '✗ Failed';
    return 'Test';
  };

  const getTestButtonClass = (type) => {
    const status = testStatus[type];
    if (status === 'sending') return 'bg-warning hover:bg-warning/90';
    if (status === 'success') return 'bg-success hover:bg-success/90';
    if (status === 'error') return 'bg-error hover:bg-error/90';
    return 'bg-primary hover:bg-primary/90';
  };

  // Add channel preferences state and handler
  const channelOptions = [
    { id: 'browser', label: 'Browser', icon: 'Globe', color: 'blue' },
    { id: 'discord', label: 'Discord', icon: 'MessageCircle', color: 'indigo' },
    { id: 'ntfy', label: 'ntfy', icon: 'Bell', color: 'orange' },
  ];
  const selectedChannels = settings.notifications.channelPreferences || [];
  const handleChannelToggle = (id) => {
    let updated;
    if (selectedChannels.includes(id)) {
      updated = selectedChannels.filter(c => c !== id);
    } else {
      updated = [...selectedChannels, id];
    }
    updateNotificationSettings({ channelPreferences: updated });
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
            role="switch"
            aria-checked={settings.notifications.enabled}
            aria-label="Enable Notifications"
            tabIndex={0}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* In-App Notification Settings */}
      <div className="space-y-4" role="group" aria-label="In-App Notification Settings">
        <h4 className="font-medium text-text-primary">In-App Notifications</h4>
        <p className="text-sm text-text-secondary">Configure toast notifications that appear within the app</p>
        
        {/* In-App Notifications Toggle */}
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Icon name="Monitor" className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h5 className="font-medium text-text-primary">Enable In-App Notifications</h5>
                <p className="text-sm text-text-secondary">Show toast notifications in the app</p>
              </div>
            </div>
            <button
              onClick={() => handleInAppSettingChange('enabled', !inAppSettings.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                inAppSettings.enabled ? 'bg-primary' : 'bg-surface-600'
              }`}
              role="switch"
              aria-checked={inAppSettings.enabled}
              aria-label="Enable In-App Notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  inAppSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {inAppSettings.enabled && (
            <div className="space-y-4">
              {/* Position Setting */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'top-left', label: 'Top Left' },
                    { value: 'top-right', label: 'Top Right' },
                    { value: 'bottom-left', label: 'Bottom Left' },
                    { value: 'bottom-right', label: 'Bottom Right' }
                  ].map((position) => (
                    <button
                      key={position.value}
                      onClick={() => handleInAppSettingChange('position', position.value)}
                      className={`p-2 rounded-lg border transition-colors text-sm ${
                        inAppSettings.position === position.value
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-surface-800 border-border text-text-secondary hover:bg-surface-700'
                      }`}
                    >
                      {position.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Setting */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Animation Style</label>
                <div className="flex space-x-2">
                  {[
                    { value: 'slide', label: 'Slide' },
                    { value: 'fade', label: 'Fade' },
                    { value: 'bounce', label: 'Bounce' }
                  ].map((animation) => (
                    <button
                      key={animation.value}
                      onClick={() => handleInAppSettingChange('animation', animation.value)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                        inAppSettings.animation === animation.value
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-surface-800 border-border text-text-secondary hover:bg-surface-700'
                      }`}
                    >
                      {animation.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Concurrent Notifications */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Max Concurrent: {inAppSettings.maxConcurrent}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={inAppSettings.maxConcurrent}
                  onChange={(e) => handleInAppSettingChange('maxConcurrent', parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Test Buttons */}
              <div className="pt-4 border-t border-border">
                <h6 className="text-sm font-medium text-text-primary mb-3">Test Notifications</h6>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'success', label: 'Success' },
                    { type: 'warning', label: 'Warning' },
                    { type: 'error', label: 'Error' }
                  ].map((test) => (
                    <button
                      key={test.type}
                      onClick={() => handleTestInAppNotification(test.type)}
                      className={`px-3 py-2 text-xs font-medium text-white rounded-lg transition-colors ${getTestButtonClass(`inapp-${test.type}`)}`}
                    >
                      {getTestButtonContent(`inapp-${test.type}`)} {test.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* External Notification Channels */}
      <div className="space-y-4" role="group" aria-label="External Notification Channels">
        <h4 className="font-medium text-text-primary">External Notification Channels</h4>
        {/* Channel Selection UI */}
        <div className="flex space-x-2 mb-2">
          {channelOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleChannelToggle(opt.id)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors duration-150 text-sm font-medium
                ${selectedChannels.includes(opt.id)
                  ? `bg-${opt.color}-500/20 border-${opt.color}-500 text-${opt.color}-500`
                  : 'bg-surface-800 border-border text-text-secondary hover:bg-surface-700'}
              `}
              aria-pressed={selectedChannels.includes(opt.id)}
              type="button"
            >
              <Icon name={opt.icon} className={`w-4 h-4 ${selectedChannels.includes(opt.id) ? `text-${opt.color}-500` : 'text-text-secondary'}`} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        
        {/* Browser Notifications */}
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Icon name="Globe" className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h5 className="font-medium text-text-primary">Browser Notifications</h5>
                <p className="text-sm text-text-secondary">Push notifications in your browser</p>
              </div>
            </div>
            <button
              onClick={() => handleTestNotification('browser')}
              disabled={!settings.notifications.enabled}
              className={`px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors ${getTestButtonClass('browser')} ${
                !settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Test Browser Notification"
            >
              {getTestButtonContent('browser')}
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            Works when the app is open. Install as PWA for background notifications.
          </p>
        </div>

        {/* SMS Notifications - REMOVED: Per user request to remove email to SMS option */}
        {/*
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Icon name="MessageCircle" className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <h5 className="font-medium text-text-primary">SMS Notifications</h5>
                <p className="text-sm text-text-secondary">Receive notifications via SMS (US carriers only)</p>
              </div>
            </div>
            <button
              onClick={() => handleTestNotification('sms')}
              disabled={!settings.notifications.enabled || !settings.notifications.sms?.phoneNumber || !settings.notifications.sms?.carrier}
              className={`px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors ${getTestButtonClass('sms')} ${
                !settings.notifications.enabled || !settings.notifications.sms?.phoneNumber || !settings.notifications.sms?.carrier ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Test SMS Notification"
            >
              {getTestButtonContent('sms')}
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={settings.notifications.sms?.phoneNumber || ''}
              onChange={(e) => handleSMSChange(e.target.value, settings.notifications.sms?.carrier)}
              className="w-full px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Carrier (e.g. xfinity, att, verizon)"
              value={settings.notifications.sms?.carrier || ''}
              onChange={(e) => handleSMSChange(settings.notifications.sms?.phoneNumber, e.target.value)}
              className="w-full px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-text-secondary">
              Receive notifications via SMS (US carriers only)
            </p>
          </div>
        </div>
        */}

        {/* Discord Notifications */}
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Icon name="MessageCircle" className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <h5 className="font-medium text-text-primary">Discord Notifications</h5>
                <p className="text-sm text-text-secondary">Receive notifications in Discord</p>
              </div>
            </div>
            <button
              onClick={() => handleTestNotification('discord')}
              disabled={!settings.notifications.enabled || !settings.notifications.discord?.webhookUrl}
              className={`px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors ${getTestButtonClass('discord')} ${
                !settings.notifications.enabled || !settings.notifications.discord?.webhookUrl ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Test Discord Notification"
            >
              {getTestButtonContent('discord')}
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="url"
              placeholder="Discord webhook URL"
              value={settings.notifications.discord?.webhookUrl || ''}
              onChange={(e) => handleDiscordChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-text-secondary">
              Create a webhook in your Discord server settings.
            </p>
          </div>
        </div>

        {/* ntfy.sh Notifications */}
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Icon name="Bell" className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h5 className="font-medium text-text-primary">ntfy.sh Push Notifications</h5>
                <p className="text-sm text-text-secondary">Free push notifications to your phone using the ntfy app</p>
              </div>
            </div>
            <button
              onClick={() => handleTestNotification('ntfy')}
              disabled={!settings.notifications.enabled || !settings.notifications.ntfy?.topic}
              className={`px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors ${getTestButtonClass('ntfy')} ${
                !settings.notifications.enabled || !settings.notifications.ntfy?.topic ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Test ntfy Notification"
            >
              {getTestButtonContent('ntfy')}
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="ntfy topic (e.g. mywebapp_alerts_xyz123)"
              value={settings.notifications.ntfy?.topic || ''}
              onChange={(e) => handleNtfyChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-text-secondary">
              <strong>How to use:</strong> Download the <a href="https://ntfy.sh/app/" target="_blank" rel="noopener noreferrer" className="underline text-primary">ntfy app</a> on your phone, choose a unique topic, and subscribe to it in the app. Enter your topic above.
            </p>
            
            {/* Backend Test */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h6 className="text-sm font-medium text-text-primary">Backend Notifications</h6>
                  <p className="text-xs text-text-secondary">Test scheduled notifications that work even when browser is closed</p>
                </div>
                <button
                  onClick={testBackendNotifications}
                  disabled={!settings.notifications.enabled || !settings.notifications.ntfy?.topic}
                  className={`px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors ${
                    !settings.notifications.enabled || !settings.notifications.ntfy?.topic 
                      ? 'bg-gray-500 opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  aria-label="Test Backend Notifications"
                >
                  Test Backend
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4" role="group" aria-label="Notification Types">
        <h4 className="font-medium text-text-primary">Notification Types</h4>
        
        {/* Morning Motivation */}
        <div className="flex items-center justify-between p-3 bg-surface-700 rounded-lg border border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Icon name="Sun" className="w-4 h-4 text-warning" />
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
                ? 'bg-warning' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={settings.notifications.enabled && settings.notifications.morningMotivation}
            aria-label="Toggle Morning Motivation Notifications"
            tabIndex={0}
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
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Moon" className="w-4 h-4 text-primary" />
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
                ? 'bg-primary' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={settings.notifications.enabled && settings.notifications.eveningReflection}
            aria-label="Toggle Evening Reflection Notifications"
            tabIndex={0}
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
            <div className="p-2 bg-error/10 rounded-lg">
              <Icon name="Shield" className="w-4 h-4 text-error" />
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
                ? 'bg-error' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={settings.notifications.enabled && settings.notifications.streakProtection}
            aria-label="Toggle Streak Protection Notifications"
            tabIndex={0}
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
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon name="Zap" className="w-4 h-4 text-success" />
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
                ? 'bg-success' 
                : 'bg-surface-600'
            } ${!settings.notifications.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={settings.notifications.enabled && settings.notifications.focusReminders}
            aria-label="Toggle Focus Reminders Notifications"
            tabIndex={0}
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
            role="switch"
            aria-checked={settings.notifications.enabled && settings.notifications.goalDeadlines}
            aria-label="Toggle Goal Deadlines Notifications"
            tabIndex={0}
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
            role="switch"
            aria-checked={settings.notifications.enabled && settings.notifications.achievementCelebrations}
            aria-label="Toggle Achievement Celebrations Notifications"
            tabIndex={0}
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
                  role="switch"
                  aria-checked={settings.notifications.enabled && settings.notifications.quietHours.enabled}
                  aria-label="Toggle Quiet Hours"
                  tabIndex={0}
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
                      className="px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">End Time</label>
                    <input
                      type="time"
                      value={settings.notifications.quietHours.end}
                      onChange={(e) => handleTimeChange('end', e.target.value)}
                      className="px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notification Scheduling */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-text-primary">Notification Schedule</h5>
                  <p className="text-sm text-text-secondary">Configure when specific notifications are sent</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-text-primary">Morning Motivation</label>
                  <input
                    type="time"
                    value={settings.notifications.schedules?.morningMotivation || '08:00'}
                    onChange={(e) => handleScheduleTimeChange('morningMotivation', e.target.value)}
                    className="px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-text-primary">Evening Reflection</label>
                  <input
                    type="time"
                    value={settings.notifications.schedules?.eveningReflection || '20:00'}
                    onChange={(e) => handleScheduleTimeChange('eveningReflection', e.target.value)}
                    className="px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-text-primary">Focus Reminders</label>
                  <input
                    type="time"
                    value={settings.notifications.schedules?.focusReminders || '14:00'}
                    onChange={(e) => handleScheduleTimeChange('focusReminders', e.target.value)}
                    className="px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-text-primary">Streak Protection</label>
                  <input
                    type="time"
                    value={settings.notifications.schedules?.streakProtection || '21:00'}
                    onChange={(e) => handleScheduleTimeChange('streakProtection', e.target.value)}
                    className="px-3 py-2 bg-surface-800 border border-border focus:border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSection;