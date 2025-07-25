import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const GoalCreationCard = ({ 
  onSubmit, 
  onCancel, 
  initialData = {},
  isVisible = false 
}) => {
  const [goalData, setGoalData] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    deadline: '',
    milestones: [],
    ...initialData
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setGoalData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const categories = [
    { value: 'personal', label: 'Personal', icon: 'User', color: 'text-blue-500' },
    { value: 'health', label: 'Health', icon: 'Heart', color: 'text-red-500' },
    { value: 'career', label: 'Career', icon: 'Briefcase', color: 'text-green-500' },
    { value: 'education', label: 'Education', icon: 'GraduationCap', color: 'text-purple-500' },
    { value: 'finance', label: 'Finance', icon: 'DollarSign', color: 'text-yellow-500' },
    { value: 'hobbies', label: 'Hobbies', icon: 'Star', color: 'text-pink-500' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!goalData.title?.trim()) {
      newErrors.title = 'Goal title is required';
    }
    
    if (!goalData.description?.trim()) {
      newErrors.description = 'Goal description is required';
    }

    if (goalData.deadline && new Date(goalData.deadline) < new Date()) {
      newErrors.deadline = 'Deadline cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        ...goalData,
        id: initialData.id || `goal_${Date.now()}`,
        createdAt: initialData.createdAt || new Date().toISOString(),
        progress: initialData.progress || 0,
        completed: initialData.completed || false
      });
    }
  };

  const updateField = (field, value) => {
    setGoalData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addMilestone = () => {
    const newMilestone = {
      id: `milestone_${Date.now()}`,
      title: '',
      description: '',
      completed: false
    };
    setGoalData(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone]
    }));
  };

  const updateMilestone = (index, field, value) => {
    setGoalData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const removeMilestone = (index) => {
    setGoalData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="bg-surface border border-border rounded-xl p-6 shadow-lg max-w-2xl mx-auto my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Icon name="Target" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {initialData.id ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <p className="text-sm text-text-secondary">
                {initialData.id ? 'Update your goal details' : 'Define what you want to achieve'}
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
              Goal Title *
            </label>
            <input
              type="text"
              value={goalData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., Learn Spanish, Run a marathon, Read 12 books"
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
              value={goalData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your goal in detail, including why it's important to you..."
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

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => updateField('category', category.value)}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      goalData.category === category.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface-700 text-text-secondary hover:border-primary/50 hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon name={category.icon} className={`w-4 h-4 ${
                        goalData.category === category.value ? 'text-primary' : category.color
                      }`} />
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Priority
              </label>
              <div className="space-y-2">
                {priorities.map((priority) => (
                  <button
                    key={priority.value}
                    onClick={() => updateField('priority', priority.value)}
                    className={`w-full p-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      goalData.priority === priority.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface-700 text-text-secondary hover:border-primary/50 hover:text-text-primary'
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Target Deadline (Optional)
            </label>
            <input
              type="date"
              value={goalData.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 bg-surface-700 border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                errors.deadline ? 'border-red-500' : 'border-border focus:border-primary'
              }`}
            />
            {errors.deadline && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <Icon name="AlertCircle" className="w-4 h-4" />
                <span>{errors.deadline}</span>
              </p>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Milestones (Optional)
              </label>
              <button
                onClick={addMilestone}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                <Icon name="Plus" className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>
            
            {goalData.milestones && goalData.milestones.length > 0 && (
              <div className="space-y-3">
                {goalData.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-surface-700 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        placeholder="Milestone title"
                        className="w-full px-3 py-2 bg-surface border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Brief description (optional)"
                        className="w-full px-3 py-2 bg-surface border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <button
                      onClick={() => removeMilestone(index)}
                      className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Icon name={initialData.id ? "Check" : "Plus"} className="w-4 h-4" />
            <span>{initialData.id ? 'Update Goal' : 'Create Goal'}</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoalCreationCard;