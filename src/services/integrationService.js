// Integration service that coordinates all features and services

class IntegrationService {
  constructor() {
    this.services = {};
    this.isInitialized = false;
    this.userId = null;
    this.initializationPromises = new Map();
  }

  // Initialize all services
  async initialize(userId) {
    if (this.isInitialized && this.userId === userId) {
      return true;
    }

    this.userId = userId;
    
    try {
      console.log('Initializing integration service for user:', userId);

      // Initialize all services in parallel
      const initPromises = [
        this.initializeCacheService(),
        this.initializeSecurityService(),
        this.initializeNotificationService(),
        this.initializeGamificationService(),
        this.initializeCalendarSyncService(),
        this.initializeAnalyticsService()
      ];

      await Promise.allSettled(initPromises);
      
      // Warm cache with user data
      await this.warmCache();
      
      // Start background services
      this.startBackgroundServices();
      
      this.isInitialized = true;
      console.log('Integration service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Error initializing integration service:', error);
      return false;
    }
  }

  // Initialize cache service
  async initializeCacheService() {
    try {
      const cacheService = (await import('./cacheService')).default;
      this.services.cache = cacheService;
      
      // Warm cache with user data
      const userData = await this.getUserData();
      if (userData) {
        await cacheService.intelligentPrefetch(this.userId, userData);
      }
      
      console.log('Cache service initialized');
    } catch (error) {
      console.error('Error initializing cache service:', error);
    }
  }

  // Initialize security service
  async initializeSecurityService() {
    try {
      const securityService = (await import('./securityService')).default;
      this.services.security = securityService;
      console.log('Security service initialized');
    } catch (error) {
      console.error('Error initializing security service:', error);
    }
  }

