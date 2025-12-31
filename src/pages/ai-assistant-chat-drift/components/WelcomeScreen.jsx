import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const WelcomeScreen = ({ onQuickAction }) => {
  const quickActions = [
    {
      id: 'create_goal',
      label: 'Set a New Goal',
      icon: 'Target',
      description: 'Define your vision and track success',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-cyan-400'
    },
    {
      id: 'check_progress',
      label: 'Check Progress',
      icon: 'BarChart3',
      description: 'Review your achievements and growth',
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-pink-400'
    },
    {
      id: 'focus_session',
      label: 'Focus Session',
      icon: 'Zap',
      description: 'Start a deep work session',
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400'
    },
    {
      id: 'journal_entry',
      label: 'Daily Reflection',
      icon: 'BookOpen',
      description: 'Log your thoughts and mood',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-gradient-to-tr from-primary-400 to-secondary-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30 rotate-3">
          <Icon name="Bot" className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          Hello, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">Drift</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
          I'm your personal AI companion for goals, habits, and growth. How can I support you today?
        </p>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12"
      >
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            onClick={() => onQuickAction(action.id)}
            className="group relative overflow-hidden glass-card rounded-2xl p-5 text-left hover:bg-surface/60 transition-all duration-300 hover:scale-[1.02] border border-white/5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl bg-surface/50 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 ${action.iconColor}`}>
                <Icon name={action.icon} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
                  {action.label}
                </h3>
                <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  {action.description}
                </p>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                <Icon name="ArrowRight" className="w-5 h-5 text-white/50" />
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Suggested Prompts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-4"
      >
        <p className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Or try asking me...
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Help me plan my week",
            "Analyze my recent progress",
            "Give me motivation",
            "Suggest a healthy meal"
          ].map((prompt, index) => (
            <button
              key={prompt}
              onClick={() => onQuickAction('custom', prompt)}
              className="px-4 py-2 rounded-full bg-surface/30 border border-white/10 hover:bg-white/5 text-sm text-text-secondary hover:text-white transition-all hover:border-white/20"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;