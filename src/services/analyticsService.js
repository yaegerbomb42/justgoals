// Enhanced analytics service for productivity insights

import { firestore } from './firebaseClient';
import { getAuth } from 'firebase/auth';
import generateDemoAnalyticsData from '../utils/demoDataGenerator';

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

  // Get default data for when fetching fails (only for unauthenticated/demo)
  getDefaultData(type) {
    switch (type) {
      case 'heatmap':
      case 'trends':
      case 'focusTimes':
      case 'insights':
        return [];
      case 'goalDependencies':
      case 'habits':
        return {};
      default:
        return {};
    }
  }

  // Main analytics method
  async getUserAnalytics(userId, timeRange = 'month') {
    if (!userId) {
      // Return demo data for unauthenticated users to showcase features
      return generateDemoAnalyticsData();
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
      let data = doc.exists ? doc.data() : {};
      // --- Prefill heatmap days ---
      // Determine date range
      let days = [];
      let today = new Date();
      let startDate;
      if (timeRange === 'week') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
      } else if (timeRange === 'month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      } else if (timeRange === 'quarter') {
        let quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
      } else if (timeRange === 'year') {
        startDate = new Date(today.getFullYear(), 0, 1);
      } else {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }
      let d = new Date(startDate);
      while (d <= today) {
        days.push(d.toISOString().slice(0, 10));
        d = new Date(d);
        d.setDate(d.getDate() + 1);
      }
      // Build a map of existing heatmap data by date
      const heatmapRaw = Array.isArray(data.heatmap) ? data.heatmap : [];
      const heatmapMap = {};
      for (const entry of heatmapRaw) {
        const dateStr = (entry.date || '').slice(0, 10);
        if (dateStr) heatmapMap[dateStr] = entry;
      }
      // Fill in all days
      const fullHeatmap = days.map(date => {
        const entry = heatmapMap[date];
        return {
          date,
          goals: entry && typeof entry.goals === 'number' ? entry.goals : 0,
          focus: entry && typeof entry.focus === 'number' ? entry.focus : 0
        };
      });
      return {
        heatmap: fullHeatmap,
        trends: Array.isArray(data.trends) ? data.trends : [],
        focusTimes: Array.isArray(data.focusTimes) ? data.focusTimes : [],
        goalDependencies: typeof data.goalDependencies === 'object' && data.goalDependencies !== null ? data.goalDependencies : {},
        habits: typeof data.habits === 'object' && data.habits !== null ? data.habits : {},
        insights: Array.isArray(data.insights) ? data.insights : [],
        permissionError: false
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        heatmap: [],
        trends: [],
        focusTimes: [],
        goalDependencies: {},
        habits: {},
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