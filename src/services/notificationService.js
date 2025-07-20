import { useSettings } from '../context/SettingsContext';
import emailNotificationService from './emailNotificationService';
import smsNotificationService from './smsNotificationService';
import discordNotificationService from './discordNotificationService';

class NotificationService {
  constructor() {
    this.permission = null;
    this.isSupported = 'Notification' in window;
    this.serviceWorkerRegistration = null;
    this.init();
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    this.permission = Notification.permission;
    
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    // Register service worker for background notifications
    await this.registerServiceWorker();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Request notification permission for PWA
        if (this.permission === 'granted') {
          await this.requestPushPermission();
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPushPermission() {
    if (!this.serviceWorkerRegistration) return false;
    
    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });
      
      console.log('Push notification subscription:', subscription);
      return true;
    } catch (error) {
      console.error('Push notification permission failed:', error);
      return false;
    }
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send notification through all configured channels
  async sendMultiChannelNotification(title, body, data = {}, settings) {
    const results = {
      browser: false,
      email: false,
      sms: false,
      discord: false,
      ntfy: false
    };

    // Browser notifications (PWA/Service Worker)
    if (this.canSendNotification(settings)) {
      try {
        await this.sendBackgroundNotification(title, body, data);
        results.browser = true;
      } catch (error) {
        console.error('Browser notification failed:', error);
      }
    }

    // Email notifications
    if (settings?.notifications?.email?.enabled && settings?.notifications?.email?.address) {
      try {
        emailNotificationService.init(settings.notifications.email.address, settings.notifications.email.provider);
        await emailNotificationService.sendEmail(title, body, { html: true, ...data });
        results.email = true;
      } catch (error) {
        console.error('Email notification failed:', error);
      }
    }

    // SMS notifications
    if (settings?.notifications?.sms?.enabled && settings?.notifications?.sms?.phoneNumber && settings?.notifications?.sms?.carrier) {
      try {
        smsNotificationService.init(settings.notifications.sms.phoneNumber, settings.notifications.sms.carrier);
        await smsNotificationService.sendSMS(body, { subject: title, ...data });
        results.sms = true;
      } catch (error) {
        console.error('SMS notification failed:', error);
      }
    }

    // Discord notifications
    if (settings?.notifications?.discord?.enabled && settings?.notifications?.discord?.webhookUrl) {
      try {
        discordNotificationService.init(settings.notifications.discord.webhookUrl);
        await discordNotificationService.sendSimpleNotification(`${title}\n\n${body}`);
        results.discord = true;
      } catch (error) {
        console.error('Discord notification failed:', error);
      }
    }

    // ntfy.sh notifications
    if (settings?.notifications?.ntfy?.enabled && settings?.notifications?.ntfy?.topic) {
      try {
        const ntfyNotificationService = (await import('./ntfyNotificationService')).default;
        ntfyNotificationService.init(
          settings.notifications.ntfy.topic,
          settings.notifications.ntfy.username,
          settings.notifications.ntfy.password
        );
        await ntfyNotificationService.sendNotification(body, { title, ...data });
        results.ntfy = true;
      } catch (error) {
        console.error('ntfy.sh notification failed:', error);
      }
    }

    return results;
  }

