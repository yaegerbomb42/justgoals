import React, { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import AddHabitModal from '../../components/AddHabitModal';
import habitService from '../../services/habitService';

// Demo version of habits page that works without authentication
const HabitsPageDemo = () => {
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'compact'

  // Mock user for demo
  const demoUser = { id: 'demo-user' };

  // Load demo habits or create some sample data
  useEffect(() => {
    loadHabits();
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
        targetChecks: 8,
        allowMultipleChecks: true,
        color: '#3B82F6',
        emoji: '💧',
        createdAt: yesterdayStr,
        treeNodes: [
          {
            id: 'node-1-yesterday',
            date: yesterdayStr,
            checks: [
              { id: 1, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 2, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 3, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 4, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 5, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 6, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 7, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 8, type: 'default', timestamp: new Date().toISOString(), completed: true },
            ],
            status: 'completed',
            parentId: null,
            createdAt: yesterdayStr
          },
          {
            id: 'node-1-today',
            date: today,
            checks: [
              { id: 9, type: 'default', timestamp: new Date().toISOString(), completed: true },
              { id: 10, type: 'default', timestamp: new Date().toISOString(), completed: true },
            ],
            status: 'active',
            parentId: null,
            createdAt: today
          }
        ]
      },
      {
        id: 'demo-habit-2',
        title: 'Exercise',
        description: 'Get your body moving',
        category: 'health',
        frequency: 'daily',
        targetChecks: 1,
        allowMultipleChecks: false,
        color: '#10B981',
        emoji: '🏃‍♂️',
        createdAt: yesterdayStr,
        treeNodes: [
          {
            id: 'node-2-yesterday',
            date: yesterdayStr,
            checks: [
              { id: 11, type: 'default', timestamp: new Date().toISOString(), completed: true },
            ],
            status: 'completed',
            parentId: null,
            createdAt: yesterdayStr
          },
          {
            id: 'node-2-today',
            date: today,
            checks: [],
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
        targetChecks: 1,
        allowMultipleChecks: false,
        color: '#8B5CF6',
        emoji: '📖',
        createdAt: yesterdayStr,
        treeNodes: [
          {
            id: 'node-3-yesterday',
            date: yesterdayStr,
            checks: [],
            status: 'failed',
            parentId: null,
            createdAt: yesterdayStr
          },
          {
            id: 'node-3-today',
            date: today,
            checks: [],
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

  const handleCheckIn = async (habitId, nodeId, checkType = 'default') => {
    try {
      const updatedHabit = await habitService.addCheckIn(demoUser.id, habitId, nodeId, checkType);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
    } catch (error) {
      console.error('Failed to add check-in:', error);
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
            
            <Button
              onClick={() => setShowAddModal(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Add Habit
            </Button>
          </div>
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
                        {habit.emoji} {habit.title}
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

export default HabitsPageDemo;