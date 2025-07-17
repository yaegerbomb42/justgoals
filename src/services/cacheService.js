// Smart caching service with lazy loading, memory management, and intelligent prefetching

class CacheService {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.maxSize = 100; // Maximum number of cached items
    this.maxAge = 30 * 60 * 1000; // 30 minutes default TTL
    this.prefetchQueue = [];
    this.isPrefetching = false;
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      prefetches: 0
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  // Set cache item with metadata
  set(key, value, options = {}) {
    const {
      ttl = this.maxAge,
      priority = 'normal', // 'high', 'normal', 'low'
      prefetch = false,
      tags = []
    } = options;

    const expiresAt = Date.now() + ttl;
    
    // Store value and metadata
    this.cache.set(key, value);
    this.metadata.set(key, {
      expiresAt,
      priority,
      tags,
      lastAccessed: Date.now(),
      accessCount: 0,
      size: this.calculateSize(value)
    });

    // Add to prefetch queue if needed
    if (prefetch) {
      this.addToPrefetchQueue(key);
    }

    // Evict if cache is full
    this.evictIfNeeded();
  }

  // Get cache item
  get(key) {
    const metadata = this.metadata.get(key);
    
    if (!metadata) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > metadata.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access metadata
    metadata.lastAccessed = Date.now();
    metadata.accessCount++;
    
    this.stats.hits++;
    return this.cache.get(key);
  }

  // Delete cache item
  delete(key) {
    this.cache.delete(key);
    this.metadata.delete(key);
  }

