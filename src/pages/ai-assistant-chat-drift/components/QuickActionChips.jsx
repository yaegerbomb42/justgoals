import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const QuickActionChips = ({ onAction }) => {
  const actions = [
    {
      id: 'create_goal',
      label: 'Create Goal',
      icon: 'Target',
      color: 'bg-primary hover:bg-primary-dark',
      textColor: 'text-primary-foreground'
    },
    {
      id: 'daily_plan',
      label: 'Daily Plan',
      icon: 'Calendar',
      color: 'bg-secondary hover:bg-secondary-dark',
      textColor: 'text-secondary-foreground'
    },
    {
      id: 'productivity_tips',
      label: 'Productivity Tips',
      icon: 'Zap',
      color: 'bg-accent hover:bg-accent-dark',
      textColor: 'text-accent-foreground'
    },
    {
      id: 'motivation',
      label: 'Get Motivated',
      icon: 'Heart',
      color: 'bg-success hover:bg-success-dark',
      textColor: 'text-success-foreground'
    }
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={() => onAction(action.id)}
          className={`
            group relative overflow-hidden px-4 py-2 rounded-full
            ${action.color} ${action.textColor}
            font-medium text-sm shadow-lg
            transition-all duration-300 transform hover:scale-105
            border border-border backdrop-blur-sm
          `}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center space-x-2">
            <Icon name={action.icon} className="w-4 h-4" />
            <span>{action.label}</span>
          </div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActionChips;