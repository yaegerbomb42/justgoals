/**
 * Context Aggregation Service for Drift AI
 * Provides comprehensive user context for RAG-like functionality
 */
import firestoreService from './firestoreService';

class ContextAggregationService {
  constructor() {
    this.contextCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive user context for AI interactions
   */
  async getComprehensiveContext(userId, currentGoals = [], settings = {}) {
    const cacheKey = `context_${userId}`;
    const cached = this.contextCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { ...cached.context, currentGoals, settings };
    }

    try {
      const context = await this.aggregateUserData(userId, currentGoals, settings);
      
      this.contextCache.set(cacheKey, {
        context,
        timestamp: Date.now()
      });
      
      return context;
    } catch (error) {
      console.error('Error aggregating user context:', error);
      return this.getFallbackContext(userId, currentGoals, settings);
    }
  }

  async aggregateUserData(userId, currentGoals, settings) {
    const [
      goals,
      habits,
      journalEntries,
      milestones,
      driftMemory,
      recentActivity
    ] = await Promise.allSettled([
      this.getGoalsData(userId),
      this.getHabitsData(userId),
      this.getJournalData(userId),
      this.getMilestonesData(userId),
      this.getDriftMemoryData(userId),
      this.getRecentActivityData(userId)
    ]);

    return {
      userId,
      timestamp: Date.now(),
      
      // Current state
      currentGoals: currentGoals || [],
      userSettings: settings || {},
      
      // Historical data
      allGoals: this.getResultValue(goals, []),
      habits: this.getResultValue(habits, []),
      journalEntries: this.getResultValue(journalEntries, []),
      milestones: this.getResultValue(milestones, []),
      conversationHistory: this.getResultValue(driftMemory, { messages: [], conversationHistory: [] }),
      recentActivity: this.getResultValue(recentActivity, {}),
      
      // Derived insights
      progressMetrics: this.calculateProgressMetrics(currentGoals),
      userPatterns: this.identifyUserPatterns(
        this.getResultValue(goals, []),
        this.getResultValue(habits, []),
        this.getResultValue(journalEntries, [])
      ),
      
      // Contextual metadata
      contextQuality: 'comprehensive',
      lastUpdated: new Date().toISOString()
    };
  }

  async getGoalsData(userId) {
    try {
      return await firestoreService.getGoals(userId);
    } catch (error) {
      console.warn('Could not fetch goals data:', error);
      return [];
    }
  }

  async getHabitsData(userId) {
    try {
      const habits = localStorage.getItem('habits');
      return habits ? JSON.parse(habits) : [];
    } catch (error) {
      console.warn('Could not fetch habits data:', error);
      return [];
    }
  }

  async getJournalData(userId) {
    try {
      const entries = localStorage.getItem('journal-entries');
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      console.warn('Could not fetch journal data:', error);
      return [];
    }
  }

  async getMilestonesData(userId) {
    try {
      const milestones = localStorage.getItem('milestones');
      return milestones ? JSON.parse(milestones) : [];
    } catch (error) {
      console.warn('Could not fetch milestones data:', error);
      return [];
    }
  }

  async getDriftMemoryData(userId) {
    try {
      return await firestoreService.getDriftMemory(userId);
    } catch (error) {
      console.warn('Could not fetch drift memory:', error);
      return { messages: [], conversationHistory: [] };
    }
  }

  async getRecentActivityData(userId) {
    try {
      const activities = {};
      
      // Get recent achievements
      const achievements = localStorage.getItem('achievements');
      if (achievements) {
        activities.achievements = JSON.parse(achievements).slice(-10);
      }
      
      // Get recent completions
      const completions = localStorage.getItem('recent-completions');
      if (completions) {
        activities.completions = JSON.parse(completions).slice(-10);
      }
      
      // Get session data
      const sessions = localStorage.getItem('focus-sessions');
      if (sessions) {
        activities.focusSessions = JSON.parse(sessions).slice(-5);
      }
      
      return activities;
    } catch (error) {
      console.warn('Could not fetch recent activity:', error);
      return {};
    }
  }

  getResultValue(result, fallback) {
    return result.status === 'fulfilled' ? result.value : fallback;
  }

