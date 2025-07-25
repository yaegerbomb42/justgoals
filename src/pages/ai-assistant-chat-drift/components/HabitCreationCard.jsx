import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const HabitCreationCard = ({ 
  onSubmit, 
  onCancel, 
  initialData = {},
  isVisible = false 
}) => {
  const [habitData, setHabitData] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    category: 'health',
    timeOfDay: 'morning',
    reminderEnabled: true,
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const frequencies = [
    { value: 'daily', label: 'Daily', icon: 'Calendar' },
    { value: 'weekly', label: 'Weekly', icon: 'CalendarDays' },
    { value: 'monthly', label: 'Monthly', icon: 'CalendarRange' }
  ];

  const categories = [
    { value: 'health', label: 'Health', icon: 'Heart', color: 'text-red-500' },
    { value: 'productivity', label: 'Productivity', icon: 'Zap', color: 'text-yellow-500' },
    { value: 'personal', label: 'Personal', icon: 'User', color: 'text-blue-500' },
    { value: 'learning', label: 'Learning', icon: 'BookOpen', color: 'text-purple-500' },
    { value: 'mindfulness', label: 'Mindfulness', icon: 'Brain', color: 'text-green-500' },
    { value: 'fitness', label: 'Fitness', icon: 'Activity', color: 'text-orange-500' }
  ];

  const timesOfDay = [
    { value: 'morning', label: 'Morning', icon: 'Sunrise' },
    { value: 'afternoon', label: 'Afternoon', icon: 'Sun' },
    { value: 'evening', label: 'Evening', icon: 'Sunset' },
    { value: 'anytime', label: 'Anytime', icon: 'Clock' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!habitData.title?.trim()) {
      newErrors.title = 'Habit title is required';
    }
    
    if (!habitData.description?.trim()) {
      newErrors.description = 'Habit description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        ...habitData,
        id: initialData.id || `habit_${Date.now()}`,
        createdAt: initialData.createdAt || new Date().toISOString(),
        streak: initialData.streak || 0,
        completedToday: initialData.completedToday || false
      });
    }
  };

  const updateField = (field, value) => {
    setHabitData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-surface border border-border rounded-xl p-6 shadow-lg max-w-2xl mx-auto my-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Icon name="Repeat" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {initialData.id ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <p className="text-sm text-text-secondary">
              {initialData.id ? 'Update your habit details' : 'Build a positive routine'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-colors"
        >
          <Icon name="X" className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Habit Title *
          </label>
          <input
            type="text"
            value={habitData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g., Morning meditation, Daily workout, Read before bed"
            className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
              errors.title ? 'border-red-500' : 'border-border focus:border-primary'
            }`}
          />
          {errors.title && (
            <p className="text-sm text-red-500 flex items-center space-x-1">
              <Icon name="AlertCircle" className="w-4 h-4" />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Description *
          </label>
          <textarea
            value={habitData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe what this habit involves and why it's important to you..."
            rows={3}
            className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none ${
              errors.description ? 'border-red-500' : 'border-border focus:border-primary'
            }`}
          />
          {errors.description && (
            <p className="text-sm text-red-500 flex items-center space-x-1">
              <Icon name="AlertCircle" className="w-4 h-4" />
              <span>{errors.description}</span>
            </p>
          )}
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Frequency
          </label>
          <div className="grid grid-cols-3 gap-3">
            {frequencies.map((freq) => (
              <button
                key={freq.value}
                onClick={() => updateField('frequency', freq.value)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  habitData.frequency === freq.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface-700 text-text-secondary hover:border-primary/50 hover:text-text-primary'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Icon name={freq.icon} className="w-5 h-5" />
                  <span className="text-sm font-medium">{freq.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => updateField('category', category.value)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  habitData.category === category.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface-700 text-text-secondary hover:border-primary/50 hover:text-text-primary'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name={category.icon} className={`w-4 h-4 ${
                    habitData.category === category.value ? 'text-primary' : category.color
                  }`} />
                  <span className="text-sm font-medium">{category.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time of Day */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Preferred Time
          </label>
          <div className="grid grid-cols-4 gap-2">
            {timesOfDay.map((time) => (
              <button
                key={time.value}
                onClick={() => updateField('timeOfDay', time.value)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  habitData.timeOfDay === time.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface-700 text-text-secondary hover:border-primary/50 hover:text-text-primary'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Icon name={time.icon} className="w-4 h-4" />
                  <span className="text-xs font-medium">{time.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reminder Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <Icon name="Bell" className="w-5 h-5 text-text-secondary" />
            <div>
              <h4 className="text-sm font-medium text-text-primary">Reminders</h4>
              <p className="text-xs text-text-secondary">Get notified to maintain your streak</p>
            </div>
          </div>
          <button
            onClick={() => updateField('reminderEnabled', !habitData.reminderEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              habitData.reminderEnabled ? 'bg-primary' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                habitData.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-blue-600 transition-all flex items-center space-x-2"
        >
          <Icon name={initialData.id ? "Check" : "Plus"} className="w-4 h-4" />
          <span>{initialData.id ? 'Update Habit' : 'Create Habit'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export default HabitCreationCard;