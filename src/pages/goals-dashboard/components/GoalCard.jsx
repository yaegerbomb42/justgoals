import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { formatDate, getDaysUntilDeadline, updateGoal, deleteGoal } from '../../../utils/goalUtils';
import { useAuth } from '../../../context/AuthContext';

const GoalCard = ({ goal, onGoalUpdate, onGoalDelete }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: goal.title,
    description: goal.description || '',
    category: goal.category || 'General',
    priority: goal.priority || 'medium',
    deadline: goal.deadline || '',
    targetValue: goal.targetValue || '',
    unit: goal.unit || ''
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-text-secondary';
    }
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Learning': 'BookOpen',
      'Health & Fitness': 'Activity',
      'Career & Work': 'Briefcase',
      'Personal Development': 'User',
      'Relationships': 'Heart',
      'Hobbies & Recreation': 'Gamepad2',
      'Financial': 'DollarSign',
      'General': 'Target'
    };
    return iconMap[category] || 'Target';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-success';
    if (progress >= 50) return 'text-warning';
    return 'text-error';
  };

  const daysUntilDeadline = getDaysUntilDeadline(goal.deadline);

  const handleSave = async () => {
    try {
      const updatedGoal = await updateGoal(user.id, goal.id, editData);
      if (updatedGoal) {
        onGoalUpdate(updatedGoal);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        const success = await deleteGoal(user.id, goal.id);
        if (success) {
          onGoalDelete(goal.id);
        }
      } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Failed to delete goal. Please try again.');
      }
    }
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-lg p-6 border border-border"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
              >
                <option value="Learning">Learning</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Career & Work">Career & Work</option>
                <option value="Personal Development">Personal Development</option>
                <option value="Relationships">Relationships</option>
                <option value="Hobbies & Recreation">Hobbies & Recreation</option>
                <option value="Financial">Financial</option>
                <option value="General">General</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Priority</label>
              <select
                value={editData.priority}
                onChange={(e) => setEditData({...editData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">Deadline</label>
            <input
              type="date"
              value={editData.deadline}
              onChange={(e) => setEditData({...editData, deadline: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Target Value</label>
              <input
                type="text"
                value={editData.targetValue}
                onChange={(e) => setEditData({...editData, targetValue: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                placeholder="e.g., 10, 5km, fluent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Unit</label>
              <input
                type="text"
                value={editData.unit}
                onChange={(e) => setEditData({...editData, unit: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface-700 text-text-primary"
                placeholder="e.g., books, km, level"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleSave}
              variant="primary"
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-lg p-6 border border-border hover:border-border-strong transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Icon name={getCategoryIcon(goal.category)} size={20} color="#FFFFFF" />
          </div>
          <div>
            <h3 className="text-lg font-heading-medium text-text-primary">{goal.title}</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-caption ${getPriorityColor(goal.priority)}`}>
                {goal.priority} priority
              </span>
              <span className="text-sm text-text-muted">•</span>
              <span className="text-sm text-text-muted">{goal.category}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg bg-surface-700 text-text-secondary hover:bg-surface-600 transition-colors"
          >
            <Icon name="Edit" size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-surface-700 text-text-secondary hover:bg-error hover:text-white transition-colors"
          >
            <Icon name="Trash2" size={16} />
          </button>
        </div>
      </div>

      {goal.description && (
        <p className="text-text-secondary mb-4">{goal.description}</p>
      )}

      <div className="space-y-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-body-medium text-text-primary">Progress</span>
            <span className={`text-sm font-body-medium ${getProgressColor(goal.progress || 0)}`}>
              {goal.progress || 0}%
            </span>
          </div>
          <div className="w-full bg-surface-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${goal.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Target */}
        {goal.targetValue && (
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Icon name="Target" size={14} />
            <span>Target: {goal.targetValue} {goal.unit}</span>
          </div>
        )}

        {/* Deadline */}
        <div className="flex items-center space-x-2 text-sm">
          <Icon name="Calendar" size={14} className="text-text-secondary" />
          <span className="text-text-secondary">Deadline: {formatDate(goal.deadline)}</span>
          {daysUntilDeadline !== null && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              daysUntilDeadline < 0 
                ? 'bg-error text-white' 
                : daysUntilDeadline <= 7 
                  ? 'bg-warning text-white' 
                  : 'bg-success text-white'
            }`}>
              {daysUntilDeadline < 0 
                ? `${Math.abs(daysUntilDeadline)} days overdue` 
                : daysUntilDeadline === 0 
                  ? 'Due today' 
                  : `${daysUntilDeadline} days left`
              }
            </span>
          )}
        </div>

        {/* Created Date */}
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Icon name="Clock" size={14} />
          <span>Created: {formatDate(goal.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default GoalCard;