  calculateProgressMetrics(goals) {
    if (!goals || goals.length === 0) {
      return {
        totalGoals: 0,
        completedGoals: 0,
        averageProgress: 0,
        completionRate: 0
      };
    }

    const completed = goals.filter(g => g.completed).length;
    const totalProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
    
    return {
      totalGoals: goals.length,
      completedGoals: completed,
      averageProgress: totalProgress / goals.length,
      completionRate: completed / goals.length
    };
  }

  identifyUserPatterns(goals, habits, journalEntries) {
    const patterns = {
      mostActiveCategories: [],
      preferredGoalTypes: [],
      streakPatterns: [],
      moodPatterns: []
    };

    try {
      // Analyze goal categories
      if (goals && goals.length > 0) {
        const categories = goals.reduce((acc, goal) => {
          const cat = goal.category || 'uncategorized';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});
        
        patterns.mostActiveCategories = Object.entries(categories)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([category, count]) => ({ category, count }));
      }

      // Analyze habits for streaks
      if (habits && habits.length > 0) {
        patterns.streakPatterns = habits
          .filter(h => h.streak > 0)
          .sort((a, b) => b.streak - a.streak)
          .slice(0, 3)
          .map(h => ({ title: h.title, streak: h.streak }));
      }

      // Analyze journal entries for mood patterns
      if (journalEntries && journalEntries.length > 0) {
        const recentEntries = journalEntries.slice(-10);
        const moods = recentEntries.reduce((acc, entry) => {
          if (entry.mood) {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
          }
          return acc;
        }, {});
        
        patterns.moodPatterns = Object.entries(moods)
          .sort(([,a], [,b]) => b - a)
          .map(([mood, count]) => ({ mood, count }));
      }
    } catch (error) {
      console.warn('Error identifying user patterns:', error);
    }

    return patterns;
  }

  getFallbackContext(userId, currentGoals, settings) {
    return {
      userId,
      timestamp: Date.now(),
      currentGoals: currentGoals || [],
      userSettings: settings || {},
      contextQuality: 'minimal',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clear context cache for a user
   */
  clearCache(userId) {
    if (userId) {
      this.contextCache.delete(`context_${userId}`);
    } else {
      this.contextCache.clear();
    }
  }

  /**
   * Get searchable context for RAG-like queries
   */
  async getSearchableContext(userId, query) {
    const context = await this.getComprehensiveContext(userId);
    
    // Create searchable text from user data
    const searchableContent = [
      // Goals content
      ...(context.allGoals || []).map(g => `Goal: ${g.title} - ${g.description || ''}`),
      
      // Journal entries
      ...(context.journalEntries || []).map(j => `Journal: ${j.title || ''} - ${j.content || ''}`),
      
      // Habits
      ...(context.habits || []).map(h => `Habit: ${h.title} - ${h.description || ''}`),
      
      // Recent conversations
      ...(context.conversationHistory?.conversationHistory || [])
        .filter(msg => msg.role === 'user')
        .map(msg => `Previous question: ${msg.content}`)
    ].join('\n');

    return {
      context,
      searchableContent,
      relevantData: this.extractRelevantData(context, query)
    };
  }

  extractRelevantData(context, query) {
    const queryLower = query.toLowerCase();
    const relevant = {
      goals: [],
      habits: [],
      journal: [],
      patterns: []
    };

    // Find relevant goals
    if (context.allGoals) {
      relevant.goals = context.allGoals.filter(g =>
        (g.title && g.title.toLowerCase().includes(queryLower)) ||
        (g.description && g.description.toLowerCase().includes(queryLower)) ||
        (g.category && g.category.toLowerCase().includes(queryLower))
      );
    }

    // Find relevant habits
    if (context.habits) {
      relevant.habits = context.habits.filter(h =>
        (h.title && h.title.toLowerCase().includes(queryLower)) ||
        (h.description && h.description.toLowerCase().includes(queryLower))
      );
    }

    // Find relevant journal entries
    if (context.journalEntries) {
      relevant.journal = context.journalEntries.filter(j =>
        (j.title && j.title.toLowerCase().includes(queryLower)) ||
        (j.content && j.content.toLowerCase().includes(queryLower)) ||
        (j.tags && j.tags.some(tag => tag.toLowerCase().includes(queryLower)))
      );
    }

    return relevant;
  }
}

// Create singleton instance
const contextAggregationService = new ContextAggregationService();

export default contextAggregationService;