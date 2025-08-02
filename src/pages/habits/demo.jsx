import React, { useState, useEffect } from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import AddHabitModal from '../../components/AddHabitModal';
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
  // Progressive habit lines view only

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
    let dailyInterval;
    
    const midnightTimeout = setTimeout(() => {
      handleMidnightReset();
      
      // Set up daily interval for future midnight resets
      dailyInterval = setInterval(handleMidnightReset, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
    
    return () => {
      clearTimeout(midnightTimeout);
      if (dailyInterval) {
        clearInterval(dailyInterval);
      }
    };
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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Generate the past week of data for demo habits
    const generateWeekNodes = (habitId, trackingType, targetAmount, targetChecks) => {
      const nodes = [];
      
      for (let i = 7; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = i === 0;
        
        if (trackingType === 'amount') {
          // Simulate varying progress over the week
          let progress = 0;
          let status = 'active';
          
          if (!isToday) {
            const rand = Math.random();
            if (rand > 0.8) {
              // 20% failed
              progress = Math.floor(targetAmount * (0.3 + Math.random() * 0.4)); // 30-70% of target
              status = 'failed';
            } else {
              // 80% completed
              progress = Math.floor(targetAmount * (1 + Math.random() * 0.3)); // 100-130% of target
              status = 'completed';
            }
          } else {
            // Today's progress (partial)
            progress = Math.floor(targetAmount * (0.2 + Math.random() * 0.4)); // 20-60% of target
            status = 'active';
          }
          
          nodes.push({
            id: `${habitId}-${dateStr}`,
            date: dateStr,
            checks: [],
            currentProgress: progress,
            status: status,
            parentId: i === 7 ? null : `${habitId}-${new Date(date.getTime() - 24*60*60*1000).toISOString().split('T')[0]}`,
            createdAt: dateStr
          });
        } else {
          // Check-based tracking
          let checks = [];
          let status = 'active';
          
          if (!isToday) {
            const rand = Math.random();
            if (rand > 0.75) {
              // 25% failed
              checks = [];
              status = 'failed';
            } else {
              // 75% completed
              checks = Array(targetChecks).fill(null).map((_, idx) => ({
                id: idx + 1,
                type: 'default',
                timestamp: new Date(date.getTime() + idx * 60000).toISOString(),
                completed: true
              }));
              status = 'completed';
            }
          } else {
            // Today's progress (might be incomplete)
            if (Math.random() > 0.5) {
              checks = [{ id: 1, type: 'default', timestamp: new Date().toISOString(), completed: true }];
            }
            status = 'active';
          }
          
          nodes.push({
            id: `${habitId}-${dateStr}`,
            date: dateStr,
            checks: checks,
            currentProgress: 0,
            status: status,
            parentId: i === 7 ? null : `${habitId}-${new Date(date.getTime() - 24*60*60*1000).toISOString().split('T')[0]}`,
            createdAt: dateStr
          });
        }
      }
      
      return nodes;
    };
    
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
        createdAt: new Date(today.getTime() - 7*24*60*60*1000).toISOString().split('T')[0],
        treeNodes: generateWeekNodes('demo-habit-1', 'amount', 8, 1)
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
        createdAt: new Date(today.getTime() - 7*24*60*60*1000).toISOString().split('T')[0],
        treeNodes: generateWeekNodes('demo-habit-2', 'amount', 10000, 1)
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
        createdAt: new Date(today.getTime() - 7*24*60*60*1000).toISOString().split('T')[0],
        treeNodes: generateWeekNodes('demo-habit-3', 'amount', 30, 1)
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
        createdAt: new Date(today.getTime() - 7*24*60*60*1000).toISOString().split('T')[0],
        treeNodes: generateWeekNodes('demo-habit-4', 'check', 1, 1)
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
        // Mark yesterday's progress based on completion
        const updatedTreeNodes = habit.treeNodes.map(node => {
          if (node.date === yesterdayStr && node.status === 'active') {
            // Check if habit was completed yesterday
            if (habit.trackingType === 'amount') {
              const completed = node.currentProgress || 0;
              const target = habit.targetAmount || 1;
              return { 
                ...node, 
                status: completed >= target ? 'completed' : 'failed' 
              };
            } else {
              const completed = node.checks?.length || 0;
              const target = habit.targetChecks || 1;
              return { 
                ...node, 
                status: completed >= target ? 'completed' : 'failed' 
              };
            }
          }
          return node;
        });
        
        // Add today's node if it doesn't exist (starting fresh from yesterday's end)
        const todayNodeExists = updatedTreeNodes.some(node => node.date === today);
        if (!todayNodeExists) {
          const yesterdayNode = updatedTreeNodes.find(node => node.date === yesterdayStr);
          updatedTreeNodes.push({
            id: Date.now() + Math.random(),
            date: today,
            checks: [],
            currentProgress: 0, // Start fresh each day
            status: 'active',
            parentId: yesterdayNode?.id || null, // Link to previous day for carry-over visualization
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
            <p className="text-text-secondary">Progressive habit lines with daily tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowAddModal(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Add Habit
            </Button>
          </div>
        </div>

        {/* Progressive Habit Lines Visualization */}
        <CreativeHabitsTree 
          habits={habits}
          onCheckIn={handleCheckIn}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
        />
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