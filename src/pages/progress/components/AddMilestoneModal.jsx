import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AddMilestoneModal = ({ isOpen, onClose, onAdd, onEdit, goals, editingMilestone = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalId: '',
    priority: 'medium',
    estimatedTime: '',
    dueTime: ''
  });

  const [errors, setErrors] = useState({});

  // Pre-fill form when editing
  useEffect(() => {
    if (editingMilestone) {
      setFormData({
        title: editingMilestone.title || '',
        description: editingMilestone.description || '',
        goalId: editingMilestone.goalId || '',
        priority: editingMilestone.priority || 'medium',
        estimatedTime: editingMilestone.estimatedTime ? editingMilestone.estimatedTime.toString() : '',
        dueTime: editingMilestone.dueTime || ''
      });
    } else {
      // Reset form for new milestone
      setFormData({
        title: '',
        description: '',
        goalId: '',
        priority: 'medium',
        estimatedTime: '',
        dueTime: ''
      });
    }
    setErrors({});
  }, [editingMilestone, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.goalId) {
      newErrors.goalId = 'Please select a goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const selectedGoal = goals.find(goal => goal.id === formData.goalId);
    
    if (editingMilestone) {
      // Edit existing milestone
      const updatedMilestone = {
        ...editingMilestone,
        title: formData.title,
        description: formData.description,
        goalId: formData.goalId,
        goalName: selectedGoal?.title || '',
        priority: formData.priority,
        estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
        dueTime: formData.dueTime,
        updatedAt: new Date().toISOString()
      };
      onEdit(updatedMilestone);
    } else {
      // Create new milestone
      const newMilestone = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        goalId: formData.goalId,
        goalName: selectedGoal?.title || '',
        priority: formData.priority,
        estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
        dueTime: formData.dueTime,
        completed: false,
        createdAt: new Date(),
        date: new Date().toISOString().split('T')[0]
      };
      onAdd(newMilestone);
    }
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      goalId: '',
      priority: 'medium',
      estimatedTime: '',
      dueTime: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface rounded-lg border border-border shadow-elevation-2 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-heading-medium text-text-primary">
            {editingMilestone ? 'Edit Progress Step' : 'Add New Progress Step'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors duration-fast"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Title *
            </label>
            <Input
              type="text"
              placeholder="Enter milestone title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-error' : ''}
            />
            {errors.title && (
              <p className="text-xs text-error mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              placeholder="Add details about this milestone"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-fast resize-none"
            />
          </div>

          {/* Goal Selection */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Associated Goal *
            </label>
            <select
              value={formData.goalId}
              onChange={(e) => handleInputChange('goalId', e.target.value)}
              className={`
                w-full px-3 py-2 bg-surface-800 border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-fast
                ${errors.goalId ? 'border-error' : 'border-border'}
              `}
            >
              <option value="">Select a goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            {errors.goalId && (
              <p className="text-xs text-error mt-1">{errors.goalId}</p>
            )}
          </div>

          {/* Priority and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-fast"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Time (min)
              </label>
              <Input
                type="number"
                placeholder="30"
                value={formData.estimatedTime}
                onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                min="1"
                max="480"
              />
            </div>
          </div>

          {/* Due Time */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Due Time (Optional)
            </label>
            <Input
              type="time"
              value={formData.dueTime}
              onChange={(e) => handleInputChange('dueTime', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              iconName={editingMilestone ? "Save" : "Plus"}
              iconPosition="left"
            >
              {editingMilestone ? 'Save Changes' : 'Add Progress Step'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddMilestoneModal;