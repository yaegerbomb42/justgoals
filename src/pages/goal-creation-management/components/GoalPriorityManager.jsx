import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const GoalPriorityManager = ({ goals, onGoalsReorder, onPriorityChange, onDeleteGoal }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const priorityLevels = [
    { id: 'high', name: 'High Priority', color: '#EF4444', icon: 'AlertTriangle' },
    { id: 'medium', name: 'Medium Priority', color: '#F59E0B', icon: 'Clock' },
    { id: 'low', name: 'Low Priority', color: '#64748B', icon: 'Minus' }
  ];

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const newGoals = [...goals];
      const draggedGoal = newGoals[draggedItem];
      newGoals.splice(draggedItem, 1);
      newGoals.splice(dragOverItem, 0, draggedGoal);
      onGoalsReorder(newGoals);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handlePriorityUpdate = (goalId, newPriority) => {
    onPriorityChange(goalId, newPriority);
  };

  // Support both legacy (high/medium/low) and AI (1-10) priorities
  const getPriorityConfig = (priority, priorityScore) => {
    if (typeof priorityScore === 'number') {
      if (priorityScore >= 9) return priorityLevels[0];
      if (priorityScore >= 7) return priorityLevels[1];
      return priorityLevels[2];
    }
    return priorityLevels.find(level => level.id === priority) || priorityLevels[1];
  };

  if (!goals || goals.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border p-8 text-center">
        <Icon name="Target" size={48} color="#64748B" className="mx-auto mb-4" />
        <h3 className="text-lg font-heading-medium text-text-primary mb-2">
          No Goals Yet
        </h3>
        <p className="text-text-secondary mb-4">
          Create your first goal to start managing priorities
        </p>
        <Button variant="primary" iconName="Plus">
          Create Goal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading-medium text-text-primary">
          Goal Priorities
        </h3>
        <div className="text-sm text-text-secondary">
          Drag to reorder • Click priority to change
        </div>
      </div>

      <div className="space-y-3">
        {goals.map((goal, index) => {
          // Support both legacy and AI priorities
          const priorityScore = typeof goal.priorityScore === 'number' ? goal.priorityScore : null;
          const priorityConfig = getPriorityConfig(goal.priority, priorityScore);
          // Fill bar based on priorityScore (1-10), fallback to progress if not present
          const barPercent = priorityScore ? Math.round((priorityScore / 10) * 100) : (goal.progress || 0);
          return (
            <div
              key={goal.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-surface rounded-lg border-2 p-4 cursor-move transition-all duration-normal ${
                draggedItem === index
                  ? 'border-primary shadow-elevation opacity-50'
                  : dragOverItem === index
                  ? 'border-primary/50 shadow-md'
                  : 'border-border hover:border-border-strong'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Drag Handle */}
                <div className="text-text-secondary hover:text-text-primary transition-colors duration-fast">
                  <Icon name="GripVertical" size={20} />
                </div>

                {/* Priority Indicator */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: priorityConfig.color }}
                  />
                  <span className="text-sm font-caption text-text-secondary">
                    #{index + 1}
                  </span>
                </div>

                {/* Goal Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-body-medium text-text-primary truncate">
                    {goal.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-text-secondary">
                      {goal.category}
                    </span>
                    {goal.deadline && (
                      <span className="text-sm text-text-secondary">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority Selector */}
                <div className="relative">
                  <select
                    value={goal.priority}
                    onChange={(e) => handlePriorityUpdate(goal.id, e.target.value)}
                    className="appearance-none bg-surface-700 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                    style={{ paddingRight: '2rem' }}
                  >
                    {priorityLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Icon name="ChevronDown" size={16} color="#94A3B8" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors duration-fast">
                    <Icon name="Edit" size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 transition-colors duration-fast"
                    aria-label={`Delete goal ${goal.title}`}
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>

              {/* Priority Score Bar with Tooltip */}
              <div className="mt-3 flex items-center space-x-3">
                <div className="flex-1 bg-surface-600 rounded-full h-2 relative group" style={{ minHeight: '2rem' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-normal"
                    style={{
                      width: `${barPercent}%`,
                      backgroundColor: priorityConfig.color
                    }}
                  />
                  {goal.aiReasoning && (
                    <div className="absolute left-0 top-full mt-2 z-10 hidden group-hover:block w-max max-w-xs bg-surface-900 text-xs text-text-secondary rounded shadow-lg p-2 border border-border"
                      style={{ fontSize: '0.75rem', lineHeight: '1.2', whiteSpace: 'normal' }}
                    >
                      <span>Why: {goal.aiReasoning}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-data text-text-secondary min-w-[3rem]">
                  {priorityScore ? `${priorityScore}/10` : `${goal.progress || 0}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority Legend */}
      <div className="bg-surface-800 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-heading-medium text-text-primary mb-3">
          Priority Levels
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {priorityLevels.map((level) => (
            <div key={level.id} className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: level.color }}
              >
                <Icon name={level.icon} size={10} color="#FFFFFF" />
              </div>
              <div>
                <div className="text-sm font-body-medium text-text-primary">
                  {level.name}
                </div>
                <div className="text-xs text-text-secondary">
                  {level.id === 'high' && 'Urgent & Important'}
                  {level.id === 'medium' && 'Important, not urgent'}
                  {level.id === 'low' && 'Nice to have'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalPriorityManager;