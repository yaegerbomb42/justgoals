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
          <div className="absolute left-4 top-8 bottom-8 w-1 bg-gradient-to-b from-surface-600 via-surface-500 to-surface-600 rounded-full"></div>
          
          {/* Progress Line */}
          <motion.div 
            className={`absolute left-4 top-8 w-1 bg-gradient-to-b ${getProgressColor()} rounded-full origin-top shadow-lg`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: completionPercentage / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ height: `${Math.max(completionPercentage, 10)}%` }}
          >
            {/* Animated pulse effect for active progress */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Start Point */}
          <motion.div 
            className="relative flex items-center mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full border-4 border-surface flex items-center justify-center z-10 shadow-lg">
              <Icon name="Play" size={14} className="text-primary-foreground" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-text-primary">Journey Start</div>
              <div className="text-xs text-text-secondary">Begin your path to success</div>
            </div>
            <div className="ml-auto">
              <motion.div
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Timeline Points */}
          {timelinePoints.map((point, index) => (
            <motion.div 
              key={point.id}
              className="relative flex items-center mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.15, duration: 0.6 }}
            >
              <motion.div 
                className={`w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center z-10 shadow-lg transition-all duration-300 ${
                  point.completed 
                    ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground' 
                    : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon 
                  name={point.completed ? "Check" : "Target"} 
                  size={14} 
                />
              </motion.div>
              <div className="ml-4 flex-1">
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  point.completed ? 'text-accent' : 'text-text-primary'
                }`}>
                  {point.title}
                </div>
                <div className="text-xs text-text-secondary flex items-center space-x-2">
                  <span>{point.priority} priority</span>
                  {point.completed && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-accent/20 text-accent"
                    >
                      ✓ Complete
                    </motion.span>
                  )}
                </div>
              </div>
              {point.completed && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-6 h-6 bg-accent rounded-full flex items-center justify-center ml-2"
                >
                  <Icon name="Check" size={12} className="text-accent-foreground" />
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Goal End Point */}
          <motion.div 
            className="relative flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (timelinePoints.length + 1) * 0.15, duration: 0.6 }}
          >
            <motion.div 
              className={`w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center z-10 shadow-lg transition-all duration-500 ${
                completionPercentage === 100
                  ? 'bg-gradient-to-br from-accent to-secondary text-accent-foreground'
                  : 'bg-surface-700 text-text-secondary'
              }`}
              animate={completionPercentage === 100 ? {
                scale: [1, 1.2, 1],
                rotate: [0, 360, 0]
              } : {}}
              transition={{ duration: 2, repeat: completionPercentage === 100 ? Infinity : 0 }}
            >
              <Icon 
                name={completionPercentage === 100 ? "Trophy" : "Flag"} 
                size={14} 
              />
            </motion.div>
            <div className="ml-4">
              <div className={`text-sm font-medium transition-colors duration-500 ${
                completionPercentage === 100 ? 'text-accent' : 'text-text-primary'
              }`}>
                Goal Achievement
              </div>
              <div className="text-xs text-text-secondary">
                {completionPercentage === 100 ? '🎉 Congratulations! Goal Complete!' : 'Your ultimate destination'}
              </div>
            </div>
            {completionPercentage === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                className="ml-auto"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="text-2xl"
                >
                  🏆
                </motion.div>
              </motion.div>
            )}
          </motion.div>
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