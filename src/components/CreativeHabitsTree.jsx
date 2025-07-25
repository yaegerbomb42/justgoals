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

  // Generate habit-centric tree structure where habits are main nodes and streaks are branches
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

    const today = new Date().toISOString().split('T')[0];

    // Create central root node representing the user's habit garden
    const rootNode = {
      id: 'root',
      type: 'root',
      date: today,
      x: 400, // Center position
      y: 250, // Center vertically
      level: 0
    };
    nodes.push(rootNode);

    // Calculate habit positions in a radial pattern around the center
    const centerX = 400;
    const centerY = 250;
    const habitRadius = 150; // Distance from center to habit nodes

    habits.forEach((habit, habitIndex) => {
      if (!habit || !habit.treeNodes || !Array.isArray(habit.treeNodes)) return;
      
      const habitColor = habit.color || colors[habitIndex % colors.length];
      
      // Position habits in a circle around the center
      const angleStep = (2 * Math.PI) / habits.length;
      const angle = habitIndex * angleStep - Math.PI / 2; // Start from top
      
      const habitNode = {
        id: `habit-${habit.id}`,
        type: 'habit',
        habitId: habit.id,
        habit: habit,
        x: centerX + Math.cos(angle) * habitRadius,
        y: centerY + Math.sin(angle) * habitRadius,
        level: 1,
        color: habitColor,
        angle: angle,
        streakLength: 0,
        currentStreak: 0,
        totalProgress: 0
      };

      // Calculate streak data
      const sortedNodes = habit.treeNodes
        .filter(node => node && node.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate current streak (consecutive completed days from today backwards)
      let currentStreak = 0;
      let streakLength = 0;
      let totalProgress = 0;

      // Count total completed days
      const completedDays = sortedNodes.filter(node => 
        node.status === 'completed' || 
        (node.status === 'active' && (node.checks?.length > 0 || node.currentProgress > 0))
      );
      
      streakLength = completedDays.length;
      totalProgress = sortedNodes.reduce((sum, node) => {
        if (habit.trackingType === 'amount') {
          return sum + (node.currentProgress || 0);
        } else {
          return sum + (node.checks?.length || 0);
        }
      }, 0);

      // Calculate current streak (consecutive days from today backwards)
      const todayDate = new Date();
      let checkDate = new Date(todayDate);
      
      while (checkDate >= new Date(sortedNodes[0]?.date || todayDate)) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayNode = sortedNodes.find(node => node.date === dateStr);
        
        if (dayNode && (dayNode.status === 'completed' || 
                       (dayNode.status === 'active' && (dayNode.checks?.length > 0 || dayNode.currentProgress > 0)))) {
          currentStreak++;
        } else {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }

      habitNode.streakLength = streakLength;
      habitNode.currentStreak = currentStreak;
      habitNode.totalProgress = totalProgress;

      nodes.push(habitNode);

      // Create branch from root to habit node
      branches.push({
        id: `branch-root-${habit.id}`,
        from: rootNode,
        to: habitNode,
        color: habitColor,
        animated: false,
        strokeWidth: 3 + Math.min(currentStreak * 0.5, 6), // Thicker branches for longer streaks
        opacity: 0.8
      });

      // Create streak branches extending from each habit
      // Show recent activity days as smaller nodes along the streak branches
      const recentDays = sortedNodes.slice(-7); // Last 7 days
      
      recentDays.forEach((node, dayIndex) => {
        if (!node || !node.date) return;

        // Position streak nodes along a branch extending from the habit
        const branchLength = 80 + (dayIndex * 15); // Extend outward
        const branchAngle = angle + (Math.PI / 4) * (dayIndex % 2 === 0 ? 1 : -1); // Alternate sides
        
        const streakNode = {
          id: `streak-${habit.id}-${node.id}`,
          type: 'streak',
          habitId: habit.id,
          nodeId: node.id,
          habit: habit,
          node: node,
          date: node.date,
          x: habitNode.x + Math.cos(branchAngle) * branchLength,
          y: habitNode.y + Math.sin(branchAngle) * branchLength,
          level: 2,
          color: habitColor,
          isToday: isToday(node.date),
          dayIndex: dayIndex
        };

        nodes.push(streakNode);

        // Create branch from habit to streak node
        branches.push({
          id: `branch-${habit.id}-${node.id}`,
          from: habitNode,
          to: streakNode,
          color: node.status === 'completed' ? '#10B981' : 
                 node.status === 'failed' ? '#EF4444' : 
                 habitColor,
          animated: isToday(node.date) && node.status === 'active',
          strokeWidth: node.status === 'completed' ? 3 : 2,
          opacity: node.status === 'failed' ? 0.4 : 0.8
        });
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
    if (node.type === 'habit') {
      // Clicked on main habit node - show habit overview or create today's entry
      const todayNode = node.habit.treeNodes?.find(n => isToday(n.date));
      if (todayNode) {
        const streakNode = { ...node, node: todayNode, nodeId: todayNode.id };
        setSelectedNode(streakNode);
        if (node.habit.trackingType === 'amount') {
          setShowProgressModal(true);
          setProgressAmount('');
        } else {
          onCheckIn(node.habitId, todayNode.id);
        }
      }
    } else if (node.type === 'streak' && isToday(node.date)) {
      // Clicked on today's streak node
      setSelectedNode(node);
      if (node.habit.trackingType === 'amount') {
        setShowProgressModal(true);
        setProgressAmount('');
      } else {
        onCheckIn(node.habitId, node.nodeId);
      }
    }
  };

  const handleNodeRightClick = (e, node) => {
    e.preventDefault();
    if (node.type === 'habit') {
      // Right-clicked on habit node - show management for today
      const todayNode = node.habit.treeNodes?.find(n => isToday(n.date));
      if (todayNode) {
        const streakNode = { ...node, node: todayNode, nodeId: todayNode.id };
        setSelectedNode(streakNode);
        setShowAdvancedProgress(true);
      }
    } else if (node.type === 'streak') {
      // Right-clicked on specific streak node
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
          <Icon name="Sparkles" className="w-16 h-16 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-semibold text-text-primary mb-3">Your Habit Garden Awaits</h3>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          Create your first habit and watch your personal growth garden flourish. Each habit becomes a tree with branches representing your daily streaks and achievements.
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
          Each habit grows as a tree with branches showing your streaks and progress
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
                strokeWidth={branch.strokeWidth || 3}
                fill="none"
                opacity={branch.opacity || 0.8}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: branch.opacity || 0.8,
                  strokeWidth: branch.animated ? [branch.strokeWidth || 3, (branch.strokeWidth || 3) + 2, branch.strokeWidth || 3] : branch.strokeWidth || 3
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
                className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full shadow-xl flex items-center justify-center border-4 border-white/20 relative"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(59, 130, 246, 0.4)',
                    '0 0 0 20px rgba(59, 130, 246, 0)',
                    '0 0 0 0 rgba(59, 130, 246, 0)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Icon name="Sparkles" className="w-10 h-10 text-white" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-sm font-semibold text-primary whitespace-nowrap">
                    Habit Garden
                  </div>
                </div>
              </motion.div>
            )}

            {node.type === 'habit' && (
              <div className="text-center relative">
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.15 }}
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {/* Main habit node */}
                  <div 
                    className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center border-4 transition-all relative"
                    style={{ 
                      backgroundColor: node.color + '30',
                      borderColor: node.color,
                      boxShadow: `0 8px 25px ${node.color}40`
                    }}
                  >
                    <span className="text-2xl">{node.habit.emoji}</span>
                    
                    {/* Streak indicator */}
                    {node.currentStreak > 0 && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-success to-success/80 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {node.currentStreak}
                      </motion.div>
                    )}
                  </div>

                  {/* Habit title and stats */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center min-w-[120px]">
                    <div className="text-sm font-semibold text-text-primary mb-1">
                      {node.habit.title}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {node.currentStreak > 0 ? (
                        <span className="text-success">🔥 {node.currentStreak} day streak</span>
                      ) : (
                        <span>Start your streak!</span>
                      )}
                    </div>
                    {node.streakLength > 0 && (
                      <div className="text-xs text-text-secondary">
                        {node.streakLength} total completions
                      </div>
                    )}
                  </div>

                  {/* Enhanced hover tooltip for habits with dynamic positioning */}
                  <div className={`absolute mb-16 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none ${
                    // Dynamic positioning based on node position to avoid cutoff
                    node.x < 200 ? 'left-0' : node.x > 600 ? 'right-0' : 'left-1/2 transform -translate-x-1/2'
                  } ${
                    node.y < 150 ? 'top-full mt-16' : 'bottom-full'
                  }`}>
                    <div className="bg-surface-700 border border-border rounded-lg p-4 shadow-xl min-w-[250px] relative">
                      {/* Dynamic tooltip arrow */}
                      {node.y >= 150 ? (
                        <div className={`absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-700 ${
                          node.x < 200 ? 'left-6' : node.x > 600 ? 'right-6' : 'left-1/2 transform -translate-x-1/2'
                        }`}></div>
                      ) : (
                        <div className={`absolute bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-surface-700 ${
                          node.x < 200 ? 'left-6' : node.x > 600 ? 'right-6' : 'left-1/2 transform -translate-x-1/2'
                        }`}></div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{node.habit.emoji}</span>
                        <div>
                          <div className="text-base font-semibold text-text-primary">
                            {node.habit.title}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {node.habit.trackingType === 'amount' ? 'Amount tracking' : 
                             node.habit.trackingType === 'count' ? 'Count tracking' : 'Simple check'}
                          </div>
                        </div>
                      </div>
                      
                      {node.habit.description && (
                        <div className="text-sm text-text-secondary mb-3">
                          {node.habit.description}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 text-center mb-3">
                        <div className="bg-surface-600 rounded-lg p-2">
                          <div className="text-lg font-bold text-success">{node.currentStreak}</div>
                          <div className="text-xs text-text-secondary">Current Streak</div>
                        </div>
                        <div className="bg-surface-600 rounded-lg p-2">
                          <div className="text-lg font-bold text-primary">{node.streakLength}</div>
                          <div className="text-xs text-text-secondary">Total Days</div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-primary mb-1">
                          <Icon name="MousePointer" className="w-3 h-3" />
                          <span>Left click: Quick update for today</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-secondary">
                          <Icon name="Settings" className="w-3 h-3" />
                          <span>Right click: Manage progress</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {node.type === 'streak' && (
              <div className="text-center relative">
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.2 }}
                  animate={node.isToday ? {
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Streak day node */}
                  <div 
                    className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 transition-all ${
                      node.node.status === 'completed' 
                        ? 'border-success bg-success/30 shadow-success/25' 
                        : node.node.status === 'failed'
                          ? 'border-error bg-error/20 opacity-75'
                          : node.isToday
                            ? 'border-primary bg-primary/30 shadow-primary/25'
                            : 'border-gray-400 bg-gray-400/20'
                    }`}
                  >
                    {node.node.status === 'completed' && (
                      <Icon name="Check" className="w-4 h-4 text-success" />
                    )}
                    {node.node.status === 'failed' && (
                      <Icon name="X" className="w-4 h-4 text-error" />
                    )}
                    {node.isToday && node.node.status === 'active' && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                    {!node.isToday && node.node.status === 'active' && (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </div>

                  {/* Date label for today or recent days with progress for today */}
                  {(node.isToday || node.dayIndex < 3) && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                      <div className={`text-xs whitespace-nowrap ${
                        node.isToday ? 'text-primary font-semibold' : 'text-text-secondary'
                      }`}>
                        {node.isToday ? 'Today' : new Date(node.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      {/* Show current progress numbers for today */}
                      {node.isToday && (
                        <div className="text-xs text-text-secondary mt-1">
                          {(() => {
                            const progress = getHabitProgress(node.habit, node.node);
                            return `${progress.current}/${progress.target}`;
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress tooltip for streak nodes */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-8 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
                    <div className="bg-surface-700 border border-border rounded-lg p-3 shadow-xl min-w-[180px] relative">
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-700"></div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-text-primary mb-1">
                          {new Date(node.date).toLocaleDateString()}
                        </div>
                        
                        {(() => {
                          const progress = getHabitProgress(node.habit, node.node);
                          return (
                            <div className="text-xs text-text-secondary">
                              Progress: {progress.current}/{progress.target}
                              {progress.unit && ` ${progress.unit}`}
                            </div>
                          );
                        })()}
                        
                        <div className={`text-xs mt-1 capitalize ${
                          node.node.status === 'completed' ? 'text-success' :
                          node.node.status === 'failed' ? 'text-error' :
                          node.isToday ? 'text-primary' : 'text-text-secondary'
                        }`}>
                          {node.node.status === 'active' && node.isToday ? 'In Progress' : node.node.status}
                        </div>

                        {node.isToday && (
                          <div className="mt-2 pt-2 border-t border-border text-xs text-primary">
                            Click to update progress
                          </div>
                        )}
                      </div>
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