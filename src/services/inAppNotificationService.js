import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../context/NotificationContext';

/**
 * In-App Notification Service
 * Bridges the existing notificationService with the new in-app notification system
 */
class InAppNotificationService {
  constructor() {
    this.notificationContext = null;
    this.isInitialized = false;
  }

  // Initialize with notification context
  init(notificationContext) {
    this.notificationContext = notificationContext;
    this.isInitialized = true;
  }

  // Check if service is ready
  isReady() {
    // Try to auto-initialize if not already done
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.tryAutoInit();
    }
    return this.isInitialized && this.notificationContext;
  }

  // Auto-initialize if notification context is available globally
  tryAutoInit() {
    try {
      // Check if there's a global notification context in React context
      const contextEvent = new CustomEvent('request-notification-context');
      let context = null;
      
      // Listen for the context response
      const handleContextResponse = (event) => {
        context = event.detail;
        window.removeEventListener('notification-context-response', handleContextResponse);
      };
      
      window.addEventListener('notification-context-response', handleContextResponse);
      window.dispatchEvent(contextEvent);
      
      // Small delay to allow for response
      setTimeout(() => {
        if (context) {
          this.init(context);
          console.log('InAppNotificationService auto-initialized');
        }
      }, 10);
    } catch (error) {
      console.warn('Failed to auto-initialize in-app notifications:', error);
    }
  }

  // Send drift progress notification
  showDriftProgress(message, progressData = {}) {
    if (!this.isReady()) return;

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.DRIFT_PROGRESS,
      title: 'Drift Progress Update',
      message,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      timeout: 6000,
      actions: [
        {
          label: 'View Chat',
          primary: true,
          callback: () => {
            window.location.href = '/ai-assistant-chat-drift';
          }
        }
      ],
      data: progressData
    });
  }

  // Send habit reminder
  showHabitReminder(habit, isUrgent = false) {
    if (!this.isReady()) return;

    const priority = isUrgent ? NOTIFICATION_PRIORITY.HIGH : NOTIFICATION_PRIORITY.MEDIUM;
    const urgencyText = isUrgent ? ' (Due Soon!)' : '';

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.HABIT_REMINDER,
      title: `Habit Reminder${urgencyText}`,
      message: `Time to complete: ${habit.title}`,
      priority,
      timeout: isUrgent ? 8000 : 5000,
      actions: [
        {
          label: 'Mark Complete',
          primary: true,
          callback: () => {
            // This would integrate with habit service
            console.log('Marking habit complete:', habit.id);
          }
        },
        {
          label: 'View Habits',
          callback: () => {
            window.location.href = '/habits';
          }
        }
      ],
      data: { habitId: habit.id, habit }
    });
  }

  // Send streak protection alert
  showStreakAlert(goal, currentStreak, daysToBreak) {
    if (!this.isReady()) return;

    const urgency = daysToBreak <= 1 ? NOTIFICATION_PRIORITY.URGENT : 
                   daysToBreak <= 2 ? NOTIFICATION_PRIORITY.HIGH : 
                   NOTIFICATION_PRIORITY.MEDIUM;

    let title, message;
    if (daysToBreak <= 1) {
      title = '🚨 Streak Emergency!';
      message = `Your "${goal.title}" streak (${currentStreak} days) breaks in less than a day!`;
    } else if (daysToBreak <= 2) {
      title = '⚠️ Streak Warning';
      message = `Your "${goal.title}" streak (${currentStreak} days) needs attention in ${daysToBreak} days.`;
    } else {
      title = '💪 Streak Reminder';
      message = `Keep your "${goal.title}" streak going! Currently at ${currentStreak} days.`;
    }

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.HABIT_STREAK,
      title,
      message,
      priority: urgency,
      timeout: urgency === NOTIFICATION_PRIORITY.URGENT ? 10000 : 7000,
      persistent: urgency === NOTIFICATION_PRIORITY.URGENT,
      actions: [
        {
          label: 'Work on Goal',
          primary: true,
          callback: () => {
            window.location.href = `/goals-dashboard?goal=${goal.id}`;
          }
        },
        {
          label: 'Focus Mode',
          callback: () => {
            window.location.href = `/focus-mode?goal=${goal.id}`;
          }
        }
      ],
      data: { goalId: goal.id, goal, currentStreak, daysToBreak }
    });
  }

  // Send goal deadline alert
  showGoalDeadline(goal, daysLeft) {
    if (!this.isReady()) return;

    const priority = daysLeft <= 1 ? NOTIFICATION_PRIORITY.HIGH : 
                    daysLeft <= 3 ? NOTIFICATION_PRIORITY.MEDIUM : 
                    NOTIFICATION_PRIORITY.LOW;

    let title, message;
    if (daysLeft <= 1) {
      title = '🚨 Deadline Tomorrow!';
      message = `"${goal.title}" is due tomorrow!`;
    } else if (daysLeft <= 3) {
      title = '📅 Deadline Approaching';
      message = `"${goal.title}" is due in ${daysLeft} days.`;
    } else {
      title = '📋 Upcoming Deadline';
      message = `"${goal.title}" is due in ${daysLeft} days.`;
    }

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.GOAL_DEADLINE,
      title,
      message,
      priority,
      timeout: 7000,
      actions: [
        {
          label: 'View Goal',
          primary: true,
          callback: () => {
            window.location.href = `/goals-dashboard?goal=${goal.id}`;
          }
        },
        {
          label: 'Start Focus',
          callback: () => {
            window.location.href = `/focus-mode?goal=${goal.id}`;
          }
        }
      ],
      data: { goalId: goal.id, goal, daysLeft }
    });
  }

  // Send milestone celebration
  showMilestone(milestone, goal) {
    if (!this.isReady()) return;

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.GOAL_MILESTONE,
      title: '🎉 Milestone Reached!',
      message: `Congratulations! You've completed: ${milestone.title}`,
      priority: NOTIFICATION_PRIORITY.HIGH,
      timeout: 8000,
      actions: [
        {
          label: 'View Progress',
          primary: true,
          callback: () => {
            window.location.href = `/goals-dashboard?goal=${goal.id}`;
          }
        },
        {
          label: 'Share Achievement',
          callback: () => {
            // This would open share modal
            console.log('Share milestone:', milestone.id);
          }
        }
      ],
      data: { milestoneId: milestone.id, goalId: goal.id, milestone, goal }
    });
  }

  // Send achievement celebration
  showAchievement(achievement) {
    if (!this.isReady()) return;

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.ACHIEVEMENT,
      title: '🏆 Achievement Unlocked!',
      message: `${achievement.title} - ${achievement.description}`,
      priority: NOTIFICATION_PRIORITY.HIGH,
      timeout: 8000,
      actions: [
        {
          label: 'View Achievements',
          primary: true,
          callback: () => {
            window.location.href = '/achievements';
          }
        },
        {
          label: 'Share',
          callback: () => {
            // This would open share modal
            console.log('Share achievement:', achievement.id);
          }
        }
      ],
      data: { achievementId: achievement.id, achievement }
    });
  }

  // Send meal reminder
  showMealReminder(mealType, scheduledTime) {
    if (!this.isReady()) return;

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.MEAL_REMINDER,
      title: '🍽️ Meal Time!',
      message: `It's time for ${mealType}. Don't forget to log your meal!`,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      timeout: 6000,
      actions: [
        {
          label: 'Log Meal',
          primary: true,
          callback: () => {
            window.location.href = '/meals';
          }
        }
      ],
      data: { mealType, scheduledTime }
    });
  }

  // Send journal reminder
  showJournalReminder(type = 'daily') {
    if (!this.isReady()) return;

    const messages = {
      daily: 'Time for your daily journal entry!',
      reflection: 'Take a moment to reflect on your day.',
      gratitude: 'What are you grateful for today?',
      weekly: 'Time for your weekly review!'
    };

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.JOURNAL_REMINDER,
      title: '📝 Journal Reminder',
      message: messages[type] || messages.daily,
      priority: NOTIFICATION_PRIORITY.LOW,
      timeout: 5000,
      actions: [
        {
          label: 'Open Journal',
          primary: true,
          callback: () => {
            window.location.href = '/journal';
          }
        }
      ],
      data: { journalType: type }
    });
  }

  // Send focus reminder
  showFocusReminder(goal, scheduledTime) {
    if (!this.isReady()) return;

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.FOCUS_REMINDER,
      title: '🎯 Focus Time!',
      message: `Ready to focus on "${goal.title}"? Your optimal focus time is now.`,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      timeout: 7000,
      actions: [
        {
          label: 'Start Focus',
          primary: true,
          callback: () => {
            window.location.href = `/focus-mode?goal=${goal.id}`;
          }
        },
        {
          label: 'View Goal',
          callback: () => {
            window.location.href = `/goals-dashboard?goal=${goal.id}`;
          }
        }
      ],
      data: { goalId: goal.id, goal, scheduledTime }
    });
  }

  // Send daily motivation
  showDailyMotivation(message, goals = []) {
    if (!this.isReady()) return;

    let motivationMessage = message;
    if (goals.length > 0) {
      const activeGoals = goals.filter(goal => !goal.completed);
      if (activeGoals.length > 0) {
        const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
        motivationMessage += `\n\n🎯 Focus on: "${randomGoal.title}"`;
      }
    }

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.DAILY_MOTIVATION,
      title: '⚡ Daily Motivation',
      message: motivationMessage,
      priority: NOTIFICATION_PRIORITY.LOW,
      timeout: 8000,
      actions: [
        {
          label: 'View Goals',
          primary: true,
          callback: () => {
            window.location.href = '/goals-dashboard';
          }
        }
      ],
      data: { goals }
    });
  }

  // Send system notification
  showSystem(title, message, priority = NOTIFICATION_PRIORITY.LOW) {
    if (!this.isReady()) return;

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      priority,
      timeout: 5000
    });
  }

  // Send success notification
  showSuccess(message, options = {}) {
    if (!this.isReady()) return;

    this.notificationContext.showSuccess(message, options);
  }

  // Send error notification
  showError(message, options = {}) {
    if (!this.isReady()) return;

    this.notificationContext.showError(message, options);
  }

  // Send warning notification
  showWarning(message, options = {}) {
    if (!this.isReady()) return;

    this.notificationContext.showWarning(message, options);
  }

  // Send info notification
  showInfo(message, options = {}) {
    if (!this.isReady()) return;

    this.notificationContext.showInfo(message, options);
  }

  // Test notification for debugging
  showTest() {
    if (!this.isReady()) return;

    this.notificationContext.addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title: '🧪 Test Notification',
      message: 'This is a test notification to verify the in-app notification system is working correctly.',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      timeout: 5000,
      actions: [
        {
          label: 'Test Action',
          primary: true,
          callback: () => {
            console.log('Test action clicked!');
          }
        }
      ]
    });
  }
}

// Create singleton instance
const inAppNotificationService = new InAppNotificationService();

export default inAppNotificationService;