import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const JournalEditor = ({ isOpen, onClose, onSave, entry, goals }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    mood: 'good',
    goals: [],
    gratitude: '',
    learnings: '',
    challenges: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Populate form when editing existing entry
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        content: entry.content || '',
        date: entry.date || new Date().toISOString().split('T')[0],
        mood: entry.mood || 'good',
        goals: entry.goals || [],
        gratitude: entry.gratitude || '',
        learnings: entry.learnings || '',
        challenges: entry.challenges || ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        mood: 'good',
        goals: [],
        gratitude: '',
        learnings: '',
        challenges: ''
      });
    }
  }, [entry, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGoalToggle = (goalId) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(id => id !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const handleSave = async () => {
    if (!formData.content.trim()) {
      alert('Please enter some content for your journal entry');
      return;
    }

    setIsSaving(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const moodOptions = [
    { value: 'excellent', label: 'Excellent', emoji: '🤩' },
    { value: 'good', label: 'Good', emoji: '😊' },
    { value: 'okay', label: 'Okay', emoji: '😐' },
    { value: 'bad', label: 'Bad', emoji: '😞' },
    { value: 'terrible', label: 'Terrible', emoji: '😢' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-heading-semibold text-text-primary">
              {entry ? 'Edit Entry' : 'New Journal Entry'}
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon name="X" size={24} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Title and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Title (optional)
                </label>
                <Input
                  type="text"
                  placeholder="Give your entry a title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Date
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleInputChange('mood', option.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                      formData.mood === option.value
                        ? 'bg-primary text-white border-primary' :'bg-surface-700 text-text-secondary border-border hover:border-primary'
                    }`}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                What's on your mind? *
              </label>
              <textarea
                placeholder="Write about your day, thoughts, experiences, or anything else..."
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-surface-700 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Related Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {goals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      formData.goals.includes(goal.id)
                        ? 'bg-primary text-white border-primary' :'bg-surface-700 text-text-secondary border-border hover:border-primary'
                    }`}
                  >
                    <Icon name="Target" size={16} />
                    <span>{goal.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gratitude */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                What are you grateful for today?
              </label>
              <textarea
                placeholder="List things you're grateful for..."
                value={formData.gratitude}
                onChange={(e) => handleInputChange('gratitude', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-surface-700 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Learnings and Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  What did you learn?
                </label>
                <textarea
                  placeholder="New insights, skills, or knowledge..."
                  value={formData.learnings}
                  onChange={(e) => handleInputChange('learnings', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-surface-700 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Challenges faced
                </label>
                <textarea
                  placeholder="What was difficult or challenging?"
                  value={formData.challenges}
                  onChange={(e) => handleInputChange('challenges', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-surface-700 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            <Button
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              iconName="Save"
              iconPosition="left"
            >
              {entry ? 'Update Entry' : 'Save Entry'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JournalEditor;