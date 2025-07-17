import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyState = ({ onCreateGoal, filterType = 'all' }) => {
  const getEmptyStateContent = () => {
    switch (filterType) {
      case 'completed':
        return {
          icon: 'CheckCircle',
          title: 'No Completed Goals Yet',
          description: 'Complete your first goal to see it here. Every journey starts with a single step!',
          actionText: 'View Active Goals',
          showCreateButton: false
        };
      case 'overdue':
        return {
          icon: 'AlertTriangle',
          title: 'No Overdue Goals',
          description: 'Great job staying on track! All your goals are progressing well.',
          actionText: 'View All Goals',
          showCreateButton: false
        };
      case 'high-priority':
        return {
          icon: 'Flame',
          title: 'No High Priority Goals',
          description: 'You don\'t have any high priority goals set. Consider marking important goals as high priority.',
          actionText: 'Create Priority Goal',
          showCreateButton: true
        };
      default:
        return {
          icon: 'Target',
          title: 'Ready to Achieve Something Amazing?',
          description: 'Start your journey by creating your first goal. Break down big dreams into achievable milestones.',
          actionText: 'Create Your First Goal',
          showCreateButton: true
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="text-center py-16 px-6">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-surface-700 rounded-full flex items-center justify-center">
          <Icon 
            name={content.icon} 
            size={32} 
            color="var(--color-text-secondary)" 
          />
        </div>

        {/* Content */}
        <h3 className="text-xl font-heading-medium text-text-primary mb-3">
          {content.title}
        </h3>
        <p className="text-text-secondary font-body mb-8 leading-relaxed">
          {content.description}
        </p>

        {/* Action Button */}
        {content.showCreateButton ? (
          <Button
            variant="primary"
            size="lg"
            onClick={onCreateGoal}
            iconName="Plus"
            iconPosition="left"
          >
            {content.actionText}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            iconName="ArrowLeft"
            iconPosition="left"
          >
            {content.actionText}
          </Button>
        )}

        {/* Additional Tips */}
        <div className="mt-12 p-4 bg-surface-800 rounded-lg text-left">
          <h4 className="text-sm font-body-medium text-text-primary mb-2 flex items-center">
            <Icon name="Lightbulb" size={16} className="mr-2" />
            Pro Tips
          </h4>
          <ul className="text-xs text-text-secondary space-y-1 font-caption">
            <li>• Set specific, measurable goals with clear deadlines</li>
            <li>• Break large goals into smaller daily milestones</li>
            <li>• Use focus sessions to maintain momentum</li>
            <li>• Chat with Drift for personalized goal strategies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;