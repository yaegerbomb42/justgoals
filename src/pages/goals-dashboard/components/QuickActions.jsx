import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';


const QuickActions = ({ onCreateGoal, onOpenDrift }) => {
  const quickActionItems = [
    {
      title: "Create New Goal",
      description: "Set a new long-term objective",
      icon: "Plus",
      color: "var(--color-primary)",
      action: onCreateGoal
    },
    {
      title: "Daily Milestones",
      description: "Check today\'s tasks",
      icon: "CheckSquare",
      color: "var(--color-accent)",
      link: "/daily-milestones"
    },
    {
      title: "Chat with Drift",
      description: "Get AI-powered guidance",
      icon: "MessageCircle",
      color: "var(--color-secondary)",
      action: onOpenDrift
    },
    {
      title: "Focus Session",
      description: "Start a focused work session",
      icon: "Focus",
      color: "var(--color-warning)",
      link: "/focus-mode"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-heading-medium text-text-primary mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActionItems.map((item, index) => {
          const ActionComponent = item.link ? Link : 'button';
          const actionProps = item.link 
            ? { to: item.link }
            : { onClick: item.action, type: 'button' };

          return (
            <ActionComponent
              key={index}
              {...actionProps}
              className="group bg-surface rounded-lg p-4 border border-border hover:border-primary/30 transition-all duration-normal hover:shadow-elevation contextual-morph"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-normal group-hover:scale-110"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Icon 
                    name={item.icon} 
                    size={24} 
                    color={item.color}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-body-medium text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-text-secondary font-caption">
                    {item.description}
                  </p>
                </div>
              </div>
            </ActionComponent>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;