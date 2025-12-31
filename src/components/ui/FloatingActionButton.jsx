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
      label: 'Drift AI',
      icon: 'Sparkles',
      gradient: 'from-secondary to-pink-500',
      action: () => navigate('/ai-assistant-chat-drift'),
      show: location.pathname !== '/ai-assistant-chat-drift'
    },
    {
      label: 'Focus Mode',
      icon: 'Zap',
      gradient: 'from-warning to-orange-500',
      action: () => navigate('/focus-mode'),
      show: location.pathname !== '/focus-mode'
    },
    {
      label: 'New Goal',
      icon: 'Target',
      gradient: 'from-primary to-secondary',
      action: () => navigate('/goal-creation-management'),
      show: !location.pathname.includes('/goal-creation')
    },
    {
      label: 'Journal',
      icon: 'BookOpen',
      gradient: 'from-accent to-emerald-400',
      action: () => navigate('/journal'),
      show: location.pathname !== '/journal'
    },
    {
      label: 'Add Todo',
      icon: 'ListTodo',
      gradient: 'from-blue-500 to-cyan-500',
      action: () => navigate('/temp-todos'),
      show: location.pathname !== '/temp-todos'
    }
  ];

  const availableActions = actionItems.filter(item => item.show).slice(0, 4);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/40 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-16 right-0 space-y-3"
            >
              {availableActions.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    item.action();
                    setIsExpanded(false);
                  }}
                  className="group flex items-center space-x-3"
                >
                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className="px-3 py-1.5 bg-surface/90 backdrop-blur-sm text-text-primary text-sm font-medium rounded-lg shadow-lg border border-border/30 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                  
                  {/* Icon button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow`}
                  >
                    <Icon name={item.icon} size={20} color="#FFFFFF" />
                  </motion.div>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl overflow-hidden group"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent" />
        
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        {/* Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          <Icon name="Plus" size={24} color="#FFFFFF" />
        </motion.div>

        {/* Pulse ring */}
        {!isExpanded && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-xl bg-primary/30"
          />
        )}
      </motion.button>

      {/* Context Tooltip */}
      {goalContext && !isExpanded && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-surface/95 backdrop-blur-sm text-text-primary px-3 py-2 rounded-xl shadow-xl border border-border/30 whitespace-nowrap text-sm"
        >
          {goalContext}
          <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
            <div className="w-0 h-0 border-l-8 border-l-surface/95 border-y-4 border-y-transparent"></div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FloatingActionButton;
