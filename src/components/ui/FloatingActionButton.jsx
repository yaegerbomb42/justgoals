import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';

const FloatingActionButton = ({ goalContext }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const actionItems = [
    {
      label: 'Focus Mode',
      icon: 'Focus',
      color: 'bg-primary',
      action: () => navigate('/focus-mode'),
      show: location.pathname !== '/focus-mode'
    },
    {
      label: 'Journal Entry',
      icon: 'BookOpen',
      color: 'bg-accent',
      action: () => navigate('/journal'),
      show: location.pathname !== '/journal'
    },
    {
      label: 'Drift AI',
      icon: 'Bot',
      color: 'bg-secondary',
      action: () => navigate('/ai-assistant-chat-drift'),
      show: location.pathname !== '/ai-assistant-chat-drift'
    },
    {
      label: 'Add Milestone',
      icon: 'Plus',
      color: 'bg-success',
      action: () => navigate('/daily-milestones'),
      show: location.pathname !== '/daily-milestones'
    }
  ];

  const availableActions = actionItems.filter(item => item.show);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-4 space-y-3"
          >
            {availableActions.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  item.action();
                  setIsExpanded(false);
                }}
                className={`flex items-center space-x-3 ${item.color} hover:shadow-lg text-white px-4 py-3 rounded-full transition-all duration-200 group`}
              >
                <Icon name={item.icon} size={20} />
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icon name="Plus" size={24} color="#FFFFFF" />
        </motion.div>
      </motion.button>

      {/* Context Tooltip */}
      {goalContext && !isExpanded && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-surface text-text-primary px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap text-sm"
        >
          {goalContext}
          <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
            <div className="w-0 h-0 border-l-4 border-l-surface border-y-4 border-y-transparent"></div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FloatingActionButton;