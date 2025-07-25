// Firebase Cloud Function for Scheduled Notifications
// Deploy this to Firebase Functions to handle background notifications

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// Helper function to send ntfy notification
async function sendNtfyNotification(topic, title, message, options = {}) {
  if (!topic) return false;
  
  try {
    const url = `https://ntfy.sh/${encodeURIComponent(topic)}`;
    const headers = {
      'Content-Type': 'text/plain',
      'Title': title
    };
    
    if (options.priority) headers['Priority'] = String(options.priority);
    if (options.tags) headers['Tags'] = options.tags.join(',');
    
    const response = await axios.post(url, message, { headers });
    
    console.log(`ntfy notification sent to ${topic}: ${response.status === 200}`);
    return response.status === 200;
  } catch (error) {
    console.error('ntfy notification error:', error);
    return false;
  }
}

// Check for due notifications every hour
exports.checkScheduledNotifications = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting scheduled notification check...');
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    try {
      // Get all users with notification settings
      const settingsSnapshot = await db.collection('userNotificationSettings').get();
      
      for (const settingDoc of settingsSnapshot.docs) {
        const userId = settingDoc.id;
        const settings = settingDoc.data();
        
        if (!settings.enabled || !settings.ntfy?.topic || !settings.ntfy?.enabled) {
          continue;
        }
        
        const ntfyTopic = settings.ntfy.topic;
        const schedules = settings.schedules || {};
        
        // Check morning motivation (default 8:00 AM)
        if (settings.morningMotivation?.enabled !== false) {
          const morningTime = schedules.morningMotivation || '08:00';
          const [morningHour, morningMin] = morningTime.split(':').map(Number);
          
          if (currentHour === morningHour && currentMinutes >= morningMin && currentMinutes < morningMin + 60) {
            await sendNtfyNotification(
              ntfyTopic,
              '🌅 Good Morning!',
              'Start your day with purpose! What will you accomplish today?',
              { priority: 3, tags: ['sunny'] }
            );
          }
        }
        
        // Check evening reflection (default 8:00 PM)
        if (settings.eveningReflection?.enabled !== false) {
          const eveningTime = schedules.eveningReflection || '20:00';
          const [eveningHour, eveningMin] = eveningTime.split(':').map(Number);
          
          if (currentHour === eveningHour && currentMinutes >= eveningMin && currentMinutes < eveningMin + 60) {
            await sendNtfyNotification(
              ntfyTopic,
              '🌙 Evening Reflection',
              'How did today go? Take a moment to reflect on your progress.',
              { priority: 3, tags: ['crescent_moon'] }
            );
          }
        }
        
        // Check focus reminders (default 2:00 PM)
        if (settings.focusReminders?.enabled !== false) {
          const focusTime = schedules.focusReminders || '14:00';
          const [focusHour, focusMin] = focusTime.split(':').map(Number);
          
          if (currentHour === focusHour && currentMinutes >= focusMin && currentMinutes < focusMin + 60) {
            await sendNtfyNotification(
              ntfyTopic,
              '🎯 Focus Time',
              'Mid-day check: Stay focused on your goals! You\'ve got this.',
              { priority: 4, tags: ['dart'] }
            );
          }
        }
        
        // Check streak protection (default 9:00 PM)
        if (settings.streakProtection?.enabled !== false) {
          const streakTime = schedules.streakProtection || '21:00';
          const [streakHour, streakMin] = streakTime.split(':').map(Number);
          
          if (currentHour === streakHour && currentMinutes >= streakMin && currentMinutes < streakMin + 60) {
            await sendNtfyNotification(
              ntfyTopic,
              '🔥 Streak Protection',
              'Don\'t break the chain! Make sure you\'ve logged progress on your goals today.',
              { priority: 5, tags: ['fire'] }
            );
          }
        }
        
        // Check goal deadlines
        if (settings.deadlineAlerts?.enabled !== false) {
          try {
            const goalsSnapshot = await db.collection('users').doc(userId).collection('goals').get();
            
            for (const goalDoc of goalsSnapshot.docs) {
              const goal = goalDoc.data();
              
              if (!goal.deadline || goal.completed) continue;
              
              const deadline = new Date(goal.deadline + 'T00:00:00');
              const timeDiff = deadline.getTime() - now.getTime();
              const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
              
              // Notify for deadlines in 7, 3, 1 days, or overdue
              if ([7, 3, 1].includes(daysUntil)) {
                await sendNtfyNotification(
                  ntfyTopic,
                  `⏰ Goal Deadline Alert`,
                  `"${goal.title}" is due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}!`,
                  { priority: 4, tags: ['warning'] }
                );
              } else if (daysUntil === 0) {
                await sendNtfyNotification(
                  ntfyTopic,
                  `🚨 Goal Due Today!`,
                  `"${goal.title}" is due today! Time to finish strong.`,
                  { priority: 5, tags: ['rotating_light'] }
                );
              } else if (daysUntil < 0 && daysUntil >= -3) {
                await sendNtfyNotification(
                  ntfyTopic,
                  `📅 Overdue Goal`,
                  `"${goal.title}" was due ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago. You can still finish it!`,
                  { priority: 4, tags: ['calendar'] }
                );
              }
            }
          } catch (error) {
            console.error(`Error checking goals for user ${userId}:`, error);
          }
        }
        
        // Small delay between users to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('Scheduled notification check completed');
      return null;
    } catch (error) {
      console.error('Error in scheduled notification check:', error);
      throw new functions.https.HttpsError('internal', 'Notification check failed');
    }
  });

// Process test notifications from the notification queue
exports.processTestNotifications = functions.firestore
  .document('notificationQueue/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    if (notification.type === 'test') {
      const success = await sendNtfyNotification(
        notification.topic,
        notification.title,
        notification.message,
        notification.options || {}
      );
      
      // Update the document with the result
      await snap.ref.update({
        sent: success,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: success ? 'delivered' : 'failed'
      });
      
      console.log(`Test notification ${success ? 'sent' : 'failed'} to ${notification.topic}`);
    }
    
    return null;
  });

// Health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});