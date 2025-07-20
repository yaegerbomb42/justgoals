import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './AppIcon';

// Popular emoji categories for habits
const emojiCategories = {
  health: {
    name: 'Health & Fitness',
    emojis: ['🦷', '🚿', '💪', '🏃‍♂️', '🏃‍♀️', '🧘‍♂️', '🧘‍♀️', '💊', '🩺', '⚖️', '🫀', '🧠', '👀', '🦴']
  },
  food: {
    name: 'Food & Nutrition',
    emojis: ['🥞', '🥗', '🍽️', '🍎', '🥕', '🥦', '🥤', '☕', '🫖', '🍳', '🥣', '🍞', '🧄', '🫐']
  },
  activities: {
    name: 'Activities & Sports',
    emojis: ['🏐', '🏀', '⚽', '🎾', '🏊‍♂️', '🏊‍♀️', '🚴‍♂️', '🚴‍♀️', '🏋️‍♂️', '🏋️‍♀️', '🥾', '🎯', '🎸', '📚']
  },
  home: {
    name: 'Home & Chores',
    emojis: ['👕', '🧺', '🧽', '🧹', '🗑️', '🛏️', '🪟', '🌱', '🚗', '🔧', '🛠️', '🧴', '🧻', '🪣']
  },
  productivity: {
    name: 'Work & Productivity',
    emojis: ['💻', '📝', '📊', '📞', '📧', '📅', '⏰', '🎯', '💡', '📖', '✏️', '📋', '🗂️', '📌']
  },
  wellness: {
    name: 'Mental Wellness',
    emojis: ['🧘‍♂️', '🧘‍♀️', '📿', '🕯️', '🌅', '🌙', '⭐', '🎨', '🎵', '🌸', '🦋', '🌈', '☮️', '💝']
  },
  learning: {
    name: 'Learning & Growth',
    emojis: ['📚', '🎓', '🔬', '🎨', '🎭', '🎪', '🎤', '🎯', '🧩', '🗺️', '🧭', '🔍', '💭', '✨']
  },
  nature: {
    name: 'Nature & Environment',
    emojis: ['🌱', '🌿', '🌳', '🌍', '♻️', '🌞', '⛅', '🌧️', '❄️', '🌊', '🏔️', '🦎', '🐝', '🦋']
  }
};

// Frequently used emojis for habits
const popularEmojis = ['🦷', '🚿', '🥞', '🥗', '🍽️', '👕', '🏐', '💪', '📚', '💻', '🧘‍♂️', '☕', '🌱', '⏰', '🎯', '📝'];

const EmojiPicker = ({ onEmojiSelect, onClose, selectedEmoji = '😊' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('popular');

  // Filter emojis based on search term
  const filterEmojis = (emojis) => {
    if (!searchTerm) return emojis;
    // Simple search - could be enhanced with emoji names/descriptions
    return emojis.filter(emoji => emoji.includes(searchTerm));
  };

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface-700 rounded-2xl p-6 m-4 w-full max-w-md max-h-[80vh] overflow-hidden border border-border shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-heading-bold text-text-primary">Choose an Emoji</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-600 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Icon name="Search" size={18} className="absolute left-3 top-3 text-text-secondary" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-600 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 max-h-16 overflow-y-auto">
          <button
            onClick={() => setActiveCategory('popular')}
            className={`px-3 py-1 rounded-full text-sm font-body-medium transition-colors ${
              activeCategory === 'popular'
                ? 'bg-primary text-white'
                : 'bg-surface-600 text-text-secondary hover:bg-surface-500'
            }`}
          >
            Popular
          </button>
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1 rounded-full text-sm font-body-medium transition-colors ${
                activeCategory === key
                  ? 'bg-primary text-white'
                  : 'bg-surface-600 text-text-secondary hover:bg-surface-500'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="max-h-64 overflow-y-auto">
          <div className="grid grid-cols-8 gap-2">
            {activeCategory === 'popular' 
              ? filterEmojis(popularEmojis).map((emoji, index) => (
                  <motion.button
                    key={`popular-${emoji}-${index}`}
                    onClick={() => handleEmojiClick(emoji)}
                    className={`p-2 text-2xl hover:bg-surface-600 rounded-lg transition-all ${
                      selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {emoji}
                  </motion.button>
                ))
              : emojiCategories[activeCategory] && filterEmojis(emojiCategories[activeCategory].emojis).map((emoji, index) => (
                  <motion.button
                    key={`${activeCategory}-${emoji}-${index}`}
                    onClick={() => handleEmojiClick(emoji)}
                    className={`p-2 text-2xl hover:bg-surface-600 rounded-lg transition-all ${
                      selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {emoji}
                  </motion.button>
                ))
            }
          </div>

          {/* No results message */}
          {searchTerm && (
            activeCategory === 'popular' 
              ? filterEmojis(popularEmojis).length === 0
              : !emojiCategories[activeCategory] || filterEmojis(emojiCategories[activeCategory].emojis).length === 0
          ) && (
            <div className="text-center py-8 text-text-secondary">
              <Icon name="Search" size={32} className="mx-auto mb-2 opacity-50" />
              <p>No emojis found for "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Current Selection */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-text-secondary text-sm">Selected:</span>
              <span className="text-3xl">{selectedEmoji}</span>
            </div>
            <button
              onClick={() => handleEmojiClick(selectedEmoji)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-body-medium"
            >
              Use This Emoji
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmojiPicker;