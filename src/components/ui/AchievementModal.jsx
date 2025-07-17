import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import { useAchievements } from '../../context/AchievementContext';

const AchievementModal = ({ isOpen, onClose, achievements, showAll = false }) => {
  const { getAchievementsByState, getProgressSummary } = useAchievements();
  const [activeTab, setActiveTab] = useState('all');
  
  const achievementsByState = getAchievementsByState();
  const progressSummary = getProgressSummary();

  const tabs = [
    { id: 'all', label: 'All', icon: 'Trophy' },
    { id: 'completed', label: 'Completed', icon: 'CheckCircle', count: achievementsByState.completed.length },
    { id: 'inProgress', label: 'In Progress', icon: 'Clock', count: achievementsByState.inProgress.length },
    { id: 'notStarted', label: 'Not Started', icon: 'Lock', count: achievementsByState.notStarted.length }
  ];

  const getAchievementsToShow = () => {
    switch (activeTab) {
      case 'completed':
        return achievementsByState.completed;
      case 'inProgress':
        return achievementsByState.inProgress;
      case 'notStarted':
        return achievementsByState.notStarted;
      default:
        return showAll ? [...achievementsByState.completed, ...achievementsByState.inProgress, ...achievementsByState.notStarted] : achievements;
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'completed':
        return 'text-success border-success/20 bg-success/10';
      case 'in-progress':
        return 'text-warning border-warning/20 bg-warning/10';
      case 'not-started':
        return 'text-text-muted border-border bg-surface-700';
      default:
        return 'text-text-secondary border-border bg-surface';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'completed':
        return 'CheckCircle';
      case 'in-progress':
        return 'Clock';
      case 'not-started':
        return 'Lock';
      default:
        return 'Circle';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading-bold text-text-primary">
                  {showAll ? 'Achievements' : 'New Achievements!'}
                </h2>
                <p className="text-text-secondary mt-1">
                  {showAll ? 'Track your progress and unlock new achievements' : 'Congratulations on your accomplishments!'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-surface-700 text-text-secondary hover:bg-surface-600 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Progress Summary */}
            {showAll && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-heading-bold text-text-primary">{progressSummary.total}</div>
                  <div className="text-sm text-text-secondary">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading-bold text-success">{progressSummary.completed}</div>
                  <div className="text-sm text-text-secondary">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading-bold text-warning">{progressSummary.inProgress}</div>
                  <div className="text-sm text-text-secondary">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading-bold text-text-muted">{progressSummary.notStarted}</div>
                  <div className="text-sm text-text-secondary">Not Started</div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          {showAll && (
            <div className="px-6 pt-4">
              <div className="flex space-x-1 bg-surface-700 rounded-lg p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-body-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-surface text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon name={tab.icon} size={16} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="px-2 py-1 text-xs bg-surface-600 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Achievements List */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getAchievementsToShow().map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    achievement.isUnlocked 
                      ? 'border-success/20 bg-success/10 hover:bg-success/20' 
                      : achievement.isInProgress
                        ? 'border-warning/20 bg-warning/10 hover:bg-warning/20'
                        : 'border-border bg-surface-700 hover:bg-surface-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                      achievement.isUnlocked 
                        ? 'bg-success text-white' 
                        : achievement.isInProgress
                          ? 'bg-warning text-white'
                          : 'bg-surface-600 text-text-muted'
                    }`}>
                      {achievement.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-lg font-heading-medium ${
                          achievement.isUnlocked 
                            ? 'text-success' 
                            : achievement.isInProgress
                              ? 'text-warning'
                              : 'text-text-muted'
                        }`}>
                          {achievement.title}
                        </h3>
                        <Icon 
                          name={getStateIcon(achievement.state)} 
                          size={16} 
                          className={
                            achievement.isUnlocked 
                              ? 'text-success' 
                              : achievement.isInProgress
                                ? 'text-warning'
                                : 'text-text-muted'
                          }
                        />
                      </div>
                      
                      <p className="text-sm text-text-secondary mb-2">
                        {achievement.description}
                      </p>
                      
                      {/* Progress Bar */}
                      {achievement.isInProgress && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                            <span>{achievement.progressText}</span>
                            <span>{achievement.percentage}%</span>
                          </div>
                          <div className="w-full bg-surface-600 rounded-full h-2">
                            <div 
                              className="bg-warning h-2 rounded-full transition-all duration-300"
                              style={{ width: `${achievement.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Next Milestone */}
                      {achievement.isInProgress && achievement.nextMilestone && (
                        <p className="text-xs text-warning font-body-medium">
                          Next: {achievement.nextMilestone}
                        </p>
                      )}
                      
                      {/* Points */}
                      <div className="flex items-center space-x-2 mt-2">
                        <Icon name="Star" size={12} className="text-warning" />
                        <span className="text-xs text-text-secondary">
                          {achievement.points} points
                        </span>
                        {achievement.isUnlocked && (
                          <span className="text-xs text-success font-body-medium">
                            ✓ Unlocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {getAchievementsToShow().length === 0 && (
              <div className="text-center py-8">
                <Icon name="Trophy" size={48} className="text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-heading-medium text-text-primary mb-2">
                  {activeTab === 'completed' ? 'No completed achievements yet' :
                   activeTab === 'inProgress' ? 'No achievements in progress' :
                   activeTab === 'notStarted' ? 'All achievements started!' :
                   'No achievements found'}
                </h3>
                <p className="text-text-secondary">
                  {activeTab === 'completed' ? 'Keep working on your goals to unlock achievements!' :
                   activeTab === 'inProgress' ? 'Start working on your goals to see progress here' :
                   activeTab === 'notStarted' ? 'Great job! You\'ve started working on all available achievements' :
                   'Start using the app to unlock achievements'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementModal; 