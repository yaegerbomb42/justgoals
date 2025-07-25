import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock,
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Target,
  Trophy,
  Zap,
  Calendar,
  Coffee,
  BookOpen,
  Activity
} from 'lucide-react';
import { useNotificationContext } from '../../context/NotificationContext';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../../context/NotificationContext';

// Icon mapping for different notification types
const getNotificationIcon = (type) => {
  const iconMap = {
    [NOTIFICATION_TYPES.SUCCESS]: CheckCircle,
    [NOTIFICATION_TYPES.ERROR]: XCircle,
    [NOTIFICATION_TYPES.WARNING]: AlertTriangle,
    [NOTIFICATION_TYPES.INFO]: Info,
    [NOTIFICATION_TYPES.GOAL_DEADLINE]: Target,
    [NOTIFICATION_TYPES.GOAL_MILESTONE]: Trophy,
    [NOTIFICATION_TYPES.ACHIEVEMENT]: Trophy,
    [NOTIFICATION_TYPES.HABIT_REMINDER]: Activity,
    [NOTIFICATION_TYPES.HABIT_STREAK]: Zap,
    [NOTIFICATION_TYPES.DRIFT_PROGRESS]: Target,
    [NOTIFICATION_TYPES.MEAL_REMINDER]: Coffee,
    [NOTIFICATION_TYPES.JOURNAL_REMINDER]: BookOpen,
    [NOTIFICATION_TYPES.FOCUS_REMINDER]: Target,
    [NOTIFICATION_TYPES.DAILY_MOTIVATION]: Zap,
    [NOTIFICATION_TYPES.SYSTEM]: Info
  };
  
  return iconMap[type] || Info;
};

// Color mapping for different notification types and priorities
const getNotificationColors = (type, priority) => {
  const baseColors = {
    [NOTIFICATION_TYPES.SUCCESS]: 'from-green-500 to-green-600 text-white',
    [NOTIFICATION_TYPES.ERROR]: 'from-red-500 to-red-600 text-white',
    [NOTIFICATION_TYPES.WARNING]: 'from-yellow-500 to-yellow-600 text-white',
    [NOTIFICATION_TYPES.INFO]: 'from-blue-500 to-blue-600 text-white',
    [NOTIFICATION_TYPES.ACHIEVEMENT]: 'from-purple-500 to-purple-600 text-white',
    [NOTIFICATION_TYPES.HABIT_STREAK]: 'from-orange-500 to-orange-600 text-white',
    [NOTIFICATION_TYPES.GOAL_MILESTONE]: 'from-indigo-500 to-indigo-600 text-white'
  };

  const priorityColors = {
    [NOTIFICATION_PRIORITY.URGENT]: 'from-red-600 to-red-700 text-white animate-pulse',
    [NOTIFICATION_PRIORITY.HIGH]: 'from-orange-500 to-orange-600 text-white'
  };

  // Priority overrides type
  if (priority === NOTIFICATION_PRIORITY.URGENT || priority === NOTIFICATION_PRIORITY.HIGH) {
    return priorityColors[priority];
  }

  return baseColors[type] || 'from-gray-500 to-gray-600 text-white';
};

