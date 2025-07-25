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
    } else if (habitTitle.trim().length > 50) {
      newErrors.title = 'Habit title must be 50 characters or less';
    }
    
    if (trackingType === 'amount') {
      if (!targetAmount || targetAmount < 1 || targetAmount > 1000) {
        newErrors.targetAmount = 'Target amount must be between 1 and 1000';
      }
      if (unit && unit.length > 20) {
        newErrors.unit = 'Unit must be 20 characters or less';
      }
    } else if (trackingType === 'count') {
      if (!targetChecks || targetChecks < 1 || targetChecks > 20) {
        newErrors.targetChecks = 'Target checks must be between 1 and 20';
      }
    }
    
    if (habitDescription && habitDescription.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }
    
    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    
    if (!selectedEmoji) {
      newErrors.emoji = 'Please select an emoji';
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
                className={`w-full px-4 py-3 bg-surface-600 border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.title ? 'border-error focus:border-error ring-error/20' : 'border-border focus:border-primary'
                }`}
                required
                maxLength={50}
                autoFocus
              />
              {errors.title && (
                <div className="flex items-center gap-1 mt-1">
                  <Icon name="AlertCircle" className="w-3 h-3 text-error" />
                  <p className="text-xs text-error">{errors.title}</p>
                </div>
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
                        ? 'border-primary bg-primary/20 ring-2 ring-primary/30'
                        : 'border-border bg-surface-600 hover:bg-surface-500 hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl mb-1">{category.icon}</div>
                      <div className={`text-xs font-medium ${
                        selectedCategory === category.id ? 'text-primary' : 'text-text-secondary'
                      }`}>{category.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Choose an Emoji *
              </label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(true)}
                className={`flex items-center gap-3 px-4 py-3 bg-surface-600 border rounded-lg hover:bg-surface-500 transition-colors w-full text-left ${
                  errors.emoji ? 'border-error' : 'border-border hover:border-primary'
                }`}
              >
                <span className="text-3xl">{selectedEmoji}</span>
                <span className="text-text-secondary flex-1">Click to change emoji</span>
                <Icon name="ChevronRight" size={16} className="text-text-secondary" />
              </button>
              {errors.emoji && (
                <div className="flex items-center gap-1 mt-1">
                  <Icon name="AlertCircle" className="w-3 h-3 text-error" />
                  <p className="text-xs text-error">{errors.emoji}</p>
                </div>
              )}
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
                      ? 'border-primary bg-primary/20 ring-2 ring-primary/30'
                      : 'border-border bg-surface-600 hover:bg-surface-500 hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">✅</div>
                    <div className={`text-xs font-medium ${
                      trackingType === 'check' ? 'text-primary' : 'text-text-secondary'
                    }`}>Simple Check</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingType('count')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    trackingType === 'count'
                      ? 'border-primary bg-primary/20 ring-2 ring-primary/30'
                      : 'border-border bg-surface-600 hover:bg-surface-500 hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">🔢</div>
                    <div className={`text-xs font-medium ${
                      trackingType === 'count' ? 'text-primary' : 'text-text-secondary'
                    }`}>Multiple Checks</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingType('amount')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    trackingType === 'amount'
                      ? 'border-primary bg-primary/20 ring-2 ring-primary/30'
                      : 'border-border bg-surface-600 hover:bg-surface-500 hover:border-primary/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">📊</div>
                    <div className={`text-xs font-medium ${
                      trackingType === 'amount' ? 'text-primary' : 'text-text-secondary'
                    }`}>Progress Amount</div>
                  </div>
                </button>
              </div>
              <div className="text-xs text-text-secondary mt-2">
                {trackingType === 'check' && 'Simple daily completion (e.g., "Did I journal today?")'}
                {trackingType === 'count' && 'Multiple completions with target (e.g., "3 gratitude entries")'}
                {trackingType === 'amount' && 'Progress towards a target amount (e.g., "10,000 steps")'}
              </div>
            </div>

            {/* Enhanced Target Goals with Smart Input Forms */}
            {trackingType === 'check' ? (
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Simple Daily Goal
                </label>
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Icon name="Check" className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-700 dark:text-emerald-300 font-medium">One-time completion</p>
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm">Perfect for binary habits like "meditate" or "exercise"</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : trackingType === 'count' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">
                    Target Daily Count
                  </label>
                  <div className="relative">
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
                      className={`w-full px-4 py-3 bg-surface-600 border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.targetChecks ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                      times
                    </div>
                  </div>
                  {errors.targetChecks && (
                    <div className="flex items-center gap-1 mt-1">
                      <Icon name="AlertCircle" className="w-3 h-3 text-error" />
                      <p className="text-xs text-error">{errors.targetChecks}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Icon name="Info" className="w-4 h-4 text-text-secondary" />
                    <span className="text-xs text-text-secondary">
                      How many times should you complete this habit each day?
                    </span>
                  </div>
                </div>
                
                {/* Quick preset buttons for count */}
                <div>
                  <label className="block text-sm font-body-medium text-text-secondary mb-2">
                    Quick presets:
                  </label>
                  <div className="flex gap-2">
                    {[1, 3, 5, 10].map(count => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTargetChecks(count)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          targetChecks === count
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-surface-600 text-text-secondary hover:bg-surface-500 hover:text-text-primary'
                        }`}
                      >
                        {count}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-body-medium text-text-primary mb-2">
                    Target Amount
                  </label>
                  <div className="flex gap-2">
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
                      className={`flex-1 px-4 py-3 bg-surface-600 border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.targetAmount ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                      }`}
                      placeholder="Enter amount..."
                    />
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => {
                        setUnit(e.target.value);
                        if (errors.unit) {
                          setErrors(prev => ({ ...prev, unit: null }));
                        }
                      }}
                      placeholder="unit"
                      className={`w-24 px-3 py-3 bg-surface-600 border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        errors.unit ? 'border-error focus:border-error' : 'border-border focus:border-primary'
                      }`}
                      maxLength={20}
                    />
                  </div>
                  {(errors.targetAmount || errors.unit) && (
                    <div className="mt-1 space-y-1">
                      {errors.targetAmount && (
                        <div className="flex items-center gap-1">
                          <Icon name="AlertCircle" className="w-3 h-3 text-error" />
                          <p className="text-xs text-error">{errors.targetAmount}</p>
                        </div>
                      )}
                      {errors.unit && (
                        <div className="flex items-center gap-1">
                          <Icon name="AlertCircle" className="w-3 h-3 text-error" />
                          <p className="text-xs text-error">{errors.unit}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Icon name="Target" className="w-4 h-4 text-text-secondary" />
                    <span className="text-xs text-text-secondary">
                      How much do you want to achieve? (e.g., 10000 steps, 8 glasses, 30 minutes)
                    </span>
                  </div>
                </div>

                {/* Smart unit suggestions */}
                <div>
                  <label className="block text-sm font-body-medium text-text-secondary mb-2">
                    Common units:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['steps', 'glasses', 'minutes', 'pages', 'reps', 'hours', 'calories', 'miles'].map(unitOption => (
                      <button
                        key={unitOption}
                        type="button"
                        onClick={() => setUnit(unitOption)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          unit === unitOption
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-surface-600 text-text-secondary hover:bg-surface-500 hover:text-text-primary'
                        }`}
                      >
                        {unitOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart presets based on unit */}
                {unit && (
                  <div>
                    <label className="block text-sm font-body-medium text-text-secondary mb-2">
                      Suggested targets for {unit}:
                    </label>
                    <div className="flex gap-2">
                      {(() => {
                        const presets = {
                          steps: [5000, 8000, 10000, 15000],
                          glasses: [4, 6, 8, 10],
                          minutes: [10, 15, 30, 60],
                          pages: [5, 10, 20, 50],
                          reps: [10, 20, 50, 100],
                          hours: [1, 2, 4, 8],
                          calories: [300, 500, 800, 1200],
                          miles: [1, 3, 5, 10]
                        };
                        return (presets[unit] || []).map(amount => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setTargetAmount(amount)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              targetAmount === amount
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-surface-600 text-text-secondary hover:bg-surface-500 hover:text-text-primary'
                            }`}
                          >
                            {amount.toLocaleString()}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
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

            {/* AI-Powered Habit Suggestions - Enhanced */}
            {mode === 'create' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-body-medium text-text-primary">
                    Popular Habit Suggestions
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      // TODO: Integrate with Drift AI for personalized suggestions
                      console.log('Request AI-powered habit suggestions');
                    }}
                    className="text-xs"
                  >
                    <Icon name="Sparkles" size={12} className="mr-1" />
                    Get AI Suggestions
                  </Button>
                </div>
                
                {/* Category-based suggestions */}
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {habitSuggestions
                    .filter(suggestion => !selectedCategory || selectedCategory === 'general' || suggestion.category === selectedCategory)
                    .map((suggestion, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-3 px-3 py-3 bg-surface-600 hover:bg-surface-500 rounded-lg transition-all text-left border border-transparent hover:border-primary/30"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-xl">{suggestion.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary">{suggestion.title}</div>
                        <div className="text-xs text-text-secondary truncate">{suggestion.description}</div>
                      </div>
                      <div className="text-xs text-text-secondary bg-surface-700 px-2 py-1 rounded-full">
                        {suggestion.trackingType === 'amount' 
                          ? `${suggestion.targetAmount} ${suggestion.unit || 'units'}`
                          : `${suggestion.targetChecks || 1}x`
                        }
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* AI Suggestion Notice */}
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
                  <Icon name="Info" className="w-4 h-4 text-primary" />
                  <div className="text-xs text-text-secondary">
                    <span className="font-medium text-primary">Pro Tip:</span> Click "Get AI Suggestions" for personalized habit recommendations based on your goals and preferences.
                  </div>
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