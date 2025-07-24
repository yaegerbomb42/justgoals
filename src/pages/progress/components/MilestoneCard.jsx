import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MilestoneCard = ({ 
  milestone, 
  onToggleComplete, 
  onStartFocus, 
  onEdit, 
  onDelete,
  isDragging = false 
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    await onToggleComplete(milestone.id);
    
    // Add celebration animation for completion
    if (!milestone.completed) {
      setTimeout(() => setIsCompleting(false), 800);
    } else {
      setIsCompleting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-accent';
      default: return 'text-text-secondary';
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'high': return 'bg-error/10 border-error/20';
      case 'medium': return 'bg-warning/10 border-warning/20';
      case 'low': return 'bg-accent/10 border-accent/20';
      default: return 'bg-surface-700 border-border';
    }
  };

  return (
    <div className={`
      bg-surface rounded-lg border border-border p-4 transition-all duration-normal
      ${milestone.completed ? 'opacity-75' : 'hover:shadow-elevation'}
      ${isDragging ? 'shadow-elevation-2 rotate-2' : ''}
      ${isCompleting ? 'micro-celebration' : ''}
    `}>
      <div className="flex items-start space-x-3">
        {/* Completion Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`
            flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-normal
            ${milestone.completed 
              ? 'bg-accent border-accent text-accent-foreground' 
              : 'border-border hover:border-accent'
            }
          `}
        >
          {milestone.completed && (
            <Icon name="Check" size={14} color="#FFFFFF" />
          )}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className={`
                font-body-medium text-sm transition-all duration-normal
                ${milestone.completed 
                  ? 'text-text-secondary line-through' :'text-text-primary'
                }
              `}>
                {milestone.title}
              </h3>
              
              {milestone.description && (
                <p className={`
                  text-xs mt-1 transition-all duration-normal
                  ${milestone.completed 
                    ? 'text-text-muted line-through' :'text-text-secondary'
                  }
                `}>
                  {milestone.description}
                </p>
              )}
            </div>

            {/* Priority Indicator */}
            <div className={`
              px-2 py-1 rounded text-xs font-caption border
              ${getPriorityBg(milestone.priority)}
            `}>
              <span className={getPriorityColor(milestone.priority)}>
                {milestone.priority?.toUpperCase() || 'NORMAL'}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-text-secondary">
              {/* Goal Association */}
              <div className="flex items-center space-x-1">
                <Icon name="Target" size={12} />
                <span className="font-caption">{milestone.goalName}</span>
              </div>

              {/* Estimated Time */}
              {milestone.estimatedTime && (
                <div className="flex items-center space-x-1">
                  <Icon name="Clock" size={12} />
                  <span className="font-caption">{milestone.estimatedTime}m</span>
                </div>
              )}

              {/* Due Time */}
              {milestone.dueTime && (
                <div className="flex items-center space-x-1">
                  <Icon name="Calendar" size={12} />
                  <span className="font-caption">{milestone.dueTime}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              {!milestone.completed && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onStartFocus(milestone)}
                  iconName="Focus"
                  className="text-text-secondary hover:text-primary"
                >
                  Focus
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onEdit(milestone)}
                iconName="Edit2"
                className="text-text-secondary hover:text-text-primary"
              />
              
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onDelete(milestone.id)}
                iconName="Trash2"
                className="text-text-secondary hover:text-error"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;