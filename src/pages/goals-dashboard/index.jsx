import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import { useSettings } from '../../context/SettingsContext';
import * as entityService from '../../services/entityManagementService';
import { calculateUserStreak } from '../../utils/goalUtils';
import { migrateGoalDeadlineField } from '../../utils/userUtils';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import SmartPriorityManager from '../../components/SmartPriorityManager';
import WelcomeHero from './components/WelcomeHero';
import QuickActions from './components/QuickActions';
import FilterSortControls from './components/FilterSortControls';
import GoalCard from './components/GoalCard';
import EmptyState from './components/EmptyState';
import Icon from '../../components/AppIcon';
import firestoreService from '../../services/firestoreService';

// Onboarding Modal Component
function OnboardingModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-surface rounded-xl shadow-lg p-8 max-w-lg w-full relative">
        <button className="absolute top-4 right-4 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-heading-bold mb-2">Welcome to Yaeger's Goals!</h2>
        <p className="mb-4 text-text-secondary">Here's how to get started and make the most of your app:</p>
        <ul className="list-disc pl-6 mb-4 text-text-primary">
          <li><b>Install:</b> Just double-click the installer for Mac or Windows. No extra setup needed.</li>
          <li><b>Getting Started:</b> Create your first goal to unlock achievements and analytics. Explore Focus Mode, Journal, and AI Assistant for more features.</li>
          <li><b>What's New:</b> Enjoy a native desktop experience, auto-updates, and enhanced security with code signing.</li>
        </ul>
        <p className="text-xs text-text-secondary">You can always revisit this screen from the dashboard menu.</p>
        <button className="mt-6 px-4 py-2 bg-primary text-white rounded" onClick={onClose}>Get Started</button>
      </div>
    </div>
  );
}

