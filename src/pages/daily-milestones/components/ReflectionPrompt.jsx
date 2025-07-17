import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReflectionPrompt = ({ 
  isVisible, 
  onClose, 
  completedMilestones, 
  totalMilestones,
  onSaveReflection 
}) => {
  const [reflection, setReflection] = useState('');
  const [tomorrowGoals, setTomorrowGoals] = useState('');
  const [mood, setMood] = useState('');

  const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const moodOptions = [
    { emoji: '😊', label: 'Great', value: 'great' },
    { emoji: '🙂', label: 'Good', value: 'good' },
    { emoji: '😐', label: 'Okay', value: 'okay' },
    { emoji: '😔', label: 'Tough', value: 'tough' }
  ];

  const getEncouragementMessage = () => {
    if (completionRate === 100) {
      return "Outstanding! You completed all your milestones today! 🎉";
    } else if (completionRate >= 80) {
      return "Excellent work! You're crushing your goals! 💪";
    } else if (completionRate >= 60) {
      return "Great progress! You're building strong momentum! 🚀";
    } else if (completionRate >= 40) {
      return "Good effort! Every step forward counts! ⭐";
    } else if (completionRate > 0) {
      return "You made progress today - that's what matters! 🌟";
    } else {
      return "Tomorrow is a fresh start! You've got this! 💫";
    }
  };

  const handleSave = () => {
    const reflectionData = {
      date: new Date().toISOString().split('T')[0],
      reflection,
      tomorrowGoals,
      mood,
      completionRate,
      completedMilestones,
      totalMilestones,
      timestamp: new Date()
    };

    onSaveReflection(reflectionData);
    
    // Reset form
    setReflection('');
    setTomorrowGoals('');
    setMood('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface rounded-lg border border-border shadow-elevation-2 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                <Icon name="BookOpen" size={20} color="#FFFFFF" />
              </div>
              <div>
                <h2 className="text-lg font-heading-medium text-text-primary">
                  Daily Reflection
                </h2>
                <p className="text-sm text-text-secondary">
                  How did today go?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors duration-fast"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Summary */}
          <div className="bg-surface-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-body-medium text-text-primary">
                Today's Achievement
              </span>
              <span className="text-sm text-text-secondary">
                {completedMilestones}/{totalMilestones} completed
              </span>
            </div>
            
            <div className="w-full h-2 bg-surface-600 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-accent transition-all duration-normal"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            
            <p className="text-sm text-accent font-body-medium">
              {getEncouragementMessage()}
            </p>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-3">
              How are you feeling about today?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={`
                    p-3 rounded-lg border transition-all duration-fast text-center
                    ${mood === option.value
                      ? 'border-primary bg-primary/10 text-primary' :'border-border hover:border-primary/50 text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-xs font-caption">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reflection */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              What went well today? What could be improved?
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Reflect on your progress, challenges, and learnings from today..."
              rows={4}
              className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-fast resize-none"
            />
          </div>

          {/* Tomorrow's Goals */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              What are your priorities for tomorrow?
            </label>
            <textarea
              value={tomorrowGoals}
              onChange={(e) => setTomorrowGoals(e.target.value)}
              placeholder="Set your intentions and key milestones for tomorrow..."
              rows={3}
              className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-fast resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1"
              iconName="Save"
              iconPosition="left"
            >
              Save Reflection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectionPrompt;