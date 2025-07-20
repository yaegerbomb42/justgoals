import { useSettings } from '../context/SettingsContext';

class NotificationService {
  constructor() {
    this.permission = null;
    this.isSupported = 'Notification' in window;
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
  }

  async requestPermission() {
    if (!this.isSupported) return false;
    
    this.permission = await Notification.requestPermission();
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
    if (!this.canSendNotification(settings) || !settings?.notifications?.morningMotivation) {
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

    this.showNotification({
      title: "JustGoals - Morning Motivation",
      body,
      icon: "/favicon.ico",
      tag: "morning-motivation",
      requireInteraction: false,
    });
  }

  // Evening reflection notification
  async sendEveningReflection(settings, userGoals = []) {
    if (!this.canSendNotification(settings) || !settings?.notifications?.eveningReflection) {
      return;
    }

    const messages = [
      "Time to reflect on your day! 🌙 How did you do with your goals?",
      "Evening check-in! ✨ Take a moment to review your progress.",
      "Day's end reflection! 📝 What did you accomplish today?",
      "Evening wrap-up! 🌟 Celebrate your wins and plan for tomorrow.",
      "Time to reflect! 💭 How are you feeling about your goal progress?",
    ];

    const randomMessage = messages[Math.floor(Math.random() * randomMessage.length)];
    
    this.showNotification({
      title: "JustGoals - Evening Reflection",
      body: randomMessage,
      icon: "/favicon.ico",
      tag: "evening-reflection",
      requireInteraction: false,
    });
  }

  // Streak protection alerts
  async sendStreakProtectionAlert(settings, goal, currentStreak, daysToBreak) {
    if (!this.canSendNotification(settings) || !settings?.notifications?.streakProtection) {
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

    this.showNotification({
      title,
      body,
      icon: "/favicon.ico",
      tag: `streak-${goal.id}`,
      requireInteraction: urgency === 'high',
      data: {
        type: 'streak-protection',
        goalId: goal.id,
        urgency,
      }
    });
  }

  // Focus session reminders
  async sendFocusReminder(settings, goal) {
    if (!this.canSendNotification(settings) || !settings?.notifications?.focusReminders) {
      return;
    }

    this.showNotification({
      title: "🎯 Focus Time!",
      body: `Ready to focus on "${goal.title}"? Your optimal focus time is now.`,
      icon: "/favicon.ico",
      tag: "focus-reminder",
      requireInteraction: false,
      data: {
        type: 'focus-reminder',
        goalId: goal.id,
      }
    });
  }

  // Goal deadline alerts
  async sendGoalDeadlineAlert(settings, goal, daysLeft) {
    if (!this.canSendNotification(settings) || !settings?.notifications?.goalDeadlines) {
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

    this.showNotification({
      title,
      body,
      icon: "/favicon.ico",
      tag: `deadline-${goal.id}`,
      requireInteraction: daysLeft <= 1,
      data: {
        type: 'goal-deadline',
        goalId: goal.id,
        daysLeft,
      }
    });
  }

  // Achievement celebration
  async sendAchievementCelebration(settings, achievement) {
    if (!this.canSendNotification(settings) || !settings?.notifications?.achievementCelebrations) {
      return;
    }

    this.showNotification({
      title: "🏆 Achievement Unlocked!",
      body: `Congratulations! You've earned: ${achievement.title}`,
      icon: "/favicon.ico",
      tag: `achievement-${achievement.id}`,
      requireInteraction: false,
      data: {
        type: 'achievement',
        achievementId: achievement.id,
      }
    });
  }

  // Generic notification method
  showNotification(options) {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
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

  // Schedule notifications
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