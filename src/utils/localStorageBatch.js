/**
 * localStorage Batch Operations Utility
 * Optimizes performance by batching localStorage operations and providing caching
 */

class LocalStorageBatch {
  constructor() {
    this.batch = new Map();
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.pendingWrites = new Set();
    this.CACHE_TTL = 30000; // 30 seconds
    this.BATCH_DELAY = 100; // 100ms delay for batching
    this.batchTimeoutId = null;
  }

  /**
   * Set item in localStorage with batching
   */
  setItem(key, value) {
    // Add to batch for delayed write
    this.batch.set(key, value);
    this.pendingWrites.add(key);
    
    // Update cache immediately for read consistency
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
    
    // Schedule batch write
    this.scheduleBatchWrite();
  }

  /**
   * Get item from localStorage with caching
   */
  getItem(key) {
    // Check cache first
    if (this.isValidCache(key)) {
      return this.cache.get(key);
    }
    
    // If pending write, return batch value
    if (this.batch.has(key)) {
      return this.batch.get(key);
    }
    
    // Read from localStorage and cache result
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
      }
      return value;
    } catch (error) {
      console.warn(`Error reading from localStorage key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key) {
    this.batch.delete(key);
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    this.pendingWrites.delete(key);
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key ${key}:`, error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  isValidCache(key) {
    return this.cache.has(key) && 
           this.cacheExpiry.has(key) && 
           Date.now() < this.cacheExpiry.get(key);
  }

  /**
   * Schedule batch write operation
   */
  scheduleBatchWrite() {
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
    }
    
    this.batchTimeoutId = setTimeout(() => {
      this.executeBatchWrite();
    }, this.BATCH_DELAY);
  }

  /**
   * Execute batch write to localStorage
   */
  executeBatchWrite() {
    if (this.batch.size === 0) return;
    
    const operations = Array.from(this.batch.entries());
    this.batch.clear();
    this.pendingWrites.clear();
    
    // Use requestIdleCallback for better performance if available
    const performWrites = () => {
      operations.forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn(`Error writing to localStorage key ${key}:`, error);
          // If quota exceeded, try to free up space
          if (error.name === 'QuotaExceededError') {
            this.cleanupOldCache();
            // Retry once
            try {
              localStorage.setItem(key, value);
            } catch (retryError) {
              console.error(`Failed to write localStorage key ${key} after cleanup:`, retryError);
            }
          }
        }
      });
    };
    
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(performWrites, { timeout: 1000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(performWrites, 0);
    }
  }

  /**
   * Force immediate write of all pending operations
   */
  flush() {
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
    this.executeBatchWrite();
  }

  /**
   * Clean up old cache entries to free memory
   */
  cleanupOldCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    this.cacheExpiry.forEach((expiry, key) => {
      if (now >= expiry) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    });
    
    // If still too many entries, remove oldest 50%
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cacheExpiry.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, Math.floor(this.cache.size / 2));
      
      entries.forEach(([key]) => {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      });
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.batch.clear();
    this.pendingWrites.clear();
    
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingWrites: this.pendingWrites.size,
      batchSize: this.batch.size
    };
  }
}

// Create singleton instance
const localStorageBatch = new LocalStorageBatch();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    localStorageBatch.flush();
  });
  
  // Periodic cleanup
  setInterval(() => {
    localStorageBatch.cleanupOldCache();
  }, 60000); // Every minute
}

export default localStorageBatch;

/**
 * Drop-in replacement functions for localStorage
 */
export const setLocalStorageItem = (key, value) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  localStorageBatch.setItem(key, stringValue);
};

export const getLocalStorageItem = (key, defaultValue = null) => {
  const value = localStorageBatch.getItem(key);
  if (value === null) return defaultValue;
  
  try {
    return JSON.parse(value);
  } catch {
    return value; // Return as string if not JSON
  }
};

export const removeLocalStorageItem = (key) => {
  localStorageBatch.removeItem(key);
};

export const flushLocalStorage = () => {
  localStorageBatch.flush();
};
