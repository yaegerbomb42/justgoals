import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WelcomeScreen = ({ onQuickStart, isConnected }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const quickStartPrompts = [
    "Help me plan my day",
    "What should I focus on today?",
    "Review my recent progress", 
    "Suggest daily milestones",
    "How to stay motivated?",
    "Analyze my journal entries"
  ];

  const features = [
    { icon: 'Target', title: 'Goal Planning', desc: 'Get personalized strategies for achieving your goals' },
    { icon: 'BookOpen', title: 'Journal Insights', desc: 'Analyze patterns and emotions in your entries' },
    { icon: 'Clock', title: 'Time Tracking', desc: 'Optimize your focus sessions and productivity' },
    { icon: 'Zap', title: 'Productivity Tips', desc: 'Receive actionable advice to boost your output' },
    { icon: 'CheckCircle', title: 'Habit Suggestions', desc: 'Build and maintain positive habits' },
    { icon: 'Smile', title: 'Motivation', desc: 'Get encouragement and reminders to stay on track' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      {/* Custom Chat Input */}
      {isConnected && (
        <motion.div variants={itemVariants} className="w-full max-w-xl mb-8">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (customPrompt.trim()) {
                onQuickStart(customPrompt.trim());
                setCustomPrompt('');
              }
            }}
            className="flex flex-col sm:flex-row items-center gap-2"
          >
            <input
              type="text"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Type your question or request for Drift..."
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-surface-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              type="submit"
              variant="primary"
              iconName="Send"
              disabled={!customPrompt.trim()}
              className="h-12 px-6"
            >
              Ask Drift
            </Button>
          </form>
          <div className="text-xs text-text-secondary mt-2">Start a custom chat with Drift by typing anything above!</div>
        </motion.div>
      )}

      {/* Drift Logo */}
      <motion.div
        variants={itemVariants}
        className="relative mb-6"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4">
          <Icon name="Bot" size={32} color="#FFFFFF" />
        </div>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full"
        />
      </motion.div>

      {/* Welcome Message */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-heading-bold text-text-primary mb-2">
          Meet Goals Assistant
        </h1>
        <p className="text-text-secondary max-w-md leading-relaxed">
          Your AI-powered goal achievement assistant. I have access to your journal entries, 
          time tracking data, and goals to provide personalized guidance.
        </p>
      </motion.div>

      {/* Features List */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl">
        {features.map((f, i) => (
          <div key={f.title} className="bg-surface/50 rounded-lg p-4 flex flex-col items-center">
            <Icon name={f.icon} size={24} className="mb-2 text-primary" />
            <h3 className="font-heading-medium text-text-primary text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-text-secondary">{f.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick Start Options */}
      {isConnected && (
        <motion.div variants={itemVariants} className="w-full max-w-2xl">
          <h3 className="font-heading-medium text-text-primary mb-4">Quick Start</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickStartPrompts.map((prompt, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => onQuickStart(prompt)}
                  className="w-full justify-start text-left h-auto py-3 px-4"
                >
                  <Icon name="MessageSquare" size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{prompt}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Call to Action */}
      <motion.div variants={itemVariants} className="mt-8">
        <p className="text-xs text-text-secondary">
          {isConnected 
            ? "Click a suggestion above or type your own message to get started" :"Configure your API key in Settings to unlock all features"
          }
        </p>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;