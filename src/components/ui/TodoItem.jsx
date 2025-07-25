import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

const TodoItem = ({ 
  todo, 
  onComplete, 
  onDelete, 
  onUpdate, 
  getPriorityColor, 
  getPriorityLabel, 
  index 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDopamine, setShowDopamine] = useState(false);

  const getPriorityIcon = (priority) => {
    const p = priority || 1; // Default to 1 instead of 0
    if (p < 3) return 'Circle';
    if (p < 6) return 'Minus';
    if (p < 8) return 'ArrowUp';
    return 'AlertTriangle';
  };

  const getPriorityBadgeStyle = (priority) => {
    const p = priority || 1; // Default to 1 instead of 0
    if (p < 3) return 'bg-surface-200 text-text-muted';
    if (p < 6) return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 shadow-sm';
    if (p < 8) return 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-600 shadow-md';
    return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-600 shadow-lg';
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    setShowDopamine(true);
    
    // Add dopamine effect before calling onComplete
    setTimeout(async () => {
      await onComplete(todo.id);
      setIsCompleting(false);
    }, 300); // Give time for animation to show
    
    setTimeout(() => setShowDopamine(false), 1200);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editText.trim() && editText !== todo.text) {
      await onUpdate(todo.id, { text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: isCompleting ? 0.8 : 1, 
        y: 0, 
        scale: 1,
        x: 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.9,
        x: -50,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        delay: index * 0.03,
        type: "tween",
        duration: 0.3,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.1 }
      }}
      className={`group relative bg-gradient-to-br from-surface to-surface/80 border border-border/60 rounded-2xl overflow-hidden 
        hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 backdrop-blur-sm
        ${showDopamine ? 'ring-2 ring-success/60 shadow-success/30 shadow-lg' : ''}
        ${isCompleting ? 'animate-pulse' : ''}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Priority Indicator */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="relative"
            >
              <Icon 
                name={getPriorityIcon(todo.priority)} 
                className={`w-4 h-4 ${getPriorityColor(todo.priority)}`} 
              />
              {(todo.priority && todo.priority > 1) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${getPriorityBadgeStyle(todo.priority)} border-2 border-surface shadow-md`}
                >
                  {todo.priority}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Todo Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={handleSaveEdit}
                  autoFocus
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:outline-none text-text-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/80 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-surface-700 text-text-secondary rounded-md text-sm hover:bg-surface-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <motion.p 
                  className="text-text-primary font-medium mb-1 break-words cursor-pointer hover:text-primary transition-colors"
                  onClick={handleEdit}
                  whileHover={{ x: 2 }}
                >
                  {todo.text}
                </motion.p>
                
                <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                  <span>
                    {new Date(todo.createdAt?.toDate?.() || todo.createdAt).toLocaleDateString()}
                  </span>
                  
                  {todo.aiPrioritized && (
                    <motion.span 
                      className="flex items-center gap-1 text-secondary bg-secondary/10 px-2 py-1 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Icon name="Sparkles" className="w-3 h-3" />
                      AI Prioritized
                    </motion.span>
                  )}
                  
                  {todo.priority && (
                    <motion.span 
                      className={`${getPriorityColor(todo.priority)} bg-opacity-10 px-2 py-1 rounded-full font-medium`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {getPriorityLabel(todo.priority)} Priority
                    </motion.span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <motion.div 
            className="flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
          >
            <motion.button
              onClick={handleComplete}
              disabled={isCompleting}
              className="p-3 text-success hover:bg-success/20 rounded-xl transition-all duration-200 disabled:opacity-50 scale-110"
              title="Complete"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon 
                name={isCompleting ? "Loader2" : "Check"} 
                className={`w-6 h-6 ${isCompleting ? 'animate-spin' : ''}`} 
              />
            </motion.button>
            <motion.button
              onClick={() => onDelete(todo.id)}
              className="p-3 text-error hover:bg-error/20 rounded-xl transition-all duration-200 scale-110"
              title="Delete"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon name="Trash2" className="w-6 h-6" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Progress bar for priority */}
      {todo.priority && (
        <motion.div
          className="h-1 bg-surface-200"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
        >
          <motion.div
            className={`h-full ${todo.priority >= 8 ? 'bg-error' : todo.priority >= 6 ? 'bg-warning' : todo.priority >= 3 ? 'bg-warning/70' : 'bg-muted'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: todo.priority / 10 }}
            transition={{ delay: index * 0.05 + 0.5, duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: 'left' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default TodoItem;