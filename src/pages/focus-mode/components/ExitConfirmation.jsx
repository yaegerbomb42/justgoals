import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExitConfirmation = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  sessionData 
}) => {
  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-600 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center space-x-3 p-6 border-b border-border">
          <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
            <Icon name="AlertTriangle" size={20} color="var(--color-warning)" />
          </div>
          <div>
            <h2 className="text-text-primary font-heading-medium">End Focus Session?</h2>
            <p className="text-text-secondary text-sm">Your progress will be saved</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-surface-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Session Duration</span>
              <span className="text-text-primary font-data">
                {formatDuration(sessionData.elapsed || 0)}
              </span>
            </div>
            
            {sessionData.goal && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">Working On</span>
                <span className="text-text-primary text-sm">
                  {sessionData.goal.title}
                </span>
              </div>
            )}
            
            {sessionData.notesCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">Notes Captured</span>
                <span className="text-text-primary text-sm">
                  {sessionData.notesCount} notes
                </span>
              </div>
            )}
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Icon name="Info" size={16} color="var(--color-accent)" className="mt-0.5" />
              <div>
                <p className="text-accent text-sm font-body-medium">Session will be saved</p>
                <p className="text-accent/80 text-xs">
                  Your focus time and notes will be recorded for this goal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Continue Session
          </Button>
          <Button
            variant="warning"
            onClick={onConfirm}
            iconName="LogOut"
            iconPosition="left"
          >
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmation;