import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';

const NotificationContext = createContext();

// Notification types for categorization
export const NOTIFICATION_TYPES = {
  DRIFT_PROGRESS: 'drift_progress',
  HABIT_REMINDER: 'habit_reminder',
  HABIT_STREAK: 'habit_streak',
  GOAL_DEADLINE: 'goal_deadline',
  GOAL_MILESTONE: 'goal_milestone',
  ACHIEVEMENT: 'achievement',
  MEAL_REMINDER: 'meal_reminder',
  JOURNAL_REMINDER: 'journal_reminder',
  FOCUS_REMINDER: 'focus_reminder',
  DAILY_MOTIVATION: 'daily_motivation',
  SYSTEM: 'system',
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning'
};

// Priority levels
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Initial state
const initialState = {
  notifications: [],
  settings: {
    enabled: true,
    position: 'top-left', // top-left, top-right, bottom-left, bottom-right
    animation: 'slide', // slide, fade, bounce
    maxConcurrent: 3,
    defaultTimeout: 5000,
    soundEnabled: false,
    priorityQueue: true
  },
  queue: []
};

// Reducer for managing notification state
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        ...action.payload
      };

      // If max concurrent reached and priority queue is enabled, queue the notification
      if (state.settings.priorityQueue && state.notifications.length >= state.settings.maxConcurrent) {
        return {
          ...state,
          queue: [...state.queue, notification].sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
          })
        };
      }

      return {
        ...state,
        notifications: [...state.notifications, notification]
      };
    }

    case 'REMOVE_NOTIFICATION': {
      const newNotifications = state.notifications.filter(n => n.id !== action.payload);
      let newQueue = state.queue;
      let updatedNotifications = newNotifications;

      // If there's room and queue has items, move next queued notification to active
      if (newNotifications.length < state.settings.maxConcurrent && state.queue.length > 0) {
        const nextNotification = state.queue[0];
        newQueue = state.queue.slice(1);
        updatedNotifications = [...newNotifications, nextNotification];
      }

      return {
        ...state,
        notifications: updatedNotifications,
        queue: newQueue
      };
    }

    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        queue: []
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case 'SNOOZE_NOTIFICATION': {
      const { id, duration } = action.payload;
      const notification = state.notifications.find(n => n.id === id);
      if (!notification) return state;

      // Remove from current notifications and schedule re-add
      const newNotifications = state.notifications.filter(n => n.id !== id);
      
      setTimeout(() => {
        // Re-add notification after snooze duration
        window.dispatchEvent(new CustomEvent('add-snoozed-notification', { 
          detail: { ...notification, id: Date.now() + Math.random() }
        }));
      }, duration);

      return {
        ...state,
        notifications: newNotifications
      };
    }

    default:
      return state;
  }
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const timeoutRefs = useRef(new Map());

  // Add notification with auto-dismiss
  const addNotification = useCallback((notification) => {
    const timeout = notification.timeout || state.settings.defaultTimeout;
    const priority = notification.priority || NOTIFICATION_PRIORITY.MEDIUM;

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: NOTIFICATION_TYPES.INFO,
        title: 'Notification',
        message: '',
        priority,
        actions: [],
        persistent: false,
        ...notification
      }
    });

    // Set auto-dismiss timer if not persistent
    if (!notification.persistent && timeout > 0) {
      const notificationId = Date.now() + Math.random();
      const timeoutId = setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
        timeoutRefs.current.delete(notificationId);
      }, timeout);
      
      timeoutRefs.current.set(notificationId, timeoutId);
    }
  }, [state.settings.defaultTimeout]);

  // Remove specific notification
  const removeNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    
    // Clear timeout if exists
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  }, []);

  // Snooze notification
  const snoozeNotification = useCallback((id, duration = 300000) => { // Default 5 minutes
    dispatch({ type: 'SNOOZE_NOTIFICATION', payload: { id, duration } });
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: 'Success',
      message,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: 'Error',
      message,
      priority: NOTIFICATION_PRIORITY.HIGH,
      persistent: true,
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title: 'Warning',
      message,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title: 'Information',
      message,
      priority: NOTIFICATION_PRIORITY.LOW,
      ...options
    });
  }, [addNotification]);

  // Listen for snoozed notifications
  React.useEffect(() => {
    const handleSnoozedNotification = (event) => {
      addNotification(event.detail);
    };

    window.addEventListener('add-snoozed-notification', handleSnoozedNotification);
    return () => window.removeEventListener('add-snoozed-notification', handleSnoozedNotification);
  }, [addNotification]);

  const value = {
    // State
    notifications: state.notifications,
    queue: state.queue,
    settings: state.settings,
    
    // Actions
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateSettings,
    snoozeNotification,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 