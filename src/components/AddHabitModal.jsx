import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './AppIcon';
import Button from './ui/Button';
import EmojiPicker from './EmojiPicker';

const AddHabitModal = ({ isOpen, onClose, onAdd, initialData = null, mode = 'create' }) => {
  const [habitTitle, setHabitTitle] = useState(initialData?.title || '');
  const [habitDescription, setHabitDescription] = useState(initialData?.description || '');
  const [selectedEmoji, setSelectedEmoji] = useState(initialData?.emoji || '🎯');
  const [trackingType, setTrackingType] = useState(initialData?.trackingType || 'check');
  const [targetChecks, setTargetChecks] = useState(initialData?.targetChecks || 1);
  const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount || 1);
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [allowMultipleChecks, setAllowMultipleChecks] = useState(initialData?.allowMultipleChecks || false);
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'general');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setHabitTitle(initialData.title || '');
        setHabitDescription(initialData.description || '');
        setSelectedEmoji(initialData.emoji || '🎯');
        setTrackingType(initialData.trackingType || 'check');
        setTargetChecks(initialData.targetChecks || 1);
        setTargetAmount(initialData.targetAmount || 1);
        setUnit(initialData.unit || '');
        setAllowMultipleChecks(initialData.allowMultipleChecks || false);
        setSelectedCategory(initialData.category || 'general');
      } else {
        setHabitTitle('');
        setHabitDescription('');
        setSelectedEmoji('🎯');
        setTrackingType('check');
        setTargetChecks(1);
        setTargetAmount(1);
        setUnit('');
        setAllowMultipleChecks(false);
        setSelectedCategory('general');
      }
      setErrors({});
    }
  }, [isOpen, initialData, mode]);

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

  // Habit suggestions with multiple check-ins and tracking types
  const habitSuggestions = [
    { title: 'Drink water', description: 'Stay hydrated throughout the day', emoji: '💧', trackingType: 'amount', targetAmount: 8, unit: 'glasses', category: 'health' },
    { title: 'Walk 10k steps', description: 'Get your daily steps in', emoji: '🚶‍♂️', trackingType: 'amount', targetAmount: 10000, unit: 'steps', category: 'health' },
    { title: 'Practice gratitude', description: 'Write down things you\'re thankful for', emoji: '🙏', trackingType: 'count', targetChecks: 3, category: 'general' },
    { title: 'Read', description: 'Read for personal development', emoji: '📖', trackingType: 'amount', targetAmount: 30, unit: 'minutes', category: 'learning' },
    { title: 'Exercise', description: 'Get your body moving', emoji: '🏃‍♂️', trackingType: 'check', targetChecks: 1, category: 'health' },
    { title: 'Meditate', description: 'Practice mindfulness and meditation', emoji: '🧘‍♂️', trackingType: 'amount', targetAmount: 10, unit: 'minutes', category: 'health' },
    { title: 'Journal', description: 'Write about your day', emoji: '📔', trackingType: 'check', targetChecks: 1, category: 'creative' },
    { title: 'Call family', description: 'Stay connected with loved ones', emoji: '📞', trackingType: 'check', targetChecks: 1, category: 'social' },
    { title: 'Learn something new', description: 'Spend time learning a new skill', emoji: '🎓', trackingType: 'amount', targetAmount: 30, unit: 'minutes', category: 'learning' },
    { title: 'Push-ups', description: 'Build upper body strength', emoji: '💪', trackingType: 'amount', targetAmount: 20, unit: 'reps', category: 'health' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!habitTitle.trim()) {
      newErrors.title = 'Habit title is required';
    } else if (habitTitle.trim().length < 2) {
      newErrors.title = 'Habit title must be at least 2 characters';
    }
    
    if (trackingType === 'amount') {
      if (!targetAmount || targetAmount < 1) {
        newErrors.targetAmount = 'Target amount must be at least 1';
      }
      if (unit && unit.length > 20) {
        newErrors.unit = 'Unit must be 20 characters or less';
      }
    } else {
      if (!targetChecks || targetChecks < 1 || targetChecks > 20) {
        newErrors.targetChecks = 'Target checks must be between 1 and 20';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const habitData = {
        title: habitTitle.trim(),
        description: habitDescription.trim(),
        emoji: selectedEmoji,
        trackingType: trackingType,
        targetChecks: trackingType === 'check' ? parseInt(targetChecks) : 1,
        targetAmount: trackingType === 'amount' ? parseInt(targetAmount) : null,
        unit: trackingType === 'amount' ? unit.trim() : null,
        allowMultipleChecks: allowMultipleChecks,
        category: selectedCategory
      };

      await onAdd(habitData);
      
      // Reset form
      setHabitTitle('');
      setHabitDescription('');
      setSelectedEmoji('🎯');
      setTrackingType('check');
      setTargetChecks(1);
      setTargetAmount(1);
      setUnit('');
      setAllowMultipleChecks(false);
      setSelectedCategory('general');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error adding habit:', error);
      setErrors({ submit: 'Failed to create habit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setHabitTitle(suggestion.title);
    setHabitDescription(suggestion.description);
    setSelectedEmoji(suggestion.emoji);
    setTrackingType(suggestion.trackingType);
    if (suggestion.trackingType === 'amount') {
      setTargetAmount(suggestion.targetAmount);
      setUnit(suggestion.unit || '');
    } else {
      setTargetChecks(suggestion.targetChecks || 1);
    }
    setSelectedCategory(suggestion.category);
  };

  const handleClose = () => {
    setHabitTitle('');
    setHabitDescription('');
    setSelectedEmoji('🎯');
    setTrackingType('check');
    setTargetChecks(1);
    setTargetAmount(1);
    setUnit('');
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
              {mode === 'edit' ? 'Edit Habit' : 'Create New Habit'}
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
                onChange={(e) => {
                  setHabitTitle(e.target.value);
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: null }));
                  }
                }}
                placeholder="Enter your habit title..."
                className={`w-full px-4 py-3 bg-surface-600 border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.title ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                }`}
                required
                maxLength={50}
              />
              {errors.title && (
                <p className="text-xs text-error mt-1">{errors.title}</p>
              )}
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

            {/* Tracking Type */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Tracking Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTrackingType('check')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    trackingType === 'check'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface-600 hover:bg-surface-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">✅</div>
                    <div className="text-xs text-text-secondary">Simple Check</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingType('count')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    trackingType === 'count'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface-600 hover:bg-surface-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">🔢</div>
                    <div className="text-xs text-text-secondary">Multiple Checks</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingType('amount')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    trackingType === 'amount'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface-600 hover:bg-surface-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">📊</div>
                    <div className="text-xs text-text-secondary">Progress Amount</div>
                  </div>
                </button>
              </div>
              <div className="text-xs text-text-secondary mt-2">
                {trackingType === 'check' && 'Simple daily completion (e.g., "Did I journal today?")'}
                {trackingType === 'count' && 'Multiple completions with target (e.g., "3 gratitude entries")'}
                {trackingType === 'amount' && 'Progress towards a target amount (e.g., "10,000 steps")'}
              </div>
            </div>

            {/* Target Goals based on tracking type */}
            {trackingType === 'check' ? (
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Simple Daily Goal
                </label>
                <div className="p-3 bg-surface-600 border border-border rounded-lg text-text-secondary text-sm">
                  ✅ Complete once per day
                </div>
              </div>
            ) : trackingType === 'count' ? (
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Target Daily Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={targetChecks}
                  onChange={(e) => {
                    setTargetChecks(parseInt(e.target.value) || 1);
                    if (errors.targetChecks) {
                      setErrors(prev => ({ ...prev, targetChecks: null }));
                    }
                  }}
                  className={`w-full px-4 py-3 bg-surface-600 border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.targetChecks ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                  }`}
                />
                {errors.targetChecks && (
                  <p className="text-xs text-error mt-1">{errors.targetChecks}</p>
                )}
                <div className="text-xs text-text-secondary mt-1">
                  How many times should you complete this habit each day?
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetAmount}
                    onChange={(e) => {
                      setTargetAmount(parseInt(e.target.value) || 1);
                      if (errors.targetAmount) {
                        setErrors(prev => ({ ...prev, targetAmount: null }));
                      }
                    }}
                    className={`w-full px-4 py-3 bg-surface-600 border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.targetAmount ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                    }`}
                  />
                  {errors.targetAmount && (
                    <p className="text-xs text-error mt-1">{errors.targetAmount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">
                    Unit (optional)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      if (errors.unit) {
                        setErrors(prev => ({ ...prev, unit: null }));
                      }
                    }}
                    placeholder="e.g., steps, glasses, minutes, pages"
                    className={`w-full px-4 py-3 bg-surface-600 border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.unit ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                    }`}
                    maxLength={20}
                  />
                  {errors.unit && (
                    <p className="text-xs text-error mt-1">{errors.unit}</p>
                  )}
                  <div className="text-xs text-text-secondary mt-1">
                    What unit are you measuring? (e.g., steps, glasses of water, minutes)
                  </div>
                </div>
              </div>
            )}

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
                  Allow extra completions beyond target
                </span>
              </label>
              <div className="text-xs text-text-secondary mt-1 ml-7">
                Useful for habits like "drink water" where you might want to track more than the minimum
              </div>
            </div>

            {/* Suggestions - only show in create mode */}
            {mode === 'create' && (
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
                        {suggestion.trackingType === 'amount' 
                          ? `${suggestion.targetAmount} ${suggestion.unit || 'units'}`
                          : `${suggestion.targetChecks || 1} goal${(suggestion.targetChecks || 1) > 1 ? 's' : ''}`
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              {errors.submit && (
                <p className="text-sm text-error flex-1">{errors.submit}</p>
              )}
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
                disabled={isSubmitting || !habitTitle.trim()}
                iconName="Plus"
                iconPosition="left"
              >
                {mode === 'edit' ? 'Update Habit' : 'Create Habit'}
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