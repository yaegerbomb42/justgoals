// Enhanced gamification service with levels, badges, challenges, and rewards

class GamificationService {
  constructor() {
    this.levels = [
      { level: 1, name: 'Novice', xpRequired: 0, badge: '🌱' },
      { level: 2, name: 'Apprentice', xpRequired: 100, badge: '📚' },
      { level: 3, name: 'Explorer', xpRequired: 250, badge: '🗺️' },
      { level: 4, name: 'Achiever', xpRequired: 500, badge: '🏆' },
      { level: 5, name: 'Master', xpRequired: 1000, badge: '👑' },
      { level: 6, name: 'Legend', xpRequired: 2000, badge: '⭐' },
      { level: 7, name: 'Mythic', xpRequired: 4000, badge: '🌟' },
      { level: 8, name: 'Divine', xpRequired: 8000, badge: '💫' }
    ];

    this.badges = {
      // Streak badges
      streak_7: { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', xp: 50 },
      streak_30: { id: 'streak_30', name: 'Monthly Master', description: '30-day streak', icon: '🔥🔥', xp: 200 },
      streak_100: { id: 'streak_100', name: 'Century Club', description: '100-day streak', icon: '🔥🔥🔥', xp: 500 },

      // Focus badges
      focus_1h: { id: 'focus_1h', name: 'Focus Starter', description: '1 hour of focus time', icon: '⏰', xp: 25 },
      focus_10h: { id: 'focus_10h', name: 'Deep Diver', description: '10 hours of focus time', icon: '⏰⏰', xp: 100 },
      focus_100h: { id: 'focus_100h', name: 'Focus Master', description: '100 hours of focus time', icon: '⏰⏰⏰', xp: 300 },

      // Goal badges
      goal_1: { id: 'goal_1', name: 'Goal Getter', description: 'Complete 1 goal', icon: '🎯', xp: 50 },
      goal_10: { id: 'goal_10', name: 'Goal Crusher', description: 'Complete 10 goals', icon: '🎯🎯', xp: 200 },
      goal_50: { id: 'goal_50', name: 'Goal Legend', description: 'Complete 50 goals', icon: '🎯🎯🎯', xp: 500 },

      // Milestone badges
      milestone_10: { id: 'milestone_10', name: 'Milestone Maker', description: 'Complete 10 milestones', icon: '✅', xp: 30 },
      milestone_50: { id: 'milestone_50', name: 'Milestone Master', description: 'Complete 50 milestones', icon: '✅✅', xp: 150 },
      milestone_200: { id: 'milestone_200', name: 'Milestone Legend', description: 'Complete 200 milestones', icon: '✅✅✅', xp: 400 },

      // Special badges
      early_bird: { id: 'early_bird', name: 'Early Bird', description: 'Complete tasks before 9 AM', icon: '🌅', xp: 75 },
      night_owl: { id: 'night_owl', name: 'Night Owl', description: 'Complete tasks after 10 PM', icon: '🦉', xp: 75 },
      weekend_warrior: { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Active on weekends', icon: '🏃', xp: 100 },
      consistency_king: { id: 'consistency_king', name: 'Consistency King', description: '90% consistency rate', icon: '👑', xp: 300 },
      speed_demon: { id: 'speed_demon', name: 'Speed Demon', description: 'Complete tasks ahead of schedule', icon: '⚡', xp: 150 },
      quality_focused: { id: 'quality_focused', name: 'Quality Focused', description: 'High-quality task completion', icon: '💎', xp: 200 }
    };

    this.challenges = {
      daily: [
        { id: 'daily_focus_2h', name: 'Deep Focus', description: 'Focus for 2 hours today', xp: 50, type: 'focus_time', target: 2 },
        { id: 'daily_milestones_3', name: 'Triple Threat', description: 'Complete 3 milestones today', xp: 40, type: 'milestones', target: 3 },
        { id: 'daily_goals_progress', name: 'Goal Progress', description: 'Make progress on 2 goals today', xp: 30, type: 'goal_progress', target: 2 }
      ],
      weekly: [
        { id: 'weekly_focus_10h', name: 'Focus Marathon', description: 'Focus for 10 hours this week', xp: 200, type: 'focus_time', target: 10 },
        { id: 'weekly_milestones_15', name: 'Milestone Master', description: 'Complete 15 milestones this week', xp: 150, type: 'milestones', target: 15 },
        { id: 'weekly_streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', xp: 100, type: 'streak', target: 7 }
      ],
      monthly: [
        { id: 'monthly_focus_40h', name: 'Focus Champion', description: 'Focus for 40 hours this month', xp: 500, type: 'focus_time', target: 40 },
        { id: 'monthly_goals_5', name: 'Goal Achiever', description: 'Complete 5 goals this month', xp: 400, type: 'goals', target: 5 },
        { id: 'monthly_consistency_80', name: 'Consistency Master', description: 'Maintain 80% consistency', xp: 300, type: 'consistency', target: 80 }
      ]
    };

    this.rewards = {
      level_up: { type: 'level_up', message: '🎉 Level Up! You\'ve reached level {level}!', xp: 0 },
      badge_earned: { type: 'badge_earned', message: '🏆 New Badge: {badge_name}!', xp: 0 },
      challenge_completed: { type: 'challenge_completed', message: '✅ Challenge Complete: {challenge_name}!', xp: 0 },
      streak_milestone: { type: 'streak_milestone', message: '🔥 {days} Day Streak! Keep it up!', xp: 0 }
    };
  }

  // Get user gamification data
  async getUserGamificationData(userId) {
    if (!userId) return null;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      
      try {
        const [goals, milestones, focusHistory, achievements] = await Promise.all([
          firestoreService.getGoals(userId),
          firestoreService.getMilestones(userId),
          firestoreService.getFocusSessionHistory(userId),
          firestoreService.getAchievements(userId)
        ]);

        return {
          goals: goals || [],
          milestones: milestones || [],
          focusHistory: focusHistory || [],
          achievements: achievements || []
        };
      } catch (error) {
        console.warn('Firestore gamification data fetch failed, falling back to localStorage:', error);
        
        // Fallback to localStorage
        const goalsKey = `goals_data_${userId}`;
        const milestonesKey = `milestones_data_${userId}`;
        const focusHistoryKey = `focus_session_history_${userId}`;
        const achievementsKey = `achievements_${userId}`;

        return {
          goals: JSON.parse(localStorage.getItem(goalsKey) || '[]'),
          milestones: JSON.parse(localStorage.getItem(milestonesKey) || '[]'),
          focusHistory: JSON.parse(localStorage.getItem(focusHistoryKey) || '[]'),
          achievements: JSON.parse(localStorage.getItem(achievementsKey) || '[]')
        };
      }
    } catch (error) {
      console.error('Error getting user gamification data:', error);
      return null;
    }
  }

  // Calculate user level and XP
  calculateUserLevel(userData) {
    const totalXP = this.calculateTotalXP(userData);
    const currentLevel = this.levels.find(level => totalXP >= level.xpRequired);
    const nextLevel = this.levels.find(level => totalXP < level.xpRequired);
    
    const progress = nextLevel ? 
      ((totalXP - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100 : 100;

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      badge: currentLevel.badge,
      xp: totalXP,
      nextLevel: nextLevel?.level || currentLevel.level,
      nextLevelName: nextLevel?.name || currentLevel.name,
      progress: Math.round(progress),
      xpToNext: nextLevel ? nextLevel.xpRequired - totalXP : 0
    };
  }

  // Calculate total XP from all sources
  calculateTotalXP(userData) {
    let totalXP = 0;

    // XP from achievements
    if (userData.achievements) {
      userData.achievements.forEach(achievement => {
        if (achievement.earned) {
          totalXP += this.badges[achievement.id]?.xp || 0;
        }
      });
    }

    // XP from completed goals
    if (userData.goals) {
      const completedGoals = userData.goals.filter(goal => goal.progress >= 100);
      totalXP += completedGoals.length * 50; // 50 XP per completed goal
    }

    // XP from completed milestones
    if (userData.milestones) {
      const completedMilestones = userData.milestones.filter(m => m.completed);
      totalXP += completedMilestones.length * 10; // 10 XP per completed milestone
    }

    // XP from focus time
    if (userData.focusHistory) {
      const totalFocusHours = userData.focusHistory.reduce((total, session) => {
        return total + (session.elapsed / (1000 * 60 * 60));
      }, 0);
      totalXP += Math.floor(totalFocusHours * 5); // 5 XP per hour of focus
    }

    return totalXP;
  }

  // Check for new achievements
  async checkAchievements(userId) {
    const userData = await this.getUserGamificationData(userId);
    if (!userData) return [];

    const newAchievements = [];
    const currentAchievements = userData.achievements || [];

    // Calculate user stats
    const stats = this.calculateUserStats(userData);

    // Check streak achievements
    if (stats.currentStreak >= 7 && !this.hasAchievement(currentAchievements, 'streak_7')) {
      newAchievements.push(this.badges.streak_7);
    }
    if (stats.currentStreak >= 30 && !this.hasAchievement(currentAchievements, 'streak_30')) {
      newAchievements.push(this.badges.streak_30);
    }
    if (stats.currentStreak >= 100 && !this.hasAchievement(currentAchievements, 'streak_100')) {
      newAchievements.push(this.badges.streak_100);
    }

    // Check focus achievements
    if (stats.totalFocusHours >= 1 && !this.hasAchievement(currentAchievements, 'focus_1h')) {
      newAchievements.push(this.badges.focus_1h);
    }
    if (stats.totalFocusHours >= 10 && !this.hasAchievement(currentAchievements, 'focus_10h')) {
      newAchievements.push(this.badges.focus_10h);
    }
    if (stats.totalFocusHours >= 100 && !this.hasAchievement(currentAchievements, 'focus_100h')) {
      newAchievements.push(this.badges.focus_100h);
    }

    // Check goal achievements
    if (stats.completedGoals >= 1 && !this.hasAchievement(currentAchievements, 'goal_1')) {
      newAchievements.push(this.badges.goal_1);
    }
    if (stats.completedGoals >= 10 && !this.hasAchievement(currentAchievements, 'goal_10')) {
      newAchievements.push(this.badges.goal_10);
    }
    if (stats.completedGoals >= 50 && !this.hasAchievement(currentAchievements, 'goal_50')) {
      newAchievements.push(this.badges.goal_50);
    }

    // Check milestone achievements
    if (stats.completedMilestones >= 10 && !this.hasAchievement(currentAchievements, 'milestone_10')) {
      newAchievements.push(this.badges.milestone_10);
    }
    if (stats.completedMilestones >= 50 && !this.hasAchievement(currentAchievements, 'milestone_50')) {
      newAchievements.push(this.badges.milestone_50);
    }
    if (stats.completedMilestones >= 200 && !this.hasAchievement(currentAchievements, 'milestone_200')) {
      newAchievements.push(this.badges.milestone_200);
    }

    // Check special achievements
    if (stats.earlyBirdCount >= 5 && !this.hasAchievement(currentAchievements, 'early_bird')) {
      newAchievements.push(this.badges.early_bird);
    }
    if (stats.nightOwlCount >= 5 && !this.hasAchievement(currentAchievements, 'night_owl')) {
      newAchievements.push(this.badges.night_owl);
    }
    if (stats.weekendActivity >= 0.8 && !this.hasAchievement(currentAchievements, 'weekend_warrior')) {
      newAchievements.push(this.badges.weekend_warrior);
    }
    if (stats.consistencyRate >= 0.9 && !this.hasAchievement(currentAchievements, 'consistency_king')) {
      newAchievements.push(this.badges.consistency_king);
    }

    return newAchievements;
  }

  // Calculate user stats for achievements
  calculateUserStats(userData) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate current streak
    let currentStreak = 0;
    let lastActivity = null;
    
    if (userData.milestones) {
      const recentMilestones = userData.milestones
        .filter(m => m.completed && new Date(m.completedAt) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      if (recentMilestones.length > 0) {
        lastActivity = new Date(recentMilestones[0].completedAt);
        let currentDate = new Date(now);
        currentDate.setHours(0, 0, 0, 0);

        while (currentDate >= lastActivity) {
          const dayMilestones = recentMilestones.filter(m => {
            const milestoneDate = new Date(m.completedAt);
            return milestoneDate.toDateString() === currentDate.toDateString();
          });

          if (dayMilestones.length > 0) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // Calculate focus hours
    const totalFocusHours = userData.focusHistory ? 
      userData.focusHistory.reduce((total, session) => {
        return total + (session.elapsed / (1000 * 60 * 60));
      }, 0) : 0;

    // Calculate completed goals and milestones
    const completedGoals = userData.goals ? userData.goals.filter(g => g.progress >= 100).length : 0;
    const completedMilestones = userData.milestones ? userData.milestones.filter(m => m.completed).length : 0;

    // Calculate special stats
    let earlyBirdCount = 0;
    let nightOwlCount = 0;
    let weekendActivity = 0;
    let consistencyRate = 0;

    if (userData.milestones) {
      const recentMilestones = userData.milestones.filter(m => m.completed && new Date(m.completedAt) >= thirtyDaysAgo);
      
      recentMilestones.forEach(milestone => {
        const completionTime = new Date(milestone.completedAt);
        const hour = completionTime.getHours();
        const dayOfWeek = completionTime.getDay();

        if (hour < 9) earlyBirdCount++;
        if (hour >= 22) nightOwlCount++;
        if (dayOfWeek === 0 || dayOfWeek === 6) weekendActivity++;
      });

      const totalDays = Math.ceil((now - thirtyDaysAgo) / (1000 * 60 * 60 * 24));
      const activeDays = new Set(recentMilestones.map(m => new Date(m.completedAt).toDateString())).size;
      consistencyRate = activeDays / totalDays;
    }

    return {
      currentStreak,
      totalFocusHours,
      completedGoals,
      completedMilestones,
      earlyBirdCount,
      nightOwlCount,
      weekendActivity: weekendActivity / Math.max(1, completedMilestones),
      consistencyRate
    };
  }

  // Check if user has specific achievement
  hasAchievement(achievements, achievementId) {
    return achievements.some(a => a.id === achievementId && a.earned);
  }

  // Get active challenges
  getActiveChallenges(userId) {
    // This would typically fetch from Firestore
    // For now, return daily challenges
    return this.challenges.daily;
  }

  // Check challenge progress
  async checkChallengeProgress(userId, challengeId) {
    const userData = await this.getUserGamificationData(userId);
    if (!userData) return { progress: 0, completed: false };

    const challenge = this.findChallenge(challengeId);
    if (!challenge) return { progress: 0, completed: false };

    const stats = this.calculateUserStats(userData);
    
    let progress = 0;
    switch (challenge.type) {
      case 'focus_time':
        progress = Math.min(stats.totalFocusHours, challenge.target);
        break;
      case 'milestones':
        progress = Math.min(stats.completedMilestones, challenge.target);
        break;
      case 'goals':
        progress = Math.min(stats.completedGoals, challenge.target);
        break;
      case 'streak':
        progress = Math.min(stats.currentStreak, challenge.target);
        break;
      case 'consistency':
        progress = Math.min(stats.consistencyRate * 100, challenge.target);
        break;
      default:
        progress = 0;
    }

    return {
      progress: Math.round(progress),
      completed: progress >= challenge.target,
      target: challenge.target
    };
  }

  // Find challenge by ID
  findChallenge(challengeId) {
    for (const category of Object.values(this.challenges)) {
      const challenge = category.find(c => c.id === challengeId);
      if (challenge) return challenge;
    }
    return null;
  }

  // Save achievement to Firestore
  async saveAchievement(userId, achievement) {
    try {
      const firestoreService = (await import('./firestoreService')).default;
      await firestoreService.saveAchievement(userId, {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xp: achievement.xp,
        earned: true,
        earnedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving achievement:', error);
      // Fallback to localStorage
      const achievementsKey = `achievements_${userId}`;
      const achievements = JSON.parse(localStorage.getItem(achievementsKey) || '[]');
      achievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xp: achievement.xp,
        earned: true,
        earnedAt: new Date().toISOString()
      });
      localStorage.setItem(achievementsKey, JSON.stringify(achievements));
    }
  }
}

// Create singleton instance
const gamificationService = new GamificationService();

export default gamificationService; 