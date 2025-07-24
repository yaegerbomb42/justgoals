import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './ui/Icon';
import Button from './ui/Button';
import ProgressEntryModal from './ProgressEntryModal';

const CreativeHabitsTree = ({ habits, onCheckIn, onEditHabit, onDeleteHabit, onProgressUpdate }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressAmount, setProgressAmount] = useState('');
  const [showAdvancedProgress, setShowAdvancedProgress] = useState(false);

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

    // Helper function for date comparison
    const isToday = (date) => {
      return date === new Date().toISOString().split('T')[0];
    };

    // Create root node (today)
    const today = new Date().toISOString().split('T')[0];
    const rootNode = {
      id: 'root',
      type: 'root',
      date: today,
      x: 400, // Center position
      y: 80,
      level: 0
    };
    nodes.push(rootNode);

    // Get all dates across all habits and sort them
    const allDates = new Set();
    habits.forEach(habit => {
      if (habit.treeNodes && Array.isArray(habit.treeNodes)) {
        habit.treeNodes.forEach(node => {
          if (node && node.date) {
            allDates.add(node.date);
          }
        });
      }
    });
    const sortedDates = Array.from(allDates).sort().reverse(); // Most recent first

    // Create date nodes in a creative tree layout
    sortedDates.forEach((date, dateIndex) => {
      const isEven = dateIndex % 2 === 0;
      const branchOffset = Math.floor(dateIndex / 2) + 1;
      
      const dateNode = {
        id: `date-${date}`,
        type: 'date',
        date: date,
        x: isEven 
          ? 400 - (120 + branchOffset * 60)  // Left side
          : 400 + (120 + branchOffset * 60), // Right side
        y: 160 + dateIndex * 80,
        level: dateIndex + 1,
        isToday: date === today
      };
      nodes.push(dateNode);

      // Create branch from root to date node (only for today) or from previous date
      const fromNode = dateIndex === 0 ? rootNode : nodes.find(n => n.type === 'date' && n.date === sortedDates[dateIndex - 1]);
      if (fromNode) {
        branches.push({
          id: `branch-${fromNode.id}-${date}`,
          from: fromNode,
          to: dateNode,
          color: date === today ? '#3B82F6' : '#64748B',
          animated: date === today
        });
      }
    });

    // Create habit nodes branching from date nodes
    habits.forEach((habit, habitIndex) => {
      if (!habit || !habit.treeNodes || !Array.isArray(habit.treeNodes)) return;
      
      const habitColor = habit.color || colors[habitIndex % colors.length];
      
      habit.treeNodes.forEach((node, nodeIndex) => {
        if (!node || !node.date) return;
        
        const parentDateNode = nodes.find(n => 
          n && n.type === 'date' && n.date === node.date
        );
        
        if (parentDateNode) {
          const habitNodesForDate = habits.filter(h => 
            h && h.treeNodes && Array.isArray(h.treeNodes) && 
            h.treeNodes.some(hn => hn && hn.date === node.date)
          ).length;
          
          const angleStep = (Math.PI * 1.2) / Math.max(habitNodesForDate, 1);
          const startAngle = -Math.PI * 0.6 - (angleStep * (habitNodesForDate - 1)) / 2;
          const angle = startAngle + habitIndex * angleStep;
          const radius = 100 + (habitIndex % 2) * 20; // Vary radius slightly
          
          const habitNode = {
            id: `habit-${habit.id}-${node.id}`,
            type: 'habit',
            habitId: habit.id,
            nodeId: node.id,
            habit: habit,
            node: node,
            date: node.date,
            x: parentDateNode.x + Math.cos(angle) * radius,
            y: parentDateNode.y + Math.sin(angle) * radius + 50,
            level: parentDateNode.level + 1,
            color: habitColor
          };
          
          if (habitNode && habitNode.id) {
            nodes.push(habitNode);

            // Create branch from date node to habit node
            branches.push({
              id: `branch-${parentDateNode.id}-${habitNode.id}`,
              from: parentDateNode,
              to: habitNode,
              color: habitColor,
              animated: node.status === 'active' && isToday(node.date),
              opacity: node.status === 'failed' ? 0.5 : 1
            });
          }
        }
      });
    });

    return { nodes, branches };
  }, [habits]);

  const isToday = (date) => {
    return date === new Date().toISOString().split('T')[0];
  };

  const getHabitProgress = (habit, node) => {
    if (!habit || !node) return { current: 0, target: 1, percentage: 0, unit: '' };
    
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
        // Simple check-in for non-amount habits
        onCheckIn(node.habitId, node.nodeId);
      }
    }
  };

  const handleNodeRightClick = (e, node) => {
    e.preventDefault();
    if (node.type === 'habit') {
      setSelectedNode(node);
      setShowAdvancedProgress(true);
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

  const handleAdvancedProgressClose = () => {
    setShowAdvancedProgress(false);
    setSelectedNode(null);
  };

  const handleAddProgress = (habitId, nodeId, type, amount) => {
    onCheckIn(habitId, nodeId, type, amount);
  };

  const handleEditProgress = (habitId, nodeId, entryId, newAmount) => {
    // This would need to be implemented in the habit service
    console.log('Edit progress:', { habitId, nodeId, entryId, newAmount });
  };

  const handleDeleteProgress = (habitId, nodeId, entryId) => {
    // This would need to be implemented in the habit service  
    console.log('Delete progress:', { habitId, nodeId, entryId });
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
          <Icon name="Trees" className="w-16 h-16 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-semibold text-text-primary mb-3">Your Habit Forest Awaits</h3>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          Plant your first habit seed and watch your personal growth forest flourish with each daily commitment
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Left click to add progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
            <span>Right click to manage progress</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[600px] overflow-hidden bg-gradient-to-br from-surface to-surface-700 border border-border rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center">
          <motion.div
            className="w-2 h-2 bg-primary rounded-full mr-3"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Creative Habits Tree
        </h2>
        <p className="text-sm text-text-secondary">
          Your habit journey visualized as a living tree
        </p>
      </div>

      {/* Tree visualization container */}
      <div className="relative w-full h-[500px] overflow-hidden rounded-lg">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-800/30 to-slate-900/50" />
      
        {/* Tree visualization */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 800 500"
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
                >
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    path={`M ${branch.from.x} ${branch.from.y} Q ${(branch.from.x + branch.to.x) / 2} ${branch.from.y + 20} ${branch.to.x} ${branch.to.y}`}
                  />
                </motion.circle>
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
              style={{ left: `${(node.x / 800) * 100}%`, top: `${(node.y / 500) * 100}%` }}
              initial={{ scale: 0, opacity: 0, y: node.y + 20 }}
              animate={{ scale: 1, opacity: 1, y: node.y }}
              transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
              whileHover={{ scale: 1.1 }}
              onClick={() => handleNodeClick(node)}
              onContextMenu={(e) => handleNodeRightClick(e, node)}
            >
            {node.type === 'root' && (
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full shadow-lg flex items-center justify-center border-4 border-white/20"
                animate={node.isToday ? {
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
                  className={`w-12 h-12 bg-gradient-to-br rounded-full shadow-lg flex items-center justify-center border-2 mb-2 ${
                    node.isToday 
                      ? 'from-primary to-secondary border-primary shadow-primary/25' 
                      : 'from-surface-600 to-surface-700 border-border'
                  }`}
                  whileHover={{ 
                    scale: 1.2,
                    boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
                  }}
                  animate={node.isToday ? {
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className={`text-xs font-bold ${
                    node.isToday ? 'text-white' : 'text-text-primary'
                  }`}>
                    {new Date(node.date).getDate()}
                  </span>
                </motion.div>
                <div className={`text-xs whitespace-nowrap ${
                  node.isToday ? 'text-primary font-medium' : 'text-text-secondary'
                }`}>
                  {node.isToday ? 'Today' : new Date(node.date).toLocaleDateString('en-US', { month: 'short' })}
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
                    className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-3 transition-all relative ${
                      node.node.status === 'completed' 
                        ? 'border-success bg-success/20 shadow-success/25' 
                        : node.node.status === 'failed'
                          ? 'border-error bg-error/20 opacity-75'
                          : 'border-white/30 shadow-lg'
                    }`}
                    style={{ 
                      backgroundColor: node.color + '20',
                      borderColor: node.node.status === 'active' ? node.color : 
                                   node.node.status === 'completed' ? '#10B981' :
                                   node.node.status === 'failed' ? '#EF4444' : node.color
                    }}
                  >
                    <span className="text-xl">{node.habit.emoji}</span>
                    
                    {/* Interactive indicator for today's habits */}
                    {isToday(node.date) && node.node.status === 'active' && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="w-full h-full bg-white rounded-full scale-50"></div>
                      </motion.div>
                    )}
                  </div>

                  {/* Progress indicator */}
                  {(() => {
                    const progress = getHabitProgress(node.habit, node.node);
                    return (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-20">
                        <div className="text-xs font-medium text-text-primary mb-1 text-center">
                          {progress.current}/{progress.target}
                          {progress.unit && ` ${progress.unit}`}
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
                        className="w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Icon name="Check" className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    {node.node.status === 'failed' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-error rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Icon name="X" className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Enhanced hover tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-14 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
                    <div className="bg-surface-700 border border-border rounded-lg p-3 shadow-xl min-w-[220px] relative">
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-700"></div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{node.habit.emoji}</span>
                        <div className="text-sm font-medium text-text-primary">
                          {node.habit.title}
                        </div>
                      </div>
                      
                      {node.habit.description && (
                        <div className="text-xs text-text-secondary mb-2">
                          {node.habit.description}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">
                          {node.habit.trackingType === 'amount' ? 'Amount tracking' : 
                           node.habit.trackingType === 'count' ? 'Count tracking' : 'Simple check'}
                        </span>
                        <span className="text-text-secondary">
                          {new Date(node.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {isToday(node.date) && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Icon name="MousePointer" className="w-3 h-3" />
                            <span>Left click: Quick update</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-secondary mt-1">
                            <Icon name="Settings" className="w-3 h-3" />
                            <span>Right click: Manage progress</span>
                          </div>
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
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    Add Progress
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Progress Management Modal */}
      <AnimatePresence>
        {showAdvancedProgress && selectedNode && (
          <ProgressEntryModal
            isOpen={showAdvancedProgress}
            onClose={handleAdvancedProgressClose}
            habit={selectedNode.habit}
            node={selectedNode.node}
            onAddProgress={handleAddProgress}
            onEditProgress={handleEditProgress}
            onDeleteProgress={handleDeleteProgress}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default CreativeHabitsTree;