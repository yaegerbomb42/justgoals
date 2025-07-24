import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as entityService from '../../services/entityManagementService'; // Import the service
import { calculateUserStreak } from '../../utils/goalUtils'; // Import streak calculation
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import FloatingActionButton from '../../components/ui/FloatingActionButton';

// Import all components
import MilestoneCard from './components/MilestoneCard';
import DateHeader from './components/DateHeader';
import GoalSelector from './components/GoalSelector';
import ProgressVisualization from './components/ProgressVisualization';
import TimelineProgressVisualization from './components/TimelineProgressVisualization';
import AddMilestoneModal from './components/AddMilestoneModal';
import AIAssistantPanel from './components/AIAssistantPanel';
import ProgressAIAssistant from './components/ProgressAIAssistant';
import ReflectionPrompt from './components/ReflectionPrompt';

const Progress = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [viewMode, setViewMode] = useState('day');
  const [milestones, setMilestones] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [error, setError] = useState(null);

  // Load goals using entityService instead of mock data
  const [goals, setGoals] = useState([]);

  // Load goals using the entity service
  useEffect(() => {
    if (isAuthenticated && user) {
      (async () => {
        try {
          const userGoals = await entityService.getGoals(user);
          setGoals(Array.isArray(userGoals) ? userGoals : []);
        } catch (e) {
          setGoals([]);
          setError('Failed to load goals. Please check your connection or permissions.');
        }
      })();
    } else {
      setGoals([]);
    }
  }, [isAuthenticated, user]);

  const getMilestoneStorageKey = useCallback(() => {
    if (user && user.id) {
      return `milestones_data_${user.id}`;
    }
    // Return a default or null if user or user.id is not available,
    // or handle this case as appropriate for your application logic.
    return null;
  }, [user]);

  // Load milestones using the entity service
  useEffect(() => {
    if (isAuthenticated && user) {
      try {
        const userMilestones = entityService.getMilestones(user);
        setMilestones(Array.isArray(userMilestones) ? userMilestones : []);
      } catch (e) {
        setMilestones([]);
        setError('Failed to load milestones. Please check your connection or permissions.');
      }
    } else {
      setMilestones([]);
    }
  }, [isAuthenticated, user, selectedDate]); // Reload if selectedDate changes, to fetch relevant milestones


  // Check for evening reflection prompt. This useEffect remains the same.
  useEffect(() => {
    const checkReflectionTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Show reflection prompt after 8 PM if there are completed milestones
      if (hour >= 20 && getFilteredMilestones().some(m => m.completed)) {
        const today = new Date().toISOString().split('T')[0];
        const hasReflectedToday = localStorage.getItem(`reflection_${today}`);
        
        if (!hasReflectedToday) {
          setShowReflectionPrompt(true);
        }
      }
    };

    checkReflectionTime();
    const interval = setInterval(checkReflectionTime, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [milestones]);

  const getFilteredMilestones = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    let filtered = Array.isArray(milestones) ? milestones.filter(milestone => milestone.date === dateStr) : [];
    
    if (selectedGoalId) {
      filtered = filtered.filter(milestone => milestone.goalId === selectedGoalId);
    }
    
    return filtered.sort((a, b) => {
      // Sort by completion status, then priority, then due time
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      if (a.dueTime && b.dueTime) {
        return a.dueTime.localeCompare(b.dueTime);
      }
      
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  };

  const handleToggleComplete = async (milestoneId) => {
    if (user) {
      const milestone = milestones.find(m => m.id === milestoneId);
      if (milestone) {
        const updatedMilestone = entityService.updateMilestone(user, milestoneId, { completed: !milestone.completed });
        if (updatedMilestone) {
          setMilestones(prevMilestones =>
            prevMilestones.map(m =>
              m.id === milestoneId ? { ...updatedMilestone, createdAt: new Date(updatedMilestone.createdAt) } : m
            )
          );
        }
      }
    }
  };

  const handleStartFocus = (milestone) => {
    // Navigate to focus mode with milestone context
    window.location.href = `/focus-mode?milestoneId=${milestone.id}&goalId=${milestone.goalId}`;
  };

  const handleEditMilestone = (milestoneDataFromModal) => {
    if (user && milestoneDataFromModal && milestoneDataFromModal.id) {
      const updatedMilestone = entityService.updateMilestone(user, milestoneDataFromModal.id, milestoneDataFromModal);
      if (updatedMilestone) {
        setMilestones(prevMilestones =>
          prevMilestones.map(m =>
            m.id === updatedMilestone.id ? { ...updatedMilestone, createdAt: new Date(updatedMilestone.createdAt) } : m
          )
        );
      }
    }
    setEditingMilestone(null);
    setIsAddModalOpen(false);
  };

  const handleDeleteMilestone = (milestoneId) => {
    if (user) {
      const success = entityService.deleteMilestone(user, milestoneId);
      if (success) {
        setMilestones(prevMilestones => prevMilestones.filter(milestone => milestone.id !== milestoneId));
      }
    }
  };

  const handleAddMilestone = (newMilestoneData) => { // newMilestoneData from AddMilestoneModal
    if (user) {
      const goal = goals.find(g => g.id === newMilestoneData.goalId);
      // Ensure 'date' is included, typically from selectedDate
      const milestonePayload = {
        ...newMilestoneData,
        date: newMilestoneData.date || selectedDate.toISOString().split('T')[0], // Ensure date is set
        goalName: goal ? goal.title : 'N/A', // Add goalName if not provided by modal
        // completed and createdAt will be set by the service or are defaults
      };
      const createdMilestone = entityService.createMilestone(user, milestonePayload);
      if (createdMilestone) {
        setMilestones(prevMilestones => [...prevMilestones, { ...createdMilestone, createdAt: new Date(createdMilestone.createdAt) }]);
      }
    }
  };

  const handleCreateProgressPath = (pathMilestones) => {
    if (user && selectedGoalId && Array.isArray(pathMilestones)) {
      const goal = goals.find(g => g.id === selectedGoalId);
      
      pathMilestones.forEach((milestone, index) => {
        // Calculate dates for milestones, spacing them out over time
        const baseDate = new Date(selectedDate);
        baseDate.setDate(baseDate.getDate() + (index * (milestone.estimatedDays || 7)));
        
        const milestonePayload = {
          title: milestone.title,
          description: milestone.description || milestone.successCriteria || '',
          goalId: selectedGoalId,
          goalName: goal ? goal.title : 'N/A',
          priority: milestone.priority || 'medium',
          date: baseDate.toISOString().split('T')[0],
          completed: false,
          createdAt: new Date(),
          aiGenerated: true // Mark as AI generated
        };
        
        const createdMilestone = entityService.createMilestone(user, milestonePayload);
        if (createdMilestone) {
          setMilestones(prevMilestones => [...prevMilestones, { ...createdMilestone, createdAt: new Date(createdMilestone.createdAt) }]);
        }
      });
    }
  };

  const handleOpenEditModal = (milestone) => {
    setEditingMilestone(milestone);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingMilestone(null);
  };

  const handleSaveReflection = (reflectionData) => {
    // Save reflection to localStorage
    localStorage.setItem(`reflection_${reflectionData.date}`, JSON.stringify(reflectionData));
    console.log('Reflection saved:', reflectionData);
  };

  const filteredMilestones = getFilteredMilestones();
  const completedCount = Array.isArray(filteredMilestones) ? filteredMilestones.filter(m => m.completed).length : 0;
  const totalCount = Array.isArray(filteredMilestones) ? filteredMilestones.length : 0;
  const selectedGoal = Array.isArray(goals) ? goals.find(goal => goal.id === selectedGoalId) : null;

  // Calculate real weekly progress and streak
  const weeklyProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const streakData = user ? calculateUserStreak(user.id) : { currentStreak: 0 };
  const streakCount = streakData.currentStreak;

  // Defensive: ensure milestones, goals, and filteredMilestones are always arrays
  const safeMilestones = Array.isArray(milestones) ? milestones : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeFilteredMilestones = Array.isArray(filteredMilestones) ? filteredMilestones : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Date Header */}
              <DateHeader
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onViewModeChange={setViewMode}
                viewMode={viewMode}
              />

              {/* Goal Selector */}
              <GoalSelector
                goals={safeGoals}
                selectedGoalId={selectedGoalId}
                onGoalSelect={setSelectedGoalId}
              />

              {/* Timeline Progress Visualization */}
              <TimelineProgressVisualization
                completedCount={completedCount}
                totalCount={totalCount}
                streakCount={streakCount}
                weeklyProgress={weeklyProgress}
                selectedGoal={selectedGoal}
                progressMarks={safeFilteredMilestones}
              />

              {/* Milestones List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-heading-medium text-text-primary">
                    Progress Journey
                  </h2>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-text-secondary">
                      {completedCount}/{totalCount} completed
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddModalOpen(true)}
                      iconName="Plus"
                      className="text-text-secondary hover:text-primary"
                    >
                      Add Step
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-error/10 border border-error/20 rounded text-error text-center mb-4">{error}</div>
                )}

                {safeFilteredMilestones.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-surface-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="Target" size={24} className="text-text-secondary" />
                    </div>
                    <h3 className="text-lg font-heading-medium text-text-primary mb-2">
                      Start Your Progress Journey
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Create progression marks to track your journey toward your goals
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setIsAddModalOpen(true)}
                      iconName="Plus"
                      iconPosition="left"
                    >
                      Add Progress Step
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {safeFilteredMilestones.map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        onToggleComplete={handleToggleComplete}
                        onStartFocus={handleStartFocus}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteMilestone}
                        isDragging={draggedItem === milestone.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-surface rounded-lg border border-border p-4">
                <h3 className="font-heading-medium text-text-primary mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    to="/focus-mode"
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-surface-700 transition-colors duration-fast"
                  >
                    <Icon name="Focus" size={20} className="text-primary mb-2" />
                    <span className="text-xs font-caption text-text-secondary">Focus Mode</span>
                  </Link>
                  
                  <Link
                    to="/goals-dashboard"
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-surface-700 transition-colors duration-fast"
                  >
                    <Icon name="Target" size={20} className="text-accent mb-2" />
                    <span className="text-xs font-caption text-text-secondary">Goals</span>
                  </Link>
                  
                  <button
                    onClick={() => setIsAIExpanded(true)}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-surface-700 transition-colors duration-fast"
                  >
                    <Icon name="Bot" size={20} className="text-secondary mb-2" />
                    <span className="text-xs font-caption text-text-secondary">Progress AI</span>
                  </button>
                  
                  <Link
                    to="/settings-configuration"
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-surface-700 transition-colors duration-fast"
                  >
                    <Icon name="Settings" size={20} className="text-warning mb-2" />
                    <span className="text-xs font-caption text-text-secondary">Settings</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Progress AI Assistant Panel - Desktop */}
            <div className="hidden lg:block">
              <ProgressAIAssistant
                isExpanded={isAIExpanded}
                onToggle={() => setIsAIExpanded(!isAIExpanded)}
                selectedGoal={selectedGoal}
                progressMarks={safeFilteredMilestones}
                onCreateProgressPath={handleCreateProgressPath}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Progress AI Assistant Panel */}
      <div className="lg:hidden">
        <ProgressAIAssistant
          isExpanded={isAIExpanded}
          onToggle={() => setIsAIExpanded(!isAIExpanded)}
          selectedGoal={selectedGoal}
          progressMarks={safeFilteredMilestones}
          onCreateProgressPath={handleCreateProgressPath}
        />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton 
        goalContext={selectedGoal?.title}
      />

      {/* Add Progress Step Modal */}
      <AddMilestoneModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddMilestone}
        onEdit={handleEditMilestone}
        goals={safeGoals}
        editingMilestone={editingMilestone}
      />

      {/* Reflection Prompt */}
      <ReflectionPrompt
        isVisible={showReflectionPrompt}
        onClose={() => setShowReflectionPrompt(false)}
        completedMilestones={completedCount}
        totalMilestones={totalCount}
        onSaveReflection={handleSaveReflection}
      />
    </div>
  );
};

export default Progress;