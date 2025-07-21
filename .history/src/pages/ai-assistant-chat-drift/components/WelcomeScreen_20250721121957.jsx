import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const WelcomeScreen = ({ onQuickAction }) => {
  const capabilities = [
    {
      icon: 'Target',
      title: 'Create & Manage Goals',
      description: 'Set new goals, track progress, and get personalized recommendations',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: 'CheckSquare',
      title: 'Set Milestones',
      description: 'Break down goals into achievable milestones with deadlines',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: 'BookOpen',
      title: 'Journal & Reflect',
      description: 'Add journal entries, track mood, and reflect on your journey',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: 'Repeat',
      title: 'Build Habits',
      description: 'Create and track habits to build lasting positive behaviors',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: 'BarChart3',
      title: 'Analyze Progress',
      description: 'Get insights on your progress and areas for improvement',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: 'Zap',
      title: 'Focus Sessions',
      description: 'Start focused work sessions and track your productivity',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const quickActions = [
    {
      id: 'create_goal',
      label: 'Create a Goal',
      icon: 'Target',
      description: 'Set a new goal to work towards',
    },
    {
      id: 'check_progress',
      label: 'Check Progress',
      icon: 'BarChart3',
      description: 'See how you\'re doing with your goals',
    },
    {
      id: 'add_milestone',
      label: 'Add Milestone',
      icon: 'CheckSquare',
      description: 'Break down a goal into smaller steps',
    },
    {
      id: 'journal_entry',
      label: 'Journal Entry',
      icon: 'BookOpen',
      description: 'Reflect on your day and progress',
    },
    {
      id: 'focus_session',
      label: 'Start Focus Session',
      icon: 'Zap',
      description: 'Begin a focused work session',
    },
    {
      id: 'habit_tracker',
      label: 'Track Habits',
      icon: 'Repeat',
      description: 'Check in on your daily habits',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Compact Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto">
          <Icon name="MessageCircle" className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-heading-bold text-text-primary mb-1">
            Welcome to Drift AI Assistant
          </h1>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            I'm your personal goal achievement companion. Let's get started!
          </p>
        </div>
      </motion.div>

      {/* Compact Capabilities Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {capabilities.slice(0, 6).map((capability, index) => (
          <motion.div
            key={capability.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="bg-surface-700 rounded-lg p-3 border border-border hover:border-primary/30 transition-all duration-200"
          >
            <div className={`w-8 h-8 bg-gradient-to-br ${capability.color} rounded-lg flex items-center justify-center mb-2`}>
              <Icon name={capability.icon} className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-medium text-text-primary text-sm mb-1">{capability.title}</h3>
            <p className="text-xs text-text-secondary line-clamp-2">{capability.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Compact Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-heading-semibold text-text-primary text-center">
          Quick Start
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickActions.slice(0, 6).map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              onClick={() => onQuickAction(action.id)}
              className="flex items-center space-x-2 p-3 bg-surface-700 rounded-lg border border-border hover:border-primary/50 hover:bg-surface-600 transition-all duration-200 text-left group"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon name={action.icon} className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors text-sm">
                  {action.label}
                </h3>
                <p className="text-xs text-text-secondary truncate">
                  {action.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Compact Example Prompts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-heading-semibold text-text-primary text-center">
          Try asking me...
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            "Create a goal to learn Spanish",
            "Add a workout milestone",
            "Help me plan my day",
            "Analyze my progress"
          ].map((prompt, index) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              onClick={() => onQuickAction('custom', prompt)}
              className="p-2 bg-surface-700 rounded-lg border border-border hover:border-primary/30 hover:bg-surface-600 transition-all duration-200 text-left text-xs text-text-secondary hover:text-text-primary"
            >
              "{prompt}"
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Compact Memory Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg"
      >
        <div className="flex items-center justify-center space-x-2 text-primary mb-1">
          <Icon name="Brain" className="w-3 h-3" />
          <span className="text-xs font-medium">Conversation Memory</span>
        </div>
        <p className="text-xs text-text-secondary">
          I remember our conversations to provide personalized assistance.
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;