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
    { icon: 'Calendar', label: 'Plan Your Day', desc: 'Get a personalized daily schedule.' },
    { icon: 'Target', label: 'Add Goals', desc: 'Set and track your goals easily.' },
    { icon: 'CheckSquare', label: 'Add Milestones', desc: 'Break goals into actionable steps.' },
    { icon: 'Repeat', label: 'Add Habits', desc: 'Build and maintain positive habits.' },
    { icon: 'BarChart3', label: 'Analyze Progress', desc: 'See your achievements and trends.' },
    { icon: 'MessageSquare', label: 'Chat & Reflect', desc: 'Ask for advice, insights, or motivation.' },
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
      className="flex flex-col items-center justify-center min-h-[60vh] py-8"
    >
      {/* Friendly Avatar and Intro */}
      <div className="mb-4 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-2">
          <Icon name="MessageSquare" className="text-primary-500 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-primary-800 mb-1">Meet Drift</h2>
        <p className="text-base text-gray-600 font-medium">Your AI-powered goal achievement assistant</p>
      </div>
      {/* Feature Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 w-full max-w-xl">
        {features.map(f => (
          <div key={f.label} className="flex flex-col items-center bg-white rounded-lg shadow p-4">
            <Icon name={f.icon} className="text-primary-500 text-2xl mb-2" />
            <div className="font-semibold text-primary-700 mb-1">{f.label}</div>
            <div className="text-xs text-gray-500 text-center">{f.desc}</div>
          </div>
        ))}
      </div>
      {/* Custom Chat Input */}
      <div className="flex flex-col items-center w-full max-w-md mb-4">
        <input
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 mb-2"
          type="text"
          placeholder="Ask Drift anything..."
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onQuickStart(customPrompt)}
          disabled={!isConnected}
        />
        <button
          className="w-full bg-primary-500 text-white font-bold py-2 rounded-lg hover:bg-primary-600 transition"
          onClick={() => onQuickStart(customPrompt)}
          disabled={!isConnected || !customPrompt.trim()}
        >
          Start Chat
        </button>
      </div>
      {/* Quick Start Prompts */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {quickStartPrompts.map((prompt, idx) => (
          <button
            key={idx}
            className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full hover:bg-primary-200 transition text-sm"
            onClick={() => onQuickStart(prompt)}
            disabled={!isConnected}
          >
            {prompt}
          </button>
        ))}
      </div>
      {/* Clear Chat Button */}
      <button
        className="mt-2 text-xs text-red-500 hover:underline"
        onClick={onClearChat}
        disabled={!isConnected}
      >
        Clear Chat History
      </button>
    </motion.div>
  );
};

export default WelcomeScreen;