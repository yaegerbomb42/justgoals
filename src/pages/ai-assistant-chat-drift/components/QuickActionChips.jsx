import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const QuickActionChips = ({ onAction }) => {
  const actions = [
    {
      id: 'create_goal',
      label: 'Create Goal',
      icon: 'Target',
      color: 'bg-primary hover:bg-primary/90',
    },
    {
      id: 'check_progress',
      label: 'Check Progress',
      icon: 'BarChart3',
      color: 'bg-success hover:bg-success/90',
    },
    {
      id: 'add_milestone',
      label: 'Add Milestone',
      icon: 'CheckSquare',
      color: 'bg-secondary hover:bg-secondary/90',
    },
    {
      id: 'journal_entry',
      label: 'Journal Entry',
      icon: 'BookOpen',
      color: 'bg-warning hover:bg-warning/90',
    },
    {
      id: 'focus_session',
      label: 'Focus Session',
      icon: 'Zap',
      color: 'bg-accent hover:bg-accent/90',
    },
    {
      id: 'habit_tracker',
      label: 'Track Habits',
      icon: 'Repeat',
      color: 'bg-error hover:bg-error/90',
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onAction(action.id)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-full text-white text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${action.color}`}
        >
          <Icon name={action.icon} className="w-4 h-4" />
          <span>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActionChips;