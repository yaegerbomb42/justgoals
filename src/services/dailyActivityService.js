// Daily Activity Service - Track when user opens the app to maintain streaks

class DailyActivityService {
  constructor() {
    this.activityKey = 'daily_activity_log';
    this.streakKey = 'user_activity_streak';
  }

  // Track user login/app open
  trackDailyActivity(userId) {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    const activityKey = `${this.activityKey}_${userId}`;
    const streakKey = `${this.streakKey}_${userId}`;

    try {
      // Get existing activity log
      const existingLog = JSON.parse(localStorage.getItem(activityKey) || '[]');
      
      // Check if today is already logged
      const todayExists = existingLog.some(entry => entry.date === today);
      
      if (!todayExists) {
        // Add today's activity
        const newEntry = {
          date: today,
          timestamp: new Date().toISOString(),
          sessionCount: 1
        };
        
        existingLog.push(newEntry);
        
        // Keep only last 365 days
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        const oneYearAgoString = oneYearAgo.toISOString().split('T')[0];
        
        const filteredLog = existingLog.filter(entry => entry.date >= oneYearAgoString);
        
        // Sort by date
        filteredLog.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Save updated log
        localStorage.setItem(activityKey, JSON.stringify(filteredLog));
        
        // Update streak
        this.updateStreak(userId, filteredLog);
        
        console.log(`Daily activity tracked for ${userId} on ${today}`);
      } else {
        // Update session count for today
        const todayEntry = existingLog.find(entry => entry.date === today);
        if (todayEntry) {
          todayEntry.sessionCount = (todayEntry.sessionCount || 1) + 1;
          todayEntry.lastSession = new Date().toISOString();
          localStorage.setItem(activityKey, JSON.stringify(existingLog));
        }
      }
    } catch (error) {
      console.error('Error tracking daily activity:', error);
    }
  }

