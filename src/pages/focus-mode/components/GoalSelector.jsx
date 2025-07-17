import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const GoalSelector = ({ selectedGoal, onGoalChange, goals }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectGoal = (goal) => {
    onGoalChange(goal);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <button
        onClick={toggleDropdown}
        className="w-full bg-surface border border-border rounded-lg px-4 py-3 flex items-center justify-between text-left hover:bg-surface-700 transition-colors duration-normal"
      >
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div>
            <p className="text-text-primary font-body-medium">
              {selectedGoal ? selectedGoal.title : "Select a goal"}
            </p>
            {selectedGoal && (
              <p className="text-text-secondary text-sm">
                {selectedGoal.category}
              </p>
            )}
          </div>
        </div>
        <Icon 
          name={isOpen ? "ChevronUp" : "ChevronDown"} 
          size={20} 
          color="var(--color-text-secondary)" 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-elevation z-300 max-h-64 overflow-y-auto">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => selectGoal(goal)}
              className="w-full px-4 py-3 text-left hover:bg-surface-700 transition-colors duration-normal border-b border-border last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: goal.color }}
                ></div>
                <div>
                  <p className="text-text-primary font-body-medium">{goal.title}</p>
                  <p className="text-text-secondary text-sm">{goal.category}</p>
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