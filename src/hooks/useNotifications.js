import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

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
        notificationService.sendMorningMotivation(settings, []);
        
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
        notificationService.sendEveningReflection(settings, []);
        
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
    notificationService.sendStreakProtectionAlert(settings, goal, currentStreak, daysToBreak);
  };

  const sendFocusReminder = (goal) => {
    notificationService.sendFocusReminder(settings, goal);
  };

  const sendGoalDeadlineAlert = (goal, daysLeft) => {
    notificationService.sendGoalDeadlineAlert(settings, goal, daysLeft);
  };

  const sendAchievementCelebration = (achievement) => {
    notificationService.sendAchievementCelebration(settings, achievement);
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