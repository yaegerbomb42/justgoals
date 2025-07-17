import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WelcomeScreen = ({ onQuickStart, isConnected }) => {
  const quickStartPrompts = [
    "Help me plan my day",
    "What should I focus on today?",
    "Review my recent progress", 
    "Suggest daily milestones",
    "How to stay motivated?",
    "Analyze my journal entries"
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

      {/* Connection Status */}
      {!isConnected && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-warning">
            <Icon name="AlertTriangle" size={20} />
            <span className="font-medium">API Key Required</span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Please configure your Gemini API key in Settings to start chatting.
          </p>
        </motion.div>
      )}

      {/* Features */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl">
        <div className="bg-surface/50 rounded-lg p-4">
          <Icon name="Target" size={24} className="text-primary mb-2" />
          <h3 className="font-heading-medium text-text-primary text-sm mb-1">Goal Planning</h3>
          <p className="text-xs text-text-secondary">Get personalized strategies for achieving your goals</p>
        </div>
        <div className="bg-surface/50 rounded-lg p-4">
          <Icon name="BookOpen" size={24} className="text-accent mb-2" />
          <h3 className="font-heading-medium text-text-primary text-sm mb-1">Journal Insights</h3>
          <p className="text-xs text-text-secondary">Analyze patterns and emotions in your entries</p>
        </div>
        <div className="bg-surface/50 rounded-lg p-4">
          <Icon name="Clock" size={24} className="text-secondary mb-2" />
          <h3 className="font-heading-medium text-text-primary text-sm mb-1">Time Tracking</h3>
          <p className="text-xs text-text-secondary">Optimize your focus sessions and productivity</p>
        </div>
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