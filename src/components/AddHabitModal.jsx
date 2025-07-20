import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './AppIcon';
import Button from './ui/Button';
import EmojiPicker from './EmojiPicker';

const AddHabitModal = ({ isOpen, onClose, onAddHabit, isWeekly = false }) => {
  const [habitName, setHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    { value: null, label: 'Any day' },
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  // Habit suggestions based on type
  const dailySuggestions = [
    { name: 'Drink 8 glasses of water', emoji: '💧' },
    { name: 'Take vitamins', emoji: '💊' },
    { name: 'Stretch for 10 minutes', emoji: '🤸‍♂️' },
    { name: 'Write in journal', emoji: '📔' },
    { name: 'Meditate', emoji: '🧘‍♂️' },
    { name: 'Read for 30 minutes', emoji: '📖' },
    { name: 'Practice gratitude', emoji: '🙏' },
    { name: 'Check in with family', emoji: '👨‍👩‍👧‍👦' }
  ];

  const weeklySuggestions = [
    { name: 'Grocery shopping', emoji: '🛒' },
    { name: 'Clean house', emoji: '🧹' },
    { name: 'Meal prep', emoji: '🥘' },
    { name: 'Visit gym', emoji: '🏋️‍♂️' },
    { name: 'Call parents', emoji: '📞' },
    { name: 'Pay bills', emoji: '💰' },
    { name: 'Plan next week', emoji: '📅' },
    { name: 'Water plants', emoji: '🌱' }
  ];

  const suggestions = isWeekly ? weeklySuggestions : dailySuggestions;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    setIsSubmitting(true);
    try {
      const habitData = {
        name: habitName.trim(),
        emoji: selectedEmoji,
        ...(isWeekly && { dayOfWeek: selectedDay })
      };

      await onAddHabit(habitData, isWeekly);
      
      // Reset form
      setHabitName('');
      setSelectedEmoji('😊');
      setSelectedDay(null);
      onClose();
    } catch (error) {
      console.error('Error adding habit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setHabitName(suggestion.name);
    setSelectedEmoji(suggestion.emoji);
  };

  const handleClose = () => {
    setHabitName('');
    setSelectedEmoji('😊');
    setSelectedDay(null);
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
              Add {isWeekly ? 'Weekly' : 'Daily'} Habit
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
            {/* Habit Name */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Habit Name *
              </label>
              <input
                type="text"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                placeholder={`Enter your ${isWeekly ? 'weekly' : 'daily'} habit...`}
                className="w-full px-4 py-3 bg-surface-600 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
                maxLength={50}
              />
              <div className="text-xs text-text-secondary mt-1">
                {habitName.length}/50 characters
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

            {/* Day of Week (Weekly only) */}
            {isWeekly && (
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Specific Day (Optional)
                </label>
                <select
                  value={selectedDay || ''}
                  onChange={(e) => setSelectedDay(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 bg-surface-600 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value || 'any'} value={day.value || ''}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-text-secondary mt-1">
                  Leave as "Any day" for flexible weekly habits
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-3">
                Popular {isWeekly ? 'Weekly' : 'Daily'} Habits
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-3 px-3 py-2 bg-surface-600 hover:bg-surface-500 rounded-lg transition-colors text-left"
                  >
                    <span className="text-xl">{suggestion.emoji}</span>
                    <span className="text-sm text-text-primary">{suggestion.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!habitName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding...
                  </div>
                ) : (
                  <>
                    <Icon name="Plus" size={16} />
                    Add Habit
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            selectedEmoji={selectedEmoji}
            onEmojiSelect={setSelectedEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AddHabitModal;