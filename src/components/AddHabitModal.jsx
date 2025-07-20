import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './AppIcon';
import Button from './ui/Button';
import EmojiPicker from './EmojiPicker';

const AddHabitModal = ({ isOpen, onClose, onAdd }) => {
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [targetChecks, setTargetChecks] = useState(1);
  const [allowMultipleChecks, setAllowMultipleChecks] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'general', name: 'General', icon: '🎯' },
    { id: 'health', name: 'Health & Wellness', icon: '💪' },
    { id: 'productivity', name: 'Productivity', icon: '⚡' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'home', name: 'Home & Life', icon: '🏠' }
  ];

  // Habit suggestions with multiple check-ins
  const habitSuggestions = [
    { title: 'Drink water', description: 'Stay hydrated throughout the day', emoji: '💧', targetChecks: 8, allowMultiple: true, category: 'health' },
    { title: 'Take breaks', description: 'Step away from screen every hour', emoji: '☕', targetChecks: 8, allowMultiple: true, category: 'health' },
    { title: 'Practice gratitude', description: 'Write down things you\'re thankful for', emoji: '🙏', targetChecks: 3, allowMultiple: true, category: 'general' },
    { title: 'Read', description: 'Read for personal development', emoji: '📖', targetChecks: 1, allowMultiple: false, category: 'learning' },
    { title: 'Exercise', description: 'Get your body moving', emoji: '🏃‍♂️', targetChecks: 1, allowMultiple: false, category: 'health' },
    { title: 'Meditate', description: 'Practice mindfulness and meditation', emoji: '🧘‍♂️', targetChecks: 1, allowMultiple: false, category: 'health' },
    { title: 'Journal', description: 'Write about your day', emoji: '📔', targetChecks: 1, allowMultiple: false, category: 'creative' },
    { title: 'Call family', description: 'Stay connected with loved ones', emoji: '📞', targetChecks: 1, allowMultiple: false, category: 'social' },
    { title: 'Learn something new', description: 'Spend time learning a new skill', emoji: '🎓', targetChecks: 1, allowMultiple: false, category: 'learning' },
    { title: 'Clean workspace', description: 'Keep your environment organized', emoji: '🧹', targetChecks: 1, allowMultiple: false, category: 'productivity' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const habitData = {
        title: habitTitle.trim(),
        description: habitDescription.trim(),
        emoji: selectedEmoji,
        targetChecks: parseInt(targetChecks),
        allowMultipleChecks: allowMultipleChecks,
        category: selectedCategory
      };

      await onAdd(habitData);
      
      // Reset form
      setHabitTitle('');
      setHabitDescription('');
      setSelectedEmoji('🎯');
      setTargetChecks(1);
      setAllowMultipleChecks(false);
      setSelectedCategory('general');
      onClose();
    } catch (error) {
      console.error('Error adding habit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setHabitTitle(suggestion.title);
    setHabitDescription(suggestion.description);
    setSelectedEmoji(suggestion.emoji);
    setTargetChecks(suggestion.targetChecks);
    setAllowMultipleChecks(suggestion.allowMultiple);
    setSelectedCategory(suggestion.category);
  };

  const handleClose = () => {
    setHabitTitle('');
    setHabitDescription('');
    setSelectedEmoji('🎯');
    setTargetChecks(1);
    setAllowMultipleChecks(false);
    setSelectedCategory('general');
    setShowEmojiPicker(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-surface-700 rounded-2xl p-6 m-4 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-heading-bold text-text-primary">
              Create New Habit
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-surface-600 rounded-lg transition-colors"
            >
              <Icon name="X" size={20} className="text-text-secondary" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Habit Title */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Habit Title *
              </label>
              <input
                type="text"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                placeholder="Enter your habit title..."
                className="w-full px-4 py-3 bg-surface-600 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
                maxLength={50}
              />
              <div className="text-xs text-text-secondary mt-1">
                {habitTitle.length}/50 characters
              </div>
            </div>

            {/* Habit Description */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={habitDescription}
                onChange={(e) => setHabitDescription(e.target.value)}
                placeholder="Describe your habit..."
                rows={3}
                className="w-full px-4 py-3 bg-surface-600 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                maxLength={200}
              />
              <div className="text-xs text-text-secondary mt-1">
                {habitDescription.length}/200 characters
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedCategory === category.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface-600 hover:bg-surface-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl mb-1">{category.icon}</div>
                      <div className="text-xs text-text-secondary">{category.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Choose an Emoji
              </label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(true)}
                className="flex items-center gap-3 px-4 py-3 bg-surface-600 border border-border rounded-lg hover:bg-surface-500 transition-colors"
              >
                <span className="text-3xl">{selectedEmoji}</span>
                <span className="text-text-secondary">Click to change</span>
                <Icon name="ChevronRight" size={16} className="text-text-secondary ml-auto" />
              </button>
            </div>

            {/* Target Checks */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Target Check-ins per Day
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={targetChecks}
                onChange={(e) => setTargetChecks(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-surface-600 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="text-xs text-text-secondary mt-1">
                How many times should you complete this habit each day?
              </div>
            </div>

            {/* Allow Multiple Checks */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMultipleChecks}
                  onChange={(e) => setAllowMultipleChecks(e.target.checked)}
                  className="w-4 h-4 text-primary bg-surface-600 border-border rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-body-medium text-text-primary">
                  Allow extra check-ins beyond target
                </span>
              </label>
              <div className="text-xs text-text-secondary mt-1 ml-7">
                Useful for habits like "drink water" where you might want to track more than the minimum
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-3">
                Popular Habit Suggestions
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {habitSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-3 px-3 py-2 bg-surface-600 hover:bg-surface-500 rounded-lg transition-colors text-left"
                  >
                    <span className="text-xl">{suggestion.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">{suggestion.title}</div>
                      <div className="text-xs text-text-secondary">{suggestion.description}</div>
                    </div>
                    <div className="text-xs text-text-secondary">
                      {suggestion.targetChecks} check{suggestion.targetChecks > 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!habitTitle.trim()}
                iconName="Plus"
                iconPosition="left"
              >
                Create Habit
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Emoji Picker Modal */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={(emoji) => {
              setSelectedEmoji(emoji);
              setShowEmojiPicker(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AddHabitModal;