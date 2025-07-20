import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ isConnected, onQuickStart }) => {
  const [customMessage, setCustomMessage] = useState('');

  const quickStartPrompts = [
    {
      id: 'plan_day',
      title: 'Plan My Day',
      description: 'Help me organize today\'s tasks and priorities',
      icon: 'Calendar',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'create_goal',
      title: 'Create a Goal',
      description: 'Help me set up a new goal with milestones',
      icon: 'Target',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'productivity_tips',
      title: 'Productivity Tips',
      description: 'Share some productivity techniques',
      icon: 'Zap',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'motivation',
      title: 'Get Motivated',
      description: 'Give me some motivation and encouragement',
      icon: 'Heart',
      color: 'from-red-500 to-pink-500'
    }
  ];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customMessage.trim()) {
      onQuickStart(customMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        {/* AI Avatar */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <Icon name="Bot" className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-slate-900">
            <Icon name="Check" className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Drift</span>
        </h1>
        <p className="text-xl text-purple-200 max-w-2xl leading-relaxed">
          Your AI assistant for goals, productivity, and personal growth. 
          I'm here to help you plan, motivate, and achieve your dreams.
        </p>
      </motion.div>

      {/* Custom Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl mb-12"
      >
        <form onSubmit={handleCustomSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ask me anything... (e.g., 'Help me plan my week')"
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!customMessage.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="Send" className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* Quick Start Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-4xl"
      >
        <h2 className="text-2xl font-semibold text-white mb-6">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickStartPrompts.map((prompt, index) => (
            <motion.button
              key={prompt.id}
              onClick={() => onQuickStart(prompt.description)}
              className={`
                group relative overflow-hidden p-6 rounded-2xl
                bg-gradient-to-r ${prompt.color} hover:scale-105
                text-white text-left transition-all duration-300
                border border-white/20 backdrop-blur-sm
                shadow-lg hover:shadow-2xl
              `}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name={prompt.icon} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{prompt.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{prompt.description}</p>
                </div>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-16 text-center"
      >
        <div className="flex flex-wrap justify-center gap-8 text-purple-200">
          <div className="flex items-center space-x-2">
            <Icon name="Zap" className="w-5 h-5 text-yellow-400" />
            <span className="text-sm">AI-Powered</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Shield" className="w-5 h-5 text-green-400" />
            <span className="text-sm">Secure & Private</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Sync" className="w-5 h-5 text-blue-400" />
            <span className="text-sm">Always Synced</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;