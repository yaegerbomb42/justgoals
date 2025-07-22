import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const GoalSelector = ({ goals, selectedGoalId, onGoalSelect, showAllGoals = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  const displayText = selectedGoal ? selectedGoal.title : 'All Goals';

  const handleGoalSelect = (goalId) => {
    onGoalSelect(goalId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-surface-800 rounded-lg border border-border hover:border-primary/50 transition-all duration-fast"
      >
        <div className="flex items-center space-x-3">
          <div className={`
            w-3 h-3 rounded-full
            ${selectedGoal 
              ? `bg-${selectedGoal.color || 'primary'}` 
              : 'bg-gradient-to-r from-primary to-secondary'
            }
          `} />
          <span className="font-body-medium text-text-primary">
            {displayText}
          </span>
        </div>
        
        <Icon 
          name={isOpen ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-text-secondary" 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-elevation z-200 max-h-64 overflow-y-auto">
          {showAllGoals && (
            <button
              onClick={() => handleGoalSelect(null)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-surface-700 transition-colors duration-fast
                ${!selectedGoalId ? 'bg-surface-700' : ''}
              `}
            >
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary" />
              <span className="font-body-medium text-text-primary">All Goals</span>
            </button>
          )}
          
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-700 transition-colors duration-fast
                ${selectedGoalId === goal.id ? 'bg-surface-700' : ''}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full`} style={{backgroundColor: `var(--color-primary)`}} />
                <div>
                  <span className="font-body-medium text-text-primary block">
                    {goal.title}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {goal.category}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-xs text-text-secondary">
                  {goal.progress || 0}%
                </div>
                <div className="w-12 h-1 bg-surface-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full`} style={{backgroundColor: `var(--color-secondary)`, width: `${goal.progress || 0}%`}}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalSelector;