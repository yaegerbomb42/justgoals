import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from './ui/Icon';
import Button from './ui/Button';

const HabitsTreeVisualization = ({ habits, onCheckIn, onDeleteHabit }) => {
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
      '#EF4444', '#06B6D4', '#84CC16', '#F97316'
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

  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-surface-700 rounded-full flex items-center justify-center">
          <Icon name="GitBranch" className="w-12 h-12 text-text-secondary" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Habits Tree Yet</h3>
        <p className="text-text-secondary">
          Create your first habit to start growing your habit tree
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-1">Habits Tree</h2>
          <p className="text-sm text-text-secondary">
            Your unified habit journey visualization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary">
            {Object.keys(treeData.habitBranches).length} active habits
          </span>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="relative">
        {/* Main timeline trunk */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-border rounded-full opacity-50"></div>
        
        {treeData.timelineNodes.map((timelineNode, timelineIndex) => (
          <div key={timelineNode.id} className="relative mb-8">
            {/* Timeline node */}
            <div className="flex items-center mb-4">
              <div className="relative z-10 w-6 h-6 bg-primary border-4 border-surface rounded-full flex items-center justify-center">
                {isToday(timelineNode.date) && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-text-primary">
                  {new Date(timelineNode.date).toLocaleDateString()}
                  {isToday(timelineNode.date) && (
                    <span className="ml-2 text-xs text-primary font-bold">TODAY</span>
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

                return (
                  <motion.div
                    key={`${habit.id}-${timelineNode.date}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    {/* Branch line */}
                    <div 
                      className="absolute -left-8 top-4 w-8 h-0.5 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    ></div>

                    {/* Habit node */}
                    <div 
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isHabitToday 
                          ? 'bg-surface-600 border-opacity-60 shadow-lg' 
                          : status === 'completed'
                            ? 'bg-success/10 border-success/30'
                            : status === 'failed'
                              ? 'bg-error/10 border-error/30'
                              : 'bg-surface-700 border-border'
                      }`}
                      style={{ 
                        borderColor: isHabitToday ? habit.color : undefined,
                        boxShadow: isHabitToday ? `0 0 20px ${habit.color}20` : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: habit.color }}
                          >
                            {habit.emoji}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary text-sm">
                              {habit.title}
                            </div>
                            <div className="text-xs text-text-secondary">
                              {progress.completed}/{progress.total} completed
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* Progress bar */}
                          <div className="w-20">
                            <div className="w-full bg-surface-800 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{ 
                                  width: `${progress.percentage}%`,
                                  backgroundColor: progress.percentage >= 100 ? '#10B981' : habit.color
                                }}
                              />
                            </div>
                            <div className="text-xs text-center mt-1 text-text-secondary">
                              {progress.percentage}%
                            </div>
                          </div>

                          {/* Status indicator */}
                          {status === 'completed' && (
                            <Icon name="CheckCircle" className="w-5 h-5 text-success" />
                          )}
                          {status === 'failed' && (
                            <Icon name="X" className="w-5 h-5 text-error" />
                          )}
                          
                          {/* Check-in button for today */}
                          {isHabitToday && status === 'active' && progress.percentage < 100 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const node = habit.nodes.find(n => n.date === timelineNode.date);
                                if (node && onCheckIn) {
                                  onCheckIn(habit.id, node.id);
                                }
                              }}
                              style={{ backgroundColor: habit.color }}
                              className="text-white border-0 hover:opacity-80"
                            >
                              <Icon name="Plus" size={12} />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Extra actions for today */}
                      {isHabitToday && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
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
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-sm font-medium text-text-primary mb-3">Habits Legend</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(treeData.habitBranches).map((habit) => (
            <div key={habit.id} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: habit.color }}
              ></div>
              <span className="text-xs text-text-secondary truncate">
                {habit.emoji} {habit.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HabitsTreeVisualization;