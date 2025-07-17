import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickActionChips = ({ onChipClick, disabled = false }) => {
  const quickActions = [
    {
      id: 'daily-planning',
      label: 'Daily Planning',
      icon: 'Calendar',
      prompt: "Help me plan my daily goals and milestones for today. What should I focus on?"
    },
    {
      id: 'goal-analysis',
      label: 'Goal Analysis',
      icon: 'Target',
      prompt: "Analyze my current goals and provide insights on my progress and areas for improvement."
    },
    {
      id: 'progress-review',
      label: 'Progress Review',
      icon: 'TrendingUp',
      prompt: "Review my recent progress and suggest strategies to maintain momentum."
    },
    {
      id: 'motivation-boost',
      label: 'Motivation Boost',
      icon: 'Zap',
      prompt: "I need some motivation and encouragement to stay focused on my goals."
    },
    {
      id: 'time-management',
      label: 'Time Management',
      icon: 'Clock',
      prompt: "Help me optimize my time management and create a more effective schedule."
    },
    {
      id: 'obstacle-solving',
      label: 'Obstacle Solving',
      icon: 'Shield',
      prompt: "I'm facing challenges with my goals. Help me identify solutions and overcome obstacles."
    }
  ];

  return (
    <div className="px-4 py-3 bg-surface-800 border-t border-border">
      <div className="mb-2">
        <span className="text-xs text-text-secondary font-caption">Quick Actions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onChipClick(action.prompt)}
            disabled={disabled}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-body-medium
              transition-all duration-normal
              ${disabled 
                ? 'bg-surface-600 text-text-muted cursor-not-allowed' :'bg-surface-600 text-text-secondary hover:bg-primary hover:text-primary-foreground hover:shadow-elevation'
              }
            `}
          >
            <Icon name={action.icon} size={14} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionChips;