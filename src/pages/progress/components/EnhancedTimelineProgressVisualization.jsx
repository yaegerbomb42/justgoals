import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import aiProgressJourneyService from '../../../services/aiProgressJourneyService';

const EnhancedTimelineProgressVisualization = ({ 
  selectedGoal,
  progressMarks = [],
  onUpdateProgress,
  onCreateAIJourney
}) => {
  const { user } = useAuth();
  const [aiJourney, setAiJourney] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [journeyInsights, setJourneyInsights] = useState(null);
  const [showAIFeatures, setShowAIFeatures] = useState(true);

  // Generate AI journey when goal changes
  useEffect(() => {
    if (selectedGoal && user && showAIFeatures) {
      generateAIJourney();
    }
  }, [selectedGoal, user, showAIFeatures]);

  // Update insights when journey or progress changes
  useEffect(() => {
    if (aiJourney.length > 0) {
      const insights = aiProgressJourneyService.getJourneyInsights(aiJourney, {});
      setJourneyInsights(insights);
    }
  }, [aiJourney, progressMarks]);

  const generateAIJourney = async () => {
    if (!selectedGoal || !user) return;
    
    setIsGenerating(true);
    try {
      const journey = await aiProgressJourneyService.generateProgressJourney(
        selectedGoal,
        user.id
      );
      setAiJourney(journey);
      
      // Notify parent component
      if (onCreateAIJourney) {
        onCreateAIJourney(journey);
      }
    } catch (error) {
      console.error('Error generating AI journey:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Use AI journey if available, fallback to manual progress marks
  const displayJourney = aiJourney.length > 0 ? aiJourney : progressMarks;
  const completedCount = displayJourney.filter(m => m.completed).length;
  const totalCount = displayJourney.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getMotivationalMessage = () => {
    if (journeyInsights?.progressVelocity === 'ahead') {
      return "You're ahead of schedule! 🚀";
    } else if (journeyInsights?.progressVelocity === 'behind') {
      return "Take it one step at a time 💪";
    } else if (completionPercentage === 100) {
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
    if (journeyInsights?.progressVelocity === 'ahead') return 'from-accent to-secondary';
    if (completionPercentage >= 80) return 'from-accent to-accent/80';
    if (completionPercentage >= 50) return 'from-primary to-primary/80';
    if (completionPercentage >= 25) return 'from-warning to-warning/80';
    return 'from-error to-error/80';
  };

  const handleMilestoneToggle = (milestoneId) => {
    const milestone = displayJourney.find(m => m.id === milestoneId);
    if (milestone && onUpdateProgress) {
      onUpdateProgress(milestoneId, { completed: !milestone.completed });
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-lg">
      {/* Header with AI Status */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-surface to-surface-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <h3 className="font-heading-medium text-text-primary">AI Progress Journey</h3>
            {aiJourney.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-1 px-2 py-1 bg-accent/20 rounded-full"
              >
                <Icon name="Bot" size={12} className="text-accent" />
                <span className="text-xs text-accent font-medium">AI Generated</span>
              </motion.div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-text-secondary font-caption">
              {getMotivationalMessage()}
            </div>
            {selectedGoal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={generateAIJourney}
                disabled={isGenerating}
                className="text-text-secondary hover:text-primary"
              >
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon name="RefreshCw" size={14} />
                  </motion.div>
                ) : (
                  <Icon name="RefreshCw" size={14} />
                )}
              </Button>
            )}
          </div>
        </div>
        {selectedGoal && (
          <div className="text-sm text-text-secondary">
            {selectedGoal.title}
          </div>
        )}
      </div>

      {/* Journey Insights Panel */}
      {journeyInsights && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  journeyInsights.progressVelocity === 'ahead' ? 'bg-accent' :
                  journeyInsights.progressVelocity === 'behind' ? 'bg-warning' : 'bg-primary'
                }`} />
                <span className="text-xs text-text-secondary capitalize">
                  {journeyInsights.progressVelocity.replace('-', ' ')}
                </span>
              </div>
              {journeyInsights.nextSuggestedAction && (
                <div className="text-xs text-text-secondary">
                  Next: {journeyInsights.nextSuggestedAction.milestone.title}
                </div>
              )}
            </div>
            <div className="text-xs text-text-secondary">
              {completedCount}/{totalCount} milestones
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 mx-auto mb-3"
          >
            <Icon name="Bot" size={32} className="text-primary" />
          </motion.div>
          <p className="text-text-secondary">AI is analyzing your patterns and creating your personalized journey...</p>
        </div>
      )}

      {/* Timeline Visualization */}
      {!isGenerating && displayJourney.length > 0 && (
        <div className="p-6">
          <div className="relative">
            {/* Timeline Background */}
            <div className="absolute left-4 top-8 bottom-8 w-1 bg-gradient-to-b from-surface-600 via-surface-500 to-surface-600 rounded-full"></div>
            
            {/* Progress Line with Enhanced Animation */}
            <motion.div 
              className={`absolute left-4 top-8 w-1 bg-gradient-to-b ${getProgressColor()} rounded-full origin-top shadow-lg`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: completionPercentage / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ height: `${Math.max(completionPercentage, 10)}%` }}
            >
              {/* Enhanced pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-white/10"
                animate={{ 
                  opacity: [0.3, 0.8, 0.3],
                  scaleX: [1, 1.2, 1]
                }}
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
                <div className="text-xs text-text-secondary">AI-powered progress path</div>
              </div>
              <div className="ml-auto">
                <motion.div
                  className="w-2 h-2 bg-primary rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* AI-Enhanced Timeline Points */}
            <AnimatePresence>
              {displayJourney.map((milestone, index) => (
                <motion.div 
                  key={milestone.id}
                  className="relative flex items-center mb-6 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 1) * 0.15, duration: 0.6 }}
                >
                  <motion.button
                    onClick={() => handleMilestoneToggle(milestone.id)}
                    className={`w-8 h-8 rounded-full border-4 border-surface flex items-center justify-center z-10 shadow-lg transition-all duration-300 cursor-pointer ${
                      milestone.completed 
                        ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground' 
                        : 'bg-surface-700 text-text-secondary hover:bg-surface-600 hover:scale-105'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon 
                      name={milestone.completed ? "Check" : 
                            milestone.type === 'reflection' ? "Eye" :
                            milestone.type === 'checkpoint' ? "MapPin" : "Target"} 
                      size={14} 
                    />
                  </motion.button>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`text-sm font-medium transition-colors duration-300 ${
                        milestone.completed ? 'text-accent' : 'text-text-primary'
                      }`}>
                        {milestone.title}
                      </div>
                      {milestone.aiGenerated && (
                        <Icon name="Bot" size={12} className="text-primary opacity-60" />
                      )}
                    </div>
                    
                    <div className="text-xs text-text-secondary mb-1">
                      {milestone.description}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-text-secondary">
                      <span className={`px-2 py-0.5 rounded-full bg-${milestone.priority === 'high' ? 'error' : milestone.priority === 'medium' ? 'warning' : 'primary'}/20 text-${milestone.priority === 'high' ? 'error' : milestone.priority === 'medium' ? 'warning' : 'primary'}`}>
                        {milestone.priority} priority
                      </span>
                      <span>{milestone.estimatedDays} days</span>
                      {milestone.focusMinutes && (
                        <span>{milestone.focusMinutes}min focus</span>
                      )}
                    </div>

                    {/* AI Context & Motivation */}
                    {milestone.adaptiveFeatures && (
                      <motion.div 
                        className="mt-2 p-2 bg-primary/5 rounded text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                      >
                        {milestone.adaptiveFeatures.motivationalNote}
                      </motion.div>
                    )}
                  </div>

                  {milestone.completed && (
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
            </AnimatePresence>

            {/* Goal End Point */}
            <motion.div 
              className="relative flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (displayJourney.length + 1) * 0.15, duration: 0.6 }}
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
                  {completionPercentage === 100 ? '🎉 Congratulations! Goal Complete!' : 'Your AI-guided destination'}
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
      )}

      {/* Empty State for No Journey */}
      {!isGenerating && displayJourney.length === 0 && (
        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Icon name="Bot" size={24} className="text-primary" />
          </motion.div>
          <h3 className="text-lg font-heading-medium text-text-primary mb-2">
            AI-Powered Progress Journey
          </h3>
          <p className="text-text-secondary mb-4">
            Select a goal to generate your personalized AI progress journey
          </p>
          {selectedGoal && (
            <Button
              variant="primary"
              onClick={generateAIJourney}
              iconName="Bot"
              iconPosition="left"
            >
              Generate AI Journey
            </Button>
          )}
        </div>
      )}

      {/* Enhanced Progress Stats */}
      <div className="border-t border-border p-4 bg-gradient-to-r from-surface to-surface-700">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <motion.div 
              className="text-lg font-data-medium text-accent"
              animate={{ scale: completedCount > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {completedCount}
            </motion.div>
            <div className="text-xs text-text-secondary font-caption">
              Completed
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-data-medium text-primary">
              {totalCount}
            </div>
            <div className="text-xs text-text-secondary font-caption">
              Milestones
            </div>
          </div>

          <div className="text-center">
            <motion.div 
              className="text-lg font-data-medium text-warning"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {Math.round(completionPercentage)}%
            </motion.div>
            <div className="text-xs text-text-secondary font-caption">
              Progress
            </div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-data-medium ${
              journeyInsights?.progressVelocity === 'ahead' ? 'text-accent' :
              journeyInsights?.progressVelocity === 'behind' ? 'text-warning' : 'text-primary'
            }`}>
              <Icon name="TrendingUp" size={18} />
            </div>
            <div className="text-xs text-text-secondary font-caption">
              AI Insights
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTimelineProgressVisualization;