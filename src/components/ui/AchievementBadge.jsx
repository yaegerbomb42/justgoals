import React from 'react';
import Icon from '../AppIcon';

const AchievementBadge = ({ 
  achievement, 
  size = 'medium', 
  showProgress = false, 
  onClick = null,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base'
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    if (percentage >= 50) return 'text-accent';
    return 'text-text-secondary';
  };

  const getProgressBg = (percentage) => {
    if (percentage >= 100) return 'bg-success/20 border-success/30';
    if (percentage >= 75) return 'bg-warning/20 border-warning/30';
    if (percentage >= 50) return 'bg-accent/20 border-accent/30';
    return 'bg-surface-700 border-border';
  };

  return (
    <div 
      className={`
        relative group cursor-pointer transition-all duration-200
        ${achievement.earned ? 'animate-pulse' : ''}
        ${onClick ? 'hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Badge */}
      <div className={`
        relative ${sizeClasses[size]} rounded-full flex items-center justify-center
        ${achievement.earned 
          ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25' 
          : getProgressBg(achievement.percentage)
        }
        border-2 ${achievement.earned ? 'border-primary/30' : 'border-border'}
        transition-all duration-200
      `}>
        <span className="text-lg leading-none">
          {achievement.icon}
        </span>
        
        {/* Earned indicator */}
        {achievement.earned && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
            <Icon name="Check" size={10} color="#FFFFFF" />
          </div>
        )}
      </div>

      {/* Progress ring for unearned achievements */}
      {!achievement.earned && showProgress && achievement.percentage > 0 && (
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className={`${getProgressColor(achievement.percentage)} opacity-30`}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${achievement.percentage * 2.83} 283`}
            className={`${getProgressColor(achievement.percentage)} transition-all duration-500`}
          />
        </svg>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-800 border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <div className="text-sm font-body-medium text-text-primary">
          {achievement.title}
        </div>
        <div className="text-xs text-text-secondary mt-1">
          {achievement.description}
        </div>
        {!achievement.earned && showProgress && (
          <div className="text-xs text-accent mt-1">
            {achievement.progress}/{achievement.total} ({Math.round(achievement.percentage)}%)
          </div>
        )}
        {achievement.earned && achievement.earnedAt && (
          <div className="text-xs text-success mt-1">
            Earned {new Date(achievement.earnedAt).toLocaleDateString()}
          </div>
        )}
        <div className="text-xs text-primary mt-1">
          +{achievement.points} points
        </div>
      </div>
    </div>
  );
};

export default AchievementBadge; 