import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './ui/Icon';
import Button from './ui/Button';

const HabitsTreeVisualization = ({ habits, onCheckIn, onDeleteHabit, onEditHabit }) => {
  // Create unified tree structure from habits
  const treeData = useMemo(() => {
    if (!habits || habits.length === 0) return { timelineNodes: [], habitBranches: {} };

    // Get all unique dates from all habits
    const allDates = new Set();
    habits.forEach(habit => {
      if (habit.treeNodes) {
        habit.treeNodes.forEach(node => allDates.add(node.date));
      }
    });

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();

    // Create timeline nodes
    const timelineNodes = sortedDates.map((date, index) => ({
      id: `timeline-${date}`,
      date,
      level: index,
      habitsStarted: habits.filter(habit => 
        habit.treeNodes && habit.treeNodes.some(node => node.date === date && index === 0)
      )
    }));

    // Create habit branches with color coding
    const habitBranches = {};
    const colors = [
      '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
      '#EF4444', '#06B6D4', '#84CC16', '#F97316',
      '#EC4899', '#6366F1', '#14B8A6', '#F59E0B'
    ];

    habits.forEach((habit, index) => {
      const color = habit.color || colors[index % colors.length];
      habitBranches[habit.id] = {
        ...habit,
        color,
        nodes: habit.treeNodes || [],
        startDate: habit.treeNodes && habit.treeNodes.length > 0 
          ? habit.treeNodes[0].date 
          : new Date().toISOString().split('T')[0]
      };
    });

    return { timelineNodes, habitBranches };
  }, [habits]);

  const getHabitProgress = (habit, date) => {
    const node = habit.nodes.find(n => n.date === date);
    if (!node) return { completed: 0, total: habit.targetChecks || 1, percentage: 0 };
    
    const completed = node.checks?.length || 0;
    const total = habit.targetChecks || 1;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const isToday = (date) => {
    return date === new Date().toISOString().split('T')[0];
  };

  const getHabitStatusForDate = (habit, date) => {
    const node = habit.nodes.find(n => n.date === date);
    if (!node) return 'inactive';
    return node.status || 'active';
  };

  const getStreakInfo = (habit) => {
    if (!habit.nodes || habit.nodes.length === 0) return { current: 0, longest: 0 };
    
    const completedNodes = habit.nodes
      .filter(node => node.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let currentStreak = 0;
    for (const node of completedNodes) {
      const checks = node.checks || [];
      const targetChecks = habit.targetChecks || 1;
      if (checks.length >= targetChecks) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return { current: currentStreak, longest: currentStreak }; // Simplified
  };

  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-12">
        <motion.div 
          className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-surface-700 to-surface-800 rounded-full flex items-center justify-center shadow-lg"
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
          <Icon name="GitBranch" className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Habits Tree Yet</h3>
        <p className="text-text-secondary">
          Create your first habit to start growing your habit tree
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-surface to-surface-700 border border-border rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center">
            <motion.div
              className="w-2 h-2 bg-primary rounded-full mr-3"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Habits Tree
          </h2>
          <p className="text-sm text-text-secondary">
            Your unified habit journey visualization
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {Object.keys(treeData.habitBranches).length}
            </div>
            <div className="text-xs text-text-secondary">active habits</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-success">
              {Object.values(treeData.habitBranches).reduce((sum, habit) => {
                return sum + habit.nodes.filter(n => n.status === 'completed').length;
              }, 0)}
            </div>
            <div className="text-xs text-text-secondary">completed days</div>
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="relative">
        {/* Main timeline trunk with gradient */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary/50 rounded-full shadow-sm"></div>
        
        <AnimatePresence>
          {treeData.timelineNodes.map((timelineNode, timelineIndex) => (
            <motion.div 
              key={timelineNode.id} 
              className="relative mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: timelineIndex * 0.1 }}
            >
              {/* Timeline node */}
              <div className="flex items-center mb-4">
                <motion.div 
                  className={`relative z-10 w-6 h-6 border-4 border-surface rounded-full flex items-center justify-center shadow-lg ${
                    isToday(timelineNode.date) 
                      ? 'bg-gradient-to-r from-primary to-secondary' 
                      : 'bg-gradient-to-r from-surface-600 to-surface-700'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  animate={isToday(timelineNode.date) ? { 
                    boxShadow: [
                      '0 0 0 0 rgba(59, 130, 246, 0.4)',
                      '0 0 0 10px rgba(59, 130, 246, 0)',
                      '0 0 0 0 rgba(59, 130, 246, 0)'
                    ]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isToday(timelineNode.date) && (
                    <motion.div 
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{ scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-text-primary">
                    {new Date(timelineNode.date).toLocaleDateString()}
                    {isToday(timelineNode.date) && (
                      <motion.span 
                        className="ml-2 text-xs text-primary font-bold"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        TODAY
                      </motion.span>
                    )}
                  </div>
                  {timelineNode.habitsStarted.length > 0 && (
                    <div className="text-xs text-text-secondary">
                      {timelineNode.habitsStarted.length} habit{timelineNode.habitsStarted.length > 1 ? 's' : ''} started
                    </div>
                  )}
                </div>
              </div>

              {/* Habit branches for this date */}
              <div className="ml-12 space-y-3">
                {Object.values(treeData.habitBranches).map((habit, habitIndex) => {
                  const hasNodeForDate = habit.nodes.some(n => n.date === timelineNode.date);
                  if (!hasNodeForDate) return null;

                  const progress = getHabitProgress(habit, timelineNode.date);
                  const status = getHabitStatusForDate(habit, timelineNode.date);
                  const isHabitToday = isToday(timelineNode.date);
                  const streakInfo = getStreakInfo(habit);

                  return (
                    <motion.div
                      key={`${habit.id}-${timelineNode.date}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: habitIndex * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="relative group"
                    >
                      {/* Animated branch line */}
                      <motion.div 
                        className="absolute -left-8 top-4 w-8 h-0.5 rounded-full shadow-sm"
                        style={{ backgroundColor: habit.color }}
                        initial={{ width: 0 }}
                        animate={{ width: 32 }}
                        transition={{ delay: habitIndex * 0.1 + 0.2 }}
                      />

                      {/* Habit node */}
                      <motion.div 
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isHabitToday 
                            ? 'bg-gradient-to-r from-surface-600 to-surface-700 border-opacity-60 shadow-lg' 
                            : status === 'completed'
                              ? 'bg-gradient-to-r from-success/10 to-success/5 border-success/30'
                              : status === 'failed'
                                ? 'bg-gradient-to-r from-error/10 to-error/5 border-error/30'
                                : 'bg-gradient-to-r from-surface-700 to-surface-800 border-border'
                        }`}
                        style={{ 
                          borderColor: isHabitToday ? habit.color : undefined,
                          boxShadow: isHabitToday ? `0 0 20px ${habit.color}20` : undefined
                        }}
                        whileHover={{ 
                          boxShadow: `0 0 30px ${habit.color}30`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                              style={{ backgroundColor: habit.color }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              {habit.emoji}
                            </motion.div>
                            <div>
                              <div className="font-medium text-text-primary text-sm flex items-center">
                                {habit.title}
                                {streakInfo.current > 0 && (
                                  <motion.div 
                                    className="ml-2 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full flex items-center"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Icon name="Flame" size={10} className="mr-1" />
                                    {streakInfo.current}
                                  </motion.div>
                                )}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {progress.completed}/{progress.total} completed
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {/* Animated progress bar */}
                            <div className="w-20">
                              <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{ backgroundColor: progress.percentage >= 100 ? '#10B981' : habit.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress.percentage}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                              </div>
                              <div className="text-xs text-center mt-1 text-text-secondary">
                                {progress.percentage}%
                              </div>
                            </div>

                            {/* Status indicators with animations */}
                            {status === 'completed' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.2 }}
                              >
                                <Icon name="CheckCircle" className="w-5 h-5 text-success" />
                              </motion.div>
                            )}
                            {status === 'failed' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.2, rotate: 180 }}
                                className="relative"
                              >
                                <Icon name="X" className="w-5 h-5 text-error" />
                                <motion.div
                                  className="absolute -inset-1 bg-error/20 rounded-full"
                                  animate={{ 
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 0, 0.3]
                                  }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              </motion.div>
                            )}
                            
                            {/* Check-in button for today */}
                            {isHabitToday && status === 'active' && progress.percentage < 100 && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const node = habit.nodes.find(n => n.date === timelineNode.date);
                                    if (node && onCheckIn) {
                                      onCheckIn(habit.id, node.id);
                                    }
                                  }}
                                  style={{ backgroundColor: habit.color }}
                                  className="text-white border-0 hover:opacity-80 shadow-lg"
                                >
                                  <Icon name="Plus" size={12} />
                                </Button>
                              </motion.div>
                            )}

                            {/* Habit management menu */}
                            {isHabitToday && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.div
                                  className="flex items-center space-x-1"
                                  initial={{ x: 10 }}
                                  animate={{ x: 0 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEditHabit && onEditHabit(habit)}
                                    className="w-6 h-6 p-0"
                                  >
                                    <Icon name="Edit" size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDeleteHabit && onDeleteHabit(habit.id)}
                                    className="w-6 h-6 p-0 text-error hover:text-error"
                                  >
                                    <Icon name="Trash2" size={12} />
                                  </Button>
                                </motion.div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Extra actions for today */}
                        {isHabitToday && (
                          <motion.div 
                            className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="text-xs text-text-secondary">
                              {habit.description}
                            </div>
                            <div className="flex items-center space-x-2">
                              {habit.allowMultipleChecks && progress.percentage >= 100 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const node = habit.nodes.find(n => n.date === timelineNode.date);
                                    if (node && onCheckIn) {
                                      onCheckIn(habit.id, node.id, 'extra');
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  + Extra
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Enhanced Legend with animations */}
      <motion.div 
        className="mt-6 pt-4 border-t border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-sm font-medium text-text-primary mb-3 flex items-center">
          <Icon name="Palette" size={16} className="mr-2 text-primary" />
          Habits Legend
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(treeData.habitBranches).map((habit, index) => (
            <motion.div 
              key={habit.id} 
              className="flex items-center space-x-2 p-2 rounded-lg bg-surface-700/50 hover:bg-surface-600/50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: habit.color }}
                animate={{ 
                  boxShadow: [`0 0 0 0 ${habit.color}40`, `0 0 0 4px ${habit.color}20`, `0 0 0 0 ${habit.color}40`]
                }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
              />
              <span className="text-xs text-text-secondary truncate">
                {habit.emoji} {habit.title}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HabitsTreeVisualization;