import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const WelcomeScreen = ({ onQuickAction }) => {
  const capabilities = [
    { icon: 'Target', title: 'Goals', description: 'Create & track goals', gradient: 'from-primary to-secondary' },
    { icon: 'CheckSquare', title: 'Milestones', description: 'Break down tasks', gradient: 'from-accent to-emerald-400' },
    { icon: 'BookOpen', title: 'Journal', description: 'Daily reflection', gradient: 'from-violet-500 to-purple-500' },
    { icon: 'Repeat', title: 'Habits', description: 'Build consistency', gradient: 'from-warning to-orange-400' },
    { icon: 'BarChart3', title: 'Analytics', description: 'Track progress', gradient: 'from-blue-500 to-cyan-400' },
    { icon: 'Zap', title: 'Focus', description: 'Deep work sessions', gradient: 'from-rose-500 to-pink-500' },
  ];

  const quickActions = [
    { id: 'create_goal', label: 'Create a Goal', icon: 'Target' },
    { id: 'check_progress', label: 'Check Progress', icon: 'BarChart3' },
    { id: 'add_milestone', label: 'Add Milestone', icon: 'CheckSquare' },
    { id: 'journal_entry', label: 'Write Journal', icon: 'BookOpen' },
    { id: 'focus_session', label: 'Focus Session', icon: 'Zap' },
    { id: 'habit_tracker', label: 'Track Habits', icon: 'Repeat' },
  ];

  const prompts = [
    "Help me create a fitness goal",
    "Analyze my weekly progress",
    "Suggest habits for productivity",
    "Plan my day efficiently"
  ];

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="relative w-20 h-20 mx-auto mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-lg opacity-50 animate-pulse-slow" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-2xl">
            <Icon name="Sparkles" className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Hey! I'm <span className="gradient-text">Drift</span>
        </h1>
        <p className="text-text-secondary max-w-md mx-auto">
          Your AI companion for achieving goals. Ask me anything or try these actions below.
        </p>
      </motion.div>

      {/* Capabilities Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-sm font-semibold text-text-muted text-center mb-4 uppercase tracking-wider">What I can do</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {capabilities.map((cap, index) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="group text-center"
            >
              <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${cap.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-2`}>
                <Icon name={cap.icon} className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xs font-medium text-text-primary">{cap.title}</h3>
              <p className="text-[10px] text-text-muted">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-sm font-semibold text-text-muted text-center mb-4 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuickAction(action.id)}
              className="glass-card-hover p-3 flex items-center space-x-3 text-left"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                <Icon name={action.icon} className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-text-primary">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Example Prompts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-sm font-semibold text-text-muted text-center mb-4 uppercase tracking-wider">Try asking...</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {prompts.map((prompt, index) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.05 }}
              onClick={() => onQuickAction('custom', prompt)}
              className="px-4 py-2 bg-surface-700/50 hover:bg-surface-700 border border-border/30 hover:border-primary/30 rounded-full text-sm text-text-secondary hover:text-text-primary transition-all"
            >
              "{prompt}"
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Memory Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex justify-center"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
          <Icon name="Brain" className="w-4 h-4 text-primary" />
          <span className="text-xs text-primary font-medium">I remember our conversations</span>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
