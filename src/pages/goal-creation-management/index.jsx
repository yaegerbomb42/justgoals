import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';
import * as entityService from '../../services/entityManagementService'; // Import the service
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import GoalFormWizard from './components/GoalFormWizard';
import AIAssistantPanel from './components/AIAssistantPanel';
import GoalPriorityManager from './components/GoalPriorityManager';
import SuccessAnimation from './components/SuccessAnimation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const GoalCreationManagement = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAIAssistantCollapsed, setIsAIAssistantCollapsed] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [savedGoalTitle, setSavedGoalTitle] = useState('');
  const [existingGoals, setExistingGoals] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const { user, isAuthenticated } = useAuth();

  // Load goals using the entity service
  useEffect(() => {
    if (isAuthenticated && user) {
      const userGoals = entityService.getGoals(user);
      setExistingGoals(userGoals);
    } else {
      setExistingGoals([]); // Not authenticated or no user
    }
  }, [isAuthenticated, user]);

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  const handleGoalSave = async (goalData) => {
    // goalData comes from GoalFormWizard
    if (user) {
      const createdGoal = await entityService.createGoal(user, goalData); // Await the async function
      if (createdGoal) {
        setExistingGoals(prevGoals => [...prevGoals, createdGoal]);
        setSavedGoalTitle(createdGoal.title);
        setShowSuccessAnimation(true);
        // No direct navigation here, success animation handles it.
      } else {
        // Handle error: goal not created (e.g., show a notification)
        console.error("Goal creation failed");
      }
    }
  };

  const handleSuccessAnimationComplete = () => {
    setShowSuccessAnimation(false);
    navigate('/goals-dashboard'); // Navigate after animation
  };

  const handleGoalsReorder = (reorderedGoals) => {
    // This is tricky with service layer.
    // Option 1: Update each goal's order/priority property individually if they have one.
    // Option 2: Replace all goals for the user if the service supports it (less ideal).
    // For now, assuming `GoalPriorityManager` provides full `reorderedGoals` array
    // and we need to update them in localStorage via the service.
    // This might require a batch update function in the service or individual updates.
    if (user) {
      // Simplistic approach: update each goal if its priority or order changed.
      // This assumes GoalPriorityManager might change a 'priority' or an 'order' field.
      // A more robust solution might involve a dedicated `updateGoalOrder(user, orderedGoalIds)` in the service.
      reorderedGoals.forEach(goal => {
        const originalGoal = existingGoals.find(g => g.id === goal.id);
        // A more specific check for what changed (e.g. an 'order' field or 'priority')
        if (originalGoal && (originalGoal.priority !== goal.priority /* || other order-related fields */)) {
          entityService.updateGoal(user, goal.id, { priority: goal.priority /*, other fields */ });
        }
      });
      setExistingGoals(reorderedGoals); // Update local state optimistically or after service calls confirm
    }
  };

  const handlePriorityChange = (goalId, newPriority) => {
    if (user) {
      const updatedGoal = entityService.updateGoal(user, goalId, { priority: newPriority });
      if (updatedGoal) {
        setExistingGoals(prevGoals =>
          prevGoals.map(goal =>
            goal.id === goalId ? updatedGoal : goal
          )
        );
      }
    }
  };

  const handleDeleteGoal = (goalId) => {
    if (user) {
      const success = entityService.deleteGoal(user, goalId);
      if (success) {
        setExistingGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      }
    }
  };

  const toggleAIAssistant = () => {
    setIsAIAssistantCollapsed(!isAIAssistantCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="pt-20 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Icon name="Target" size={24} color="#FFFFFF" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-heading-semibold text-text-primary">
                  Goal Creation & Management
                </h1>
                <p className="text-text-secondary">
                  Define your objectives and manage your goal priorities with AI assistance
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-surface-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-body-medium transition-all duration-normal ${
                  activeTab === 'create' ?'bg-primary text-primary-foreground shadow-elevation' :'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon name="Plus" size={16} className="inline mr-2" />
                Create New Goal
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-body-medium transition-all duration-normal ${
                  activeTab === 'manage' ?'bg-primary text-primary-foreground shadow-elevation' :'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon name="Settings" size={16} className="inline mr-2" />
                Manage Priorities
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className={`${isAIAssistantCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
              {activeTab === 'create' ? (
                <div className="bg-surface rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-heading-medium text-text-primary">
                      Create New Goal
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <Icon name="Lightbulb" size={16} />
                      <span>Step {currentStep} of 4</span>
                    </div>
                  </div>
                  
                  <GoalFormWizard
                    onGoalSave={handleGoalSave}
                    onStepChange={handleStepChange}
                    currentStep={currentStep}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-surface rounded-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-heading-medium text-text-primary">
                        Manage Goal Priorities
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('create')}
                        iconName="Plus"
                        iconPosition="left"
                      >
                        Add New Goal
                      </Button>
                    </div>
                    
                    <GoalPriorityManager
                      goals={existingGoals}
                      onGoalsReorder={handleGoalsReorder}
                      onPriorityChange={handlePriorityChange}
                      onDeleteGoal={handleDeleteGoal}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Assistant Panel */}
            {!isAIAssistantCollapsed && (
              <div className="lg:col-span-1">
                <div className="sticky top-24 h-[calc(100vh-8rem)]">
                  <AIAssistantPanel
                    isCollapsed={false}
                    onToggle={toggleAIAssistant}
                    goalContext={activeTab === 'create' ? 'Goal Creation' : 'Goal Management'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg border border-border p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="Target" size={16} color="#6366F1" />
                </div>
                <div>
                  <div className="text-lg font-heading-medium text-text-primary">
                    {existingGoals.length}
                  </div>
                  <div className="text-sm text-text-secondary">Total Goals</div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <Icon name="TrendingUp" size={16} color="#10B981" />
                </div>
                <div>
                  <div className="text-lg font-heading-medium text-text-primary">
                    {existingGoals.filter(g => g.progress > 50).length}
                  </div>
                  <div className="text-sm text-text-secondary">On Track</div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Icon name="AlertTriangle" size={16} color="#F59E0B" />
                </div>
                <div>
                  <div className="text-lg font-heading-medium text-text-primary">
                    {existingGoals.filter(g => g.priority === 'high').length}
                  </div>
                  <div className="text-sm text-text-secondary">High Priority</div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Icon name="Calendar" size={16} color="#8B5CF6" />
                </div>
                <div>
                  <div className="text-lg font-heading-medium text-text-primary">
                    {existingGoals.filter(g => new Date(g.targetDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <div className="text-sm text-text-secondary">Due Soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton goalContext="Goal Creation" />

      {/* Collapsed AI Assistant */}
      {isAIAssistantCollapsed && (
        <AIAssistantPanel
          isCollapsed={true}
          onToggle={toggleAIAssistant}
        />
      )}

      {/* Success Animation */}
      <SuccessAnimation
        isVisible={showSuccessAnimation}
        onComplete={handleSuccessAnimationComplete}
        goalTitle={savedGoalTitle}
      />
    </div>
  );
};

export default GoalCreationManagement;