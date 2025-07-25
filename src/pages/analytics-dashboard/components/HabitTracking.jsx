import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ChainVisualization from '../../../components/ChainLink';
import habitService, { getToday, getCurrentWeek } from '../../../services/habitService';
import { useAuth } from '../../../context/AuthContext';

const HabitTracking = () => {
  const { user } = useAuth() || { user: null };
  const userId = user?.id || null;

  // State management
  const [habitData, setHabitData] = useState({
    dailyHabits: [],
    weeklyHabits: [],
    customDailyHabits: [],
    customWeeklyHabits: [],
    dailyChain: 0,
    weeklyChain: 0,
    dailyCompletions: {},
    weeklyCompletions: {},
    lastDailyReset: getToday(),
    lastWeeklyReset: getCurrentWeek(),
  });

  const [showCelebration, setShowCelebration] = useState({ daily: false, weekly: false });
  const [newChainLink, setNewChainLink] = useState({ daily: false, weekly: false });
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load habit data on component mount
  useEffect(() => {
    loadHabitsData();
  }, [userId]);

  const loadHabitsData = async () => {
    try {
      setIsLoading(true);
      const data = await habitService.loadHabitsData(userId);
      setHabitData(data);
      
      // Check for automatic resets
      await habitService.checkAndResetHabits(userId);
      const updatedData = await habitService.loadHabitsData(userId);
      setHabitData(updatedData);
    } catch (error) {
      console.error('Error loading habits data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new custom habit
  // Remove a custom habit
  const handleRemoveHabit = async (habitId, isWeekly, isCustom) => {
    if (!isCustom) return; // Only allow removing custom habits
    
    try {
      await habitService.removeCustomHabit(userId, habitId, isWeekly);
      await loadHabitsData();
    } catch (error) {
      console.error('Error removing habit:', error);
    }
  };

  // Toggle habit completion
  const toggleHabit = async (habitId, isWeekly = false, isCustom = false) => {
    try {
      const updatedData = await habitService.toggleHabitCompletion(userId, habitId, isWeekly, isCustom);
      setHabitData(updatedData);

      // Check for celebrations
      const allDailyHabits = [...updatedData.dailyHabits, ...(updatedData.customDailyHabits || [])];
      const allWeeklyHabits = [...updatedData.weeklyHabits, ...(updatedData.customWeeklyHabits || [])];
      
      if (!isWeekly) {
        const allDailyCompleted = allDailyHabits.every(habit => habit.completed);
        const today = getToday();
        if (allDailyCompleted && !habitData.dailyCompletions[today]) {
          setShowCelebration(prev => ({ ...prev, daily: true }));
          setNewChainLink(prev => ({ ...prev, daily: true }));
          setTimeout(() => setShowCelebration(prev => ({ ...prev, daily: false })), 3000);
          setTimeout(() => setNewChainLink(prev => ({ ...prev, daily: false })), 1000);
        }
      } else {
        const allWeeklyCompleted = allWeeklyHabits.every(habit => habit.completed);
        const currentWeek = getCurrentWeek();
        if (allWeeklyCompleted && !habitData.weeklyCompletions[currentWeek]) {
          setShowCelebration(prev => ({ ...prev, weekly: true }));
          setNewChainLink(prev => ({ ...prev, weekly: true }));
          setTimeout(() => setShowCelebration(prev => ({ ...prev, weekly: false })), 3000);
          setTimeout(() => setNewChainLink(prev => ({ ...prev, weekly: false })), 1000);
        }
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  // Reset all habits for testing
  const resetAllHabits = async () => {
    try {
      const resetData = await habitService.resetAllProgress(userId);
      setHabitData(resetData);
    } catch (error) {
      console.error('Error resetting habits:', error);
    }
  };

  // Reset chains for testing
  const resetChains = async () => {
    try {
      const currentData = await habitService.loadHabitsData(userId);
      const resetData = {
        ...currentData,
        dailyChain: 0,
        weeklyChain: 0,
        dailyCompletions: {},
        weeklyCompletions: {},
      };
      await habitService.saveHabitsData(userId, resetData);
      setHabitData(resetData);
    } catch (error) {
      console.error('Error resetting chains:', error);
    }
  };

  // Get all habits combined
  const allDailyHabits = [...habitData.dailyHabits, ...(habitData.customDailyHabits || [])];
  const allWeeklyHabits = [...habitData.weeklyHabits, ...(habitData.customWeeklyHabits || [])];
  const allDailyCompleted = allDailyHabits.every(habit => habit.completed);
  const allWeeklyCompleted = allWeeklyHabits.every(habit => habit.completed);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <motion.h1 
            className="text-4xl font-heading-bold text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Daily Habits 🌟
          </motion.h1>
          <motion.p 
            className="text-white/90 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Build your perfect day, one habit at a time
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Daily Habits Section */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-surface-700 rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden">
            {/* Celebration Banner */}
            <AnimatePresence>
              {showCelebration.daily && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20 z-10 flex items-center justify-center"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="bg-emerald-500 text-white px-6 py-3 rounded-full font-heading-bold text-lg shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    🎉 Great Work! Daily Goals Complete! 🎉
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading-bold text-primary flex items-center gap-3">
                <span className="bg-primary/10 p-2 rounded-lg">📅</span>
                Daily Habits
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <span className="text-2xl font-heading-bold text-warning">{habitData.dailyChain}</span>
                  <span className="text-text-secondary">day streak</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {allDailyHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  className={`bg-surface-600 rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer relative group ${
                    habit.completed 
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleHabit(habit.id, false, !habit.isDefault)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        habit.completed 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'border-border bg-surface-800'
                      }`}
                      animate={habit.completed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {habit.completed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Icon name="Check" size={12} className="text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                    <span className="text-3xl">{habit.emoji}</span>
                    <span className={`text-lg font-body-medium flex-1 ${
                      habit.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-primary'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.completed && (
                      <motion.span
                        className="text-emerald-500 font-heading-bold"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        ✓ Done!
                      </motion.span>
                    )}
                    {!habit.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHabit(habit.id, false, true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-danger transition-all"
                        title="Remove custom habit"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Daily Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary">Daily Progress</span>
                <span className="text-primary font-heading-medium">
                  {allDailyHabits.filter(h => h.completed).length} / {allDailyHabits.length}
                </span>
              </div>
              <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${allDailyHabits.length > 0 ? (allDailyHabits.filter(h => h.completed).length / allDailyHabits.length) * 100 : 0}%` 
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Weekly Habits Section */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-surface-700 rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden">
            {/* Celebration Banner */}
            <AnimatePresence>
              {showCelebration.weekly && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-violet-400/30 to-violet-500/20 z-10 flex items-center justify-center"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="bg-violet-500 text-white px-6 py-3 rounded-full font-heading-bold text-lg shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    🔥 Amazing! Weekly Goals Complete! 🔥
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading-bold text-secondary flex items-center gap-3">
                <span className="bg-secondary/10 p-2 rounded-lg">📆</span>
                Weekly Habits
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <span className="text-2xl font-heading-bold text-warning">{habitData.weeklyChain}</span>
                  <span className="text-text-secondary">week streak</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {allWeeklyHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  className={`bg-surface-600 rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer relative group ${
                    habit.completed 
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' 
                      : 'border-border hover:border-secondary/50'
                  }`}
                  onClick={() => toggleHabit(habit.id, true, !habit.isDefault)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        habit.completed 
                          ? 'bg-violet-500 border-violet-500' 
                          : 'border-border bg-surface-800'
                      }`}
                      animate={habit.completed ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {habit.completed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Icon name="Check" size={12} className="text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                    <span className="text-3xl">{habit.emoji}</span>
                    <span className={`text-lg font-body-medium flex-1 ${
                      habit.completed ? 'text-violet-600 dark:text-violet-400' : 'text-text-primary'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.completed && (
                      <motion.span
                        className="text-violet-500 font-heading-bold"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        ✓ Done!
                      </motion.span>
                    )}
                    {!habit.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHabit(habit.id, true, true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-danger transition-all"
                        title="Remove custom habit"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Weekly Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary">Weekly Progress</span>
                <span className="text-secondary font-heading-medium">
                  {allWeeklyHabits.filter(h => h.completed).length} / {allWeeklyHabits.length}
                </span>
              </div>
              <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${allWeeklyHabits.length > 0 ? (allWeeklyHabits.filter(h => h.completed).length / allWeeklyHabits.length) * 100 : 0}%` 
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chain Visualization */}
        <motion.div
          className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <h3 className="text-2xl font-heading-bold text-amber-700 dark:text-amber-300 mb-6 text-center flex items-center justify-center gap-3">
            <span className="text-3xl">🔗</span>
            Habit Chains
            <span className="text-3xl">🔗</span>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Chain */}
            <div className="text-center">
              <h4 className="text-lg font-heading-medium text-emerald-700 dark:text-emerald-300 mb-4">Daily Chain</h4>
              <ChainVisualization
                chainLength={habitData.dailyChain}
                hasNewLink={newChainLink.daily}
                color="emerald"
                size="normal"
                label={habitData.dailyChain > 0 
                  ? "Keep it up! Complete today's habits to extend your chain."
                  : "Start your daily chain by completing all habits today!"
                }
              />
              <div className="text-2xl font-heading-bold text-emerald-600 dark:text-emerald-400 mt-4">
                🔥 {habitData.dailyChain} day{habitData.dailyChain !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Weekly Chain */}
            <div className="text-center">
              <h4 className="text-lg font-heading-medium text-violet-700 dark:text-violet-300 mb-4">Weekly Chain</h4>
              <ChainVisualization
                chainLength={habitData.weeklyChain}
                hasNewLink={newChainLink.weekly}
                color="violet"
                size="normal"
                label={habitData.weeklyChain > 0 
                  ? "Excellent consistency! Complete this week's habits to continue."
                  : "Start your weekly chain by completing all habits this week!"
                }
              />
              <div className="text-2xl font-heading-bold text-violet-600 dark:text-violet-400 mt-4">
                🔥 {habitData.weeklyChain} week{habitData.weeklyChain !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {(habitData.dailyChain > 0 || habitData.weeklyChain > 0) ? (
              <p className="text-amber-700 dark:text-amber-300 font-body-medium">
                Keep the momentum going! You're building incredible habits! 🚀
              </p>
            ) : (
              <p className="text-amber-700 dark:text-amber-300 font-body-medium">
                Start your journey today - every chain begins with a single link! 💪
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* Settings Panel */}
        <motion.div
          className="bg-surface-700 rounded-2xl p-6 border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-heading-bold text-text-primary">Settings</h3>
            <Button 
              onClick={() => setShowSettings(!showSettings)} 
              variant="outline"
              size="sm"
            >
              {showSettings ? 'Hide' : 'Show'} Controls
            </Button>
          </div>
          
          <AnimatePresence>
            {showSettings && (
              <motion.div
                className="space-y-4"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    onClick={resetAllHabits} 
                    variant="outline"
                    className="w-full"
                  >
                    Reset Today's Habits
                  </Button>
                  <Button 
                    onClick={resetChains} 
                    variant="outline"
                    className="w-full text-warning border-warning hover:bg-warning/10"
                  >
                    Reset All Chains
                  </Button>
                </div>
                <div className="text-sm text-text-secondary bg-surface-600 rounded-lg p-3">
                  <strong>Note:</strong> Habits automatically reset daily/weekly. Chains break if you miss a day/week.
                  Use these controls for testing or if you need to manually reset your progress.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Add Habit Modals */}
    </div>
  );
};

export default HabitTracking; 