  // Clear cache by tags
  clearByTags(tags) {
    const keysToDelete = [];
    
    for (const [key, metadata] of this.metadata.entries()) {
      if (tags.some(tag => metadata.tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.metadata.clear();
    this.prefetchQueue = [];
  }

  // Get cache statistics
  getStats() {
    const totalItems = this.cache.size;
    const totalSize = Array.from(this.metadata.values())
      .reduce((sum, meta) => sum + meta.size, 0);
    
    return {
      ...this.stats,
      totalItems,
      totalSize,
      hitRate: this.stats.hits / Math.max(1, this.stats.hits + this.stats.misses)
    };
  }

  // Calculate size of cached item
  calculateSize(value) {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch (error) {
      return 0;
    }
  }

  // Evict items if cache is full
  evictIfNeeded() {
    if (this.cache.size <= this.maxSize) return;

    // Sort by priority and access frequency
    const items = Array.from(this.metadata.entries())
      .map(([key, meta]) => ({
        key,
        ...meta,
        score: this.calculateEvictionScore(meta)
      }))
      .sort((a, b) => a.score - b.score);

    // Remove lowest priority items
    const itemsToRemove = this.cache.size - this.maxSize;
    for (let i = 0; i < itemsToRemove; i++) {
      this.delete(items[i].key);
      this.stats.evictions++;
    }
  }

  // Calculate eviction score (lower = more likely to be evicted)
  calculateEvictionScore(metadata) {
    const priorityScore = {
      'high': 3,
      'normal': 2,
      'low': 1
    };

    const timeSinceAccess = Date.now() - metadata.lastAccessed;
    const accessFrequency = metadata.accessCount / Math.max(1, timeSinceAccess / (1000 * 60)); // accesses per minute

    return (
      priorityScore[metadata.priority] * 1000 +
      accessFrequency * 100 +
      timeSinceAccess / (1000 * 60) // minutes since last access
    );
  }

  // Start cleanup interval
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  // Cleanup expired items
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, metadata] of this.metadata.entries()) {
      if (now > metadata.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  // Add to prefetch queue
  addToPrefetchQueue(key) {
    if (!this.prefetchQueue.includes(key)) {
      this.prefetchQueue.push(key);
      this.processPrefetchQueue();
    }
  }

  // Process prefetch queue
  async processPrefetchQueue() {
    if (this.isPrefetching || this.prefetchQueue.length === 0) return;

    this.isPrefetching = true;

    while (this.prefetchQueue.length > 0) {
      const key = this.prefetchQueue.shift();
      
      try {
        await this.prefetchItem(key);
        this.stats.prefetches++;
      } catch (error) {
        console.error('Error prefetching item:', key, error);
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isPrefetching = false;
  }

  // Prefetch item (to be implemented by specific services)
  async prefetchItem(key) {
    // This will be overridden by specific implementations
    console.log('Prefetching:', key);
  }

  // Lazy loading with cache
  async lazyLoad(key, loader, options = {}) {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Load data
    try {
      const data = await loader();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.error('Error in lazy load:', error);
      throw error;
    }
  }

  // Batch load multiple items
  async batchLoad(keys, loader, options = {}) {
    const results = {};
    const keysToLoad = [];

    // Check cache for each key
    for (const key of keys) {
      const cached = this.get(key);
      if (cached !== null) {
        results[key] = cached;
      } else {
        keysToLoad.push(key);
      }
    }

    // Load missing items
    if (keysToLoad.length > 0) {
      try {
        const loadedData = await loader(keysToLoad);
        
        for (const key of keysToLoad) {
          if (loadedData[key]) {
            this.set(key, loadedData[key], options);
            results[key] = loadedData[key];
          }
        }
      } catch (error) {
        console.error('Error in batch load:', error);
        throw error;
      }
    }

    return results;
  }

  // Intelligent prefetching based on user behavior
  async intelligentPrefetch(userId, userData) {
    if (!userId || !userData) return;

    const prefetchTasks = [];

    // Prefetch frequently accessed data
    if (userData.goals?.length > 0) {
      prefetchTasks.push(this.prefetchGoals(userId));
    }

    if (userData.milestones?.length > 0) {
      prefetchTasks.push(this.prefetchMilestones(userId));
    }

    // Prefetch analytics data if user is active
    const lastActivity = this.getLastActivity(userData);
    if (lastActivity && Date.now() - lastActivity < 24 * 60 * 60 * 1000) {
      prefetchTasks.push(this.prefetchAnalytics(userId));
    }

    // Execute prefetch tasks
    await Promise.allSettled(prefetchTasks);
  }

  // Prefetch goals data
  async prefetchGoals(userId) {
    const key = `goals_${userId}`;
    if (this.get(key)) return; // Already cached

    try {
      const firestoreService = (await import('./firestoreService')).default;
      const goals = await firestoreService.getGoals(userId);
      this.set(key, goals, { 
        ttl: 10 * 60 * 1000, // 10 minutes
        priority: 'high',
        tags: ['goals', `user_${userId}`]
      });
    } catch (error) {
      console.error('Error prefetching goals:', error);
    }
  }

  // Prefetch milestones data
  async prefetchMilestones(userId) {
    const key = `milestones_${userId}`;
    if (this.get(key)) return; // Already cached

    try {
      const firestoreService = (await import('./firestoreService')).default;
      const milestones = await firestoreService.getMilestones(userId);
      this.set(key, milestones, { 
        ttl: 5 * 60 * 1000, // 5 minutes
        priority: 'high',
        tags: ['milestones', `user_${userId}`]
      });
    } catch (error) {
      console.error('Error prefetching milestones:', error);
    }
  }

  // Prefetch analytics data
  async prefetchAnalytics(userId) {
    const key = `analytics_${userId}`;
    if (this.get(key)) return; // Already cached

    try {
      const analyticsService = (await import('./analyticsService')).default;
      const analytics = await analyticsService.getProductivityHeatmap(userId, 'week');
      this.set(key, analytics, { 
        ttl: 15 * 60 * 1000, // 15 minutes
        priority: 'normal',
        tags: ['analytics', `user_${userId}`]
      });
    } catch (error) {
      console.error('Error prefetching analytics:', error);
    }
  }

  // Get last activity timestamp
  getLastActivity(userData) {
    const activities = [];

    // Check milestones
    if (userData.milestones) {
      userData.milestones.forEach(m => {
        if (m.completedAt) activities.push(new Date(m.completedAt));
        if (m.createdAt) activities.push(new Date(m.createdAt));
      });
    }

    // Check focus sessions
    if (userData.focusHistory) {
      userData.focusHistory.forEach(s => {
        activities.push(new Date(s.startTime));
      });
    }

    // Check goals
    if (userData.goals) {
      userData.goals.forEach(g => {
        if (g.lastActivity) activities.push(new Date(g.lastActivity));
      });
    }

    return activities.length > 0 ? Math.max(...activities) : null;
  }

  // Cache warming for critical data
  async warmCache(userId) {
    console.log('Warming cache for user:', userId);
    
    const warmTasks = [
      this.prefetchGoals(userId),
      this.prefetchMilestones(userId),
      this.prefetchUserSettings(userId)
    ];

    await Promise.allSettled(warmTasks);
  }

  // Prefetch user settings
  async prefetchUserSettings(userId) {
    const key = `settings_${userId}`;
    if (this.get(key)) return;

    try {
      const firestoreService = (await import('./firestoreService')).default;
      const settings = await firestoreService.getAppSettings(userId);
      this.set(key, settings, { 
        ttl: 60 * 60 * 1000, // 1 hour
        priority: 'high',
        tags: ['settings', `user_${userId}`]
      });
    } catch (error) {
      console.error('Error prefetching user settings:', error);
    }
  }

  // Memory management
  getMemoryUsage() {
    const totalSize = Array.from(this.metadata.values())
      .reduce((sum, meta) => sum + meta.size, 0);
    
    return {
      totalSize,
      itemCount: this.cache.size,
      maxSize: this.maxSize,
      memoryPressure: totalSize > 10 * 1024 * 1024 // 10MB threshold
    };
  }

  // Optimize cache based on memory pressure
  optimizeCache() {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage.memoryPressure) {
      // Reduce cache size and TTL under memory pressure
      this.maxSize = Math.max(20, this.maxSize - 10);
      this.maxAge = Math.max(5 * 60 * 1000, this.maxAge - 5 * 60 * 1000); // 5 minutes minimum
      
      // Evict more aggressively
      this.evictIfNeeded();
      
      console.log('Cache optimized due to memory pressure');
    }
  }

  // Export cache for debugging
  exportCache() {
    return {
      cache: Object.fromEntries(this.cache),
      metadata: Object.fromEntries(this.metadata),
      stats: this.getStats(),
      memoryUsage: this.getMemoryUsage()
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService; 