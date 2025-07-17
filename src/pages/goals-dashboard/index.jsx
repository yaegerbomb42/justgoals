import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import { useSettings } from '../../context/SettingsContext';
import * as entityService from '../../services/entityManagementService'; // Import the service
import { calculateUserStreak } from '../../utils/goalUtils'; // Import streak calculation
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import WelcomeHero from './components/WelcomeHero';
import QuickActions from './components/QuickActions';
import FilterSortControls from './components/FilterSortControls';
import GoalCard from './components/GoalCard';
import EmptyState from './components/EmptyState';
import Icon from '../../components/AppIcon';
import GoalCreationModal from './components/GoalCreationModal';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { checkAchievements } = useAchievements();
  const { settings } = useSettings();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboardingDismissed');
  });
  const [updateStatus, setUpdateStatus] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // Load goals using the entity service
  useEffect(() => {
    setIsLoading(true);
    if (isAuthenticated && user) {
      const userGoals = entityService.getGoals(user);
      setGoals(userGoals);
    } else {
      setGoals([]); // Not authenticated or no user
    }
    setIsLoading(false);
  }, [isAuthenticated, user]);

  // User data for WelcomeHero - will be derived from 'user' and 'goals'
  const [displayUserStats, setDisplayUserStats] = useState({
    name: "User",
    totalGoals: 0,
    completedGoals: 0,
    streakDays: 0 // Streak calculation is complex, defaulting to 0 for now
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const total = Array.isArray(goals) ? goals.length : 0;
      const completed = Array.isArray(goals) ? goals.filter(goal => goal.progress >= 100).length : 0;
      setDisplayUserStats({
        name: user.name || "User", // Use user's name from AuthContext
        totalGoals: total,
        completedGoals: completed,
        streakDays: calculateUserStreak(user.id).currentStreak // Calculate real streak
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

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingDismissed', '1');
  };


  // Filter and sort goals
  useEffect(() => {
    let filtered = Array.isArray(goals) ? [...goals] : [];

    // Apply filters
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(goal => goal.progress < 100);
        break;
      case 'completed':
        filtered = filtered.filter(goal => goal.progress >= 100);
        break;
      case 'overdue':
        filtered = filtered.filter(goal => {
          const deadline = new Date(goal.deadline);
          const now = new Date();
          return deadline < now && goal.progress < 100;
        });
        break;
      case 'high-priority':
        filtered = filtered.filter(goal => goal.priority === 'high');
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply sorting
    switch (activeSort) {
      case 'deadline':
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'progress':
        filtered.sort((a, b) => b.progress - a.progress);
        break;
      case 'created':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredGoals(filtered);
  }, [goals, activeFilter, activeSort]);

  // Restore wizard-based goal creation
  const handleCreateGoal = () => {
    navigate('/goal-creation-management');
  };

  const handleDeleteGoal = (goalId) => {
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
  };

  const handleGoalUpdate = (updatedGoal) => {
    setGoals(prevGoals => 
      prevGoals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal)
    );
  };

  const handleGoalDelete = (goalId) => {
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
  };

  const handleFocusMode = (goal) => {
    // Navigate to focus mode with the selected goal
    navigate('/focus-mode', { state: { selectedGoal: goal } });
  };

  const handleOpenDrift = () => {
    navigate('/ai-assistant-chat-drift');
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleSortChange = (sort) => {
    setActiveSort(sort);
  };

  // Defensive: ensure goals and achievements are always arrays
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeAchievements = Array.isArray(checkAchievements) ? checkAchievements : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Loading Skeleton */}
            <div className="animate-pulse">
              <div className="bg-surface rounded-xl h-32 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-surface rounded-xl h-64"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  // Show error if no goals or achievements
  if (!safeGoals.length) {
    return (
      <div className="min-h-screen bg-background">
        <Header showDownloadMenu={showDownloadMenu} setShowDownloadMenu={setShowDownloadMenu} />
        <main className="pt-20 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {showOnboarding && <OnboardingModal open={showOnboarding} onClose={handleDismissOnboarding} />}
            {updateStatus && (
              <div className="bg-info text-info-content px-4 py-2 text-center">
                {updateStatus}
              </div>
            )}
            <div className="text-center py-16">
              <h1 className="text-2xl font-heading-bold text-text-primary mb-4">No Goals Yet</h1>
              <p className="text-text-secondary mb-8">Start by creating your first goal to unlock achievements and progress tracking.</p>
              <button onClick={handleCreateGoal} className="btn btn-primary">Create Goal</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showDownloadMenu={showDownloadMenu} setShowDownloadMenu={setShowDownloadMenu} />
      {showOnboarding && <OnboardingModal open={showOnboarding} onClose={handleDismissOnboarding} />}
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
                  onGoalDelete={handleGoalDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              onCreateGoal={handleCreateGoal}
              filterType={activeFilter}
            />
          )}
        </div>
      </main>
      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};

export default GoalsDashboard;