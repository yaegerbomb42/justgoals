import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './ui/Icon';
import Button from './ui/Button';

const ProgressEntryModal = ({ 
  isOpen, 
  onClose, 
  habit, 
  node, 
  onAddProgress, 
  onEditProgress, 
  onDeleteProgress 
}) => {
  const [progressAmount, setProgressAmount] = useState('');
  const [progressType, setProgressType] = useState('add');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setProgressAmount('');
      setProgressType('add');
      setEditingEntry(null);
      setShowDeleteConfirm(null);
    }
  }, [isOpen]);

  if (!isOpen || !habit || !node) return null;

  const handleSubmit = () => {
    const amount = parseFloat(progressAmount);
    if (amount <= 0) return;

    if (editingEntry) {
      onEditProgress(habit.id, node.id, editingEntry.id, amount);
    } else {
      onAddProgress(habit.id, node.id, progressType, amount);
    }
    
    setProgressAmount('');
    setEditingEntry(null);
    onClose();
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setProgressAmount(entry.amount?.toString() || '1');
  };

  const handleDelete = (entryId) => {
    onDeleteProgress(habit.id, node.id, entryId);
    setShowDeleteConfirm(null);
  };

  const getProgressEntries = () => {
    if (habit.trackingType === 'amount') {
      // For amount-based habits, show a single progress entry
      return [{
        id: 'current',
        amount: node.currentProgress || 0,
        timestamp: node.updatedAt || new Date().toISOString(),
        type: 'amount'
      }];
    } else {
      // For check-based habits, show individual checks
      return node.checks || [];
    }
  };

  const getProgress = () => {
    if (habit.trackingType === 'amount') {
      const current = node.currentProgress || 0;
      const target = habit.targetAmount || 1;
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        unit: habit.unit || ''
      };
    } else {
      const current = node.checks?.length || 0;
      const target = habit.targetChecks || 1;
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        unit: 'completions'
      };
    }
  };

  const progress = getProgress();
  const entries = getProgressEntries();

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface-700 rounded-xl p-6 m-4 w-full max-w-md border border-border shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{habit.emoji}</span>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {habit.title}
              </h3>
              <p className="text-sm text-text-secondary">
                Manage Progress
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-600 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Current Progress */}
        <div className="mb-6 p-4 bg-surface-600 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Current Progress</span>
            <span className="text-lg font-bold text-primary">
              {progress.current}/{progress.target} {progress.unit}
            </span>
          </div>
          <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {progress.percentage}% complete
          </div>
        </div>

        {/* Add/Edit Progress */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-primary mb-3">
            {editingEntry ? 'Edit Progress Entry' : 'Add New Progress'}
          </h4>
          
          <div className="space-y-4">
            {/* Progress Type for amount-based habits */}
            {habit.trackingType === 'amount' && !editingEntry && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Progress Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setProgressType('add')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      progressType === 'add'
                        ? 'bg-primary text-white'
                        : 'bg-surface-600 text-text-secondary hover:bg-surface-500'
                    }`}
                  >
                    ➕ Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressType('subtract')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      progressType === 'subtract'
                        ? 'bg-warning text-white'
                        : 'bg-surface-600 text-text-secondary hover:bg-surface-500'
                    }`}
                  >
                    ➖ Subtract
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressType('set')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      progressType === 'set'
                        ? 'bg-secondary text-white'
                        : 'bg-surface-600 text-text-secondary hover:bg-surface-500'
                    }`}
                  >
                    📝 Set
                  </button>
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {progressType === 'add' && 'Add to current progress'}
                  {progressType === 'subtract' && 'Subtract from current progress'}
                  {progressType === 'set' && 'Set exact progress amount'}
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Amount {habit.unit && `(${habit.unit})`}
              </label>
              <input
                type="number"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                placeholder={editingEntry ? "Edit amount..." : "Enter amount..."}
                className="w-full px-4 py-3 bg-surface-600 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
                min="0"
                step={habit.trackingType === 'amount' ? '0.1' : '1'}
              />
            </div>

            {/* Quick Amount Buttons */}
            {habit.trackingType === 'amount' && !editingEntry && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Quick amounts:
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const suggestions = habit.unit === 'steps' ? [1000, 2500, 5000] :
                                      habit.unit === 'glasses' ? [1, 2, 4] :
                                      habit.unit === 'minutes' ? [5, 15, 30] :
                                      habit.unit === 'pages' ? [1, 5, 10] :
                                      [1, 5, 10];
                    
                    return suggestions.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setProgressAmount(amount.toString())}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-surface-600 text-text-secondary hover:bg-surface-500 hover:text-text-primary transition-all"
                      >
                        {amount.toLocaleString()}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              {editingEntry && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingEntry(null);
                    setProgressAmount('');
                  }}
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!progressAmount || parseFloat(progressAmount) <= 0}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {editingEntry ? 'Update' : 'Add'} Progress
              </Button>
            </div>
          </div>
        </div>

        {/* Progress History */}
        {entries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-3">
              Progress History
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id || index}
                  className="flex items-center justify-between p-3 bg-surface-600 rounded-lg border border-border"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {habit.trackingType === 'amount' 
                          ? `${entry.amount} ${habit.unit || 'units'}`
                          : `Completion ${index + 1}`
                        }
                      </div>
                      <div className="text-xs text-text-secondary">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {habit.trackingType === 'amount' && (
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1 text-text-secondary hover:text-primary transition-colors"
                        title="Edit entry"
                      >
                        <Icon name="Edit" size={14} />
                      </button>
                    )}
                    {entries.length > 1 && (
                      <button
                        onClick={() => setShowDeleteConfirm(entry.id || index)}
                        className="p-1 text-text-secondary hover:text-error transition-colors"
                        title="Delete entry"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {showDeleteConfirm !== null && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-surface-700 rounded-lg p-6 m-4 w-full max-w-sm border border-border shadow-xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <div className="text-center mb-4">
                  <Icon name="AlertTriangle" className="w-12 h-12 text-warning mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Delete Progress Entry?
                  </h3>
                  <p className="text-text-secondary">
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(showDeleteConfirm)}
                  >
                    Delete
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ProgressEntryModal;