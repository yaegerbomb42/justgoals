import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

// Predefined habit categories
const defaultDailyHabits = [
  { id: 'brush-teeth', name: 'Brush Teeth', emoji: '🦷', completed: false },
  { id: 'shower', name: 'Shower', emoji: '🚿', completed: false },
  { id: 'breakfast', name: 'Eat Breakfast', emoji: '🥞', completed: false },
  { id: 'lunch', name: 'Eat Lunch', emoji: '🥗', completed: false },
  { id: 'dinner', name: 'Eat Dinner', emoji: '🍽️', completed: false },
];

const defaultWeeklyHabits = [
  { id: 'laundry', name: 'Do Laundry', emoji: '👕', completed: false, dayOfWeek: null },
  { id: 'volleyball', name: 'Volleyball on Thursday', emoji: '🏐', completed: false, dayOfWeek: 4 },
];

const getToday = () => new Date().toISOString().split('T')[0];
const getCurrentWeek = () => {
  const today = new Date();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  return startOfWeek.toISOString().split('T')[0];
};
const isToday = (dateStr) => dateStr === getToday();
const isThisWeek = (weekStr) => weekStr === getCurrentWeek();

const HabitTracking = () => {
  // Load saved data or use defaults
  const [habitData, setHabitData] = useState(() => {
    try {
      const saved = localStorage.getItem('enhanced_habits_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          dailyHabits: parsed.dailyHabits || defaultDailyHabits,
          weeklyHabits: parsed.weeklyHabits || defaultWeeklyHabits,
          dailyChain: parsed.dailyChain || 0,
          weeklyChain: parsed.weeklyChain || 0,
          dailyCompletions: parsed.dailyCompletions || {},
          weeklyCompletions: parsed.weeklyCompletions || {},
          lastDailyReset: parsed.lastDailyReset || getToday(),
          lastWeeklyReset: parsed.lastWeeklyReset || getCurrentWeek(),
        };
      }
    } catch (error) {
      console.error('Error loading habit data:', error);
    }
    return {
      dailyHabits: defaultDailyHabits,
      weeklyHabits: defaultWeeklyHabits,
      dailyChain: 0,
      weeklyChain: 0,
      dailyCompletions: {},
      weeklyCompletions: {},
      lastDailyReset: getToday(),
      lastWeeklyReset: getCurrentWeek(),
    };
  });

  const [showCelebration, setShowCelebration] = useState({ daily: false, weekly: false });
  const [newChainLink, setNewChainLink] = useState({ daily: false, weekly: false });
  const [showSettings, setShowSettings] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('enhanced_habits_data', JSON.stringify(habitData));
  }, [habitData]);

  // Reset all habits for testing
  const resetAllHabits = () => {
    setHabitData(prev => ({
      ...prev,
      dailyHabits: defaultDailyHabits,
      weeklyHabits: defaultWeeklyHabits,
    }));
  };

  // Reset chains for testing
  const resetChains = () => {
    setHabitData(prev => ({
      ...prev,
      dailyChain: 0,
      weeklyChain: 0,
      dailyCompletions: {},
      weeklyCompletions: {},
    }));
  };

  // Check for day/week reset
  useEffect(() => {
    const today = getToday();
    const thisWeek = getCurrentWeek();
    
    setHabitData(prev => {
      let updated = { ...prev };
      
      // Reset daily habits if new day
      if (prev.lastDailyReset !== today) {
        updated.dailyHabits = defaultDailyHabits;
        updated.lastDailyReset = today;
        // Check if we need to break daily chain
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayCompleted = prev.dailyCompletions[yesterdayStr];
        if (!yesterdayCompleted) {
          updated.dailyChain = 0; // Break chain if yesterday wasn't completed
        }
      }
      
      // Reset weekly habits if new week
      if (prev.lastWeeklyReset !== thisWeek) {
        updated.weeklyHabits = defaultWeeklyHabits;
        updated.lastWeeklyReset = thisWeek;
        // Check if we need to break weekly chain
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() - lastWeek.getDay()).toISOString().split('T')[0];
        const lastWeekCompleted = prev.weeklyCompletions[lastWeekStr];
        if (!lastWeekCompleted) {
          updated.weeklyChain = 0; // Break chain if last week wasn't completed
        }
      }
      
      return updated;
    });
  }, []);

  const toggleHabit = (habitId, isWeekly = false) => {
    setHabitData(prev => {
      const updated = { ...prev };
      
      if (isWeekly) {
        updated.weeklyHabits = prev.weeklyHabits.map(habit =>
          habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
        );
        
        // Check if all weekly habits are completed
        const allWeeklyCompleted = updated.weeklyHabits.every(habit => habit.completed);
        if (allWeeklyCompleted && !prev.weeklyCompletions[getCurrentWeek()]) {
          updated.weeklyChain = prev.weeklyChain + 1;
          updated.weeklyCompletions[getCurrentWeek()] = true;
          setShowCelebration(prev => ({ ...prev, weekly: true }));
          setNewChainLink(prev => ({ ...prev, weekly: true }));
          setTimeout(() => setShowCelebration(prev => ({ ...prev, weekly: false })), 3000);
          setTimeout(() => setNewChainLink(prev => ({ ...prev, weekly: false })), 1000);
        } else if (!updated.weeklyHabits.every(habit => habit.completed) && prev.weeklyCompletions[getCurrentWeek()]) {
          // If we uncomplete a habit after already completing the week, remove the completion
          updated.weeklyChain = Math.max(0, prev.weeklyChain - 1);
          delete updated.weeklyCompletions[getCurrentWeek()];
        }
      } else {
        updated.dailyHabits = prev.dailyHabits.map(habit =>
          habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
        );
        
        // Check if all daily habits are completed
        const allDailyCompleted = updated.dailyHabits.every(habit => habit.completed);
        if (allDailyCompleted && !prev.dailyCompletions[getToday()]) {
          updated.dailyChain = prev.dailyChain + 1;
          updated.dailyCompletions[getToday()] = true;
          setShowCelebration(prev => ({ ...prev, daily: true }));
          setNewChainLink(prev => ({ ...prev, daily: true }));
          setTimeout(() => setShowCelebration(prev => ({ ...prev, daily: false })), 3000);
          setTimeout(() => setNewChainLink(prev => ({ ...prev, daily: false })), 1000);
        } else if (!updated.dailyHabits.every(habit => habit.completed) && prev.dailyCompletions[getToday()]) {
          // If we uncomplete a habit after already completing the day, remove the completion
          updated.dailyChain = Math.max(0, prev.dailyChain - 1);
          delete updated.dailyCompletions[getToday()];
        }
      }
      
      return updated;
    });
  };

  const allDailyCompleted = habitData.dailyHabits.every(habit => habit.completed);
  const allWeeklyCompleted = habitData.weeklyHabits.every(habit => habit.completed);

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
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="text-2xl font-heading-bold text-warning">{habitData.dailyChain}</span>
                <span className="text-text-secondary">day streak</span>
              </div>
            </div>

            <div className="grid gap-4">
              {habitData.dailyHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  className={`bg-surface-600 rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer ${
                    habit.completed 
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleHabit(habit.id)}
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
                    <span className={`text-lg font-body-medium ${
                      habit.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-primary'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.completed && (
                      <motion.span
                        className="ml-auto text-emerald-500 font-heading-bold"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        ✓ Done!
                      </motion.span>
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
                  {habitData.dailyHabits.filter(h => h.completed).length} / {habitData.dailyHabits.length}
                </span>
              </div>
              <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(habitData.dailyHabits.filter(h => h.completed).length / habitData.dailyHabits.length) * 100}%` 
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
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="text-2xl font-heading-bold text-warning">{habitData.weeklyChain}</span>
                <span className="text-text-secondary">week streak</span>
              </div>
            </div>

            <div className="grid gap-4">
              {habitData.weeklyHabits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  className={`bg-surface-600 rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer ${
                    habit.completed 
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' 
                      : 'border-border hover:border-secondary/50'
                  }`}
                  onClick={() => toggleHabit(habit.id, true)}
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
                    <span className={`text-lg font-body-medium ${
                      habit.completed ? 'text-violet-600 dark:text-violet-400' : 'text-text-primary'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.completed && (
                      <motion.span
                        className="ml-auto text-violet-500 font-heading-bold"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        ✓ Done!
                      </motion.span>
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
                  {habitData.weeklyHabits.filter(h => h.completed).length} / {habitData.weeklyHabits.length}
                </span>
              </div>
              <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(habitData.weeklyHabits.filter(h => h.completed).length / habitData.weeklyHabits.length) * 100}%` 
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
              <div className="flex justify-center items-center mb-4 flex-wrap">
                {[...Array(Math.min(habitData.dailyChain, 10))].map((_, i) => (
                  <motion.span
                    key={i}
                    className="text-3xl"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    style={{ 
                      filter: newChainLink.daily && i === habitData.dailyChain - 1 ? 'drop-shadow(0 0 10px #10b981)' : 'none'
                    }}
                  >
                    🔗
                  </motion.span>
                ))}
                {habitData.dailyChain > 10 && (
                  <span className="text-xl text-emerald-600 dark:text-emerald-400 ml-2">
                    +{habitData.dailyChain - 10} more
                  </span>
                )}
                {habitData.dailyChain === 0 && (
                  <span className="text-2xl text-text-secondary">No chain yet</span>
                )}
              </div>
              <div className="text-2xl font-heading-bold text-emerald-600 dark:text-emerald-400">
                🔥 {habitData.dailyChain} day{habitData.dailyChain !== 1 ? 's' : ''}
              </div>
              {habitData.dailyChain > 0 && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                  Keep it up! Complete today's habits to extend your chain.
                </div>
              )}
            </div>

            {/* Weekly Chain */}
            <div className="text-center">
              <h4 className="text-lg font-heading-medium text-violet-700 dark:text-violet-300 mb-4">Weekly Chain</h4>
              <div className="flex justify-center items-center mb-4 flex-wrap">
                {[...Array(Math.min(habitData.weeklyChain, 10))].map((_, i) => (
                  <motion.span
                    key={i}
                    className="text-3xl"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    style={{ 
                      filter: newChainLink.weekly && i === habitData.weeklyChain - 1 ? 'drop-shadow(0 0 10px #8b5cf6)' : 'none'
                    }}
                  >
                    🔗
                  </motion.span>
                ))}
                {habitData.weeklyChain > 10 && (
                  <span className="text-xl text-violet-600 dark:text-violet-400 ml-2">
                    +{habitData.weeklyChain - 10} more
                  </span>
                )}
                {habitData.weeklyChain === 0 && (
                  <span className="text-2xl text-text-secondary">No chain yet</span>
                )}
              </div>
              <div className="text-2xl font-heading-bold text-violet-600 dark:text-violet-400">
                🔥 {habitData.weeklyChain} week{habitData.weeklyChain !== 1 ? 's' : ''}
              </div>
              {habitData.weeklyChain > 0 && (
                <div className="text-sm text-violet-600 dark:text-violet-400 mt-2">
                  Excellent consistency! Complete this week's habits to continue.
                </div>
              )}
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
    </div>
  );
};

export default HabitTracking; 