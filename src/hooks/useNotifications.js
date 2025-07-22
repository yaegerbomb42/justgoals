import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import inAppNotificationService from '../services/inAppNotificationService';

export const useNotifications = () => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const intervalRef = useRef(null);
  const scheduledNotificationsRef = useRef(new Map());

  // Request notification permission on mount
  useEffect(() => {
    if (settings?.notifications?.enabled) {
      notificationService.requestPermission();
    }
  }, [settings?.notifications?.enabled]);

  // Schedule morning motivation notifications
  useEffect(() => {
    if (!settings?.notifications?.enabled || !settings?.notifications?.morningMotivation) {
      return;
    }

    const scheduleMorningMotivation = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8:00 AM

      const timeUntilMorning = tomorrow.getTime() - now.getTime();
      
      // Clear existing morning notification
      if (scheduledNotificationsRef.current.has('morning-motivation')) {
        clearTimeout(scheduledNotificationsRef.current.get('morning-motivation'));
      }

      // Schedule new morning notification
      const timeoutId = setTimeout(() => {
        // Send background notification
        notificationService.sendMorningMotivation(settings, []);
        
        // Send in-app notification
        const motivationMessages = [
          "Good morning! 🌅 Time to crush your goals today!",
          "Rise and shine! ✨ Your goals are waiting for you.",
          "Morning! 🌞 Let's make today count towards your dreams.",
          "Good morning! 🚀 Ready to make progress on your goals?",
          "Wake up and conquer! 💪 Today is your day to shine."
        ];
        const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
        inAppNotificationService.showDailyMotivation(randomMessage, []);
        
        // Schedule next day's notification
        scheduleMorningMotivation();
      }, timeUntilMorning);

      scheduledNotificationsRef.current.set('morning-motivation', timeoutId);
    };

    scheduleMorningMotivation();

    return () => {
      if (scheduledNotificationsRef.current.has('morning-motivation')) {
        clearTimeout(scheduledNotificationsRef.current.get('morning-motivation'));
      }
    };
  }, [settings?.notifications?.enabled, settings?.notifications?.morningMotivation]);

  // Schedule evening reflection notifications
  useEffect(() => {
    if (!settings?.notifications?.enabled || !settings?.notifications?.eveningReflection) {
      return;
    }

    const scheduleEveningReflection = () => {
      const now = new Date();
      const today = new Date(now);
      today.setHours(20, 0, 0, 0); // 8:00 PM

      let timeUntilEvening = today.getTime() - now.getTime();
      
      // If it's already past 8 PM, schedule for tomorrow
      if (timeUntilEvening <= 0) {
        today.setDate(today.getDate() + 1);
        timeUntilEvening = today.getTime() - now.getTime();
      }

      // Clear existing evening notification
      if (scheduledNotificationsRef.current.has('evening-reflection')) {
        clearTimeout(scheduledNotificationsRef.current.get('evening-reflection'));
      }

      // Schedule new evening notification
      const timeoutId = setTimeout(() => {
        // Send background notification
        notificationService.sendEveningReflection(settings, []);
        
        // Send in-app notification
        inAppNotificationService.showJournalReminder('reflection');
        
        // Schedule next day's notification
        scheduleEveningReflection();
      }, timeUntilEvening);

      scheduledNotificationsRef.current.set('evening-reflection', timeoutId);
    };

    scheduleEveningReflection();

    return () => {
      if (scheduledNotificationsRef.current.has('evening-reflection')) {
        clearTimeout(scheduledNotificationsRef.current.get('evening-reflection'));
      }
    };
  }, [settings?.notifications?.enabled, settings?.notifications?.eveningReflection]);

  // Check for streak protection alerts every hour
  useEffect(() => {
    if (!settings?.notifications?.enabled || !settings?.notifications?.streakProtection) {
      return;
    }

    const checkStreakProtection = () => {
      // This would typically check user goals and their streaks
      // For now, we'll just log that we're checking
      console.log('Checking for streak protection alerts...');
      
      // In a real implementation, you would:
      // 1. Get user goals from context or service
      // 2. Check which goals have active streaks
      // 3. Calculate days until streak breaks
      // 4. Send notifications for goals at risk
    };

    // Check immediately
    checkStreakProtection();

    // Then check every hour
    intervalRef.current = setInterval(checkStreakProtection, 60 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings?.notifications?.enabled, settings?.notifications?.streakProtection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all scheduled notifications
      scheduledNotificationsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      scheduledNotificationsRef.current.clear();

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Helper functions to send notifications manually
  const sendTestNotification = () => {
    notificationService.showNotification({
      title: "Test Notification",
      body: "This is a test notification from JustGoals!",
      icon: "/favicon.ico",
      tag: "test-notification",
    });
  };

  const sendStreakAlert = (goal, currentStreak, daysToBreak) => {
    // Send background notification
    notificationService.sendStreakProtectionAlert(settings, goal, currentStreak, daysToBreak);
    
    // Send in-app notification
    inAppNotificationService.showStreakAlert(goal, currentStreak, daysToBreak);
  };

  const sendFocusReminder = (goal) => {
    // Send background notification
    notificationService.sendFocusReminder(settings, goal);
    
    // Send in-app notification
    inAppNotificationService.showFocusReminder(goal, new Date());
  };

  const sendGoalDeadlineAlert = (goal, daysLeft) => {
    // Send background notification
    notificationService.sendGoalDeadlineAlert(settings, goal, daysLeft);
    
    // Send in-app notification
    inAppNotificationService.showGoalDeadline(goal, daysLeft);
  };

  const sendAchievementCelebration = (achievement) => {
    // Send background notification
    notificationService.sendAchievementCelebration(settings, achievement);
    
    // Send in-app notification
    inAppNotificationService.showAchievement(achievement);
  };

  return {
    sendTestNotification,
    sendStreakAlert,
    sendFocusReminder,
    sendGoalDeadlineAlert,
    sendAchievementCelebration,
    isSupported: notificationService.isSupported,
    permission: notificationService.permission,
  };
}; 