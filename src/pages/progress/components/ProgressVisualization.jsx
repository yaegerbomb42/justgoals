import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressVisualization = ({ 
  completedCount, 
  totalCount, 
  streakCount, 
  weeklyProgress,
  selectedGoal 
}) => {
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const getMotivationalMessage = () => {
    if (completionPercentage === 100) {
      return "Perfect day! 🎉";
    } else if (completionPercentage >= 80) {
      return "Almost there! 💪";
    } else if (completionPercentage >= 50) {
      return "Great progress! 🚀";
    } else if (completionPercentage > 0) {
      return "Keep going! ⭐";
    } else {
      return "Ready to start! 🌟";
    }
  };

  const getProgressColor = () => {
    if (completionPercentage >= 80) return 'accent';
    if (completionPercentage >= 50) return 'primary';
    if (completionPercentage >= 25) return 'warning';
    return 'error';
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading-medium text-text-primary">Today's Progress</h3>
        <div className="text-xs text-text-secondary font-caption">
          {getMotivationalMessage()}
        </div>
      </div>

      {/* Main Progress Circle */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={`var(--color-${getProgressColor()})`}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPercentage / 100)}`}
              className="transition-all duration-slow"
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-data-medium text-text-primary">
              {Math.round(completionPercentage)}%
            </div>
            <div className="text-xs text-text-secondary font-caption">
              {completedCount}/{totalCount}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Completed Tasks */}
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-accent/20 rounded-lg mx-auto mb-2">
            <Icon name="CheckCircle" size={16} className="text-accent" />
          </div>
          <div className="text-lg font-data-medium text-text-primary">
            {completedCount}
          </div>
          <div className="text-xs text-text-secondary font-caption">
            Completed
          </div>
        </div>

        {/* Current Streak */}
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-warning/20 rounded-lg mx-auto mb-2">
            <Icon name="Flame" size={16} className="text-warning" />
          </div>
          <div className="text-lg font-data-medium text-text-primary">
            {streakCount}
          </div>
          <div className="text-xs text-text-secondary font-caption">
            Day Streak
          </div>
        </div>

        {/* Weekly Average */}
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 rounded-lg mx-auto mb-2">
            <Icon name="TrendingUp" size={16} className="text-secondary" />
          </div>
          <div className="text-lg font-data-medium text-text-primary">
            {weeklyProgress}%
          </div>
          <div className="text-xs text-text-secondary font-caption">
            Weekly Avg
          </div>
        </div>
      </div>

      {/* Goal-specific Progress */}
      {selectedGoal && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-body-medium text-text-primary">
              {selectedGoal.title}
            </span>
            <span className="text-sm text-text-secondary">
              {selectedGoal.progress || 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-surface-600 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-${selectedGoal.color || 'primary'} transition-all duration-normal`}
              style={{ width: `${selectedGoal.progress || 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressVisualization;