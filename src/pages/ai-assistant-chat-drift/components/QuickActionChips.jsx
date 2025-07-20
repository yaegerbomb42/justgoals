import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const QuickActionChips = ({ onAction }) => {
  const actions = [
    {
      id: 'create_goal',
      label: 'Create Goal',
      icon: 'Target',
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'daily_plan',
      label: 'Daily Plan',
      icon: 'Calendar',
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'from-purple-600 to-pink-600'
    },
    {
      id: 'productivity_tips',
      label: 'Productivity Tips',
      icon: 'Zap',
      color: 'from-yellow-500 to-orange-500',
      hoverColor: 'from-yellow-600 to-orange-600'
    },
    {
      id: 'motivation',
      label: 'Get Motivated',
      icon: 'Heart',
      color: 'from-red-500 to-pink-500',
      hoverColor: 'from-red-600 to-pink-600'
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
            bg-gradient-to-r ${action.color} hover:${action.hoverColor}
            text-white font-medium text-sm shadow-lg
            transition-all duration-300 transform hover:scale-105
            border border-white/20 backdrop-blur-sm
          `}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
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