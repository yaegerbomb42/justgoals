// Free ntfy.sh Notification Service
// Sends push notifications to ntfy.sh topics (iOS/Android/browser)

class NtfyNotificationService {
  constructor() {
    this.isEnabled = false;
    this.topic = '';
  }

  // Initialize with topic only
  init(topic) {
    this.topic = topic;
    this.isEnabled = !!topic;
  }

  // Send notification via ntfy.sh
  async sendNotification(message, options = {}) {
    if (!this.isEnabled || !this.topic) {
      console.warn('ntfy.sh notifications not configured');
      return false;
    }
    const url = `https://ntfy.sh/${encodeURIComponent(this.topic)}`;
    const headers = {};
    if (options.title) headers['Title'] = options.title;
    if (options.priority) headers['Priority'] = String(options.priority);
    if (options.tags) headers['Tags'] = options.tags.join(',');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: message,
      });
      if (response.ok) {
        console.log('ntfy.sh notification sent successfully');
        return true;
      } else {
        console.error('ntfy.sh notification failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('ntfy.sh notification error:', error);
      return false;
    }
  }

  // Send a test notification
  async sendTestNotification() {
    return this.sendNotification('Test notification from JustGoals!', {
      title: 'JustGoals Test',
      priority: 3,
      tags: ['bell', 'tada']
    });
  }
}

const ntfyNotificationService = new NtfyNotificationService();
export default ntfyNotificationService; 