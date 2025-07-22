import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import AddHabitModal from '../../components/AddHabitModal';
import habitService from '../../services/habitService';

const HabitsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { checkAchievements } = useAchievements();
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'compact'
  const [batchMode, setBatchMode] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState(new Set());

  // Load user habits
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHabits();
    }
  }, [isAuthenticated, user]);

  const loadHabits = () => {
    if (!user?.id) return;
    try {
      const userHabits = habitService.getHabits(user.id);
      setHabits(Array.isArray(userHabits) ? userHabits : []);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (habitData) => {
    if (!user?.id) return;
    
    try {
      const newHabit = await habitService.createHabit(user.id, {
        ...habitData,
        treeNodes: [{
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          checks: [],
          status: 'active',
          parentId: null
        }]
      });
      
      setHabits(prev => [...prev, newHabit]);
      setShowAddModal(false);
      checkAchievements();
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const handleCheckIn = async (habitId, nodeId, checkType = 'default') => {
    if (!user?.id) return;
    
    try {
      const updatedHabit = await habitService.addCheckIn(user.id, habitId, nodeId, checkType);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
      checkAchievements();
    } catch (error) {
      console.error('Failed to add check-in:', error);
    }
  };

  // Batch check-in for multiple habits
  const handleBatchCheckIn = async (habitIds) => {
    if (!user?.id || habitIds.length === 0) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const updates = [];
      
      for (const habitId of habitIds) {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) continue;
        
        const activeNode = habit.treeNodes?.find(node => 
          node.date === today && node.status === 'active'
        );
        
        if (activeNode) {
          updates.push(habitService.addCheckIn(user.id, habitId, activeNode.id, 'default'));
        }
      }
      
      const results = await Promise.all(updates);
      setHabits(prev => {
        const updated = [...prev];
        results.forEach(updatedHabit => {
          const index = updated.findIndex(h => h.id === updatedHabit.id);
          if (index !== -1) {
            updated[index] = updatedHabit;
          }
        });
        return updated;
      });
      
      checkAchievements();
      setSelectedHabits(new Set()); // Clear selection after batch action
    } catch (error) {
      console.error('Failed to batch check-in:', error);
    }
  };

  const toggleHabitSelection = (habitId) => {
    setSelectedHabits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(habitId)) {
        newSet.delete(habitId);
      } else {
        newSet.add(habitId);
      }
      return newSet;
    });
  };

  const getTodayActiveHabits = () => {
    const today = new Date().toISOString().split('T')[0];
    return habits.filter(habit => {
      const activeNode = habit.treeNodes?.find(node => 
        node.date === today && node.status === 'active'
      );
      const progress = getHabitProgress(habit);
      return activeNode && progress.percentage < 100;
    });
  };

  const handleCreateBranch = async (habitId, parentNodeId) => {
    if (!user?.id) return;
    
    try {
      const updatedHabit = await habitService.createBranch(user.id, habitId, parentNodeId);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const handleResetBranch = async (habitId, nodeId) => {
    if (!user?.id) return;
    
    try {
      const updatedHabit = await habitService.resetBranch(user.id, habitId, nodeId);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
    } catch (error) {
      console.error('Failed to reset branch:', error);
    }
  };

  const getHabitProgress = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    const activeNode = habit.treeNodes?.find(node => 
      node.date === today && node.status === 'active'
    );
    
    if (!activeNode) return { completed: 0, total: habit.targetChecks || 1, percentage: 0 };
    
    const completed = activeNode.checks?.length || 0;
    const total = habit.targetChecks || 1;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getHabitStreak = (habit) => {
    if (!habit.treeNodes) return 0;
    
    let streak = 0;
    const sortedNodes = habit.treeNodes
      .filter(node => node.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (const node of sortedNodes) {
      const checks = node.checks || [];
      const targetChecks = habit.targetChecks || 1;
      if (checks.length >= targetChecks) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const renderCompactHabitCard = (habit) => {
    const progress = getHabitProgress(habit);
    const today = new Date().toISOString().split('T')[0];
    const activeNode = habit.treeNodes?.find(node => 
      node.date === today && node.status === 'active'
    );
    const isCompleted = progress.percentage >= 100;
    const isSelected = selectedHabits.has(habit.id);
    
    return (
      <div 
        key={habit.id} 
        className={`bg-surface border rounded-lg p-4 transition-all ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border'
        } ${isCompleted ? 'opacity-75' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              {batchMode && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleHabitSelection(habit.id)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-text-primary truncate">
                  {habit.title}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-text-secondary">
                    {progress.completed}/{progress.total}
                  </span>
                  <div className="flex-1 bg-surface-700 rounded-full h-1.5 min-w-0">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isCompleted ? 'bg-success' : 'bg-primary'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-3">
            {!isCompleted && activeNode && (
              <Button
                size="sm"
                variant={progress.percentage > 0 ? "default" : "outline"}
                onClick={() => handleCheckIn(habit.id, activeNode.id)}
                className="px-3 py-1 text-xs"
              >
                +
              </Button>
            )}
            {isCompleted && (
              <Icon name="CheckCircle" className="w-5 h-5 text-success" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHabitTree = (habit) => {
    if (!habit.treeNodes) return null;
    
    const sortedNodes = habit.treeNodes.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="GitBranch" className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-text-primary">
            Habit Progress Tree ({sortedNodes.length} days tracked)
          </span>
        </div>
        
        <div className="relative">
          {/* Main tree trunk line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
          
          {sortedNodes.map((node, index) => {
            const checks = node.checks || [];
            const targetChecks = habit.targetChecks || 1;
            const isCompleted = checks.length >= targetChecks;
            const isToday = node.date === new Date().toISOString().split('T')[0];
            const isFailed = node.status === 'failed';
            
            return (
              <div key={node.id} className="relative flex items-center space-x-4 pb-4">
                {/* Tree node connection */}
                <div className="relative z-10">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-success border-success' 
                      : isFailed 
                        ? 'bg-error border-error'
                        : isToday 
                          ? 'bg-warning border-warning animate-pulse'
                          : 'bg-surface border-border'
                  }`}></div>
                  
                  {/* Branch line for today's active node */}
                  {isToday && (
                    <div className="absolute left-3 top-1.5 w-4 h-0.5 bg-warning"></div>
                  )}
                </div>
                
                {/* Node content */}
                <div className={`flex-1 p-3 rounded-lg border ${
                  isToday 
                    ? 'bg-warning/10 border-warning/30' 
                    : isCompleted 
                      ? 'bg-success/10 border-success/30'
                      : isFailed
                        ? 'bg-error/10 border-error/30'
                        : 'bg-surface-700 border-border'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-text-primary">
                        {new Date(node.date).toLocaleDateString()}
                        {isToday && <span className="ml-2 text-xs text-warning font-bold">TODAY</span>}
                      </span>
                      
                      {/* Status badge */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isCompleted 
                          ? 'bg-success/20 text-success' 
                          : isFailed 
                            ? 'bg-error/20 text-error'
                            : node.status === 'active'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-surface/20 text-text-secondary'
                      }`}>
                        {isCompleted ? 'Completed' : isFailed ? 'Failed' : node.status}
                      </span>
                    </div>
                    
                    {/* Progress indicators */}
                    <div className="flex items-center space-x-1">
                      {checks.map((check, checkIndex) => (
                        <div
                          key={checkIndex}
                          className={`w-3 h-3 rounded-full ${
                            check.completed 
                              ? 'bg-success' 
                              : 'bg-text-secondary'
                          }`}
                          title={`Check ${checkIndex + 1}: ${check.type || 'default'}`}
                        />
                      ))}
                      {Array.from({ length: targetChecks - checks.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="w-3 h-3 rounded-full border border-text-secondary opacity-30"
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Action buttons for today */}
                  {isToday && node.status === 'active' && (
                    <div className="mt-3 flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(habit.id, node.id, 'default')}
                        disabled={checks.length >= targetChecks}
                        className="flex items-center space-x-1"
                      >
                        <Icon name="Plus" size={14} />
                        <span>Check In</span>
                      </Button>
                      {habit.allowMultipleChecks && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckIn(habit.id, node.id, 'extra')}
                        >
                          + Extra
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateBranch(habit.id, node.id)}
                        className="flex items-center space-x-1"
                      >
                        <Icon name="GitBranch" size={14} />
                        <span>Branch</span>
                      </Button>
                    </div>
                  )}
                  
                  {/* Reset option for failed nodes */}
                  {isFailed && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetBranch(habit.id, node.id)}
                        className="text-warning border-warning hover:bg-warning/10"
                      >
                        <Icon name="RotateCcw" size={14} className="mr-1" />
                        Reset Branch
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Tree statistics */}
        <div className="mt-4 p-3 bg-surface-600 rounded-lg border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-success">
                {sortedNodes.filter(n => n.status === 'completed' || (n.checks?.length || 0) >= (habit.targetChecks || 1)).length}
              </div>
              <div className="text-xs text-text-secondary">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-error">
                {sortedNodes.filter(n => n.status === 'failed').length}
              </div>
              <div className="text-xs text-text-secondary">Failed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-warning">
                {getHabitStreak(habit)}
              </div>
              <div className="text-xs text-text-secondary">Current Streak</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading-bold text-text-primary mb-2">Habits</h1>
            <p className="text-text-secondary">Build lasting habits with tree-based tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="px-3 py-1"
              >
                <Icon name="Grid3X3" size={16} />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                onClick={() => setViewMode('compact')}
                className="px-3 py-1"
              >
                <Icon name="List" size={16} />
              </Button>
            </div>
            
            {/* Batch Mode Toggle */}
            {viewMode === 'compact' && (
              <Button
                size="sm"
                variant={batchMode ? 'default' : 'outline'}
                onClick={() => {
                  setBatchMode(!batchMode);
                  setSelectedHabits(new Set());
                }}
              >
                <Icon name="CheckSquare" size={16} className="mr-1" />
                Batch
              </Button>
            )}
            
            <Button
              onClick={() => setShowAddModal(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Add Habit
            </Button>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {batchMode && selectedHabits.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">
                {selectedHabits.size} habit{selectedHabits.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleBatchCheckIn(Array.from(selectedHabits))}
                  disabled={getTodayActiveHabits().filter(h => selectedHabits.has(h.id)).length === 0}
                >
                  <Icon name="Plus" size={16} className="mr-1" />
                  Check In All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedHabits(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions for Active Habits */}
        {viewMode === 'compact' && !batchMode && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text-primary">Today's Active Habits</h2>
              <span className="text-sm text-text-secondary">
                {getTodayActiveHabits().length} remaining
              </span>
            </div>
            {getTodayActiveHabits().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getTodayActiveHabits().slice(0, 6).map(habit => {
                  const progress = getHabitProgress(habit);
                  const today = new Date().toISOString().split('T')[0];
                  const activeNode = habit.treeNodes?.find(node => 
                    node.date === today && node.status === 'active'
                  );
                  
                  return (
                    <Button
                      key={habit.id}
                      size="sm"
                      variant="outline"
                      onClick={() => activeNode && handleCheckIn(habit.id, activeNode.id)}
                      className="flex items-center space-x-2"
                    >
                      <span className="text-xs">{habit.title}</span>
                      <Icon name="Plus" size={12} />
                      <span className="text-xs text-text-secondary">
                        {progress.completed}/{progress.total}
                      </span>
                    </Button>
                  );
                })}
                {getTodayActiveHabits().length > 6 && (
                  <span className="text-xs text-text-secondary self-center ml-2">
                    +{getTodayActiveHabits().length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Habits Grid/List */}
        {habits.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Target" className="w-16 h-16 mx-auto mb-4 text-text-secondary" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No habits yet</h3>
            <p className="text-text-secondary mb-6">
              Start building positive habits with our tree-based tracking system
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Create Your First Habit
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'compact' ? 'space-y-3' : 'grid gap-6'}>
            {habits.map((habit) => {
              if (viewMode === 'compact') {
                return renderCompactHabitCard(habit);
              }
              
              const progress = getHabitProgress(habit);
              const streak = getHabitStreak(habit);
              
              return (
                <div key={habit.id} className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-text-primary mb-2">
                        {habit.title}
                      </h3>
                      <p className="text-text-secondary mb-3">{habit.description}</p>
                      
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Icon name="Target" className="w-4 h-4 text-primary" />
                          <span className="text-sm text-text-secondary">
                            {progress.completed}/{progress.total} goals today
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Icon name="Flame" className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-text-secondary">
                            {streak} day streak
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Icon name="Calendar" className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-text-secondary">
                            {habit.frequency || 'Daily'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Quick check-in button */}
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const activeNode = habit.treeNodes?.find(node => 
                          node.date === today && node.status === 'active'
                        );
                        const isCompleted = progress.percentage >= 100;
                        
                        return !isCompleted && activeNode ? (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(habit.id, activeNode.id)}
                            className="mr-2"
                          >
                            <Icon name="Plus" size={16} className="mr-1" />
                            Check In
                          </Button>
                        ) : isCompleted ? (
                          <div className="flex items-center text-success mr-2">
                            <Icon name="CheckCircle" size={16} className="mr-1" />
                            <span className="text-sm">Complete</span>
                          </div>
                        ) : null;
                      })()}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedHabit(habit)}
                      >
                        View Tree
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Today's Progress</span>
                      <span className="text-sm text-text-secondary">{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-surface-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.percentage >= 100 
                            ? 'bg-gradient-to-r from-success to-success' 
                            : 'bg-gradient-to-r from-primary to-secondary'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Tree View (Collapsed by default) */}
                  {selectedHabit?.id === habit.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-lg font-semibold text-text-primary mb-3">Habit Tree</h4>
                      {renderHabitTree(habit)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <AddHabitModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddHabit}
        />
      )}
    </div>
  );
};

export default HabitsPage; 