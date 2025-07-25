// Achievement system for tracking user progress and awarding badges
import dailyActivityService from './dailyActivityService';
import * as entityService from './entityManagementService';
import { getUserId } from '../utils/userUtils';

class AchievementService {
  constructor() {
    // Cache for user data to prevent excessive localStorage reads
    this.userDataCache = new Map();
    this.cacheExpiry = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // Debounce map for achievement checks
    this.achievementCheckDebounce = new Map();
    this.DEBOUNCE_DELAY = 1000; // 1 second
    
    this.achievements = {
      // Goal-related achievements
      firstGoal: {
        id: 'firstGoal',
        title: 'First Steps',
        description: 'Create your first goal',
        icon: '🎯',
        category: 'goals',
        condition: (userData) => userData.totalGoals >= 1,
        points: 10
      },
      goalMaster: {
        id: 'goalMaster',
        title: 'Goal Master',
        description: 'Create 10 goals',
        icon: '🏆',
        category: 'goals',
        condition: (userData) => userData.totalGoals >= 10,
        points: 50
      },
      goalCompleter: {
        id: 'goalCompleter',
        title: 'Goal Achiever',
        description: 'Complete your first goal',
        icon: '✅',
        category: 'goals',
        condition: (userData) => userData.completedGoals >= 1,
        points: 25
      },
      goalChampion: {
        id: 'goalChampion',
        title: 'Goal Champion',
        description: 'Complete 10 goals',
        icon: '👑',
        category: 'goals',
        condition: (userData) => userData.completedGoals >= 10,
        points: 100
      },

      // Streak achievements
      weekStreak: {
        id: 'weekStreak',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'streaks',
        condition: (userData) => userData.currentStreak >= 7,
        points: 30
      },
      monthStreak: {
        id: 'monthStreak',
        title: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '⚡',
        category: 'streaks',
        condition: (userData) => userData.currentStreak >= 30,
        points: 75
      },
      streakLegend: {
        id: 'streakLegend',
        title: 'Streak Legend',
        description: 'Maintain a 100-day streak',
        icon: '🌟',
        category: 'streaks',
        condition: (userData) => userData.currentStreak >= 100,
        points: 200
      },

      // Focus mode achievements
      focusBeginner: {
        id: 'focusBeginner',
        title: 'Focus Beginner',
        description: 'Complete your first focus session',
        icon: '🎯',
        category: 'focus',
        condition: (userData) => userData.totalFocusSessions >= 1,
        points: 15
      },
      focusMaster: {
        id: 'focusMaster',
        title: 'Focus Master',
        description: 'Complete 50 focus sessions',
        icon: '🧠',
        category: 'focus',
        condition: (userData) => userData.totalFocusSessions >= 50,
        points: 60
      },
      focusChampion: {
        id: 'focusChampion',
        title: 'Focus Champion',
        description: 'Complete 100 focus sessions',
        icon: '💎',
        category: 'focus',
        condition: (userData) => userData.totalFocusSessions >= 100,
        points: 120
      },
      timeMaster: {
        id: 'timeMaster',
        title: 'Time Master',
        description: 'Accumulate 100 hours of focus time',
        icon: '⏰',
        category: 'focus',
        condition: (userData) => userData.totalFocusTime >= 3600000, // 100 hours in ms
        points: 150
      },

      // Milestone achievements
      milestoneCreator: {
        id: 'milestoneCreator',
        title: 'Milestone Creator',
        description: 'Create your first milestone',
        icon: '📋',
        category: 'milestones',
        condition: (userData) => userData.totalMilestones >= 1,
        points: 10
      },
      milestoneMaster: {
        id: 'milestoneMaster',
        title: 'Milestone Master',
        description: 'Create 50 milestones',
        icon: '📊',
        category: 'milestones',
        condition: (userData) => userData.totalMilestones >= 50,
        points: 40
      },
      milestoneCompleter: {
        id: 'milestoneCompleter',
        title: 'Milestone Achiever',
        description: 'Complete 25 milestones',
        icon: '🎉',
        category: 'milestones',
        condition: (userData) => userData.completedMilestones >= 25,
        points: 50
      },

      // Special achievements
      earlyBird: {
        id: 'earlyBird',
        title: 'Early Bird',
        description: 'Complete a milestone before 9 AM',
        icon: '🌅',
        category: 'special',
        condition: (userData) => userData.earlyBirdMilestones >= 1,
        points: 20
      },
      nightOwl: {
        id: 'nightOwl',
        title: 'Night Owl',
        description: 'Complete a milestone after 10 PM',
        icon: '🦉',
        category: 'special',
        condition: (userData) => userData.nightOwlMilestones >= 1,
        points: 20
      },
      weekendWarrior: {
        id: 'weekendWarrior',
        title: 'Weekend Warrior',
        description: 'Complete milestones on 5 consecutive weekends',
        icon: '🏃',
        category: 'special',
        condition: (userData) => userData.weekendStreak >= 5,
        points: 35
      },
      consistencyKing: {
        id: 'consistencyKing',
        title: 'Consistency King',
        description: 'Use the app for 30 consecutive days',
        icon: '👑',
        category: 'special',
        condition: (userData) => userData.consecutiveDays >= 30,
        points: 80
      },
      // New creative and engagement achievements
      creativeStarter: {
        id: 'creativeStarter',
        title: 'Creative Starter',
        description: 'Write your first journal entry',
        icon: '\u270D',
        category: 'journal',
        condition: (userData) => userData.totalJournalEntries >= 1,
        points: 10
      },
      journalMaster: {
        id: 'journalMaster',
        title: 'Journal Master',
        description: 'Write 50 journal entries',
        icon: '\uD83D\uDCDD',
        category: 'journal',
        condition: (userData) => userData.totalJournalEntries >= 50,
        points: 50
      },
      productivityPro: {
        id: 'productivityPro',
        title: 'Productivity Pro',
        description: 'Complete 100 tasks (goals + milestones)',
        icon: '\uD83D\uDCBC',
        category: 'productivity',
        condition: (userData) => userData.completedTasks >= 100,
        points: 100
      },
      engagementGuru: {
        id: 'engagementGuru',
        title: 'Engagement Guru',
        description: 'Log in for 100 days',
        icon: '\uD83D\uDE80',
        category: 'engagement',
        condition: (userData) => userData.consecutiveDays >= 100,
        points: 150
      },

      // Meal-related achievements
      firstMeal: {
        id: 'firstMeal',
        title: 'First Bite',
        description: 'Plan your first meal',
        icon: '🍽️',
        category: 'meals',
        condition: (userData) => userData.totalMeals >= 1,
        points: 10
      },
      mealPlanner: {
        id: 'mealPlanner',
        title: 'Meal Planner',
        description: 'Create your first weekly meal plan',
        icon: '📅',
        category: 'meals',
        condition: (userData) => userData.totalMealPlans >= 1,
        points: 25
      },
      nutritionNinja: {
        id: 'nutritionNinja',
        title: 'Nutrition Ninja',
        description: 'Complete all meals for a day',
        icon: '🥋',
        category: 'meals',
        condition: (userData) => userData.perfectMealDays >= 1,
        points: 30
      },
      macroMaster: {
        id: 'macroMaster',
        title: 'Macro Master',
        description: 'Hit your macro targets for 7 consecutive days',
        icon: '🎯',
        category: 'meals',
        condition: (userData) => userData.macroStreak >= 7,
        points: 50
      },
      aiChef: {
        id: 'aiChef',
        title: 'AI Chef',
        description: 'Generate your first AI meal plan',
        icon: '🤖',
        category: 'meals',
        condition: (userData) => userData.aiGeneratedMealPlans >= 1,
        points: 40
      },
      consistentEater: {
        id: 'consistentEater',
        title: 'Consistent Eater',
        description: 'Complete meals for 30 consecutive days',
        icon: '🏆',
        category: 'meals',
        condition: (userData) => userData.mealCompletionStreak >= 30,
        points: 75
      },
      proteinPro: {
        id: 'proteinPro',
        title: 'Protein Pro',
        description: 'Hit your protein target for 14 consecutive days',
        icon: '💪',
        category: 'meals',
        condition: (userData) => userData.proteinStreak >= 14,
        points: 60
      },
      mealPrepMaster: {
        id: 'mealPrepMaster',
        title: 'Meal Prep Master',
        description: 'Plan and complete 50 meals',
        icon: '📦',
        category: 'meals',
        condition: (userData) => userData.completedMeals >= 50,
        points: 100
      },

      // Additional Goal Achievements
      goalVisionary: {
        id: 'goalVisionary',
        title: 'Goal Visionary',
        description: 'Create 25 goals',
        icon: '🌟',
        category: 'goals',
        condition: (userData) => userData.totalGoals >= 25,
        points: 75
      },
      goalLegend: {
        id: 'goalLegend',
        title: 'Goal Legend',
        description: 'Complete 25 goals',
        icon: '🏅',
        category: 'goals',
        condition: (userData) => userData.completedGoals >= 25,
        points: 150
      },
      goalArchitect: {
        id: 'goalArchitect',
        title: 'Goal Architect',
        description: 'Create goals in 5 different categories',
        icon: '🏗️',
        category: 'goals',
        condition: (userData) => userData.goalCategories >= 5,
        points: 60
      },

      // Enhanced Streak Achievements
      fireStarter: {
        id: 'fireStarter',
        title: 'Fire Starter',
        description: 'Achieve your first 3-day streak',
        icon: '🔥',
        category: 'streaks',
        condition: (userData) => userData.longestStreak >= 3,
        points: 15
      },
      burnBright: {
        id: 'burnBright',
        title: 'Burn Bright',
        description: 'Maintain a 50-day streak',
        icon: '🌋',
        category: 'streaks',
        condition: (userData) => userData.longestStreak >= 50,
        points: 200
      },
      ultraStreak: {
        id: 'ultraStreak',
        title: 'Ultra Streak',
        description: 'Achieve a 100-day streak',
        icon: '⚡',
        category: 'streaks',
        condition: (userData) => userData.longestStreak >= 100,
        points: 500
      },

      // Advanced Focus Achievements
      focusNinja: {
        id: 'focusNinja',
        title: 'Focus Ninja',
        description: 'Complete 100 focus sessions',
        icon: '🥷',
        category: 'focus',
        condition: (userData) => userData.totalFocusSessions >= 100,
        points: 150
      },
      deepWork: {
        id: 'deepWork',
        title: 'Deep Work Master',
        description: 'Complete a 4-hour focus session',
        icon: '🧘',
        category: 'focus',
        condition: (userData) => userData.longestFocusSession >= 240, // 240 minutes = 4 hours
        points: 100
      },
      focusMarathon: {
        id: 'focusMarathon',
        title: 'Focus Marathon',
        description: 'Complete 50 hours of total focus time',
        icon: '🏃‍♂️',
        category: 'focus',
        condition: (userData) => userData.totalFocusTime >= 3000, // 3000 minutes = 50 hours
        points: 250
      },

      // Special Time-based Achievements
      midnightWarrior: {
        id: 'midnightWarrior',
        title: 'Midnight Warrior',
        description: 'Complete a goal after midnight',
        icon: '🌙',
        category: 'special',
        condition: (userData) => userData.midnightCompletions >= 1,
        points: 30
      },
      quickStart: {
        id: 'quickStart',
        title: 'Quick Start',
        description: 'Complete a goal within an hour of creating it',
        icon: '⚡',
        category: 'special',
        condition: (userData) => userData.quickCompletions >= 1,
        points: 25
      },
      perfectWeek: {
        id: 'perfectWeek',
        title: 'Perfect Week',
        description: 'Complete all daily goals for 7 consecutive days',
        icon: '💯',
        category: 'special',
        condition: (userData) => userData.perfectWeeks >= 1,
        points: 80
      },

      // Milestone & Achievement Focused
      milestoneCollector: {
        id: 'milestoneCollector',
        title: 'Milestone Collector',
        description: 'Complete 100 milestones',
        icon: '🏆',
        category: 'milestones',
        condition: (userData) => userData.completedMilestones >= 100,
        points: 120
      },
      speedRunner: {
        id: 'speedRunner',
        title: 'Speed Runner',
        description: 'Complete 10 milestones in one day',
        icon: '💨',
        category: 'milestones',
        condition: (userData) => userData.milestonesInOneDay >= 10,
        points: 60
      },

      // Social & Engagement Achievements
      shareExpert: {
        id: 'shareExpert',
        title: 'Share Expert',
        description: 'Share 25 achievements or progress updates',
        icon: '📢',
        category: 'special',
        condition: (userData) => userData.sharesCount >= 25,
        points: 40
      },
      motivator: {
        id: 'motivator',
        title: 'Motivator',
        description: 'Use the AI assistant 50 times',
        icon: '🤖',
        category: 'special',
        condition: (userData) => userData.aiInteractions >= 50,
        points: 70
      },

      // Creative & Exploration Achievements
      explorer: {
        id: 'explorer',
        title: 'Explorer',
        description: 'Use every feature in the app at least once',
        icon: '🗺️',
        category: 'special',
        condition: (userData) => userData.featuresUsed >= 8, // Assuming 8 main features
        points: 90
      },
      customizer: {
        id: 'customizer',
        title: 'Customizer',
        description: 'Change your theme and background effects',
        icon: '🎨',
        category: 'special',
        condition: (userData) => userData.themeChanges >= 3,
        points: 20
      },
      dataGeek: {
        id: 'dataGeek',
        title: 'Data Geek',
        description: 'View analytics dashboard 20 times',
        icon: '📊',
        category: 'special',
        condition: (userData) => userData.analyticsViews >= 20,
        points: 35
      },

      // Advanced Meal Achievements
      healthyChoices: {
        id: 'healthyChoices',
        title: 'Healthy Choices',
        description: 'Log 100 healthy meals',
        icon: '🥗',
        category: 'meals',
        condition: (userData) => userData.healthyMeals >= 100,
        points: 80
      },
      balanceSeeker: {
        id: 'balanceSeeker',
        title: 'Balance Seeker',
        description: 'Maintain balanced macros for 14 days',
        icon: '⚖️',
        category: 'meals',
        condition: (userData) => userData.balancedMacroStreak >= 14,
        points: 65
      }
    };

    this.categories = {
      goals: { name: 'Goals', icon: '🎯', color: '#6366F1' },
      streaks: { name: 'Streaks', icon: '🔥', color: '#EF4444' },
      focus: { name: 'Focus', icon: '🧠', color: '#10B981' },
      milestones: { name: 'Milestones', icon: '📋', color: '#F59E0B' },
      special: { name: 'Special', icon: '⭐', color: '#8B5CF6' },
      meals: { name: 'Meals', icon: '🍽️', color: '#06B6D4' }
    };
  }

