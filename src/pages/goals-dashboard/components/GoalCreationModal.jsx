import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const GoalCreationModal = ({ isOpen, onClose, onCreateGoal }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    deadline: '',
    targetValue: '',
    unit: 'tasks'
  });

  const categories = [
    { value: 'personal', label: 'Personal Development', icon: 'User' },
    { value: 'career', label: 'Career & Professional', icon: 'Briefcase' },
    { value: 'health', label: 'Health & Fitness', icon: 'Heart' },
    { value: 'learning', label: 'Learning & Education', icon: 'BookOpen' },
    { value: 'financial', label: 'Financial', icon: 'DollarSign' },
    { value: 'creative', label: 'Creative Projects', icon: 'Palette' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority', color: 'var(--color-accent)' },
    { value: 'medium', label: 'Medium Priority', color: 'var(--color-warning)' },
    { value: 'high', label: 'High Priority', color: 'var(--color-error)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newGoal = {
      id: Date.now().toString(),
      ...formData,
      progress: 0,
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    onCreateGoal(newGoal);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      priority: 'medium',
      deadline: '',
      targetValue: '',
      unit: 'tasks'
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-1000 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl border border-border shadow-elevation-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading-semibold text-text-primary">Create New Goal</h2>
            <p className="text-sm text-text-secondary mt-1">Set up your next achievement milestone</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors duration-fast"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Title */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Goal Title *
            </label>
            <Input
              type="text"
              placeholder="e.g., Learn React Development"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 bg-surface-800 border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-fast resize-none"
              rows="3"
              placeholder="Describe your goal and what success looks like..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Category
              </label>
              <select
                className="w-full px-4 py-3 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-fast"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Priority Level
              </label>
              <div className="space-y-2">
                {priorities.map((priority) => (
                  <label key={priority.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-fast
                      ${formData.priority === priority.value 
                        ? 'border-primary bg-primary' :'border-border'
                      }
                    `}>
                      {formData.priority === priority.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm text-text-primary">{priority.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline and Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Target Deadline
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Target Value (Optional)
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.targetValue}
                  onChange={(e) => handleInputChange('targetValue', e.target.value)}
                  className="flex-1"
                />
                <select
                  className="px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-fast"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                >
                  <option value="tasks">Tasks</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="pages">Pages</option>
                  <option value="pounds">Pounds</option>
                  <option value="dollars">Dollars</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              iconName="Plus"
              iconPosition="left"
              className="flex-1"
              disabled={!formData.title.trim()}
            >
              Create Goal
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default GoalCreationModal;