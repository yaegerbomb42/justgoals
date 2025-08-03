import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './ui/Icon';
import Button from './ui/Button';
import ProgressEntryModal from './ProgressEntryModal';

const CreativeHabitsTree = ({ habits, onCheckIn, onEditHabit, onDeleteHabit, onProgressUpdate }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressAmount, setProgressAmount] = useState('');
  const [showAdvancedProgress, setShowAdvancedProgress] = useState(false);
  const scrollContainerRef = useRef(null);

  // Generate days to display (past 7 days, today, future 7 days)
  const days = useMemo(() => {
    const today = new Date();
    const daysArray = [];
    
    // Generate 7 days before today
    for (let i = 7; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      daysArray.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: false,
        isPast: true,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    // Add today
    daysArray.push({
      date: today.toISOString().split('T')[0],
      display: 'Today',
      isToday: true,
      isPast: false,
      dayName: today.toLocaleDateString('en-US', { weekday: 'short' })
    });
    
    // Generate 7 days after today
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      daysArray.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: false,
        isPast: false,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    return daysArray;
  }, []);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIndex = days.findIndex(day => day.isToday);
      const scrollLeft = todayIndex * 120 - (scrollContainerRef.current.clientWidth / 2) + 60;
      scrollContainerRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [days]);

  const getHabitProgress = (habit, dateStr) => {
    if (!habit || !habit.treeNodes) return { current: 0, target: 1, percentage: 0, unit: '', node: null };
    
    const node = habit.treeNodes.find(n => n.date === dateStr);
    if (!node) return { current: 0, target: 1, percentage: 0, unit: '', node: null };
    
    if (habit.trackingType === 'amount') {
      const current = node.currentProgress || 0;
      const target = habit.targetAmount || 1;
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        unit: habit.unit || '',
        node
      };
    } else {
      const current = node.checks?.length || 0;
      const target = habit.targetChecks || 1;
      return {
        current,
        target,
        percentage: Math.min(Math.round((current / target) * 100), 100),
        unit: 'completions',
        node
      };
    }
  };

  const getHabitStreak = (habit) => {
    if (!habit.treeNodes) return 0;
    
    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const node = habit.treeNodes.find(n => n.date === dateStr);
      
      if (!node) break;
      
      const progress = getHabitProgress(habit, dateStr);
      if (progress.percentage >= 100) {
        streak++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };

  const handleHabitClick = (habit, day) => {
    if (day.isPast && !day.isToday) return; // Can't modify past days
    
    const progress = getHabitProgress(habit, day.date);
    if (!progress.node) return;
    
    setSelectedNode({ habit, node: progress.node, day });
    
    if (habit.trackingType === 'amount') {
      setShowProgressModal(true);
      setProgressAmount('');
    } else {
      onCheckIn(habit.id, progress.node.id);
    }
  };

  const handleProgressAdd = (habit, day, amount = 1) => {
    const progress = getHabitProgress(habit, day.date);
    if (!progress.node) return;
    
    if (habit.trackingType === 'amount') {
      const newAmount = (progress.current || 0) + amount;
      onCheckIn(habit.id, progress.node.id, 'default', newAmount);
    } else {
      onCheckIn(habit.id, progress.node.id);
    }
  };

  const handleProgressSubtract = (habit, day) => {
    const progress = getHabitProgress(habit, day.date);
    if (!progress.node) return;
    
    if (habit.trackingType === 'amount') {
      const newAmount = Math.max(0, (progress.current || 0) - 1);
      onCheckIn(habit.id, progress.node.id, 'default', newAmount);
    }
    // For check-based habits, we could implement removing checks here
  };

  const handleProgressSubmit = () => {
    if (selectedNode && progressAmount) {
      const amount = parseFloat(progressAmount);
      if (amount > 0) {
        onCheckIn(selectedNode.habit.id, selectedNode.node.id, 'default', amount);
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
          <Icon name="TrendingUp" className="w-16 h-16 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-semibold text-text-primary mb-3">Your Progressive Habit Lines Await</h3>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          Create your first habit and watch your progressive lines grow day by day. Each habit starts at the top and progresses toward daily completion.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Click to add progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span>Complete to reach the end node</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gradient-to-br from-surface to-surface-700 border border-border rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-1 flex items-center">
          <motion.div
            className="w-2 h-2 bg-primary rounded-full mr-3"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Progressive Habit Lines
        </h2>
        <p className="text-sm text-text-secondary">
          Track your daily progress with visual progression lines. Click habits to add progress, reach the end node to complete.
        </p>
      </div>

      {/* Days header - horizontal scroll */}
      <div className="mb-4">
        <div 
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          style={{ scrollbarWidth: 'thin' }}
        >
          {days.map((day, index) => (
            <div key={day.date} className="flex-shrink-0 w-28 text-center">
              <div className={`text-xs font-medium mb-1 ${
                day.isToday ? 'text-primary' : day.isPast ? 'text-text-secondary/70' : 'text-text-secondary'
              }`}>
                {day.dayName}
              </div>
              <div className={`text-sm font-semibold ${
                day.isToday ? 'text-primary' : day.isPast ? 'text-text-secondary/70' : 'text-text-primary'
              }`}>
                {day.display}
              </div>
              {day.isToday && (
                <motion.div
                  className="w-2 h-2 bg-primary rounded-full mx-auto mt-1"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Habits with progressive lines */}
      <div className="space-y-6">
        {habits.map((habit, habitIndex) => {
          const streak = getHabitStreak(habit);
          
          return (
            <motion.div
              key={habit.id}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: habitIndex * 0.1 }}
            >
              {/* Habit header with icon and streak */}
              <div className="flex items-center mb-3">
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 shadow-lg relative"
                    style={{ 
                      backgroundColor: habit.color + '20',
                      borderColor: habit.color
                    }}
                  >
                    {habit.emoji}
                    
                    {/* Streak counter */}
                    {streak > 0 && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-success to-success/80 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                      >
                        {streak}
                      </motion.div>
                    )}
                  </div>
                </div>
                
                <div className="ml-3 flex-1">
                  <h3 className="font-semibold text-text-primary">{habit.title}</h3>
                  <p className="text-sm text-text-secondary">
                    {habit.trackingType === 'amount' 
                      ? `Target: ${habit.targetAmount} ${habit.unit || 'units'} daily`
                      : 'Complete daily check-in'
                    }
                  </p>
                </div>
              </div>

              {/* Progressive line container */}
              <div className="relative">
                <div 
                  className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {days.map((day, dayIndex) => {
                    const progress = getHabitProgress(habit, day.date);
                    const isCompleted = progress.percentage >= 100;
                    const hasProgress = progress.current > 0;
                    
                    return (
                      <div key={`${habit.id}-${day.date}`} className="flex-shrink-0 w-28">
                        {/* Start node (habit icon) */}
                        <div className="relative h-16 flex flex-col items-center">
                          <motion.div
                            className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${
                              day.isPast && !day.isToday 
                                ? 'cursor-not-allowed opacity-50' 
                                : 'hover:scale-110'
                            }`}
                            style={{ 
                              backgroundColor: hasProgress ? habit.color : 'transparent',
                              borderColor: habit.color,
                              opacity: day.isPast && !day.isToday ? 0.5 : 1
                            }}
                            onClick={() => !day.isPast && handleHabitClick(habit, day)}
                            whileHover={!day.isPast ? { scale: 1.1 } : {}}
                            whileTap={!day.isPast ? { scale: 0.95 } : {}}
                          >
                            {hasProgress && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />
                            )}
                          </motion.div>

                          {/* Progressive line */}
                          <div className="w-1 flex-1 relative bg-gray-300 rounded-full overflow-hidden">
                            {/* Progress fill */}
                            <motion.div
                              className="w-full rounded-full"
                              style={{
                                background: `linear-gradient(to bottom, ${habit.color}, ${habit.color}cc)`,
                                boxShadow: hasProgress ? `0 0 8px ${habit.color}40` : 'none'
                              }}
                              initial={{ height: '0%' }}
                              animate={{ 
                                height: `${progress.percentage}%`,
                                boxShadow: hasProgress && day.isToday ? [
                                  `0 0 8px ${habit.color}40`,
                                  `0 0 16px ${habit.color}60`,
                                  `0 0 8px ${habit.color}40`
                                ] : hasProgress ? `0 0 8px ${habit.color}40` : 'none'
                              }}
                              transition={{ 
                                duration: 0.8, 
                                ease: "easeOut",
                                boxShadow: { duration: 2, repeat: Infinity }
                              }}
                            />
                            
                            {/* Glowing effect for today's active progress */}
                            {day.isToday && hasProgress && !isCompleted && (
                              <motion.div
                                className="absolute top-0 left-0 w-full rounded-full"
                                style={{
                                  height: `${progress.percentage}%`,
                                  background: `linear-gradient(to bottom, ${habit.color}80, transparent)`,
                                  filter: 'blur(2px)'
                                }}
                                animate={{
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            )}
                          </div>

                          {/* End node (target) */}
                          <motion.div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              isCompleted 
                                ? 'bg-success border-success text-white' 
                                : 'border-gray-400 bg-gray-200'
                            }`}
                            animate={isCompleted ? {
                              scale: [1, 1.2, 1],
                              boxShadow: [
                                '0 0 0 0 rgba(34, 197, 94, 0.4)',
                                '0 0 0 10px rgba(34, 197, 94, 0)',
                                '0 0 0 0 rgba(34, 197, 94, 0)'
                              ]
                            } : {}}
                            transition={isCompleted ? { duration: 2, repeat: Infinity } : {}}
                          >
                            {isCompleted ? (
                              <Icon name="Check" className="w-4 h-4" />
                            ) : (
                              <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            )}
                          </motion.div>

                          {/* Progress text */}
                          <div className="mt-2 text-center">
                            <div className={`text-xs font-medium ${
                              day.isToday ? 'text-primary' : 'text-text-secondary'
                            }`}>
                              {progress.current}/{progress.target}
                            </div>
                            {progress.unit && habit.trackingType === 'amount' && (
                              <div className="text-xs text-text-secondary/70">
                                {progress.unit}
                              </div>
                            )}
                          </div>

                          {/* Add/Subtract buttons for today */}
                          {day.isToday && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProgressSubtract(habit, day);
                                }}
                                className="w-6 h-6 p-0 text-xs"
                                disabled={progress.current <= 0}
                              >
                                <Icon name="Minus" className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProgressAdd(habit, day, 1);
                                }}
                                className="w-6 h-6 p-0 text-xs"
                              >
                                <Icon name="Plus" className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

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
                  Add your progress for {selectedNode.day.display}
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
    </div>
  );
};

export default CreativeHabitsTree;