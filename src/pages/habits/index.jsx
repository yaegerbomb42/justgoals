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

  const renderHabitTree = (habit) => {
    if (!habit.treeNodes) return null;
    
    const sortedNodes = habit.treeNodes.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return (
      <div className="space-y-2">
        {sortedNodes.map((node, index) => {
          const checks = node.checks || [];
          const targetChecks = habit.targetChecks || 1;
          const isCompleted = checks.length >= targetChecks;
          const isToday = node.date === new Date().toISOString().split('T')[0];
          
          return (
            <div key={node.id} className="flex items-center space-x-3 p-3 bg-surface-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {new Date(node.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    {checks.map((check, checkIndex) => (
                      <div
                        key={checkIndex}
                        className={`w-4 h-4 rounded-full border-2 ${
                          check.completed 
                            ? 'bg-success border-success' 
                            : 'border-text-secondary'
                        }`}
                      />
                    ))}
                    {Array.from({ length: targetChecks - checks.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="w-4 h-4 rounded-full border-2 border-text-secondary"
                      />
                    ))}
                  </div>
                </div>
                
                {isToday && node.status === 'active' && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(habit.id, node.id, 'default')}
                      disabled={checks.length >= targetChecks}
                    >
                      Check In
                    </Button>
                    {habit.allowMultipleChecks && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckIn(habit.id, node.id, 'extra')}
                      >
                        Extra Check
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateBranch(habit.id, node.id)}
                    >
                      Branch
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {isCompleted ? (
                  <Icon name="CheckCircle" className="w-5 h-5 text-success" />
                ) : node.status === 'failed' ? (
                  <Icon name="XCircle" className="w-5 h-5 text-error" />
                ) : (
                  <Icon name="Circle" className="w-5 h-5 text-text-secondary" />
                )}
                
                {node.status === 'failed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResetBranch(habit.id, node.id)}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          );
        })}
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
          <Button
            onClick={() => setShowAddModal(true)}
            iconName="Plus"
            iconPosition="left"
          >
            Add Habit
          </Button>
        </div>

        {/* Habits Grid */}
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
          <div className="grid gap-6">
            {habits.map((habit) => {
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
                            {progress.completed}/{progress.total} checks today
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
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
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