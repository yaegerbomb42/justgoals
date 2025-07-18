// Enhanced analytics service for productivity insights

import { firestore } from './firebaseClient';
import { getAuth } from 'firebase/auth';

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch fresh data
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      return this.getDefaultData(key);
    }
  }

  // Get default data for when fetching fails
  getDefaultData(type) {
    switch (type) {
      case 'heatmap':
        return this.generateDefaultHeatmap();
      case 'trends':
        return this.generateDefaultTrends();
      case 'focusTimes':
        return this.generateDefaultFocusTimes();
      case 'goalDependencies':
        return {};
      case 'habits':
        return this.generateDefaultHabits();
      case 'insights':
        return [];
      default:
        return {};
    }
  }

  // Generate default heatmap data
  generateDefaultHeatmap() {
    const heatmap = [];
    const now = new Date();
    const daysInWeek = 7;
    const hoursInDay = 24;

    for (let day = 0; day < daysInWeek; day++) {
      for (let hour = 0; hour < hoursInDay; hour++) {
        heatmap.push({
          day,
          hour,
          value: Math.floor(Math.random() * 5), // Random activity level 0-4
          date: new Date(now.getTime() - (daysInWeek - day) * 24 * 60 * 60 * 1000)
        });
      }
    }
    return heatmap;
  }

  // Generate default trends data
  generateDefaultTrends() {
    const trends = [];
    const days = 30;
    const now = new Date();

    for (let i = 0; i < days; i++) {
      trends.push({
        date: new Date(now.getTime() - (days - i) * 24 * 60 * 60 * 1000),
        productivity: Math.floor(Math.random() * 100),
        focusTime: Math.floor(Math.random() * 8),
        goalsCompleted: Math.floor(Math.random() * 5),
        tasksCompleted: Math.floor(Math.random() * 10)
      });
    }
    return trends;
  }

  // Generate default focus times data
  generateDefaultFocusTimes() {
    return [
      { hour: 9, productivity: 85, sessions: 3 },
      { hour: 10, productivity: 90, sessions: 4 },
      { hour: 11, productivity: 75, sessions: 2 },
      { hour: 14, productivity: 80, sessions: 3 },
      { hour: 15, productivity: 85, sessions: 4 },
      { hour: 16, productivity: 70, sessions: 2 }
    ];
  }

  // Generate default habits data
  generateDefaultHabits() {
    return {
      focusSessions: {
        totalTime: 0,
        averageDuration: 0,
        totalSessions: 0
      },
      dailyCheckins: {
        currentStreak: 0,
        longestStreak: 0,
        totalCheckins: 0
      },
      goalCompletion: {
        completedToday: 0,
        completedThisWeek: 0,
        completionRate: 0
      }
    };
  }

  // Main analytics method
  async getUserAnalytics(userId, timeRange = 'month') {
    if (!userId) {
      return {
        heatmap: this.generateDefaultHeatmap(),
        trends: this.generateDefaultTrends(),
        focusTimes: this.generateDefaultFocusTimes(),
        goalDependencies: {},
        habits: this.generateDefaultHabits(),
        insights: [],
        permissionError: false
      };
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Try to get data from Firestore
      const docRef = firestore.collection('users').doc(user.uid).collection('analytics').doc('dashboard');
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        return {
          heatmap: data.heatmap || this.generateDefaultHeatmap(),
          trends: data.trends || this.generateDefaultTrends(),
          focusTimes: data.focusTimes || this.generateDefaultFocusTimes(),
          goalDependencies: data.goalDependencies || {},
          habits: data.habits || this.generateDefaultHabits(),
          insights: data.insights || [],
          permissionError: false
        };
      } else {
        // Return default data if no analytics exist
        return {
          heatmap: this.generateDefaultHeatmap(),
          trends: this.generateDefaultTrends(),
          focusTimes: this.generateDefaultFocusTimes(),
          goalDependencies: {},
          habits: this.generateDefaultHabits(),
          insights: [],
          permissionError: false
        };
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        heatmap: this.generateDefaultHeatmap(),
        trends: this.generateDefaultTrends(),
        focusTimes: this.generateDefaultFocusTimes(),
        goalDependencies: {},
        habits: this.generateDefaultHabits(),
        insights: [],
        permissionError: false
      };
    }
  }

  // Individual analytics methods for specific components
  async getProductivityHeatmap(userId, timeRange = 'month') {
    return this.getCachedData(`heatmap_${userId}_${timeRange}`, async () => {
      const analytics = await this.getUserAnalytics(userId, timeRange);
      return analytics.heatmap;
    });
  }

  async getProductivityTrends(userId, timeRange = 'month') {
    return this.getCachedData(`trends_${userId}_${timeRange}`, async () => {
      const analytics = await this.getUserAnalytics(userId, timeRange);
      return analytics.trends;
    });
  }

  async getOptimalFocusTimes(userId) {
    return this.getCachedData(`focusTimes_${userId}`, async () => {
      const analytics = await this.getUserAnalytics(userId);
      return analytics.focusTimes;
    });
  }

  async getGoalDependencyAnalysis(userId) {
    return this.getCachedData(`goalDependencies_${userId}`, async () => {
      const analytics = await this.getUserAnalytics(userId);
      return analytics.goalDependencies;
    });
  }

  async getHabitTrackingData(userId) {
    return this.getCachedData(`habits_${userId}`, async () => {
      const analytics = await this.getUserAnalytics(userId);
      return analytics.habits;
    });
  }

  async getPredictiveInsights(userId) {
    return this.getCachedData(`insights_${userId}`, async () => {
      const analytics = await this.getUserAnalytics(userId);
      return analytics.insights;
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(key) {
    this.cache.delete(key);
  }
}

export default new AnalyticsService(); 