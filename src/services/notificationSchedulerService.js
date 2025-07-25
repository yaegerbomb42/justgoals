// Notification Scheduler Service
// Handles storing notification preferences and goal metadata for backend scheduling

import firestoreService from './firestoreService';

class NotificationSchedulerService {
  constructor() {
    this.isEnabled = false;
  }

  // Save user notification preferences to Firestore
  async saveUserNotificationSettings(userId, settings) {
    try {
      const userDoc = {
        notifications: {
          ntfyTopic: settings.ntfy?.topic || null,
          morningMotivation: {
            enabled: settings.morningMotivation || false,
            time: settings.morningTime || "08:00"
          },
          eveningReflection: {
            enabled: settings.eveningReflection || false,
            time: settings.eveningTime || "20:00"
          },
          deadlineAlerts: {
            enabled: settings.goalDeadlines || false,
            daysBefore: [7, 3, 1] // Alert 7, 3, and 1 days before deadline
          },
          streakReminders: {
            enabled: settings.streakProtection || false
          },
          focusReminders: {
            enabled: settings.focusReminders || false
          },
          updatedAt: new Date().toISOString()
        }
      };

      await firestoreService.saveUserSettings(userId, userDoc);
      console.log('Notification settings saved for backend scheduling');
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return false;
    }
  }

  // Update goal with notification metadata
  async updateGoalNotificationData(userId, goalId, goalData) {
    try {
      const notificationMeta = {
        notifications: {
          deadlineAlerts: goalData.notificationsEnabled || false,
          nextDeadlineCheck: this.calculateNextDeadlineCheck(goalData.deadline),
          streakReminders: goalData.notificationsEnabled || false,
          lastNotificationSent: null,
          updatedAt: new Date().toISOString()
        }
      };

      // Update the goal with notification metadata
      await firestoreService.updateGoal(userId, goalId, notificationMeta);
      console.log('Goal notification metadata updated');
      return true;
    } catch (error) {
      console.error('Error updating goal notification data:', error);
      return false;
    }
  }

  // Calculate when next deadline check should occur
  calculateNextDeadlineCheck(deadline) {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysUntilDeadline = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Schedule next check based on how far away deadline is
    if (daysUntilDeadline <= 1) {
      return new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(); // Check every 6 hours
    } else if (daysUntilDeadline <= 7) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Check daily
    } else {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Check weekly
    }
  }

  // Initialize user for backend notifications
  async initializeUserForBackendNotifications(userId, settings) {
    try {
      // Save notification preferences
      await this.saveUserNotificationSettings(userId, settings);

      // Get user's goals and update them with notification metadata
      const goals = await firestoreService.getGoals(userId);
      
      for (const goal of goals) {
        await this.updateGoalNotificationData(userId, goal.id, goal);
      }

      console.log('User initialized for backend notifications');
      return true;
    } catch (error) {
      console.error('Error initializing user for backend notifications:', error);
      return false;
    }
  }

    // Test backend connection by queuing a notification
  async testBackendConnection(userId, ntfyTopic, testMessage = "🧪 Backend test successful! Your scheduled notifications will work when browser is closed.") {
    try {
      // Queue a test notification for the Vercel cron job to pick up
      await firestoreService.saveDocument('notificationQueue', `test_${Date.now()}`, {
        userId,
        topic: ntfyTopic,
        title: "🧪 Backend Test",
        message: testMessage,
        timestamp: new Date().toISOString(),
        type: 'test'
      });

      console.log('✅ Test notification queued for Vercel cron job');
      return true;
    } catch (error) {
      console.error('❌ Failed to queue test notification:', error);
      return false;
    }
  }
}

const notificationSchedulerService = new NotificationSchedulerService();
export default notificationSchedulerService;
