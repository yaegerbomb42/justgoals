import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import AddHabitModal from '../../components/AddHabitModal';
import HabitsTreeVisualization from '../../components/HabitsTreeVisualization';
import habitService from '../../services/habitService';

const HabitsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { checkAchievements } = useAchievements();
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'compact'
  const [batchMode, setBatchMode] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState(new Set());

  // Load user habits with midnight reset functionality
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHabits();
      
      // Set up midnight reset functionality
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      
      const midnightTimeout = setTimeout(() => {
        handleMidnightReset();
        
        // Set up daily interval for future midnight resets
        setInterval(handleMidnightReset, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
      
      return () => clearTimeout(midnightTimeout);
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

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setShowEditModal(true);
  };

  const handleUpdateHabit = async (habitData) => {
    if (!editingHabit || !user?.id) return;
    
    try {
      const updatedHabit = await habitService.updateHabit(user.id, editingHabit.id, habitData);
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? updatedHabit : h));
      setShowEditModal(false);
      setEditingHabit(null);
      checkAchievements();
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!user?.id || !confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await habitService.deleteHabit(user.id, habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      checkAchievements();
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const handleMidnightReset = async () => {
    if (!user?.id) return;
    
    console.log('Midnight reset triggered');
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const updatedHabits = habits.map(habit => {
        // Mark yesterday's incomplete habits as failed
        const updatedTreeNodes = habit.treeNodes.map(node => {
          if (node.date === yesterdayStr && node.status === 'active') {
            const completed = node.checks?.length || 0;
            const target = habit.targetChecks || 1;
            if (completed < target) {
              return { ...node, status: 'failed' };
            }
          }
          return node;
        });
        
        // Add today's node if it doesn't exist
        const todayNodeExists = updatedTreeNodes.some(node => node.date === today);
        if (!todayNodeExists) {
          updatedTreeNodes.push({
            id: Date.now() + Math.random(),
            date: today,
            checks: [],
            status: 'active',
            parentId: null,
            createdAt: new Date().toISOString()
          });
        }
        
        return { ...habit, treeNodes: updatedTreeNodes };
      });
      
      setHabits(updatedHabits);
      
      // Update all habits in Firebase
      for (const habit of updatedHabits) {
        await habitService.updateHabit(user.id, habit.id, { treeNodes: habit.treeNodes });
      }
    } catch (error) {
      console.error('Failed to perform midnight reset:', error);
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
            <p className="text-text-secondary">Build lasting habits with unified tree tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                onClick={() => setViewMode('tree')}
                className="px-3 py-1"
              >
                <Icon name="GitBranch" size={16} />
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

        {/* Main Content Area */}
        {habits.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Target" className="w-16 h-16 mx-auto mb-4 text-text-secondary" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No habits yet</h3>
            <p className="text-text-secondary mb-6">
              Start building positive habits with our unified tree tracking system
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Create Your First Habit
            </Button>
          </div>
        ) : viewMode === 'tree' ? (
          /* Tree Visualization */
          <HabitsTreeVisualization 
            habits={habits}
            onCheckIn={handleCheckIn}
            onEditHabit={handleEditHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        ) : (
          /* Compact View */
          <div className="space-y-3">
            {habits.map((habit) => renderCompactHabitCard(habit))}
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

      {/* Edit Habit Modal */}
      {showEditModal && editingHabit && (
        <AddHabitModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingHabit(null);
          }}
          onAdd={handleUpdateHabit}
          initialData={editingHabit}
          mode="edit"
        />
      )}
    </div>
  );
};

export default HabitsPage; 