  // Send background notification (works when app is closed)
  async sendBackgroundNotification(title, body, data = {}) {
    if (!this.serviceWorkerRegistration) return;

    try {
      await this.serviceWorkerRegistration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data,
        requireInteraction: false,
        actions: [
          {
            action: 'open',
            title: 'Open App',
            icon: '/favicon.ico'
          }
        ]
      });
    } catch (error) {
      console.error('Background notification failed:', error);
      // Fallback to regular notification
      this.showNotification({ title, body, data });
    }
  }

  // Schedule background notification
  scheduleBackgroundNotification(type, time, data = {}) {
    if (!this.serviceWorkerRegistration) return;

    const now = new Date();
    const scheduledTime = new Date(time);
    
    if (scheduledTime <= now) {
      console.warn('Scheduled time is in the past');
      return;
    }

    const delay = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      switch (type) {
        case 'morning-motivation':
          this.sendBackgroundNotification(
            'JustGoals - Morning Motivation',
            data.message || 'Good morning! Time to crush your goals today! 🌅',
            { type: 'morning-motivation', ...data }
          );
          break;
        case 'evening-reflection':
          this.sendBackgroundNotification(
            'JustGoals - Evening Reflection',
            data.message || 'Time to reflect on your day! 🌙',
            { type: 'evening-reflection', ...data }
          );
          break;
        case 'streak-protection':
          this.sendBackgroundNotification(
            '🚨 Streak Alert!',
            data.message || 'Your streak is about to break!',
            { type: 'streak-protection', ...data }
          );
          break;
        case 'goal-deadline':
          this.sendBackgroundNotification(
            '📅 Goal Deadline',
            data.message || 'Goal deadline approaching!',
            { type: 'goal-deadline', ...data }
          );
          break;
        case 'focus-reminder':
          this.sendBackgroundNotification(
            '🎯 Focus Time!',
            data.message || 'Ready to focus on your goals?',
            { type: 'focus-reminder', ...data }
          );
          break;
      }
    }, delay);
  }

  async requestPermission() {
    if (!this.isSupported) return false;
    
    this.permission = await Notification.requestPermission();
    
    if (this.permission === 'granted') {
      await this.requestPushPermission();
    }
    
    return this.permission === 'granted';
  }

  // Check if notifications are enabled and not in quiet hours
  canSendNotification(settings) {
    if (!this.isSupported || this.permission !== 'granted') return false;
    if (!settings?.notifications?.enabled) return false;
    
    // Check quiet hours
    if (settings?.notifications?.quietHours?.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHour, startMin] = settings.notifications.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = settings.notifications.quietHours.end.split(':').map(Number);
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      if (startTime <= endTime) {
        // Same day (e.g., 22:00 to 08:00)
        if (currentTime >= startTime && currentTime <= endTime) return false;
      } else {
        // Overnight (e.g., 22:00 to 08:00)
        if (currentTime >= startTime || currentTime <= endTime) return false;
      }
    }
    
    return true;
  }

  // Morning motivation notification
  async sendMorningMotivation(settings, userGoals = []) {
    if (!settings?.notifications?.morningMotivation) {
      return;
    }

    const messages = [
      "Good morning! 🌅 Time to crush your goals today!",
      "Rise and shine! ✨ Your goals are waiting for you.",
      "Morning! 🌞 Let's make today count towards your dreams.",
      "Good morning! 🚀 Ready to make progress on your goals?",
      "Wake up and conquer! 💪 Today is your day to shine.",
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Add goal-specific motivation if available
    let body = randomMessage;
    if (userGoals.length > 0) {
      const activeGoals = userGoals.filter(goal => !goal.completed);
      if (activeGoals.length > 0) {
        const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
        body += `\n\nFocus on: "${randomGoal.title}"`;
      }
    }

    // Send through all configured channels
    return this.sendMultiChannelNotification("JustGoals - Morning Motivation", body, {
      type: 'morning-motivation',
      goals: userGoals
    }, settings);
  }

  // Evening reflection notification
  async sendEveningReflection(settings, userGoals = []) {
    if (!settings?.notifications?.eveningReflection) {
      return;
    }

    const messages = [
      "Time to reflect on your day! 🌙 How did you do with your goals?",
      "Evening check-in! ✨ Take a moment to review your progress.",
      "Day's end reflection! 📝 What did you accomplish today?",
      "Evening wrap-up! 🌟 Celebrate your wins and plan for tomorrow.",
      "Time to reflect! 💭 How are you feeling about your goal progress?",
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return this.sendMultiChannelNotification("JustGoals - Evening Reflection", randomMessage, {
      type: 'evening-reflection',
      goals: userGoals
    }, settings);
  }

  // Streak protection alerts
  async sendStreakProtectionAlert(settings, goal, currentStreak, daysToBreak) {
    if (!settings?.notifications?.streakProtection) {
      return;
    }

    const urgency = daysToBreak <= 1 ? 'high' : daysToBreak <= 2 ? 'medium' : 'low';
    
    let title, body;
    
    if (urgency === 'high') {
      title = "🚨 Streak Alert!";
      body = `Your "${goal.title}" streak is about to break! You're on day ${currentStreak} - don't let it slip away!`;
    } else if (urgency === 'medium') {
      title = "⚠️ Streak Warning";
      body = `Your "${goal.title}" streak (${currentStreak} days) needs attention soon. Keep it going!`;
    } else {
      title = "💪 Streak Reminder";
      body = `Don't forget about your "${goal.title}" streak! You're on day ${currentStreak} - keep the momentum!`;
    }

    return this.sendMultiChannelNotification(title, body, {
      type: 'streak-protection',
      goalId: goal.id,
      urgency,
      goal: goal
    }, settings);
  }

  // Focus session reminders
  async sendFocusReminder(settings, goal) {
    if (!settings?.notifications?.focusReminders) {
      return;
    }

    return this.sendMultiChannelNotification("🎯 Focus Time!", `Ready to focus on "${goal.title}"? Your optimal focus time is now.`, {
      type: 'focus-reminder',
      goalId: goal.id,
      goal: goal
    }, settings);
  }

  // Goal deadline alerts
  async sendGoalDeadlineAlert(settings, goal, daysLeft) {
    if (!settings?.notifications?.goalDeadlines) {
      return;
    }

    let title, body;
    
    if (daysLeft <= 1) {
      title = "🚨 Deadline Tomorrow!";
      body = `"${goal.title}" is due tomorrow! Time to push hard!`;
    } else if (daysLeft <= 3) {
      title = "⚠️ Deadline Approaching";
      body = `"${goal.title}" is due in ${daysLeft} days. Keep pushing!`;
    } else if (daysLeft <= 7) {
      title = "📅 Deadline This Week";
      body = `"${goal.title}" is due in ${daysLeft} days. Stay on track!`;
    }

    return this.sendMultiChannelNotification(title, body, {
      type: 'goal-deadline',
      goalId: goal.id,
      daysLeft,
      goal: goal
    }, settings);
  }

  // Achievement celebration
  async sendAchievementCelebration(settings, achievement) {
    if (!settings?.notifications?.achievementCelebrations) {
      return;
    }

    return this.sendMultiChannelNotification("🏆 Achievement Unlocked!", `Congratulations! You've earned: ${achievement.title}`, {
      type: 'achievement',
      achievementId: achievement.id,
      achievement: achievement
    }, settings);
  }

  // Generic notification method (fallback)
  showNotification(options) {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      data: options.data || {},
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Handle different notification types
      if (options.data?.type === 'streak-protection') {
        // Navigate to goal details
        window.location.href = `/goals-dashboard?goal=${options.data.goalId}`;
      } else if (options.data?.type === 'focus-reminder') {
        // Navigate to focus mode
        window.location.href = `/focus-mode?goal=${options.data.goalId}`;
      } else if (options.data?.type === 'goal-deadline') {
        // Navigate to goal details
        window.location.href = `/goals-dashboard?goal=${options.data.goalId}`;
      } else if (options.data?.type === 'achievement') {
        // Navigate to achievements
        window.location.href = '/achievements';
      }
    };

    // Auto-close non-interactive notifications after 5 seconds
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  }

  // Schedule notifications (enhanced with background support)
  scheduleNotification(type, time, data = {}) {
    const now = new Date();
    const scheduledTime = new Date(time);
    
    if (scheduledTime <= now) {
      console.warn('Scheduled time is in the past');
      return;
    }

    const delay = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      switch (type) {
        case 'morning-motivation':
          this.sendMorningMotivation(data.settings, data.goals);
          break;
        case 'evening-reflection':
          this.sendEveningReflection(data.settings, data.goals);
          break;
        case 'streak-protection':
          this.sendStreakProtectionAlert(data.settings, data.goal, data.currentStreak, data.daysToBreak);
          break;
        case 'focus-reminder':
          this.sendFocusReminder(data.settings, data.goal);
          break;
        case 'goal-deadline':
          this.sendGoalDeadlineAlert(data.settings, data.goal, data.daysLeft);
          break;
        case 'achievement':
          this.sendAchievementCelebration(data.settings, data.achievement);
          break;
      }
    }, delay);
  }

  // Clear all notifications
  clearAll() {
    if (this.isSupported) {
      // Clear all notifications with our tag
      const tags = [
        'morning-motivation',
        'evening-reflection',
        'focus-reminder',
        'achievement'
      ];
      
      tags.forEach(tag => {
        // Note: This is a workaround since there's no direct API to clear notifications
        // In a real app, you'd track notification IDs and close them
      });
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 