const GoalsDashboard = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('deadline');
  const [showSmartPriority, setShowSmartPriority] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { checkAchievements } = useAchievements();
  const { settings } = useSettings();
  // Robust onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState(null);
  const [lastOnboardingState, setLastOnboardingState] = useState(undefined); // For guard
  const [updateStatus, setUpdateStatus] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // Load goals using the entity service
  useEffect(() => {
    setGoals([]);
    if (isAuthenticated && user) {
      // Migrate any existing goals from targetDate to deadline field
      migrateGoalDeadlineField(user);
      
      (async () => {
        const userGoals = await entityService.getGoals(user);
        setGoals(userGoals);
      })();
    }
  }, [isAuthenticated, user]);

  // User data for WelcomeHero - will be derived from 'user' and 'goals'
  const [displayUserStats, setDisplayUserStats] = useState({
    name: "User",
    totalGoals: 0,
    completedGoals: 0,
    streakDays: 0
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const total = Array.isArray(goals) ? goals.length : 0;
      const completed = Array.isArray(goals) ? goals.filter(goal => goal.progress >= 100).length : 0;
      setDisplayUserStats({
        name: user.name || "User",
        totalGoals: total,
        completedGoals: completed,
        streakDays: calculateUserStreak(user.id).currentStreak
      });
    } else {
      setDisplayUserStats({ name: "User", totalGoals: 0, completedGoals: 0, streakDays: 0 });
    }
  }, [user, isAuthenticated, goals]);

  // Electron auto-updater integration
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.checkForUpdates) {
      window.electronAPI.checkForUpdates((status) => {
        setUpdateStatus(status);
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let sessionFlag = false;
    async function checkOnboarding() {
      if (isAuthenticated && user && user.id) {
        try {
          // First check localStorage for immediate response
          const localOnboardingDismissed = localStorage.getItem(`onboardingDismissed_${user.id}`) === 'true';
          
          // If localStorage says dismissed, use that immediately
          if (localOnboardingDismissed && lastOnboardingState !== true) {
            setShowOnboarding(false);
            setLastOnboardingState(true);
            setOnboardingError(null);
            console.log('[Onboarding] Using localStorage value (dismissed)');
          }
          
          // Then try to get from Firestore for sync
          const appSettings = await firestoreService.getAppSettings(user.id);
          let firestoreOnboardingDismissed = appSettings.onboardingDismissed;
          
          // Determine the authoritative value (prefer true if either source says true)
          const authoritativeValue = localOnboardingDismissed || firestoreOnboardingDismissed || false;
          
          if (!cancelled) {
            if (lastOnboardingState !== authoritativeValue) {
              setShowOnboarding(!authoritativeValue);
              setLastOnboardingState(authoritativeValue);
              setOnboardingError(null);
              sessionFlag = true;
              console.log('[Onboarding] State updated:', !authoritativeValue, 'from sources:', { local: localOnboardingDismissed, firestore: firestoreOnboardingDismissed });
              
              // Sync the authoritative value to both stores if needed
              if (authoritativeValue) {
                localStorage.setItem(`onboardingDismissed_${user.id}`, 'true');
                if (!firestoreOnboardingDismissed) {
                  firestoreService.saveAppSettings(user.id, { ...appSettings, onboardingDismissed: true })
                    .catch(e => console.warn('Failed to sync onboarding state to Firestore:', e));
                }
              }
            } else {
              console.log('[Onboarding] No state change needed');
            }
          }
        } catch (e) {
          console.error('[Onboarding] Firestore error:', e);
          // Fallback to localStorage if error
          const onboardingDismissed = localStorage.getItem(`onboardingDismissed_${user?.id}`) === 'true';
          if (!cancelled && !sessionFlag) {
            if (lastOnboardingState !== onboardingDismissed) {
              setShowOnboarding(!onboardingDismissed);
              setLastOnboardingState(onboardingDismissed);
              setOnboardingError('Could not check onboarding status. Using local data.');
              sessionFlag = true;
              console.log('[Onboarding] Fallback state updated:', !onboardingDismissed);
            } else {
              console.log('[Onboarding] No fallback state change needed');
            }
          }
        }
      } else {
        setShowOnboarding(false);
        setOnboardingError(null);
        setLastOnboardingState(undefined);
        console.log('[Onboarding] Not authenticated or no user, modal hidden');
      }
    }
    checkOnboarding();
    return () => { cancelled = true; };
  }, [isAuthenticated, user, lastOnboardingState]);

  const handleDismissOnboarding = async () => {
    setShowOnboarding(false);
    if (isAuthenticated && user && user.id) {
      // Always persist in localStorage immediately to ensure state is saved
      localStorage.setItem(`onboardingDismissed_${user.id}`, 'true');
      setLastOnboardingState(true);
      
      try {
        // Attempt to save to Firestore as well
        const appSettings = await firestoreService.getAppSettings(user.id);
        await firestoreService.saveAppSettings(user.id, { ...appSettings, onboardingDismissed: true });
        console.log('[Onboarding] Modal dismissed, synced to Firestore');
      } catch (e) {
        // If Firestore fails, we already have localStorage backup
        console.warn('[Onboarding] Modal dismissed, Firestore sync failed but localStorage persisted:', e);
      }
    }
  };

  // Filter and sort goals
  useEffect(() => {
    let filtered = [...goals];
    
    // Apply filter based on type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(goal => {
        switch (activeFilter) {
          case 'active':
            return goal.progress < 100 && (!goal.deadline || new Date(goal.deadline) >= new Date());
          case 'completed':
            return goal.progress >= 100;
          case 'overdue':
            return goal.progress < 100 && goal.deadline && new Date(goal.deadline) < new Date();
          case 'high-priority':
            return goal.priority === 'high' || goal.priority === 'critical';
          default:
            // If it's not a status filter, treat it as a category filter
            return goal.category === activeFilter;
        }
      });
    }
    
    // Apply sorting
    if (activeSort === 'deadline') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.deadline || '9999-12-31');
        const dateB = new Date(b.deadline || '9999-12-31');
        return dateA - dateB;
      });
    } else if (activeSort === 'progress') {
      filtered.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } else if (activeSort === 'priority') {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
    } else if (activeSort === 'created') {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (activeSort === 'alphabetical') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    
    setFilteredGoals(filtered);
  }, [goals, activeFilter, activeSort]);

  // Always use wizard-based goal creation
  const handleCreateGoal = () => {
    navigate('/goal-creation-management');
  };

  const handleDeleteGoal = async (goalId) => {
    if (user) {
      try {
        await entityService.deleteGoal(user, goalId);
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      } catch (error) {
        console.error("Failed to delete goal:", error);
        alert("Failed to delete the goal. Please try again.");
      }
    }
  };

  const handleGoalUpdate = (updatedGoal) => {
    setGoals(prevGoals => prevGoals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal));
  };

  const handleSmartPrioritization = () => {
    if (safeGoals.length === 0) {
      alert('Add some goals first to use smart prioritization.');
      return;
    }
    setShowSmartPriority(true);
  };

  const handlePrioritizedGoalsApplied = async (prioritizedGoals) => {
    try {
      // Update goals with new AI priority data
      for (const goal of prioritizedGoals) {
        if (user && goal.id) {
          await entityService.updateGoal(user, goal.id, {
            aiPriorityScore: goal.aiPriorityScore,
            aiConfidence: goal.aiConfidence,
            aiReasoning: goal.aiReasoning,
            aiRecommendedAction: goal.aiRecommendedAction,
            aiImpactAreas: goal.aiImpactAreas,
            aiTimeframe: goal.aiTimeframe,
            aiPrioritizedAt: goal.aiPrioritizedAt
          });
        }
      }
      
      // Update local state
      setGoals(prioritizedGoals);
      setShowSmartPriority(false);
      
      // Show success message
      alert('Smart prioritization applied successfully! Your goals are now ordered by strategic importance.');
    } catch (error) {
      console.error('Error applying prioritization:', error);
      alert('Failed to apply prioritization. Please try again.');
    }
  };

  const getUserContext = () => {
    return {
      totalGoals: safeGoals.length,
      completedGoals: safeGoals.filter(g => g.progress >= 100).length,
      overdue: safeGoals.filter(g => g.deadline && new Date(g.deadline) < new Date()).length,
      categories: [...new Set(safeGoals.map(g => g.category))],
      avgProgress: safeGoals.length > 0 ? Math.round(safeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / safeGoals.length) : 0,
      userName: user?.displayName || user?.email || 'User',
      userGoalsHistory: safeGoals.length // Could be enhanced with more historical data
    };
  };

  const handleFilterChange = (filter) => setActiveFilter(filter);
  const handleSortChange = (sort) => setActiveSort(sort);
  const handleOpenDrift = () => navigate('/ai-assistant-chat-drift');

  const safeGoals = Array.isArray(goals) ? goals : [];

  // Remove the early return for !safeGoals.length
  // Always render the main dashboard layout

  return (
    <div className="min-h-screen bg-background">
      {showOnboarding && <OnboardingModal open={showOnboarding} onClose={handleDismissOnboarding} />}
      {onboardingError && (
        <div className="bg-error/10 border border-error/20 text-error text-center p-4 mb-4 rounded">
          <strong>{onboardingError}</strong>
        </div>
      )}
      {updateStatus && (
        <div className="bg-info text-info-content px-4 py-2 text-center">
          {updateStatus}
        </div>
      )}
      <main className="pt-20 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Hero Section - always show */}
          <WelcomeHero
            userName={displayUserStats.name}
            userId={user?.id}
            overallProgress={0} // If you have this value, pass it
            totalGoals={displayUserStats.totalGoals}
            completedGoals={displayUserStats.completedGoals}
            streakDays={displayUserStats.streakDays}
          />
          {/* Quick Actions - always show */}
          <QuickActions
            onCreateGoal={handleCreateGoal}
            onOpenDrift={handleOpenDrift}
            onSmartPrioritize={handleSmartPrioritization}
            hasGoals={safeGoals.length > 0}
          />
          {/* Filter and Sort Controls - always show */}
          <FilterSortControls
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            activeFilter={activeFilter}
            activeSort={activeSort}
          />
          {/* Goals Grid or Empty State */}
          {Array.isArray(filteredGoals) && filteredGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onGoalUpdate={handleGoalUpdate}
                  onGoalDelete={handleDeleteGoal}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h1 className="text-2xl font-heading-bold text-text-primary mb-4">No Goals Yet</h1>
              <p className="text-text-secondary mb-8">Start by creating your first goal to unlock achievements and progress tracking.</p>
              <button onClick={handleCreateGoal} className="btn btn-primary">Create Goal</button>
            </div>
          )}
        </div>
      </main>
      {/* Floating Action Button */}
      <FloatingActionButton />
      
      {/* Smart Priority Manager Modal */}
      {showSmartPriority && (
        <SmartPriorityManager
          goals={safeGoals}
          onGoalsReordered={handlePrioritizedGoalsApplied}
          onClose={() => setShowSmartPriority(false)}
          userContext={getUserContext()}
        />
      )}
    </div>
  );
};

export default GoalsDashboard;