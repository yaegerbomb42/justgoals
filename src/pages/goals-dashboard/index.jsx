import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import { useSettings } from '../../context/SettingsContext';
import * as entityService from '../../services/entityManagementService';
import { calculateUserStreak } from '../../utils/goalUtils';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
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
          const appSettings = await firestoreService.getAppSettings(user.id);
          // Fallback to localStorage if onboardingDismissed is not found
          let onboardingDismissed = appSettings.onboardingDismissed;
          if (typeof onboardingDismissed === 'undefined') {
            onboardingDismissed = localStorage.getItem(`onboardingDismissed_${user.id}`) === 'true';
          }
          console.log('[Onboarding] Firestore/localStorage value:', onboardingDismissed);
          if (!cancelled) {
            // Only update state if value actually changes
            if (lastOnboardingState !== onboardingDismissed) {
              setShowOnboarding(!onboardingDismissed);
              setLastOnboardingState(onboardingDismissed);
              setOnboardingError(null);
              sessionFlag = true;
              console.log('[Onboarding] State updated:', !onboardingDismissed);
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
              setOnboardingError('Could not check onboarding status. Please check your connection or permissions.');
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
      try {
        const appSettings = await firestoreService.getAppSettings(user.id);
        await firestoreService.saveAppSettings(user.id, { ...appSettings, onboardingDismissed: true });
        localStorage.setItem(`onboardingDismissed_${user.id}`, 'true'); // Always persist in localStorage as well
        setLastOnboardingState(true);
        console.log('[Onboarding] Modal dismissed, state set to true');
      } catch (e) {
        // If Firestore fails, persist in localStorage
        localStorage.setItem(`onboardingDismissed_${user.id}`, 'true');
        setLastOnboardingState(true);
        console.log('[Onboarding] Modal dismissed (fallback), state set to true');
      }
    }
  };

  // Filter and sort goals
  useEffect(() => {
    let filtered = [...goals];
    if (activeFilter !== 'all') {
      filtered = filtered.filter(goal => goal.category === activeFilter);
    }
    if (activeSort === 'deadline') {
      filtered.sort((a, b) => new Date(a.targetDate || a.deadline) - new Date(b.targetDate || b.deadline));
    } else if (activeSort === 'progress') {
      filtered.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    }
    setFilteredGoals(filtered);
  }, [goals, activeFilter, activeSort]);

  // Always use wizard-based goal creation
  const handleCreateGoal = () => {
    navigate('/goal-creation-management');
  };

  const handleDeleteGoal = (goalId) => {
    if (user) {
      const success = entityService.deleteGoal(user, goalId);
      if (success) {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      }
    }
  };

  const handleGoalUpdate = (updatedGoal) => {
    setGoals(prevGoals => prevGoals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal));
  };

  const handleFilterChange = (filter) => setActiveFilter(filter);
  const handleSortChange = (sort) => setActiveSort(sort);
  const handleOpenDrift = () => navigate('/ai-assistant-chat-drift');

  const safeGoals = Array.isArray(goals) ? goals : [];

  // Remove the early return for !safeGoals.length
  // Always render the main dashboard layout

  return (
    <div className="min-h-screen bg-background">
      <Header showDownloadMenu={showDownloadMenu} setShowDownloadMenu={setShowDownloadMenu} />
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
            overallProgress={displayUserStats.totalGoals > 0 ? (displayUserStats.completedGoals / displayUserStats.totalGoals) * 100 : 0}
            totalGoals={displayUserStats.totalGoals}
            completedGoals={displayUserStats.completedGoals}
            streakDays={displayUserStats.streakDays}
          />
          {/* Quick Actions - always show */}
          <QuickActions
            onCreateGoal={handleCreateGoal}
            onOpenDrift={handleOpenDrift}
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
    </div>
  );
};

export default GoalsDashboard;