  // Update user activity streak
  updateStreak(userId, activityLog) {
    if (!userId || !activityLog) return;

    const streakKey = `${this.streakKey}_${userId}`;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Calculate current streak
      let currentStreak = 0;
      let checkDate = today;
      
      // Sort activity log by date (most recent first)
      const sortedLog = [...activityLog].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Check consecutive days
      for (let i = 0; i < sortedLog.length; i++) {
        const entry = sortedLog[i];
        const entryDate = entry.date;
        
        if (entryDate === checkDate) {
          currentStreak++;
          // Move to previous day
          const prevDate = new Date(checkDate);
          prevDate.setDate(prevDate.getDate() - 1);
          checkDate = prevDate.toISOString().split('T')[0];
        } else {
          // Check if there's a gap
          const expectedDate = new Date(checkDate);
          const actualDate = new Date(entryDate);
          const dayDiff = Math.floor((expectedDate - actualDate) / (1000 * 60 * 60 * 24));
          
          if (dayDiff > 0) {
            // There's a gap, streak is broken
            break;
          }
        }
      }
      
      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      let prevDate = null;
      
      for (const entry of sortedLog.reverse()) {
        const entryDate = new Date(entry.date);
        
        if (prevDate) {
          const dayDiff = Math.floor((entryDate - prevDate) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        
        prevDate = entryDate;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      
      // Save streak data
      const streakData = {
        currentStreak,
        longestStreak,
        lastActivity: today,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(streakKey, JSON.stringify(streakData));
      
      console.log(`Streak updated for ${userId}: ${currentStreak} days (longest: ${longestStreak})`);
      
      return streakData;
    } catch (error) {
      console.error('Error updating streak:', error);
      return { currentStreak: 0, longestStreak: 0, lastActivity: today };
    }
  }

  // Get user's current streak
  getStreak(userId) {
    if (!userId) return { currentStreak: 0, longestStreak: 0, lastActivity: null };

    const streakKey = `${this.streakKey}_${userId}`;
    
    try {
      const streakData = JSON.parse(localStorage.getItem(streakKey) || '{}');
      return {
        currentStreak: streakData.currentStreak || 0,
        longestStreak: streakData.longestStreak || 0,
        lastActivity: streakData.lastActivity || null
      };
    } catch (error) {
      console.error('Error getting streak:', error);
      return { currentStreak: 0, longestStreak: 0, lastActivity: null };
    }
  }

  // Get user's activity log
  getActivityLog(userId) {
    if (!userId) return [];

    const activityKey = `${this.activityKey}_${userId}`;
    
    try {
      return JSON.parse(localStorage.getItem(activityKey) || '[]');
    } catch (error) {
      console.error('Error getting activity log:', error);
      return [];
    }
  }

  // Get activity stats
  getActivityStats(userId) {
    if (!userId) return {};

    const activityLog = this.getActivityLog(userId);
    const streak = this.getStreak(userId);
    
    // Calculate additional stats
    const totalDays = activityLog.length;
    const totalSessions = activityLog.reduce((sum, entry) => sum + (entry.sessionCount || 1), 0);
    
    // Activity in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];
    
    const recentActivity = activityLog.filter(entry => entry.date >= thirtyDaysAgoString);
    const recentDays = recentActivity.length;
    const recentSessions = recentActivity.reduce((sum, entry) => sum + (entry.sessionCount || 1), 0);
    
    // Calculate consistency rate (days active in last 30 days)
    const consistencyRate = Math.round((recentDays / 30) * 100);
    
    return {
      ...streak,
      totalDays,
      totalSessions,
      recentDays,
      recentSessions,
      consistencyRate,
      averageSessionsPerDay: totalDays > 0 ? Math.round((totalSessions / totalDays) * 10) / 10 : 0
    };
  }

  // Check if streak is at risk (no activity yesterday)
  isStreakAtRisk(userId) {
    if (!userId) return false;

    const activityLog = this.getActivityLog(userId);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const hasYesterdayActivity = activityLog.some(entry => entry.date === yesterdayString);
    const streak = this.getStreak(userId);
    
    return streak.currentStreak > 0 && !hasYesterdayActivity;
  }

  // Get streak motivation message
  getMotivationMessage(userId) {
    const stats = this.getActivityStats(userId);
    const { currentStreak, longestStreak, consistencyRate } = stats;
    
    if (currentStreak === 0) {
      return "Start your streak today! Every journey begins with a single step. 🚀";
    }
    
    if (currentStreak === 1) {
      return "Great start! One day down, let's keep the momentum going! 💪";
    }
    
    if (currentStreak < 7) {
      return `${currentStreak} days strong! You're building a great habit! 🔥`;
    }
    
    if (currentStreak < 30) {
      return `Amazing! ${currentStreak} day streak! You're on fire! 🌟`;
    }
    
    if (currentStreak < longestStreak) {
      return `${currentStreak} days! You're getting close to your personal best of ${longestStreak} days! ⚡`;
    }
    
    if (currentStreak === longestStreak && currentStreak >= 30) {
      return `Incredible! ${currentStreak} days - you've reached your personal best! 🏆`;
    }
    
    return `Outstanding! ${currentStreak} day streak! You're a true champion! 👑`;
  }

  // Initialize tracking for new users
  initializeTracking(userId) {
    if (!userId) return;
    
    // Track today as first activity
    this.trackDailyActivity(userId);
    
    console.log(`Daily activity tracking initialized for user ${userId}`);
  }

  // Reset streak (for testing purposes)
  resetStreak(userId) {
    if (!userId) return;

    const activityKey = `${this.activityKey}_${userId}`;
    const streakKey = `${this.streakKey}_${userId}`;
    
    localStorage.removeItem(activityKey);
    localStorage.removeItem(streakKey);
    
    console.log(`Streak reset for user ${userId}`);
  }
}

// Create singleton instance
const dailyActivityService = new DailyActivityService();

export default dailyActivityService;
