import { useState, useEffect } from 'react';

class NotificationManager {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.listeners = new Set();
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    // Notify listeners of permission change
    this.notifyListeners('permissionChanged', permission);
    
    return permission === 'granted';
  }

  // Show a notification
  show(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Notifications not available or permission not granted');
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || 'justgoals-notification',
      silent: options.silent || false,
      requireInteraction: options.requireInteraction || false,
      ...options
    });

    // Auto-close after delay if specified
    if (options.autoClose && typeof options.autoClose === 'number') {
      setTimeout(() => {
        notification.close();
      }, options.autoClose);
    }

    return notification;
  }

  // Show habit reminder notification
  showHabitReminder(habit, options = {}) {
    const title = `⏰ Habit Reminder: ${habit.title}`;
    const body = habit.description || `Time to work on your ${habit.title} habit!`;
    
    return this.show(title, {
      body,
      icon: '🎯',
      tag: `habit-reminder-${habit.id}`,
      autoClose: 10000,
      data: {
        type: 'habit-reminder',
        habitId: habit.id,
        habit
      },
      ...options
    });
  }

  // Show streak protection alert
  showStreakAlert(habit, streakDays) {
    const title = `🔥 Streak Protection: ${habit.title}`;
    const body = `Don't break your ${streakDays}-day streak! Complete your habit before midnight.`;
    
    return this.show(title, {
      body,
      icon: '🔥',
      tag: `streak-alert-${habit.id}`,
      requireInteraction: true,
      data: {
        type: 'streak-alert',
        habitId: habit.id,
        streakDays
      }
    });
  }

  // Show achievement notification
  showAchievementUnlocked(achievement) {
    const title = '🎉 Achievement Unlocked!';
    const body = `${achievement.title} - ${achievement.description}`;
    
    return this.show(title, {
      body,
      icon: '🏆',
      tag: `achievement-${achievement.id}`,
      autoClose: 8000,
      data: {
        type: 'achievement',
        achievementId: achievement.id
      }
    });
  }

  // Show goal deadline reminder
  showGoalDeadlineReminder(goal, daysLeft) {
    const title = `📅 Goal Deadline Approaching: ${goal.title}`;
    const body = daysLeft === 0 
      ? 'Deadline is today! Time to finish strong.'
      : `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining to complete your goal.`;
    
    return this.show(title, {
      body,
      icon: '⏰',
      tag: `goal-deadline-${goal.id}`,
      autoClose: 12000,
      data: {
        type: 'goal-deadline',
        goalId: goal.id,
        daysLeft
      }
    });
  }

  // Schedule recurring notifications
  scheduleHabitReminders(habit, schedule) {
    // This would typically integrate with a service worker for persistent scheduling
    const { times, days } = schedule;
    
    times.forEach(time => {
      days.forEach(day => {
        // Schedule notification (simplified - in production would use service worker)
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const delay = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
          this.showHabitReminder(habit, {
            tag: `scheduled-${habit.id}-${time}-${day}`
          });
        }, delay);
      });
    });
  }

  // Add listener for notification events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Get current permission status
  getPermissionStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      canRequest: this.permission === 'default'
    };
  }

  // Test notification (for user to verify they work)
  testNotification() {
    return this.show('🎯 JustGoals Test Notification', {
      body: 'Notifications are working correctly! You\'ll receive habit reminders like this.',
      autoClose: 5000,
      tag: 'test-notification'
    });
  }
}

// Singleton instance
const notificationManager = new NotificationManager();

// React hook for using notifications
export const useNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState(
    notificationManager.getPermissionStatus()
  );

  useEffect(() => {
    const unsubscribe = notificationManager.addListener((event, data) => {
      if (event === 'permissionChanged') {
        setPermissionStatus(notificationManager.getPermissionStatus());
      }
    });

    return unsubscribe;
  }, []);

  const requestPermission = async () => {
    try {
      const granted = await notificationManager.requestPermission();
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  };

  const showNotification = (title, options) => {
    return notificationManager.show(title, options);
  };

  const showHabitReminder = (habit, options) => {
    return notificationManager.showHabitReminder(habit, options);
  };

  const showStreakAlert = (habit, streakDays) => {
    return notificationManager.showStreakAlert(habit, streakDays);
  };

  const showAchievementUnlocked = (achievement) => {
    return notificationManager.showAchievementUnlocked(achievement);
  };

  const showGoalDeadlineReminder = (goal, daysLeft) => {
    return notificationManager.showGoalDeadlineReminder(goal, daysLeft);
  };

  const scheduleHabitReminders = (habit, schedule) => {
    return notificationManager.scheduleHabitReminders(habit, schedule);
  };

  const testNotification = () => {
    return notificationManager.testNotification();
  };

  return {
    permissionStatus,
    requestPermission,
    showNotification,
    showHabitReminder,
    showStreakAlert,
    showAchievementUnlocked,
    showGoalDeadlineReminder,
    scheduleHabitReminders,
    testNotification
  };
};

export default notificationManager;