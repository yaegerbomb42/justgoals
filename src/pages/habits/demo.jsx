import React, { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import AddHabitModal from '../../components/AddHabitModal';
import HabitsTreeVisualization from '../../components/HabitsTreeVisualization';
import CreativeHabitsTree from '../../components/CreativeHabitsTree';
import habitService from '../../services/habitService';

// Demo version of habits page that works without authentication
const HabitsPageDemo = () => {
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('creative'); // 'creative', 'tree', or 'compact'

  // Mock user for demo
  const demoUser = { id: 'demo-user' };

  // Load demo habits or create some sample data
  useEffect(() => {
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
  }, []);

  const loadHabits = () => {
    try {
      let userHabits = habitService.getHabits(demoUser.id);
      
      // If no habits exist, create some demo habits
      if (!Array.isArray(userHabits) || userHabits.length === 0) {
        userHabits = createDemoHabits();
        habitService.saveToLocalStorage(userHabits);
      }
      
      setHabits(userHabits);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  const createDemoHabits = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    return [
      {
        id: 'demo-habit-1',
        title: 'Drink Water',
        description: 'Stay hydrated throughout the day',
        category: 'health',
        frequency: 'daily',
        trackingType: 'amount',
        targetAmount: 8,
        unit: 'glasses',
        color: '#3B82F6',
        emoji: '💧',
        createdAt: yesterdayStr,
        treeNodes: [
          {
            id: 'node-1-yesterday',
            date: yesterdayStr,
            checks: [],
            currentProgress: 8,
            status: 'completed',
            parentId: null,
            createdAt: yesterdayStr
          },
          {
            id: 'node-1-today',
            date: today,
            checks: [],
            currentProgress: 2,
            status: 'active',
            parentId: null,
            createdAt: today
          }
        ]
      },
      {
        id: 'demo-habit-2',
        title: 'Walk 10k Steps',
        description: 'Get your daily steps in',
        category: 'health',
        frequency: 'daily',
        trackingType: 'amount',
        targetAmount: 10000,
        unit: 'steps',
        color: '#10B981',
        emoji: '🚶‍♂️',
        createdAt: yesterdayStr,
        treeNodes: [
          {
            id: 'node-2-yesterday',
            date: yesterdayStr,
            checks: [],
            currentProgress: 12500,
            status: 'completed',
            parentId: null,
            createdAt: yesterdayStr
          },
          {
            id: 'node-2-today',
            date: today,
            checks: [],
            currentProgress: 3400,
            status: 'active',
            parentId: null,
            createdAt: today
          }
        ]
      },
      {
        id: 'demo-habit-3',
        title: 'Read',
        description: 'Read for personal development',
        category: 'learning',
        frequency: 'daily',
        trackingType: 'amount',
        targetAmount: 30,
        unit: 'minutes',
        color: '#8B5CF6',
        emoji: '📖',
        createdAt: yesterdayStr,
        treeNodes: [
          {
            id: 'node-3-yesterday',
            date: yesterdayStr,
            checks: [],
            currentProgress: 45,
            status: 'completed',
            parentId: null,
            createdAt: yesterdayStr
          },
          {
            id: 'node-3-today',
            date: today,
            checks: [],
            currentProgress: 0,
            status: 'active',
            parentId: null,
            createdAt: today
          }
        ]
      },
      {
        id: 'demo-habit-4',
        title: 'Meditate',
        description: 'Practice mindfulness',
        category: 'health',
        frequency: 'daily',
        trackingType: 'check',
        targetChecks: 1,
        color: '#F59E0B',
        emoji: '🧘‍♂️',
        createdAt: yesterdayStr,
        treeNodes: [
          {
            id: 'node-4-yesterday',
            date: yesterdayStr,
            checks: [
              { id: 1, type: 'default', timestamp: new Date().toISOString(), completed: true }
            ],
            currentProgress: 0,
            status: 'completed',
            parentId: null,
            createdAt: yesterdayStr
          },
          {
            id: 'node-4-today',
            date: today,
            checks: [],
            currentProgress: 0,
            status: 'active',
            parentId: null,
            createdAt: today
          }
        ]
      }
    ];
  };

  const handleAddHabit = async (habitData) => {
    try {
      const newHabit = await habitService.createHabit(demoUser.id, {
        ...habitData,
        treeNodes: [{
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          checks: [],
          currentProgress: 0,
          status: 'active',
          parentId: null
        }]
      });
      
      setHabits(prev => [...prev, newHabit]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const handleCheckIn = async (habitId, nodeId, checkType = 'default', progressAmount = 1) => {
    try {
      const updatedHabit = await habitService.addCheckIn(demoUser.id, habitId, nodeId, checkType, progressAmount);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
    } catch (error) {
      console.error('Failed to add check-in:', error);
    }
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setShowEditModal(true);
  };

  const handleUpdateHabit = async (habitData) => {
    if (!editingHabit) return;
    
    try {
      const updatedHabit = await habitService.updateHabit(demoUser.id, editingHabit.id, habitData);
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? updatedHabit : h));
      setShowEditModal(false);
      setEditingHabit(null);
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await habitService.deleteHabit(demoUser.id, habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const handleMidnightReset = async () => {
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
      habitService.saveToLocalStorage(updatedHabits);
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
    
    if (habit.trackingType === 'amount') {
      const completed = activeNode.currentProgress || 0;
      const total = habit.targetAmount || 1;
      const percentage = Math.min(Math.round((completed / total) * 100), 100);
      return { completed, total, percentage, unit: habit.unit };
    } else {
      const completed = activeNode.checks?.length || 0;
      const total = habit.targetChecks || 1;
      const percentage = Math.min(Math.round((completed / total) * 100), 100);
      return { completed, total, percentage };
    }
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
            <h1 className="text-3xl font-heading-bold text-text-primary mb-2">Habits (Demo)</h1>
            <p className="text-text-secondary">Build lasting habits with tree-based tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'creative' ? 'default' : 'ghost'}
                onClick={() => setViewMode('creative')}
                className="px-3 py-1"
              >
                <Icon name="Trees" size={16} />
              </Button>
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
            
            <Button
              onClick={() => setShowAddModal(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Add Habit
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'creative' ? (
          /* Creative Tree Visualization */
          <CreativeHabitsTree 
            habits={habits}
            onCheckIn={handleCheckIn}
            onEditHabit={handleEditHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        ) : viewMode === 'tree' ? (
          /* Original Tree Visualization */
          <HabitsTreeVisualization 
            habits={habits}
            onCheckIn={handleCheckIn}
            onEditHabit={handleEditHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        ) : (
          /* Compact View - Show individual habit cards */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Today's Habits</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {habits.map((habit) => {
                const progress = getHabitProgress(habit);
                const streak = getHabitStreak(habit);
                
                return (
                  <div key={habit.id} className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{habit.emoji}</span>
                        <div>
                          <h3 className="font-medium text-text-primary text-sm">{habit.title}</h3>
                          <p className="text-xs text-text-secondary">
                            {progress.completed}/{progress.total} {progress.unit || ''}
                          </p>
                        </div>
                      </div>
                      
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
                            className="px-3 py-1"
                          >
                            <Icon name="Plus" size={12} />
                          </Button>
                        ) : isCompleted ? (
                          <Icon name="CheckCircle" className="w-4 h-4 text-success" />
                        ) : null;
                      })()}
                    </div>
                    
                    <div className="w-full bg-surface-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          progress.percentage >= 100 ? 'bg-success' : 'bg-primary'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    
                    {streak > 0 && (
                      <div className="flex items-center mt-2 text-xs text-orange-400">
                        <Icon name="Flame" size={12} className="mr-1" />
                        {streak} day streak
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

export default HabitsPageDemo;