  // Initialize notification service
  async initializeNotificationService() {
    try {
      const notificationService = (await import('./notificationService')).default;
      this.services.notification = notificationService;
      
      // Initialize notifications
      await notificationService.initialize(this.userId);
      
      // Schedule smart reminders
      await notificationService.scheduleSmartReminders(this.userId);
      
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Initialize gamification service
  async initializeGamificationService() {
    try {
      const gamificationService = (await import('./gamificationService')).default;
      this.services.gamification = gamificationService;
      console.log('Gamification service initialized');
    } catch (error) {
      console.error('Error initializing gamification service:', error);
    }
  }

  // Initialize calendar sync service
  async initializeCalendarSyncService() {
    try {
      const calendarSyncService = (await import('./calendarSyncService')).default;
      this.services.calendarSync = calendarSyncService;
      
      // Initialize calendar sync
      await calendarSyncService.initialize(this.userId);
      
      console.log('Calendar sync service initialized');
    } catch (error) {
      console.error('Error initializing calendar sync service:', error);
    }
  }

  // Initialize analytics service
  async initializeAnalyticsService() {
    try {
      const analyticsService = (await import('./analyticsService')).default;
      this.services.analytics = analyticsService;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Error initializing analytics service:', error);
    }
  }

  // Warm cache with user data
  async warmCache() {
    try {
      if (this.services.cache) {
        await this.services.cache.warmCache(this.userId);
      }
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  }

  // Start background services
  startBackgroundServices() {
    // Start periodic cache optimization
    setInterval(() => {
      if (this.services.cache) {
        this.services.cache.optimizeCache();
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Start periodic security monitoring
    setInterval(() => {
      if (this.services.security) {
        const stats = this.services.security.getSecurityStats();
        if (stats.totalSuspiciousActivities > 10) {
          console.warn('High suspicious activity detected:', stats);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Start periodic gamification checks
    setInterval(async () => {
      if (this.services.gamification) {
        await this.checkAchievements();
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  // Get user data with caching
  async getUserData() {
    try {
      if (this.services.cache) {
        return await this.services.cache.lazyLoad(
          `user_data_${this.userId}`,
          async () => {
            const firestoreService = (await import('./firestoreService')).default;
            const [goals, milestones, focusHistory, journalEntries] = await Promise.all([
              firestoreService.getGoals(this.userId),
              firestoreService.getMilestones(this.userId),
              firestoreService.getFocusSessionHistory(this.userId),
              firestoreService.getJournalEntries(this.userId)
            ]);
            
            return { goals, milestones, focusHistory, journalEntries };
          },
          { ttl: 5 * 60 * 1000, priority: 'high' }
        );
      }
      
      // Fallback without cache
      const firestoreService = (await import('./firestoreService')).default;
      const [goals, milestones, focusHistory, journalEntries] = await Promise.all([
        firestoreService.getGoals(this.userId),
        firestoreService.getMilestones(this.userId),
        firestoreService.getFocusSessionHistory(this.userId),
        firestoreService.getJournalEntries(this.userId)
      ]);
      
      return { goals, milestones, focusHistory, journalEntries };
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Create goal with validation and notifications
  async createGoal(goalData) {
    try {
      // Validate input
      if (this.services.security) {
        const validation = this.services.security.validateGoalData(goalData);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        goalData = validation.sanitized;
      }

      // Check rate limit
      if (this.services.security) {
        const rateLimit = this.services.security.checkRateLimit(this.userId, 'goals');
        if (!rateLimit.allowed) {
          throw new Error('Rate limit exceeded for goal creation');
        }
      }

      // Save goal
      const firestoreService = (await import('./firestoreService')).default;
      const savedGoal = await firestoreService.saveGoal(this.userId, goalData);

      // Clear cache
      if (this.services.cache) {
        this.services.cache.clearByTags(['goals', `user_${this.userId}`]);
      }

      // Send notification
      if (this.services.notification) {
        await this.services.notification.sendNotification(
          this.userId,
          'goal_created',
          { goalTitle: savedGoal.title }
        );
      }

      // Check achievements
      await this.checkAchievements();

      return savedGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  // Complete milestone with gamification
  async completeMilestone(milestoneId) {
    try {
      // Get milestone data
      const userData = await this.getUserData();
      const milestone = userData.milestones.find(m => m.id === milestoneId);
      
      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // Update milestone
      const firestoreService = (await import('./firestoreService')).default;
      const updatedMilestone = await firestoreService.updateMilestone(
        this.userId,
        milestoneId,
        { completed: true, completedAt: new Date().toISOString() }
      );

      // Clear cache
      if (this.services.cache) {
        this.services.cache.clearByTags(['milestones', `user_${this.userId}`]);
      }

      // Send notification
      if (this.services.notification) {
        await this.services.notification.sendNotification(
          this.userId,
          'milestone_completed',
          { milestoneTitle: milestone.title }
        );
      }

      // Check achievements
      await this.checkAchievements();

      // Sync to calendar if enabled
      if (this.services.calendarSync) {
        const status = this.services.calendarSync.getSyncStatus();
        if (status.enabled) {
          await this.services.calendarSync.manualSync(this.userId);
        }
      }

      return updatedMilestone;
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  }

  // Start focus session with analytics
  async startFocusSession(sessionData) {
    try {
      // Validate input
      if (this.services.security) {
        const validation = this.services.security.validateInput(
          sessionData.notes || '',
          null,
          { maxLength: 1000 }
        );
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.error}`);
        }
        sessionData.notes = validation.sanitized;
      }

      // Check rate limit
      if (this.services.security) {
        const rateLimit = this.services.security.checkRateLimit(this.userId, 'focus');
        if (!rateLimit.allowed) {
          throw new Error('Rate limit exceeded for focus sessions');
        }
      }

      // Save focus session
      const firestoreService = (await import('./firestoreService')).default;
      const savedSession = await firestoreService.saveFocusSession(this.userId, {
        ...sessionData,
        startTime: new Date().toISOString(),
        isActive: true
      });

      // Clear cache
      if (this.services.cache) {
        this.services.cache.clearByTags(['focus_sessions', `user_${this.userId}`]);
      }

      // Send notification
      if (this.services.notification) {
        await this.services.notification.sendNotification(
          this.userId,
          'focus_session_started',
          { duration: sessionData.duration }
        );
      }

      return savedSession;
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw error;
    }
  }

  // End focus session with analytics
  async endFocusSession(sessionId, endData = {}) {
    try {
      // Get session data
      const userData = await this.getUserData();
      const session = userData.focusHistory.find(s => s.id === sessionId);
      
      if (!session) {
        throw new Error('Focus session not found');
      }

      // Calculate elapsed time
      const endTime = new Date();
      const startTime = new Date(session.startTime);
      const elapsed = endTime.getTime() - startTime.getTime();

      // Update session
      const firestoreService = (await import('./firestoreService')).default;
      const updatedSession = await firestoreService.updateFocusSession(
        this.userId,
        sessionId,
        {
          ...endData,
          endTime: endTime.toISOString(),
          elapsed,
          isActive: false
        }
      );

      // Clear cache
      if (this.services.cache) {
        this.services.cache.clearByTags(['focus_sessions', `user_${this.userId}`]);
      }

      // Send notification
      if (this.services.notification) {
        const hours = Math.round((elapsed / (1000 * 60 * 60)) * 10) / 10;
        await this.services.notification.sendNotification(
          this.userId,
          'focus_session_completed',
          { hours, goalTitle: session.goal?.title }
        );
      }

      // Check achievements
      await this.checkAchievements();

      // Update analytics
      if (this.services.analytics) {
        // Analytics will be updated on next load
        this.services.cache.clearByTags(['analytics', `user_${this.userId}`]);
      }

      return updatedSession;
    } catch (error) {
      console.error('Error ending focus session:', error);
      throw error;
    }
  }

  // Check achievements
  async checkAchievements() {
    try {
      if (!this.services.gamification) return [];

      const newAchievements = await this.services.gamification.checkAchievements(this.userId);
      
      if (newAchievements.length > 0) {
        // Save achievements
        const firestoreService = (await import('./firestoreService')).default;
        for (const achievement of newAchievements) {
          await firestoreService.saveAchievement(this.userId, achievement);
        }

        // Send notifications
        if (this.services.notification) {
          for (const achievement of newAchievements) {
            await this.services.notification.sendNotification(
              this.userId,
              'achievement',
              { achievementName: achievement.name }
            );
          }
        }

        // Clear cache
        if (this.services.cache) {
          this.services.cache.clearByTags(['achievements', `user_${this.userId}`]);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Get analytics with caching
  async getAnalytics(timeRange = 'week') {
    try {
      if (this.services.cache) {
        return await this.services.cache.lazyLoad(
          `analytics_${this.userId}_${timeRange}`,
          async () => {
            if (!this.services.analytics) {
              throw new Error('Analytics service not available');
            }
            
            const [heatmap, trends, focusTimes, goalDependencies, habits, insights] = await Promise.all([
              this.services.analytics.getProductivityHeatmap(this.userId, timeRange),
              this.services.analytics.getProductivityTrends(this.userId, timeRange),
              this.services.analytics.getOptimalFocusTimes(this.userId),
              this.services.analytics.getGoalDependencyAnalysis(this.userId),
              this.services.analytics.getHabitTrackingData(this.userId),
              this.services.analytics.getPredictiveInsights(this.userId)
            ]);
            
            return { heatmap, trends, focusTimes, goalDependencies, habits, insights };
          },
          { ttl: 15 * 60 * 1000, priority: 'normal' }
        );
      }
      
      // Fallback without cache
      if (!this.services.analytics) {
        throw new Error('Analytics service not available');
      }
      
      const [heatmap, trends, focusTimes, goalDependencies, habits, insights] = await Promise.all([
        this.services.analytics.getProductivityHeatmap(this.userId, timeRange),
        this.services.analytics.getProductivityTrends(this.userId, timeRange),
        this.services.analytics.getOptimalFocusTimes(this.userId),
        this.services.analytics.getGoalDependencyAnalysis(this.userId),
        this.services.analytics.getHabitTrackingData(this.userId),
        this.services.analytics.getPredictiveInsights(this.userId)
      ]);
      
      return { heatmap, trends, focusTimes, goalDependencies, habits, insights };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {};
    }
  }

  // Get gamification data
  async getGamificationData() {
    try {
      if (!this.services.gamification) return null;

      const userData = await this.getUserData();
      if (!userData) return null;

      const userLevel = this.services.gamification.calculateUserLevel(userData);
      const activeChallenges = this.services.gamification.getActiveChallenges(this.userId);
      
      return { userLevel, activeChallenges };
    } catch (error) {
      console.error('Error getting gamification data:', error);
      return null;
    }
  }

  // Get service status
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      userId: this.userId,
      services: {
        cache: !!this.services.cache,
        security: !!this.services.security,
        notification: !!this.services.notification,
        gamification: !!this.services.gamification,
        calendarSync: !!this.services.calendarSync,
        analytics: !!this.services.analytics
      }
    };
  }

  // Cleanup on logout
  cleanup() {
    // Stop background services
    if (this.services.notification) {
      this.services.notification.clearScheduledNotifications();
    }
    
    if (this.services.calendarSync) {
      this.services.calendarSync.stopAutoSync();
    }
    
    // Clear cache
    if (this.services.cache) {
      this.services.cache.clear();
    }
    
    // Reset state
    this.isInitialized = false;
    this.userId = null;
    this.services = {};
    
    console.log('Integration service cleaned up');
  }
}

// Create singleton instance
const integrationService = new IntegrationService();

export default integrationService; 