  // Get user data for achievement checking with caching
  async getUserData(user) {
    if (!user) return this.getDefaultUserData();
    
    const userId = getUserId(user);
    if (!userId) return this.getDefaultUserData();
    
    const cacheKey = `userData_${userId}`;
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      return this.userDataCache.get(cacheKey);
    }
    
    try {
      const userData = await this.fetchUserDataFromSources(user);
      
      // Cache the result
      this.userDataCache.set(cacheKey, userData);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
      
      return userData;
    } catch (error) {
      console.error('Error getting user data for achievements:', error);
      return this.getDefaultUserData();
    }
  }

  // Check if cached data is still valid
  isValidCache(cacheKey) {
    return this.userDataCache.has(cacheKey) && 
           this.cacheExpiry.has(cacheKey) && 
           Date.now() < this.cacheExpiry.get(cacheKey);
  }

  // Get default user data structure
  getDefaultUserData() {
    return {
      totalGoals: 0,
      completedGoals: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      totalFocusSessions: 0,
      totalFocusTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      earlyBirdMilestones: 0,
      nightOwlMilestones: 0,
      weekendStreak: 0,
      consecutiveDays: 0,
      totalJournalEntries: 0,
      completedTasks: 0,
      // Meal-related data
      totalMeals: 0,
      completedMeals: 0,
      totalMealPlans: 0,
      perfectMealDays: 0,
      macroStreak: 0,
      aiGeneratedMealPlans: 0,
      mealCompletionStreak: 0,
      proteinStreak: 0
    };
  }

  // Optimized data fetching with batch localStorage operations
  async fetchUserDataFromSources(user) {
    const userId = getUserId(user);
    if (!userId) return this.getDefaultUserData();
    
    // Batch localStorage operations
    const localStorageKeys = [
      `goals_data_${userId}`,
      `milestones_data_${userId}`,
      `focus_session_stats_${userId}`,
      `focus_session_history_${userId}`,
      `focus_session_sessions_${userId}`,
      `journal_entries_${userId}`,
      `meals_data_${userId}`,
      `meal_plans_data_${userId}`,
      `meal_completions_data_${userId}`
    ];
    
    const localStorageData = {};
    localStorageKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        localStorageData[key] = data ? JSON.parse(data) : (key.includes('stats') ? {} : []);
      } catch (e) {
        console.warn(`Failed to parse localStorage data for ${key}:`, e);
        localStorageData[key] = key.includes('stats') ? {} : [];
      }
    });

    // Get data from entity service with fallback
    let goalsData = [];
    let milestonesData = [];
    
    try { 
      goalsData = await entityService.getGoals(user) || [];
    } catch (e) { 
      console.warn('Failed to get goals from entity service, using localStorage');
      goalsData = localStorageData[`goals_data_${userId}`] || [];
    }
    
    try { 
      milestonesData = await entityService.getMilestones(user) || [];
    } catch (e) { 
      console.warn('Failed to get milestones from entity service, using localStorage');
      milestonesData = localStorageData[`milestones_data_${userId}`] || [];
    }
    
    // Process focus session data
    const focusStats = localStorageData[`focus_session_stats_${userId}`] || {};
    let focusHistory = localStorageData[`focus_session_history_${userId}`] || [];
    
    // Try alternative key format if empty
    if (focusHistory.length === 0) {
      focusHistory = localStorageData[`focus_session_sessions_${userId}`] || [];
    }
    
    // Get activity data efficiently
    const activityStreak = dailyActivityService.getStreak(userId);
    const activityStats = dailyActivityService.getActivityStats(userId);
    
    // Calculate derived data
    const streakData = this.calculateStreakData(milestonesData);
    const specialData = this.calculateSpecialData(milestonesData, focusHistory);
    const mealStats = this.calculateMealStats(
      localStorageData[`meals_data_${userId}`] || [],
      localStorageData[`meal_plans_data_${userId}`] || [],
      localStorageData[`meal_completions_data_${userId}`] || []
    );
    
    const completedTasks = this.calculateCompletedTasks(goalsData, milestonesData);
    
    return {
      totalGoals: this.safeArrayLength(goalsData),
      completedGoals: this.safeArrayFilter(goalsData, goal => goal.progress >= 100).length,
      totalMilestones: this.safeArrayLength(milestonesData),
      completedMilestones: this.safeArrayFilter(milestonesData, m => m.completed).length,
      totalFocusSessions: focusStats.sessionsToday || 0,
      totalFocusTime: focusStats.totalFocusTime || 0,
      currentStreak: Math.max(activityStreak.currentStreak, streakData.currentStreak || 0),
      longestStreak: Math.max(activityStreak.longestStreak, streakData.longestStreak || 0),
      earlyBirdMilestones: specialData.earlyBird || 0,
      nightOwlMilestones: specialData.nightOwl || 0,
      weekendStreak: specialData.weekendStreak || 0,
      consecutiveDays: Math.max(activityStats.totalDays, specialData.consecutiveDays || 0),
      totalJournalEntries: this.safeArrayLength(localStorageData[`journal_entries_${userId}`] || []),
      completedTasks,
      // Meal-related data
      totalMeals: mealStats.totalMeals || 0,
      completedMeals: mealStats.completedMeals || 0,
      totalMealPlans: mealStats.totalMealPlans || 0,
      perfectMealDays: mealStats.perfectMealDays || 0,
      macroStreak: mealStats.macroStreak || 0,
      aiGeneratedMealPlans: mealStats.aiGeneratedMealPlans || 0,
      mealCompletionStreak: mealStats.mealCompletionStreak || 0,
      proteinStreak: mealStats.proteinStreak || 0
    };
  }

  // Safe array operations to prevent errors
  safeArrayLength(arr) {
    return Array.isArray(arr) ? arr.length : 0;
  }

  safeArrayFilter(arr, predicate) {
    if (!Array.isArray(arr)) return [];
    try {
      return arr.filter(predicate);
    } catch (e) {
      console.warn('Error filtering array:', e);
      return [];
    }
  }

  calculateCompletedTasks(goalsData, milestonesData) {
    const completedGoals = this.safeArrayFilter(goalsData, goal => goal.progress >= 100).length;
    const completedMilestones = this.safeArrayFilter(milestonesData, m => m.completed).length;
    return completedGoals + completedMilestones;
  }

  // Clear cache when user data updates
  invalidateUserCache(userId) {
    const cacheKey = `userData_${userId}`;
    this.userDataCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);
  }

  // Calculate streak data
  calculateStreakData(milestonesData) {
    if (!milestonesData.length) return { currentStreak: 0 };

    const completedMilestones = milestonesData
      .filter(m => m.completed)
      .map(m => new Date(m.completedAt || m.createdAt).toDateString())
      .sort();

    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if user completed something today or yesterday
    if (completedMilestones.includes(today) || completedMilestones.includes(yesterday)) {
      let streakDate = completedMilestones.includes(today) ? today : yesterday;
      currentStreak = 1;

      // Count backwards to find streak
      for (let i = 1; i <= 100; i++) {
        const checkDate = new Date(Date.now() - (i * 86400000)).toDateString();
        if (completedMilestones.includes(checkDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak };
  }

  // Calculate special achievement data
  calculateSpecialData(milestonesData, focusHistory) {
    const completedMilestones = milestonesData.filter(m => m.completed);
    
    let earlyBird = 0;
    let nightOwl = 0;
    let weekendStreak = 0;
    let consecutiveDays = 0;

    // Check for early bird and night owl achievements
    completedMilestones.forEach(milestone => {
      const completedDate = new Date(milestone.completedAt || milestone.createdAt);
      const hour = completedDate.getHours();
      
      if (hour < 9) earlyBird++;
      if (hour >= 22) nightOwl++;
    });

    // Calculate consecutive days
    const activityDates = new Set();
    
    // Add milestone completion dates
    completedMilestones.forEach(m => {
      const date = new Date(m.completedAt || m.createdAt).toDateString();
      activityDates.add(date);
    });

    // Add focus session dates
    focusHistory.forEach(session => {
      const date = new Date(session.startTime).toDateString();
      activityDates.add(date);
    });

    const sortedDates = Array.from(activityDates).sort();
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentConsecutive = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          currentConsecutive++;
        } else {
          currentConsecutive = 1;
        }
      }
      
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    }

    consecutiveDays = maxConsecutive;

    return {
      earlyBird,
      nightOwl,
      weekendStreak,
      consecutiveDays
    };
  }

  // Calculate meal-related statistics
  calculateMealStats(mealsData, mealPlansData, mealCompletionsData) {
    const totalMeals = Array.isArray(mealsData) ? mealsData.length : 0;
    const totalMealPlans = Array.isArray(mealPlansData) ? mealPlansData.length : 0;
    const aiGeneratedMealPlans = Array.isArray(mealPlansData) ? mealPlansData.filter(plan => plan.generatedBy === 'ai').length : 0;
    
    const completedMeals = Array.isArray(mealCompletionsData) ? mealCompletionsData.filter(completion => completion.completed).length : 0;
    
    // Calculate perfect meal days (days where all planned meals were completed)
    let perfectMealDays = 0;
    let mealCompletionStreak = 0;
    let macroStreak = 0; // This would need meal preference and actual macro data
    let proteinStreak = 0; // This would need actual meal nutrition data
    
    // Group completions by date
    const completionsByDate = {};
    if (Array.isArray(mealCompletionsData)) {
      mealCompletionsData.forEach(completion => {
        if (completion.completed && completion.date) {
          if (!completionsByDate[completion.date]) {
            completionsByDate[completion.date] = [];
          }
          completionsByDate[completion.date].push(completion);
        }
      });
    }

    // Count perfect days (simplified - assumes 3 meals per day target)
    const targetMealsPerDay = 3;
    Object.keys(completionsByDate).forEach(date => {
      if (completionsByDate[date].length >= targetMealsPerDay) {
        perfectMealDays++;
      }
    });

    // Calculate streaks (simplified calculation)
    const sortedDates = Object.keys(completionsByDate).sort();
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate meal completion streak (consecutive days with any completed meals)
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      if (completionsByDate[date].length > 0) {
        currentStreak++;
        // Check if there's a gap
        if (i > 0) {
          const prevDate = sortedDates[i - 1];
          const daysDiff = (new Date(date) - new Date(prevDate)) / (1000 * 60 * 60 * 24);
          if (daysDiff > 1) break;
        }
      } else {
        break;
      }
    }
    mealCompletionStreak = currentStreak;

    return {
      totalMeals,
      completedMeals,
      totalMealPlans,
      perfectMealDays,
      macroStreak: macroStreak, // Placeholder - would need actual macro tracking
      aiGeneratedMealPlans,
      mealCompletionStreak,
      proteinStreak: proteinStreak // Placeholder - would need actual nutrition tracking
    };
  }

  // Check and award achievements with debouncing to prevent race conditions
  async checkAchievements(user) {
    if (!user) return [];
    
    const userId = user.uid || user.id;
    
    // Implement debouncing to prevent multiple concurrent checks
    if (this.achievementCheckDebounce.has(userId)) {
      clearTimeout(this.achievementCheckDebounce.get(userId));
    }
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        try {
          this.achievementCheckDebounce.delete(userId);
          const result = await this.performAchievementCheck(user);
          resolve(result);
        } catch (error) {
          console.error('Error in debounced achievement check:', error);
          resolve([]);
        }
      }, this.DEBOUNCE_DELAY);
      
      this.achievementCheckDebounce.set(userId, timeoutId);
    });
  }

  // Perform the actual achievement check
  async performAchievementCheck(user) {
    const userData = await this.getUserData(user);
    if (!userData) return [];

    const userId = user?.uid || user?.id;
    const userAchievements = this.getUserAchievements(userId);
    const newAchievements = [];

    Object.values(this.achievements).forEach(achievement => {
      // Check if user already has this achievement
      if (userAchievements.find(ua => ua.id === achievement.id)) {
        return;
      }

      // Check if user meets the condition
      try {
        if (achievement.condition(userData)) {
          newAchievements.push({
            ...achievement,
            awardedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn(`Error checking condition for achievement ${achievement.id}:`, error);
      }
    });

    // Award new achievements
    if (newAchievements.length > 0) {
      this.awardAchievements(userId, newAchievements);
      // Invalidate cache since user data has changed
      this.invalidateUserCache(userId);
    }

    return newAchievements;
  }

  // Get user's earned achievements
  getUserAchievements(userId) {
    if (!userId) {
      console.warn('getUserAchievements called with missing userId');
      return [];
    }

    try {
      const achievementsKey = `user_achievements_${userId}`;
      const raw = localStorage.getItem(achievementsKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.error('Achievements data corrupted, resetting:', { raw });
        localStorage.setItem(achievementsKey, '[]');
        return [];
      }
      return parsed;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  // Award achievements to user
  awardAchievements(userId, achievements) {
    if (!userId || !achievements.length) {
      console.warn('awardAchievements called with missing userId or empty achievements:', { userId, achievements });
      return;
    }

    try {
      const achievementsKey = `user_achievements_${userId}`;
      let existingAchievements = [];
      try {
        existingAchievements = this.getUserAchievements(userId);
      } catch (e) {
        console.error('Error loading existing achievements:', e);
        existingAchievements = [];
      }
      // Prevent duplicate achievement IDs
      const existingIds = new Set(existingAchievements.map(a => a.id));
      const newUniqueAchievements = achievements.filter(a => !existingIds.has(a.id));
      const updatedAchievements = [...existingAchievements, ...newUniqueAchievements];

      localStorage.setItem(achievementsKey, JSON.stringify(updatedAchievements));

      // Validate save
      const verify = JSON.parse(localStorage.getItem(achievementsKey) || '[]');
      if (!Array.isArray(verify) || verify.length < updatedAchievements.length) {
        console.error('Achievement save verification failed:', { verify, updatedAchievements });
      }

      // Update total points
      this.updateUserPoints(userId, newUniqueAchievements);

      console.log(`Awarded ${newUniqueAchievements.length} new achievements to user ${userId}:`, newUniqueAchievements);
    } catch (error) {
      console.error('Error awarding achievements:', error);
    }
  }

  // Update user points
  updateUserPoints(userId, achievements) {
    if (!userId || !achievements.length) return;

    try {
      const pointsKey = `user_points_${userId}`;
      const currentPoints = parseInt(localStorage.getItem(pointsKey) || '0');
      const newPoints = achievements.reduce((total, achievement) => total + achievement.points, 0);
      const totalPoints = currentPoints + newPoints;
      
      localStorage.setItem(pointsKey, totalPoints.toString());
      
      console.log(`Updated points for user ${userId}: +${newPoints} (Total: ${totalPoints})`);
    } catch (error) {
      console.error('Error updating user points:', error);
    }
  }

  // Get user points
  getUserPoints(userId) {
    if (!userId) return 0;

    try {
      const pointsKey = `user_points_${userId}`;
      return parseInt(localStorage.getItem(pointsKey) || '0');
    } catch (error) {
      console.error('Error getting user points:', error);
      return 0;
    }
  }

  // Get achievement progress with detailed state
  async getAchievementProgress(user, achievementId) {
    if (!user || !achievementId) {
      return { progress: 0, total: 0, percentage: 0, state: 'not-started' };
    }

    const achievement = this.achievements[achievementId];
    if (!achievement) {
      return { progress: 0, total: 0, percentage: 0, state: 'not-started' };
    }

    const userData = await this.getUserData(user);
    if (!userData) {
      return { progress: 0, total: 0, percentage: 0, state: 'not-started' };
    }

    // Calculate progress based on achievement type
    let progress = 0;
    let total = 1;
    let state = 'not-started';

    switch (achievementId) {
      case 'firstGoal':
        progress = userData.totalGoals >= 1 ? 1 : 0;
        total = 1;
        break;
      case 'goalMaster':
        progress = Math.min(userData.totalGoals, 10);
        total = 10;
        break;
      case 'goalCompleter':
        progress = userData.completedGoals >= 1 ? 1 : 0;
        total = 1;
        break;
      case 'goalChampion':
        progress = Math.min(userData.completedGoals, 10);
        total = 10;
        break;
      case 'weekStreak':
        progress = Math.min(userData.currentStreak, 7);
        total = 7;
        break;
      case 'monthStreak':
        progress = Math.min(userData.currentStreak, 30);
        total = 30;
        break;
      case 'streakLegend':
        progress = Math.min(userData.currentStreak, 100);
        total = 100;
        break;
      case 'focusBeginner':
        progress = userData.totalFocusSessions >= 1 ? 1 : 0;
        total = 1;
        break;
      case 'focusMaster':
        progress = Math.min(userData.totalFocusSessions, 50);
        total = 50;
        break;
      case 'focusChampion':
        progress = Math.min(userData.totalFocusSessions, 100);
        total = 100;
        break;
      case 'timeMaster':
        progress = Math.min(userData.totalFocusTime, 3600000); // 100 hours in ms
        total = 3600000;
        break;
      case 'milestoneCreator':
        progress = userData.totalMilestones >= 1 ? 1 : 0;
        total = 1;
        break;
      case 'milestoneMaster':
        progress = Math.min(userData.totalMilestones, 50);
        total = 50;
        break;
      case 'milestoneCompleter':
        progress = Math.min(userData.completedMilestones, 25);
        total = 25;
        break;
      case 'earlyBird':
        progress = userData.earlyBirdMilestones >= 1 ? 1 : 0;
        total = 1;
        break;
      case 'nightOwl':
        progress = userData.nightOwlMilestones >= 1 ? 1 : 0;
        total = 1;
        break;
      case 'weekendWarrior':
        progress = Math.min(userData.weekendStreak, 5);
        total = 5;
        break;
      case 'consistencyKing':
        progress = Math.min(userData.consecutiveDays, 30);
        total = 30;
        break;
      case 'creativeStarter':
        progress = userData.totalJournalEntries >= 1 ? 1 : 0;
        total = 1;
        break;
      case 'journalMaster':
        progress = Math.min(userData.totalJournalEntries, 50);
        total = 50;
        break;
      case 'productivityPro':
        progress = userData.completedTasks >= 100 ? 1 : 0;
        total = 100;
        break;
      case 'engagementGuru':
        progress = userData.consecutiveDays >= 100 ? 1 : 0;
        total = 100;
        break;
      default:
        progress = 0;
        total = 1;
    }

    const percentage = Math.round((progress / total) * 100);
    
    // Determine state
    if (percentage === 0) {
      state = 'not-started';
    } else if (percentage === 100) {
      state = 'completed';
    } else {
      state = 'in-progress';
    }

    return { progress, total, percentage, state };
  }

  // Get achievement state with detailed information
  getAchievementState(userId, achievementId) {
    const progress = this.getAchievementProgress(userId, achievementId);
    const achievement = this.achievements[achievementId];
    
    return {
      ...progress,
      ...achievement,
      isUnlocked: progress.state === 'completed',
      isInProgress: progress.state === 'in-progress',
      isLocked: progress.state === 'not-started',
      progressText: this.getProgressText(achievementId, progress),
      nextMilestone: this.getNextMilestone(achievementId, progress)
    };
  }

  // Get human-readable progress text
  getProgressText(achievementId, progress) {
    const { progress: current, total } = progress;
    
    switch (achievementId) {
      case 'firstGoal':
        return current >= 1 ? 'Goal created!' : 'Create your first goal';
      case 'goalMaster':
        return `${current}/${total} goals created`;
      case 'goalCompleter':
        return current >= 1 ? 'Goal completed!' : 'Complete your first goal';
      case 'goalChampion':
        return `${current}/${total} goals completed`;
      case 'weekStreak':
        return `${current}/${total} days in current streak`;
      case 'monthStreak':
        return `${current}/${total} days in current streak`;
      case 'streakLegend':
        return `${current}/${total} days in current streak`;
      case 'focusBeginner':
        return current >= 1 ? 'First session completed!' : 'Complete your first focus session';
      case 'focusMaster':
        return `${current}/${total} focus sessions completed`;
      case 'focusChampion':
        return `${current}/${total} focus sessions completed`;
      case 'timeMaster':
        const hours = Math.floor(current / (1000 * 60 * 60));
        const totalHours = Math.floor(total / (1000 * 60 * 60));
        return `${hours}/${totalHours} hours of focus time`;
      case 'milestoneCreator':
        return current >= 1 ? 'Milestone created!' : 'Create your first milestone';
      case 'milestoneMaster':
        return `${current}/${total} milestones created`;
      case 'milestoneCompleter':
        return `${current}/${total} milestones completed`;
      case 'earlyBird':
        return current >= 1 ? 'Early bird milestone completed!' : 'Complete a milestone before 9 AM';
      case 'nightOwl':
        return current >= 1 ? 'Night owl milestone completed!' : 'Complete a milestone after 10 PM';
      case 'weekendWarrior':
        return `${current}/${total} consecutive weekends`;
      case 'consistencyKing':
        return `${current}/${total} consecutive days`;
      case 'creativeStarter':
        return current >= 1 ? 'First journal entry written!' : 'Write your first journal entry';
      case 'journalMaster':
        return `${current}/${total} journal entries written`;
      case 'productivityPro':
        return `${current}/${total} tasks completed`;
      case 'engagementGuru':
        return `${current}/${total} consecutive days`;
      default:
        return `${current}/${total} progress`;
    }
  }

  // Get next milestone information
  getNextMilestone(achievementId, progress) {
    const { progress: current, total } = progress;
    
    if (current >= total) return null;
    
    const remaining = total - current;
    
    switch (achievementId) {
      case 'goalMaster':
        return `Create ${remaining} more goal${remaining > 1 ? 's' : ''}`;
      case 'goalChampion':
        return `Complete ${remaining} more goal${remaining > 1 ? 's' : ''}`;
      case 'weekStreak':
        return `Maintain streak for ${remaining} more day${remaining > 1 ? 's' : ''}`;
      case 'monthStreak':
        return `Maintain streak for ${remaining} more day${remaining > 1 ? 's' : ''}`;
      case 'streakLegend':
        return `Maintain streak for ${remaining} more day${remaining > 1 ? 's' : ''}`;
      case 'focusMaster':
        return `Complete ${remaining} more focus session${remaining > 1 ? 's' : ''}`;
      case 'focusChampion':
        return `Complete ${remaining} more focus session${remaining > 1 ? 's' : ''}`;
      case 'timeMaster':
        const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
        return `Accumulate ${remainingHours} more hour${remainingHours > 1 ? 's' : ''} of focus time`;
      case 'milestoneMaster':
        return `Create ${remaining} more milestone${remaining > 1 ? 's' : ''}`;
      case 'milestoneCompleter':
        return `Complete ${remaining} more milestone${remaining > 1 ? 's' : ''}`;
      case 'weekendWarrior':
        return `Complete milestones on ${remaining} more consecutive weekend${remaining > 1 ? 's' : ''}`;
      case 'consistencyKing':
        return `Use the app for ${remaining} more consecutive day${remaining > 1 ? 's' : ''}`;
      case 'creativeStarter':
        return `Write ${remaining} more journal entry${remaining > 1 ? 's' : ''}`;
      case 'journalMaster':
        return `Write ${remaining} more journal entry${remaining > 1 ? 's' : ''}`;
      case 'productivityPro':
        return `Complete ${remaining} more task${remaining > 1 ? 's' : ''}`;
      case 'engagementGuru':
        return `Use the app for ${remaining} more consecutive day${remaining > 1 ? 's' : ''}`;
      default:
        return `Complete ${remaining} more`;
    }
  }

  // Get all achievements with progress
  async getAllAchievementsWithProgress(user) {
    const userId = user?.uid || user?.id;
    const userAchievements = this.getUserAchievements(userId);
    
    return Promise.all(Object.values(this.achievements).map(async achievement => {
      const userAchievement = userAchievements.find(ua => ua.id === achievement.id);
      const progress = await this.getAchievementProgress(user, achievement.id);
      
      return {
        ...achievement,
        earned: !!userAchievement,
        earnedAt: userAchievement?.awardedAt,
        progress: progress.progress,
        total: progress.total,
        percentage: progress.percentage
      };
    }));
  }

  // Get achievements by category
  async getAchievementsByCategory(user) {
    const achievements = await this.getAllAchievementsWithProgress(user);
    const categorized = {};

    Object.keys(this.categories).forEach(category => {
      categorized[category] = {
        ...this.categories[category],
        achievements: achievements.filter(a => a.category === category)
      };
    });

    return categorized;
  }

  // Get recent achievements (last 5)
  getRecentAchievements(userId) {
    const userAchievements = this.getUserAchievements(userId);
    return userAchievements
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
      .slice(0, 5);
  }

  // Get next achievable achievements
  async getNextAchievements(user) {
    const achievements = await this.getAllAchievementsWithProgress(user);
    return achievements
      .filter(a => !a.earned && a.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }
}

// Create singleton instance
const achievementService = new AchievementService();

export default achievementService; 