// Animation variants for different animation types
const getAnimationVariants = (animationType, position) => {
  const isLeft = position.includes('left');
  const isTop = position.includes('top');

  const slideVariants = {
    initial: {
      x: isLeft ? -400 : 400,
      y: 0,
      opacity: 0,
      scale: 0.8
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.4
      }
    },
    exit: {
      x: isLeft ? -400 : 400,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    }
  };

  const fadeVariants = {
    initial: {
      opacity: 0,
      scale: 0.9,
      y: isTop ? -20 : 20
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: isTop ? -20 : 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const bounceVariants = {
    initial: {
      opacity: 0,
      scale: 0.5,
      y: isTop ? -50 : 50
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      scale: 0.5,
      transition: {
        duration: 0.2
      }
    }
  };

  const variants = {
    slide: slideVariants,
    fade: fadeVariants,
    bounce: bounceVariants
  };

  return variants[animationType] || slideVariants;
};

// Individual notification component
const NotificationToast = ({ notification, onRemove, onSnooze, position, animation }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [pausedTime, setPausedTime] = useState(null);
  
  const Icon = getNotificationIcon(notification.type);
  const colors = getNotificationColors(notification.type, notification.priority);
  const variants = getAnimationVariants(animation, position);

  // Progress bar for timeout with hover pause functionality
  useEffect(() => {
    if (notification.persistent || notification.timeout <= 0) return;

    const initStartTime = Date.now();
    setStartTime(initStartTime);
    const duration = notification.timeout;

    const interval = setInterval(() => {
      if (isHovered) {
        // Pause timer when hovered
        if (!pausedTime) {
          setPausedTime(Date.now());
        }
        return;
      }

      // Resume timer when not hovered
      let currentStartTime = initStartTime;
      if (pausedTime) {
        // Add the pause duration to start time
        const pauseDuration = Date.now() - pausedTime;
        currentStartTime += pauseDuration;
        setStartTime(currentStartTime);
        setPausedTime(null);
      }

      const elapsed = Date.now() - currentStartTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(notification.id);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [notification.persistent, notification.timeout, isHovered, pausedTime, onRemove, notification.id]);

  const handleAction = (action) => {
    if (action.callback) {
      action.callback();
    }
    onRemove(notification.id);
  };

  const progressPercentage = timeLeft && notification.timeout > 0 
    ? (timeLeft / notification.timeout) * 100 
    : 0;

  return (
    <motion.div
      layout
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        relative overflow-hidden rounded-lg shadow-lg backdrop-blur-sm
        bg-gradient-to-r ${colors}
        min-w-80 max-w-96 p-4 mb-3
        transform cursor-pointer
        border border-white/20
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Progress bar for timeout */}
      {!notification.persistent && notification.timeout > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <motion.div
            className="h-full bg-white/60"
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={20} className="drop-shadow-sm" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm truncate pr-2">
              {notification.title}
            </h4>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Snooze button for reminders */}
              {(notification.type === NOTIFICATION_TYPES.HABIT_REMINDER || 
                notification.type === NOTIFICATION_TYPES.MEAL_REMINDER ||
                notification.type === NOTIFICATION_TYPES.JOURNAL_REMINDER ||
                notification.type === NOTIFICATION_TYPES.FOCUS_REMINDER) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSnooze(notification.id);
                  }}
                  className="p-1 rounded hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
                  title="Snooze for 5 minutes"
                >
                  <Clock size={14} />
                </button>
              )}
              
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
                className="p-1 rounded hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm opacity-90 mt-1 leading-relaxed">
            {notification.message}
          </p>

          {/* Action buttons */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  className={`
                    px-3 py-1.5 rounded text-xs font-medium transition-colors
                    ${action.primary 
                      ? 'bg-white/20 hover:bg-white/30 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp for info */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs opacity-60 mt-2"
            >
              {new Date(notification.timestamp).toLocaleTimeString()}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main notification display component
const NotificationDisplay = () => {
  const { notifications, settings, removeNotification, snoozeNotification } = useNotificationContext();

  // Position classes
  const getPositionClasses = (position) => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };
    return positions[position] || positions['top-left'];
  };

  if (!settings.enabled || notifications.length === 0) {
    return null;
  }

  return (
    <div className={`
      fixed z-50 pointer-events-none
      ${getPositionClasses(settings.position)}
    `}>
      <div className="pointer-events-auto">
        <AnimatePresence mode="sync">
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
              onSnooze={snoozeNotification}
              position={settings.position}
              animation={settings.animation}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Queue indicator */}
      {settings.enabled && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs text-gray-500 mt-2 text-center pointer-events-none"
        >
          {notifications.length > 1 && `${notifications.length} notifications`}
        </motion.div>
      )}
    </div>
  );
};

export default NotificationDisplay;