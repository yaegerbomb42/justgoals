// Achievement system for tracking user progress and awarding badges

class AchievementService {
  constructor() {
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
      }
    };

    this.categories = {
      goals: { name: 'Goals', icon: '🎯', color: '#6366F1' },
      streaks: { name: 'Streaks', icon: '🔥', color: '#EF4444' },
      focus: { name: 'Focus', icon: '🧠', color: '#10B981' },
      milestones: { name: 'Milestones', icon: '📋', color: '#F59E0B' },
      special: { name: 'Special', icon: '⭐', color: '#8B5CF6' }
    };
  }

  // Get user data for achievement checking
  getUserData(userId) {
    if (!userId) return {
      totalGoals: 0,
      completedGoals: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      totalFocusSessions: 0,
      totalFocusTime: 0,
      currentStreak: 0,
      earlyBirdMilestones: 0,
      nightOwlMilestones: 0,
      weekendStreak: 0,
      consecutiveDays: 0,
      totalJournalEntries: 0,
      completedTasks: 0
    };
    try {
      // Get goals data
      const goalsKey = `goals_data_${userId}`;
      let goalsData = [];
      try { goalsData = JSON.parse(localStorage.getItem(goalsKey) || '[]'); } catch (e) { goalsData = []; }
      // Get milestones data
      const milestonesKey = `milestones_data_${userId}`;
      let milestonesData = [];
      try { milestonesData = JSON.parse(localStorage.getItem(milestonesKey) || '[]'); } catch (e) { milestonesData = []; }
      // Get focus session data
      const focusStatsKey = `focus_session_stats_${userId}`;
      let focusStats = {};
      try { focusStats = JSON.parse(localStorage.getItem(focusStatsKey) || '{}'); } catch (e) { focusStats = {}; }
      // Get focus history
      const focusHistoryKey = `focus_session_history_${userId}`;
      let focusHistory = [];
      try { focusHistory = JSON.parse(localStorage.getItem(focusHistoryKey) || '[]'); } catch (e) { focusHistory = []; }
      // Get journal entries
      const journalKey = `journal_entries_${userId}`;
      let journalEntries = [];
      try { journalEntries = JSON.parse(localStorage.getItem(journalKey) || '[]'); } catch (e) { journalEntries = []; }
      // Calculate streak data
      const streakData = this.calculateStreakData(milestonesData);
      // Calculate special achievements data
      const specialData = this.calculateSpecialData(milestonesData, focusHistory);
      // Calculate completed tasks (goals + milestones)
      const completedTasks = (Array.isArray(goalsData) ? goalsData.filter(goal => goal.progress >= 100).length : 0) + (Array.isArray(milestonesData) ? milestonesData.filter(m => m.completed).length : 0);
      return {
        totalGoals: Array.isArray(goalsData) ? goalsData.length : 0,
        completedGoals: Array.isArray(goalsData) ? goalsData.filter(goal => goal.progress >= 100).length : 0,
        totalMilestones: Array.isArray(milestonesData) ? milestonesData.length : 0,
        completedMilestones: Array.isArray(milestonesData) ? milestonesData.filter(m => m.completed).length : 0,
        totalFocusSessions: focusStats.sessionsToday || 0,
        totalFocusTime: focusStats.totalFocusTime || 0,
        currentStreak: streakData.currentStreak || 0,
        earlyBirdMilestones: specialData.earlyBird || 0,
        nightOwlMilestones: specialData.nightOwl || 0,
        weekendStreak: specialData.weekendStreak || 0,
        consecutiveDays: specialData.consecutiveDays || 0,
        totalJournalEntries: Array.isArray(journalEntries) ? journalEntries.length : 0,
        completedTasks
      };
    } catch (error) {
      console.error('Error getting user data for achievements:', error);
      return {
        totalGoals: 0,
        completedGoals: 0,
        totalMilestones: 0,
        completedMilestones: 0,
        totalFocusSessions: 0,
        totalFocusTime: 0,
        currentStreak: 0,
        earlyBirdMilestones: 0,
        nightOwlMilestones: 0,
        weekendStreak: 0,
        consecutiveDays: 0,
        totalJournalEntries: 0,
        completedTasks: 0
      };
    }
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

  // Check and award achievements
  checkAchievements(userId) {
    const userData = this.getUserData(userId);
    if (!userData) return [];

    const userAchievements = this.getUserAchievements(userId);
    const newAchievements = [];

    Object.values(this.achievements).forEach(achievement => {
      // Check if user already has this achievement
      if (userAchievements.find(ua => ua.id === achievement.id)) {
        return;
      }

      // Check if user meets the condition
      if (achievement.condition(userData)) {
        newAchievements.push({
          ...achievement,
          awardedAt: new Date().toISOString()
        });
      }
    });

    // Award new achievements
    if (newAchievements.length > 0) {
      this.awardAchievements(userId, newAchievements);
    }

    return newAchievements;
  }

  // Get user's earned achievements
  getUserAchievements(userId) {
    if (!userId) return [];

    try {
      const achievementsKey = `user_achievements_${userId}`;
      return JSON.parse(localStorage.getItem(achievementsKey) || '[]');
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  // Award achievements to user
  awardAchievements(userId, achievements) {
    if (!userId || !achievements.length) return;

    try {
      const achievementsKey = `user_achievements_${userId}`;
      const existingAchievements = this.getUserAchievements(userId);
      const updatedAchievements = [...existingAchievements, ...achievements];
      
      localStorage.setItem(achievementsKey, JSON.stringify(updatedAchievements));
      
      // Update total points
      this.updateUserPoints(userId, achievements);
      
      console.log(`Awarded ${achievements.length} new achievements to user ${userId}:`, achievements);
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
  getAchievementProgress(userId, achievementId) {
    if (!userId || !achievementId) {
      return { progress: 0, total: 0, percentage: 0, state: 'not-started' };
    }

    const achievement = this.achievements[achievementId];
    if (!achievement) {
      return { progress: 0, total: 0, percentage: 0, state: 'not-started' };
    }

    const userData = this.getUserData(userId);
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
  getAllAchievementsWithProgress(userId) {
    const userAchievements = this.getUserAchievements(userId);
    
    return Object.values(this.achievements).map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.id === achievement.id);
      const progress = this.getAchievementProgress(userId, achievement.id);
      
      return {
        ...achievement,
        earned: !!userAchievement,
        earnedAt: userAchievement?.awardedAt,
        progress: progress.progress,
        total: progress.total,
        percentage: progress.percentage
      };
    });
  }

  // Get achievements by category
  getAchievementsByCategory(userId) {
    const achievements = this.getAllAchievementsWithProgress(userId);
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
  getNextAchievements(userId) {
    const achievements = this.getAllAchievementsWithProgress(userId);
    return achievements
      .filter(a => !a.earned && a.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }
}

// Create singleton instance
const achievementService = new AchievementService();

export default achievementService; 