// Notification utilities for the app

class NotificationManager {
  constructor() {
    this.hasPermission = false;
    this.checkPermission();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    } else if (Notification.permission === 'denied') {
      this.hasPermission = false;
      return false;
    } else {
      // Permission not determined yet
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  async sendNotification(title, options = {}) {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return false;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async sendMilestoneReminder(milestone) {
    return this.sendNotification('Milestone Reminder', {
      body: `Don't forget: ${milestone.title}`,
      tag: `milestone-${milestone.id}`,
      data: { type: 'milestone', id: milestone.id }
    });
  }

  async sendFocusSessionReminder(goal) {
    return this.sendNotification('Focus Session Reminder', {
      body: `Time to focus on: ${goal.title}`,
      tag: `focus-${goal.id}`,
      data: { type: 'focus', goalId: goal.id }
    });
  }

  async sendDailyGoalReminder(goals) {
    const activeGoals = goals.filter(goal => goal.progress < 100);
    if (activeGoals.length === 0) return;

    const goalText = activeGoals.length === 1 
      ? activeGoals[0].title 
      : `${activeGoals.length} active goals`;

    return this.sendNotification('Daily Goals Check-in', {
      body: `You have ${goalText} to work on today`,
      tag: 'daily-goals',
      data: { type: 'daily-goals' }
    });
  }

  async sendBreakReminder() {
    return this.sendNotification('Break Time!', {
      body: 'Take a short break to maintain focus and productivity',
      tag: 'break-reminder',
      data: { type: 'break' }
    });
  }

  async sendSessionCompleteNotification(sessionData) {
    return this.sendNotification('Focus Session Complete!', {
      body: `Great work! You focused for ${Math.round(sessionData.elapsed / 60)} minutes on ${sessionData.goal?.title || 'your goal'}`,
      tag: 'session-complete',
      data: { type: 'session-complete', sessionData }
    });
  }
}

// Create a singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;

// Helper functions for common notification patterns
export const scheduleReminder = (callback, delay) => {
  return setTimeout(callback, delay);
};

export const scheduleDailyReminder = (callback, timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();
  return setTimeout(callback, delay);
};

export const cancelReminder = (timeoutId) => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}; 