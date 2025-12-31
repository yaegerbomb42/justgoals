import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const QuickActions = ({ onCreateGoal, onOpenDrift, onSmartPrioritize, hasGoals = false }) => {
  const quickActionItems = [
    {
      title: "New Goal",
      description: "Set a new objective",
      icon: "Plus",
      gradient: "from-primary to-secondary",
      bgGlow: "primary",
      action: onCreateGoal
    },
    {
      title: "Daily Tasks",
      description: "Check today's tasks",
      icon: "CheckSquare",
      gradient: "from-accent to-emerald-400",
      bgGlow: "accent",
      link: "/daily-milestones"
    },
    {
      title: "Drift AI",
      description: "Get AI guidance",
      icon: "Sparkles",
      gradient: "from-secondary to-pink-500",
      bgGlow: "secondary",
      action: onOpenDrift
    },
    {
      title: "Focus Mode",
      description: "Deep work session",
      icon: "Zap",
      gradient: "from-warning to-orange-400",
      bgGlow: "warning",
      link: "/focus-mode"
    }
  ];

  if (hasGoals && onSmartPrioritize) {
    quickActionItems.splice(2, 0, {
      title: "Smart Priority",
      description: "AI prioritization",
      icon: "Brain",
      gradient: "from-violet-500 to-purple-500",
      bgGlow: "violet",
      action: onSmartPrioritize
    });
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Quick Actions</h2>
        <span className="text-xs text-text-muted">Press ⌘K for AI commands</span>
      </div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3"
      >
        {quickActionItems.map((actionItem, index) => {
          const ActionComponent = actionItem.link ? Link : 'button';
          const actionProps = actionItem.link 
            ? { to: actionItem.link }
            : { onClick: actionItem.action, type: 'button' };

          return (
            <motion.div key={index} variants={item}>
              <ActionComponent
                {...actionProps}
                className="group relative w-full"
              >
                {/* Hover glow effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${actionItem.gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-all duration-300`} />
                
                <div className="relative glass-card-hover p-4 h-full flex flex-col items-center text-center space-y-3">
                  {/* Icon container */}
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 bg-gradient-to-br ${actionItem.gradient} rounded-xl flex items-center justify-center shadow-lg transform transition-transform`}
                  >
                    <Icon name={actionItem.icon} size={22} color="#FFFFFF" />
                  </motion.div>
                  
                  {/* Text */}
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {actionItem.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {actionItem.description}
                    </p>
                  </div>
                </div>
              </ActionComponent>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default QuickActions;
