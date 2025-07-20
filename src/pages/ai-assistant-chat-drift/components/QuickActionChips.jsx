import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const QuickActionChips = ({ onAction }) => {
  const actions = [
    {
      id: 'create_goal',
      label: 'Create Goal',
      icon: 'Target',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'check_progress',
      label: 'Check Progress',
      icon: 'BarChart3',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'add_milestone',
      label: 'Add Milestone',
      icon: 'CheckSquare',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'journal_entry',
      label: 'Journal Entry',
      icon: 'BookOpen',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      id: 'focus_session',
      label: 'Focus Session',
      icon: 'Zap',
      color: 'bg-yellow-500 hover:bg-yellow-600',
    },
    {
      id: 'habit_tracker',
      label: 'Track Habits',
      icon: 'Repeat',
      color: 'bg-red-500 hover:bg-red-600',
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