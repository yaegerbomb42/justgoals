import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const SessionStats = ({ 
  currentSession, 
  totalFocusTime, 
  sessionsToday, 
  selectedGoal 
}) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimeHours = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${Math.floor(seconds)}s`;
    }
  };

  const getSessionProgress = () => {
    if (!currentSession.isActive) return 0;
    const duration = 25 * 60; // 25 minutes default
    return Math.min((currentSession.elapsed / duration) * 100, 100);
  };

  const safeCurrentSession = currentSession || { elapsed: 0, isActive: false };
  const safeTotalFocusTime = typeof totalFocusTime === 'number' ? totalFocusTime : 0;
  const safeSessionsToday = typeof sessionsToday === 'number' ? sessionsToday : 0;
  const safeSelectedGoal = selectedGoal || { progress: 0 };

  const stats = [
    {
      label: 'Current Session',
      value: safeCurrentSession.elapsed > 0 ? formatTime(safeCurrentSession.elapsed) : '0s',
      icon: 'Clock',
      color: 'text-primary',
      progress: safeCurrentSession.isActive ? getSessionProgress() : 0
    },
    {
      label: 'Total Focus Time',
      value: formatTimeHours(safeTotalFocusTime),
      icon: 'Target',
      color: 'text-accent'
    },
    {
      label: 'Sessions Today',
      value: safeSessionsToday.toString(),
      icon: 'Calendar',
      color: 'text-secondary'
    },
    {
      label: 'Goal Progress',
      value: safeSelectedGoal ? `${safeSelectedGoal.progress || 0}%` : '0%',
      icon: 'TrendingUp',
      color: 'text-success'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-surface/50 backdrop-blur-sm border border-border rounded-lg p-4 text-center relative overflow-hidden"
        >
          {/* Progress Bar for Current Session */}
          {stat.progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-primary"
              />
            </div>
          )}

          <div className="flex items-center justify-center mb-2">
            <Icon name={stat.icon} size={20} className={stat.color} />
          </div>
          
          <div className="text-lg font-heading-semibold text-text-primary mb-1">
            {stat.value}
          </div>
          
          <div className="text-xs text-text-secondary font-caption">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SessionStats;