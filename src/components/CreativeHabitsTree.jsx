import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './ui/Icon';
import Button from './ui/Button';

const CreativeHabitsTree = ({ habits, onCheckIn, onEditHabit, onDeleteHabit, onProgressUpdate }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressAmount, setProgressAmount] = useState('');

  // Generate tree structure with creative positioning
  const treeStructure = useMemo(() => {
    if (!habits || habits.length === 0) return { nodes: [], branches: [] };

    const nodes = [];
    const branches = [];
    const colors = [
      '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
      '#EF4444', '#06B6D4', '#84CC16', '#F97316',
      '#EC4899', '#6366F1', '#14B8A6', '#F59E0B'
    ];

    // Create root node (today)
    const today = new Date().toISOString().split('T')[0];
    const rootNode = {
      id: 'root',
      type: 'root',
      date: today,
      x: 400, // Center position
      y: 50,
      level: 0
    };
    nodes.push(rootNode);

    // Get all dates across all habits and sort them
    const allDates = new Set();
    habits.forEach(habit => {
      if (habit.treeNodes) {
        habit.treeNodes.forEach(node => allDates.add(node.date));
      }
    });
    const sortedDates = Array.from(allDates).sort();

    // Create date nodes in a creative tree layout
    sortedDates.forEach((date, dateIndex) => {
      if (date !== today) {
        const dateNode = {
          id: `date-${date}`,
          type: 'date',
          date: date,
          x: 400 + (dateIndex % 2 === 0 ? -150 : 150) * Math.ceil(dateIndex / 2),
          y: 120 + dateIndex * 80,
          level: dateIndex + 1
        };
        nodes.push(dateNode);

        // Create branch from root to date node
        branches.push({
          id: `branch-root-${date}`,
          from: rootNode,
          to: dateNode,
          color: '#64748B'
        });
      }
    });

    // Create habit nodes branching from date nodes
    habits.forEach((habit, habitIndex) => {
      const habitColor = habit.color || colors[habitIndex % colors.length];
      
      if (habit.treeNodes) {
        habit.treeNodes.forEach((node, nodeIndex) => {
          const parentDateNode = nodes.find(n => 
            (n.type === 'date' && n.date === node.date) || 
            (n.type === 'root' && n.date === node.date)
          );
          
          if (parentDateNode) {
            const angleStep = (2 * Math.PI) / Math.max(habits.length, 3);
            const angle = habitIndex * angleStep - Math.PI / 2;
            const radius = 80;
            
            const habitNode = {
              id: `habit-${habit.id}-${node.id}`,
              type: 'habit',
              habitId: habit.id,
              nodeId: node.id,
              habit: habit,
              node: node,
              date: node.date,
              x: parentDateNode.x + Math.cos(angle) * radius,
              y: parentDateNode.y + Math.sin(angle) * radius + 40,
              level: parentDateNode.level + 1,
              color: habitColor
            };
            nodes.push(habitNode);

            // Create branch from date node to habit node
            branches.push({
              id: `branch-${parentDateNode.id}-${habitNode.id}`,
              from: parentDateNode,
              to: habitNode,
              color: habitColor,
              animated: node.status === 'active' && isToday(node.date)
            });
          }
        });
      }
    });

    return { nodes, branches };
  }, [habits]);

  const isToday = (date) => {
    return date === new Date().toISOString().split('T')[0];
  };

  const getHabitProgress = (habit, node) => {
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

  const handleNodeClick = (node) => {
    if (node.type === 'habit' && isToday(node.date)) {
      setSelectedNode(node);
      if (node.habit.trackingType === 'amount') {
        setShowProgressModal(true);
        setProgressAmount('');
      } else {
        // Simple check-in
        onCheckIn(node.habitId, node.nodeId);
      }
    }
  };

  const handleProgressSubmit = () => {
    if (selectedNode && progressAmount) {
      const amount = parseFloat(progressAmount);
      if (amount > 0) {
        onCheckIn(selectedNode.habitId, selectedNode.nodeId, 'default', amount);
        setShowProgressModal(false);
        setSelectedNode(null);
        setProgressAmount('');
      }
    }
  };

  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div 
          className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-surface-700 to-surface-800 rounded-full flex items-center justify-center shadow-lg"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Icon name="TreePine" className="w-16 h-16 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-semibold text-text-primary mb-3">Your Habit Forest Awaits</h3>
        <p className="text-text-secondary max-w-md mx-auto">
          Plant your first habit seed and watch your personal growth forest flourish with each daily commitment
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[600px] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-xl" />
      
      {/* Tree visualization */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 800 600"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
      >
        {/* Render branches */}
        <AnimatePresence>
          {treeStructure.branches.map((branch) => (
            <motion.g key={branch.id}>
              <motion.path
                d={`M ${branch.from.x} ${branch.from.y} Q ${(branch.from.x + branch.to.x) / 2} ${branch.from.y + 20} ${branch.to.x} ${branch.to.y}`}
                stroke={branch.color}
                strokeWidth={branch.animated ? 4 : 3}
                fill="none"
                opacity={0.8}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 0.8,
                  strokeWidth: branch.animated ? [3, 5, 3] : 3
                }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeInOut",
                  repeat: branch.animated ? Infinity : 0,
                  repeatDuration: 2
                }}
                style={{
                  filter: branch.animated ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                }}
              />
              
              {/* Animated particles for active branches */}
              {branch.animated && (
                <motion.circle
                  r="3"
                  fill={branch.color}
                  opacity={0.6}
                  initial={{ 
                    offsetDistance: "0%",
                    scale: 0
                  }}
                  animate={{ 
                    offsetDistance: "100%",
                    scale: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    offsetPath: `path('M ${branch.from.x} ${branch.from.y} Q ${(branch.from.x + branch.to.x) / 2} ${branch.from.y + 20} ${branch.to.x} ${branch.to.y}')`
                  }}
                />
              )}
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>

      {/* Render nodes */}
      <AnimatePresence>
        {treeStructure.nodes.map((node, index) => (
          <motion.div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: node.x, top: node.y }}
            initial={{ scale: 0, opacity: 0, y: node.y + 20 }}
            animate={{ scale: 1, opacity: 1, y: node.y }}
            transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
            whileHover={{ scale: 1.1 }}
            onClick={() => handleNodeClick(node)}
          >
            {node.type === 'root' && (
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full shadow-lg flex items-center justify-center border-4 border-white/20"
                animate={isToday(node.date) ? {
                  boxShadow: [
                    '0 0 0 0 rgba(59, 130, 246, 0.4)',
                    '0 0 0 20px rgba(59, 130, 246, 0)',
                    '0 0 0 0 rgba(59, 130, 246, 0)'
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon name="Calendar" className="w-8 h-8 text-white" />
              </motion.div>
            )}

            {node.type === 'date' && (
              <div className="text-center">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-surface-600 to-surface-700 rounded-full shadow-lg flex items-center justify-center border-2 border-border mb-2"
                  whileHover={{ 
                    scale: 1.2,
                    boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
                  }}
                >
                  <span className="text-xs font-bold text-text-primary">
                    {new Date(node.date).getDate()}
                  </span>
                </motion.div>
                <div className="text-xs text-text-secondary whitespace-nowrap">
                  {new Date(node.date).toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
            )}

            {node.type === 'habit' && (
              <div className="text-center">
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.1 }}
                  animate={isToday(node.date) && node.node.status === 'active' ? {
                    scale: [1, 1.05, 1]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Habit node */}
                  <div 
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-3 transition-all ${
                      node.node.status === 'completed' 
                        ? 'border-success bg-success/20' 
                        : node.node.status === 'failed'
                          ? 'border-error bg-error/20'
                          : 'border-white/30'
                    }`}
                    style={{ 
                      backgroundColor: node.color + '20',
                      borderColor: node.node.status === 'active' ? node.color : undefined
                    }}
                  >
                    <span className="text-xl">{node.habit.emoji}</span>
                  </div>

                  {/* Progress indicator */}
                  {(() => {
                    const progress = getHabitProgress(node.habit, node.node);
                    return (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-20">
                        <div className="text-xs font-medium text-text-primary mb-1 text-center">
                          {progress.current}/{progress.target}
                        </div>
                        <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="h-1.5 rounded-full"
                            style={{ backgroundColor: progress.percentage >= 100 ? '#10B981' : node.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status indicators */}
                  <div className="absolute -top-2 -right-2">
                    {node.node.status === 'completed' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-6 h-6 bg-success rounded-full flex items-center justify-center"
                      >
                        <Icon name="Check" className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    {node.node.status === 'failed' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-error rounded-full flex items-center justify-center"
                      >
                        <Icon name="X" className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-12 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <div className="bg-surface-700 border border-border rounded-lg p-3 shadow-xl min-w-[200px]">
                      <div className="text-sm font-medium text-text-primary mb-1">
                        {node.habit.title}
                      </div>
                      <div className="text-xs text-text-secondary mb-2">
                        {node.habit.description}
                      </div>
                      {isToday(node.date) && node.node.status === 'active' && (
                        <div className="text-xs text-primary font-medium">
                          Click to update progress
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Progress input modal */}
      <AnimatePresence>
        {showProgressModal && selectedNode && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProgressModal(false)}
          >
            <motion.div
              className="bg-surface-700 rounded-xl p-6 m-4 w-full max-w-sm border border-border shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">{selectedNode.habit.emoji}</div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedNode.habit.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  Add your progress for today
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Amount {selectedNode.habit.unit && `(${selectedNode.habit.unit})`}
                  </label>
                  <input
                    type="number"
                    value={progressAmount}
                    onChange={(e) => setProgressAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full px-4 py-3 bg-surface-600 border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowProgressModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProgressSubmit}
                    disabled={!progressAmount || parseFloat(progressAmount) <= 0}
                  >
                    Add Progress
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreativeHabitsTree;