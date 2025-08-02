import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import AddHabitModal from '../../components/AddHabitModal';
import HabitsAIAssistant from './components/AIAssistantPanel';
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
  const [viewMode, setViewMode] = useState('creative'); // Only 'creative' mode now
  const [showAIAssistant, setShowAIAssistant] = useState(false);

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
          currentProgress: 0,
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

  const handleCheckIn = async (habitId, nodeId, checkType = 'default', progressAmount = 1) => {
    if (!user?.id) return;
    
    try {
      const updatedHabit = await habitService.addCheckIn(user.id, habitId, nodeId, checkType, progressAmount);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
      checkAchievements();
    } catch (error) {
      console.error('Failed to add check-in:', error);
    }
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
            currentProgress: 0,
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
            <h1 className="text-3xl font-heading-bold text-text-primary mb-2">Habits</h1>
            <p className="text-text-secondary">Build lasting habits with unified tree tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            
            <Button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              variant="secondary"
              size="sm"
            >
              <Icon name="Bot" size={16} className="mr-1" />
              AI Assistant
            </Button>
            
            <Button
              onClick={() => setShowAddModal(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Add Habit
            </Button>
          </div>
        </div>

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
        ) : (
          /* Creative Tree Visualization */
          <CreativeHabitsTree 
            habits={habits}
            onCheckIn={handleCheckIn}
            onEditHabit={handleEditHabit}
            onDeleteHabit={handleDeleteHabit}
          />
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

      {/* Habits AI Assistant */}
      <HabitsAIAssistant
        isExpanded={showAIAssistant}
        onToggle={() => setShowAIAssistant(!showAIAssistant)}
        habits={habits}
        onCreateHabit={handleAddHabit}
        onUpdateHabit={handleUpdateHabit}
        onDeleteHabit={handleDeleteHabit}
      />
    </div>
  );
};

export default HabitsPage; 