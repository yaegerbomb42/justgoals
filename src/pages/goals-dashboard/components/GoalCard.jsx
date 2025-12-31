import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { formatDate, getDaysUntilDeadline, updateGoal, deleteGoal } from '../../../utils/goalUtils';
import { useAuth } from '../../../context/AuthContext';

const GoalCard = ({ goal, onGoalUpdate, onGoalDelete }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editData, setEditData] = useState({
    title: goal.title,
    description: goal.description || '',
    category: goal.category || 'General',
    priority: goal.priority || 'medium',
    deadline: goal.deadline || '',
    targetValue: goal.targetValue || '',
    unit: goal.unit || ''
  });

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high': return { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30', label: 'High Priority' };
      case 'medium': return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'Medium' };
      case 'low': return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', label: 'Low' };
      default: return { color: 'text-text-secondary', bg: 'bg-surface-700', border: 'border-border', label: 'Normal' };
    }
  };

  const getCategoryConfig = (category) => {
    const configs = {
      'Learning': { icon: 'BookOpen', gradient: 'from-blue-500 to-cyan-500' },
      'Health & Fitness': { icon: 'Activity', gradient: 'from-green-500 to-emerald-500' },
      'Career & Work': { icon: 'Briefcase', gradient: 'from-violet-500 to-purple-500' },
      'Personal Development': { icon: 'User', gradient: 'from-pink-500 to-rose-500' },
      'Relationships': { icon: 'Heart', gradient: 'from-red-500 to-pink-500' },
      'Hobbies & Recreation': { icon: 'Gamepad2', gradient: 'from-orange-500 to-amber-500' },
      'Financial': { icon: 'DollarSign', gradient: 'from-yellow-500 to-lime-500' },
      'General': { icon: 'Target', gradient: 'from-primary to-secondary' }
    };
    return configs[category] || configs['General'];
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-emerald-400';
    if (progress >= 50) return 'from-yellow-500 to-amber-400';
    if (progress >= 25) return 'from-orange-500 to-amber-500';
    return 'from-primary to-secondary';
  };

  const daysUntilDeadline = getDaysUntilDeadline(goal.deadline);
  const priorityConfig = getPriorityConfig(goal.priority);
  const categoryConfig = getCategoryConfig(goal.category);
  const progress = goal.progress || 0;

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
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              className="input-modern"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              className="input-modern min-h-[80px] resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
                className="input-modern"
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
              <label className="block text-sm font-medium text-text-primary mb-2">Priority</label>
              <select
                value={editData.priority}
                onChange={(e) => setEditData({...editData, priority: e.target.value})}
                className="input-modern"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Deadline</label>
            <input
              type="date"
              value={editData.deadline}
              onChange={(e) => setEditData({...editData, deadline: e.target.value})}
              className="input-modern"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Target Value</label>
              <input
                type="text"
                value={editData.targetValue}
                onChange={(e) => setEditData({...editData, targetValue: e.target.value})}
                className="input-modern"
                placeholder="e.g., 10, 5km"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Unit</label>
              <input
                type="text"
                value={editData.unit}
                onChange={(e) => setEditData({...editData, unit: e.target.value})}
                className="input-modern"
                placeholder="e.g., books, km"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-2">
            <Button onClick={handleSave} variant="primary" className="flex-1">
              Save Changes
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${categoryConfig.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-all duration-500`} />
      
      <div className="relative glass-card overflow-hidden">
        {/* Progress indicator line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-700/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getProgressColor(progress)}`}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-12 h-12 bg-gradient-to-br ${categoryConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <Icon name={categoryConfig.icon} size={24} color="#FFFFFF" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-text-primary truncate">{goal.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border} border`}>
                    {priorityConfig.label}
                  </span>
                  <span className="text-xs text-text-muted">{goal.category}</span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center space-x-1"
                >
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg bg-surface-700/50 text-text-secondary hover:text-text-primary hover:bg-surface-600 transition-all"
                  >
                    <Icon name="Edit" size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg bg-surface-700/50 text-text-secondary hover:text-error hover:bg-error/10 transition-all"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-sm text-text-secondary mb-4 line-clamp-2">{goal.description}</p>
          )}

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Progress</span>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-bold bg-gradient-to-r ${getProgressColor(progress)} bg-clip-text text-transparent`}>
                  {progress}%
                </span>
                {progress >= 100 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 bg-success rounded-full flex items-center justify-center"
                  >
                    <Icon name="Check" size={12} color="#FFFFFF" />
                  </motion.div>
                )}
              </div>
            </div>
            <div className="progress-bar">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`progress-fill bg-gradient-to-r ${getProgressColor(progress)}`}
              />
            </div>
          </div>

          {/* Meta Info */}
          <div className="space-y-2">
            {/* Target */}
            {goal.targetValue && (
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <Icon name="Target" size={14} className="text-primary" />
                <span>Target: <span className="text-text-primary font-medium">{goal.targetValue} {goal.unit}</span></span>
              </div>
            )}

            {/* Deadline */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <Icon name="Calendar" size={14} />
                <span>{formatDate(goal.deadline)}</span>
              </div>
              {daysUntilDeadline !== null && (
                <motion.span 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    daysUntilDeadline < 0 
                      ? 'bg-error/20 text-error border border-error/30' 
                      : daysUntilDeadline <= 7 
                        ? 'bg-warning/20 text-warning border border-warning/30' 
                        : 'bg-success/20 text-success border border-success/30'
                  }`}
                >
                  {daysUntilDeadline < 0 
                    ? `${Math.abs(daysUntilDeadline)}d overdue` 
                    : daysUntilDeadline === 0 
                      ? 'Due today' 
                      : `${daysUntilDeadline}d left`
                  }
                </motion.span>
              )}
            </div>
          </div>

          {/* AI Score Badge (if available) */}
          {goal.aiPriorityScore && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-text-muted">
                  <Icon name="Sparkles" size={12} className="text-secondary" />
                  <span>AI Priority Score</span>
                </div>
                <span className="text-sm font-bold text-secondary">{goal.aiPriorityScore}/100</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom gradient accent */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${categoryConfig.gradient} opacity-50`} />
      </div>
    </motion.div>
  );
};

export default GoalCard;
