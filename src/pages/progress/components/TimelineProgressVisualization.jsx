import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const TimelineProgressVisualization = ({ 
  completedCount, 
  totalCount, 
  streakCount, 
  weeklyProgress,
  selectedGoal,
  progressMarks = []
}) => {
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  const getMotivationalMessage = () => {
    if (completionPercentage === 100) {
      return "Journey Complete! 🎉";
    } else if (completionPercentage >= 80) {
      return "Almost there! 💪";
    } else if (completionPercentage >= 50) {
      return "Great progress! 🚀";
    } else if (completionPercentage > 0) {
      return "Keep going! ⭐";
    } else {
      return "Ready to begin! 🌟";
    }
  };

  const getProgressColor = () => {
    if (completionPercentage >= 80) return 'from-accent to-accent/80';
    if (completionPercentage >= 50) return 'from-primary to-primary/80';
    if (completionPercentage >= 25) return 'from-warning to-warning/80';
    return 'from-error to-error/80';
  };

  // Create timeline points based on progress marks
  const timelinePoints = progressMarks.slice(0, 5).map((mark, index) => ({
    id: mark.id,
    title: mark.title,
    completed: mark.completed,
    position: ((index + 1) / (progressMarks.length + 1)) * 100,
    priority: mark.priority
  }));

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading-medium text-text-primary">Progress Journey</h3>
          <div className="text-xs text-text-secondary font-caption">
            {getMotivationalMessage()}
          </div>
        </div>
        {selectedGoal && (
          <div className="text-sm text-text-secondary">
            {selectedGoal.title}
          </div>
        )}
      </div>

      {/* Timeline Progress */}
      <div className="p-6">
        <div className="relative">
          {/* Timeline Background */}
          <div className="absolute left-4 top-8 bottom-8 w-1 bg-surface-600 rounded-full"></div>
          
          {/* Progress Line */}
          <motion.div 
            className={`absolute left-4 top-8 w-1 bg-gradient-to-b ${getProgressColor()} rounded-full origin-top`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: completionPercentage / 100 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ height: `${Math.max(completionPercentage, 10)}%` }}
          />

          {/* Start Point */}
          <div className="relative flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full border-4 border-surface flex items-center justify-center z-10">
              <Icon name="Play" size={14} className="text-primary-foreground" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-text-primary">Start</div>
              <div className="text-xs text-text-secondary">Begin your journey</div>
            </div>
          </div>

          {/* Timeline Points */}
          {timelinePoints.map((point, index) => (
            <motion.div 
              key={point.id}
              className="relative flex items-center mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className={`w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center z-10 ${
                point.completed 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-surface-700 text-text-secondary'
              }`}>
                <Icon 
                  name={point.completed ? "Check" : "Target"} 
                  size={14} 
                />
              </div>
              <div className="ml-4 flex-1">
                <div className={`text-sm font-medium ${
                  point.completed ? 'text-accent' : 'text-text-primary'
                }`}>
                  {point.title}
                </div>
                <div className="text-xs text-text-secondary">
                  {point.priority} priority
                </div>
              </div>
              {point.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-accent rounded-full flex items-center justify-center ml-2"
                >
                  <Icon name="Check" size={12} className="text-accent-foreground" />
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Goal End Point */}
          <div className="relative flex items-center">
            <div className={`w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center z-10 ${
              completionPercentage === 100
                ? 'bg-gradient-to-br from-accent to-secondary text-accent-foreground'
                : 'bg-surface-700 text-text-secondary'
            }`}>
              <Icon 
                name={completionPercentage === 100 ? "Trophy" : "Flag"} 
                size={14} 
              />
            </div>
            <div className="ml-4">
              <div className={`text-sm font-medium ${
                completionPercentage === 100 ? 'text-accent' : 'text-text-primary'
              }`}>
                Goal Complete
              </div>
              <div className="text-xs text-text-secondary">
                {completionPercentage === 100 ? 'Congratulations!' : 'Your destination'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="border-t border-border p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Completed */}
          <div className="text-center">
            <div className="text-lg font-data-medium text-accent">
              {completedCount}
            </div>
            <div className="text-xs text-text-secondary font-caption">
              Completed
            </div>
          </div>

          {/* Streak */}
          <div className="text-center">
            <div className="text-lg font-data-medium text-warning">
              {streakCount}
            </div>
            <div className="text-xs text-text-secondary font-caption">
              Day Streak
            </div>
          </div>

          {/* Progress */}
          <div className="text-center">
            <div className="text-lg font-data-medium text-primary">
              {Math.round(completionPercentage)}%
            </div>
            <div className="text-xs text-text-secondary font-caption">
              Progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineProgressVisualization;