// Smart notification service with intelligent reminders and scheduling

class NotificationService {
  constructor() {
    this.notificationTypes = {
      GOAL_REMINDER: 'goal_reminder',
      MILESTONE_DUE: 'milestone_due',
      FOCUS_SESSION: 'focus_session',
      STREAK_REMINDER: 'streak_reminder',
      ACHIEVEMENT: 'achievement',
      DAILY_CHECKIN: 'daily_checkin',
      WEEKLY_REVIEW: 'weekly_review',
      PRODUCTIVITY_INSIGHT: 'productivity_insight',
      CHALLENGE_REMINDER: 'challenge_reminder',
      CALENDAR_SYNC: 'calendar_sync'
    };

    this.reminderStrategies = {
      GENTLE: 'gentle',      // Soft reminders
      MODERATE: 'moderate',  // Regular reminders
      AGGRESSIVE: 'aggressive', // Frequent reminders
      SMART: 'smart'         // AI-powered timing
    };

    this.notificationSettings = {
      enabled: true,
      strategy: 'smart',
      quietHours: { start: 22, end: 8 }, // 10 PM to 8 AM
      maxDailyNotifications: 10,
      soundEnabled: true,
      vibrationEnabled: true
    };
  }

  // Initialize notification service
  async initialize(userId) {
    if (!userId) return false;

    try {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
          return true;
        } else {
          console.log('Notification permission denied');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Load user notification settings
  async loadSettings(userId) {
    if (!userId) return this.notificationSettings;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      try {
        const settings = await firestoreService.getNotificationSettings(userId);
        return { ...this.notificationSettings, ...settings };
      } catch (error) {
        console.warn('Firestore notification settings fetch failed, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const settingsKey = `notification_settings_${userId}`;
        const savedSettings = localStorage.getItem(settingsKey);
        return savedSettings ? { ...this.notificationSettings, ...JSON.parse(savedSettings) } : this.notificationSettings;
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return this.notificationSettings;
    }
  }

  // Save notification settings
  async saveSettings(userId, settings) {
    if (!userId) return false;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      try {
        await firestoreService.saveNotificationSettings(userId, settings);
      } catch (error) {
        console.warn('Firestore notification settings save failed, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const settingsKey = `notification_settings_${userId}`;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
      }
      
      this.notificationSettings = { ...this.notificationSettings, ...settings };
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return false;
    }
  }

  // Send smart notification
  async sendNotification(userId, type, data = {}) {
    if (!userId) return false;

    const settings = await this.loadSettings(userId);
    if (!settings.enabled) return false;

    // Check if in quiet hours
    if (this.isInQuietHours(settings.quietHours)) {
      console.log('Notification suppressed during quiet hours');
      return false;
    }

    // Check daily notification limit
    if (!this.checkDailyLimit(userId, settings.maxDailyNotifications)) {
      console.log('Daily notification limit reached');
      return false;
    }

    const notification = this.createNotification(type, data);
    
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/assets/images/app-icon.png',
          badge: '/assets/images/app-icon.png',
          tag: notification.tag,
          requireInteraction: notification.requireInteraction || false,
          silent: !settings.soundEnabled,
          vibrate: settings.vibrationEnabled ? [200, 100, 200] : undefined
        });

        // Handle notification click
        browserNotification.onclick = () => {
          this.handleNotificationClick(notification);
          browserNotification.close();
        };

        // Log notification
        this.logNotification(userId, type, notification);
        
        return true;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return false;
  }

  // Create notification content based on type
  createNotification(type, data) {
    const baseNotification = {
      tag: type,
      requireInteraction: false,
      icon: '/assets/images/app-icon.png',
      badge: '/assets/images/app-icon.png'
    };

    switch (type) {
      case this.notificationTypes.GOAL_REMINDER:
        return {
          ...baseNotification,
          title: '🎯 Goal Reminder',
          body: `Don't forget about "${data.goalTitle}". You're ${data.progress}% complete!`,
          requireInteraction: true
        };

      case this.notificationTypes.MILESTONE_DUE:
        return {
          ...baseNotification,
          title: '✅ Milestone Due',
          body: `"${data.milestoneTitle}" is due ${data.dueDate}. Time to tackle it!`,
          requireInteraction: true
        };

      case this.notificationTypes.FOCUS_SESSION:
        return {
          ...baseNotification,
          title: '⏰ Focus Time',
          body: `Ready for a ${data.duration}-minute focus session? Your goals are waiting!`,
          requireInteraction: false
        };

      case this.notificationTypes.STREAK_REMINDER:
        return {
          ...baseNotification,
          title: '🔥 Streak Alert',
          body: `You're on a ${data.streak}-day streak! Don't break the chain today.`,
          requireInteraction: false
        };

      case this.notificationTypes.ACHIEVEMENT:
        return {
          ...baseNotification,
          title: '🏆 Achievement Unlocked!',
          body: `Congratulations! You have earned "${data.achievementName}"!`,
          requireInteraction: true
        };

      case this.notificationTypes.DAILY_CHECKIN:
        return {
          ...baseNotification,
          title: '📝 Daily Check-in',
          body: 'How was your day? Take a moment to reflect on your progress.',
          requireInteraction: false
        };

      case this.notificationTypes.WEEKLY_REVIEW:
        return {
          ...baseNotification,
          title: '📊 Weekly Review',
          body: 'Time for your weekly progress review. See how far you have come!',
          requireInteraction: true
        };

      case this.notificationTypes.PRODUCTIVITY_INSIGHT:
        return {
          ...baseNotification,
          title: '💡 Productivity Insight',
          body: data.insight,
          requireInteraction: false
        };

      case this.notificationTypes.CHALLENGE_REMINDER:
        return {
          ...baseNotification,
          title: '🎯 Challenge Update',
          body: `"${data.challengeName}": ${data.progress}/${data.target} complete!`,
          requireInteraction: false
        };

      case this.notificationTypes.CALENDAR_SYNC:
        return {
          ...baseNotification,
          title: '📅 Calendar Sync',
          body: `${data.count} events synced to your daily planner.`,
          requireInteraction: false
        };

      default:
        return {
          ...baseNotification,
          title: 'Drift',
          body: data.message || 'You have a new notification from Drift.'
        };
    }
  }

  // Check if current time is in quiet hours
  isInQuietHours(quietHours) {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (quietHours.start > quietHours.end) {
      // Quiet hours span midnight (e.g., 10 PM to 8 AM)
      return currentHour >= quietHours.start || currentHour < quietHours.end;
    } else {
      // Quiet hours within same day
      return currentHour >= quietHours.start && currentHour < quietHours.end;
    }
  }

  // Check daily notification limit
  checkDailyLimit(userId, maxNotifications) {
    const today = new Date().toDateString();
    const notificationsKey = `notifications_${userId}_${today}`;
    const todayNotifications = parseInt(localStorage.getItem(notificationsKey) || '0');
    
    return todayNotifications < maxNotifications;
  }

  // Log notification
  logNotification(userId, type, notification) {
    const today = new Date().toDateString();
    const notificationsKey = `notifications_${userId}_${today}`;
    const todayNotifications = parseInt(localStorage.getItem(notificationsKey) || '0');
    localStorage.setItem(notificationsKey, (todayNotifications + 1).toString());

    // Log to history
    const historyKey = `notification_history_${userId}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({
      type,
      title: notification.title,
      body: notification.body,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 notifications
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  // Handle notification click
  handleNotificationClick(notification) {
    // Navigate to appropriate page based on notification type
    const url = this.getNotificationUrl(notification.tag);
    if (url) {
      window.location.href = url;
    }
  }

  // Get URL for notification type
  getNotificationUrl(type) {
    switch (type) {
      case this.notificationTypes.GOAL_REMINDER:
        return '/goals-dashboard';
      case this.notificationTypes.MILESTONE_DUE:
        return '/daily-milestones';
      case this.notificationTypes.FOCUS_SESSION:
        return '/focus-mode';
      case this.notificationTypes.ACHIEVEMENT:
        return '/analytics-dashboard';
      case this.notificationTypes.DAILY_CHECKIN:
        return '/daily-milestones';
      case this.notificationTypes.WEEKLY_REVIEW:
        return '/analytics-dashboard';
      case this.notificationTypes.CHALLENGE_REMINDER:
        return '/analytics-dashboard';
      default:
        return '/';
    }
  }

  // Schedule smart reminders
  async scheduleSmartReminders(userId) {
    const userData = await this.getUserData(userId);
    if (!userData) return;

    const settings = await this.loadSettings(userId);
    if (!settings.enabled) return;

    // Get user's optimal times
    const optimalTimes = this.calculateOptimalTimes(userData);
    
    // Schedule goal reminders
    await this.scheduleGoalReminders(userId, userData, optimalTimes);
    
    // Schedule milestone reminders
    await this.scheduleMilestoneReminders(userId, userData, optimalTimes);
    
    // Schedule focus session reminders
    await this.scheduleFocusReminders(userId, userData, optimalTimes);
    
    // Schedule streak reminders
    await this.scheduleStreakReminders(userId, userData);
    
    // Schedule daily check-in
    await this.scheduleDailyCheckin(userId, optimalTimes);
  }

  // Calculate optimal notification times based on user behavior
  calculateOptimalTimes(userData) {
    const focusHistory = userData.focusHistory || [];
    const milestones = userData.milestones || [];
    
    // Analyze focus session times
    const hourlyActivity = Array(24).fill(0);
    focusHistory.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourlyActivity[hour]++;
    });

    // Find most active hours
    const mostActiveHours = hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    return {
      morning: mostActiveHours.find(h => h >= 6 && h <= 10) || 9,
      afternoon: mostActiveHours.find(h => h >= 12 && h <= 16) || 14,
      evening: mostActiveHours.find(h => h >= 18 && h <= 22) || 20,
      mostActive: mostActiveHours[0] || 9
    };
  }

  // Schedule goal reminders
  async scheduleGoalReminders(userId, userData, optimalTimes) {
    const activeGoals = userData.goals?.filter(g => g.progress < 100) || [];
    
    activeGoals.forEach(goal => {
      const daysSinceLastActivity = goal.lastActivity ? 
        (Date.now() - new Date(goal.lastActivity)) / (1000 * 60 * 60 * 24) : 999;
      
      // Remind if no activity for 3+ days
      if (daysSinceLastActivity >= 3) {
        this.scheduleNotification(userId, this.notificationTypes.GOAL_REMINDER, {
          goalTitle: goal.title,
          progress: goal.progress || 0
        }, optimalTimes.mostActive);
      }
    });
  }

  // Schedule milestone reminders
  async scheduleMilestoneReminders(userId, userData, optimalTimes) {
    const today = new Date();
    const upcomingMilestones = userData.milestones?.filter(m => {
      if (m.completed || !m.dueDate) return false;
      const dueDate = new Date(m.dueDate);
      const daysUntilDue = (dueDate - today) / (1000 * 60 * 60 * 24);
      return daysUntilDue <= 2 && daysUntilDue >= 0;
    }) || [];

    upcomingMilestones.forEach(milestone => {
      this.scheduleNotification(userId, this.notificationTypes.MILESTONE_DUE, {
        milestoneTitle: milestone.title,
        dueDate: new Date(milestone.dueDate).toLocaleDateString()
      }, optimalTimes.morning);
    });
  }

  // Schedule focus session reminders
  async scheduleFocusReminders(userId, userData, optimalTimes) {
    const lastFocusSession = userData.focusHistory?.[userData.focusHistory.length - 1];
    const hoursSinceLastSession = lastFocusSession ? 
      (Date.now() - new Date(lastFocusSession.startTime)) / (1000 * 60 * 60) : 999;
    
    // Remind if no focus session for 24+ hours
    if (hoursSinceLastSession >= 24) {
      this.scheduleNotification(userId, this.notificationTypes.FOCUS_SESSION, {
        duration: 25
      }, optimalTimes.mostActive);
    }
  }

  // Schedule streak reminders
  async scheduleStreakReminders(userId, userData) {
    const stats = this.calculateStreakStats(userData);
    
    if (stats.currentStreak > 0) {
      // Remind to maintain streak
      this.scheduleNotification(userId, this.notificationTypes.STREAK_REMINDER, {
        streak: stats.currentStreak
      }, 18); // 6 PM
    }
  }

  // Schedule daily check-in
  async scheduleDailyCheckin(userId, optimalTimes) {
    this.scheduleNotification(userId, this.notificationTypes.DAILY_CHECKIN, {}, 21); // 9 PM
  }

  // Schedule a notification for a specific time
  scheduleNotification(userId, type, data, hour) {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(hour, 0, 0, 0);
    
    // If target time has passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const delay = targetTime.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.sendNotification(userId, type, data);
    }, delay);
  }

  // Calculate streak stats
  calculateStreakStats(userData) {
    const milestones = userData.milestones || [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const recentMilestones = milestones
      .filter(m => m.completed && new Date(m.completedAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

    // Calculate streaks
    for (let i = 0; i < recentMilestones.length; i++) {
      const currentDate = new Date(recentMilestones[i].completedAt);
      currentDate.setHours(0, 0, 0, 0);
      
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(recentMilestones[i - 1].completedAt);
        prevDate.setHours(0, 0, 0, 0);
        
        const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    
    maxStreak = Math.max(maxStreak, tempStreak);
    
    // Calculate current streak
    if (recentMilestones.length > 0) {
      const lastActivity = new Date(recentMilestones[recentMilestones.length - 1].completedAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(lastActivity);
      currentDate.setHours(0, 0, 0, 0);
      
      while (currentDate <= today) {
        const dayMilestones = recentMilestones.filter(m => {
          const milestoneDate = new Date(m.completedAt);
          return milestoneDate.toDateString() === currentDate.toDateString();
        });
        
        if (dayMilestones.length > 0) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() + 1);
        } else {
          break;
        }
      }
    }
    
    return { currentStreak, maxStreak };
  }

  // Get user data for notifications
  async getUserData(userId) {
    if (!userId) return null;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      try {
        const [goals, milestones, focusHistory] = await Promise.all([
          firestoreService.getGoals(userId),
          firestoreService.getMilestones(userId),
          firestoreService.getFocusSessionHistory(userId)
        ]);

        return {
          goals: goals || [],
          milestones: milestones || [],
          focusHistory: focusHistory || []
        };
      } catch (error) {
        console.warn('Firestore user data fetch failed, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const goalsKey = `goals_data_${userId}`;
        const milestonesKey = `milestones_data_${userId}`;
        const focusHistoryKey = `focus_session_history_${userId}`;

        return {
          goals: JSON.parse(localStorage.getItem(goalsKey) || '[]'),
          milestones: JSON.parse(localStorage.getItem(milestonesKey) || '[]'),
          focusHistory: JSON.parse(localStorage.getItem(focusHistoryKey) || '[]')
        };
      }
    } catch (error) {
      console.error('Error getting user data for notifications:', error);
      return null;
    }
  }

  // Clear all scheduled notifications
  clearScheduledNotifications() {
    // This would clear all setTimeout timers
    // In a real implementation, you'd track and clear specific timers
    console.log('Clearing scheduled notifications');
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 