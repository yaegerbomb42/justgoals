// Offline detection and fallback service
class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = [];
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyCallbacks('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyCallbacks('offline');
    });
  }

  // Register callbacks for online/offline state changes
  onStatusChange(callback) {
    this.callbacks.push(callback);
  }

  // Remove callback
  removeStatusListener(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  // Notify all registered callbacks
  notifyCallbacks(status) {
    this.callbacks.forEach(callback => {
      try {
        callback(status, this.isOnline);
      } catch (error) {
        console.error('Error in offline status callback:', error);
      }
    });
  }

  // Get localStorage data with fallback
  getLocalData(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return fallback;
    }
  }

  // Save to localStorage with error handling
  setLocalData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      return false;
    }
  }

  // Check if we can make network requests
  canMakeNetworkRequests() {
    return this.isOnline;
  }

  // Queue actions for when we come back online
  queueForOnline(action, data) {
    const queueKey = 'offline_queue';
    const queue = this.getLocalData(queueKey, []);
    queue.push({
      action,
      data,
      timestamp: new Date().toISOString()
    });
    this.setLocalData(queueKey, queue);
  }

  // Process queued actions when coming back online
  processOfflineQueue() {
    if (!this.isOnline) return;

    const queueKey = 'offline_queue';
    const queue = this.getLocalData(queueKey, []);
    
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline actions...`);
    
    // Process each queued action
    queue.forEach(async (item, index) => {
      try {
        // This would need to be implemented based on action types
        await this.processQueuedAction(item);
        console.log(`Processed queued action ${index + 1}/${queue.length}`);
      } catch (error) {
        console.error(`Failed to process queued action:`, error);
      }
    });

    // Clear the queue
    this.setLocalData(queueKey, []);
  }

  // Process individual queued actions (to be implemented based on needs)
  async processQueuedAction(item) {
    // This would dispatch to appropriate services based on action type
    console.log('Processing queued action:', item);
  }

  // Get current status info
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.getLocalData('last_sync_time'),
      queuedActions: this.getLocalData('offline_queue', []).length
    };
  }
}

const offlineService = new OfflineService();
export default offlineService;
