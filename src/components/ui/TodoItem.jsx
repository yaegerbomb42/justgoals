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

  const getPriorityIcon = (priority) => {
    if (!priority || priority < 3) return 'Circle';
    if (priority < 6) return 'Minus';
    if (priority < 8) return 'ArrowUp';
    return 'AlertTriangle';
  };

  const getPriorityBadgeStyle = (priority) => {
    if (!priority || priority < 3) return 'bg-gray-100 text-gray-600';
    if (priority < 6) return 'bg-amber-100 text-amber-700';
    if (priority < 8) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await onComplete(todo.id);
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
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: isCompleting ? 0.5 : 1, 
        y: 0, 
        scale: isCompleting ? 0.95 : 1,
        x: isCompleting ? -20 : 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        x: -100,
        transition: { duration: 0.3 }
      }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ scale: 1.02 }}
      className="group bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-200 hover:shadow-lg"
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
              {todo.priority && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold ${getPriorityBadgeStyle(todo.priority)}`}
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
                    className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary/80 transition-colors"
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
                      className="flex items-center gap-1 text-purple-500 bg-purple-500/10 px-2 py-1 rounded-full"
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
              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all duration-200 disabled:opacity-50"
              title="Complete"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon 
                name={isCompleting ? "Loader2" : "Check"} 
                className={`w-4 h-4 ${isCompleting ? 'animate-spin' : ''}`} 
              />
            </motion.button>
            
            <motion.button
              onClick={() => onDelete(todo.id)}
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              title="Delete"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon name="Trash2" className="w-4 h-4" />
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
            className={`h-full ${todo.priority >= 8 ? 'bg-red-500' : todo.priority >= 6 ? 'bg-orange-500' : todo.priority >= 3 ? 'bg-amber-500' : 'bg-gray-400'}`}
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