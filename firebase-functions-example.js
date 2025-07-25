// Firebase Cloud Function for Scheduled Notifications
// Deploy this to Firebase Functions to handle background notifications

const functions = require('firebase-functions');
const admin = require('firebase-admin');

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
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: message
    });
    
    console.log(`ntfy notification sent to ${topic}: ${response.ok}`);
    return response.ok;
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
    
    try {
      // Get all users with notification settings
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const ntfyTopic = userData.notifications?.ntfyTopic;
        
        if (!ntfyTopic) continue; // Skip users without ntfy setup
        
        // Check morning motivation
        await checkMorningMotivation(userId, userData, now);
        
        // Check evening reflection
        await checkEveningReflection(userId, userData, now);
        
        // Check goal deadlines
        await checkGoalDeadlines(userId, ntfyTopic, now);
        
        // Check streak reminders
        await checkStreakReminders(userId, ntfyTopic, now);
      }
      
      console.log('Scheduled notification check completed');
    } catch (error) {
      console.error('Error in scheduled notification check:', error);
    }
    
    return null;
  });

// Check morning motivation notifications
async function checkMorningMotivation(userId, userData, now) {
  const settings = userData.notifications?.morningMotivation;
  if (!settings?.enabled) return;
  
  const hour = now.getHours();
  const targetHour = parseInt(settings.time?.split(':')[0] || '8');
  
  // Send if it's the right hour and we haven't sent today
  if (hour === targetHour) {
    const today = now.toISOString().split('T')[0];
    const lastSent = userData.notifications?.lastMorningMotivation;
    
    if (lastSent !== today) {
      const messages = [
        "Good morning! Ready to crush your goals today? 🌅",
        "Rise and shine! Your goals are waiting for you! ⭐",
        "New day, new opportunities! Let's make progress! 🚀",
        "Morning motivation: You're capable of amazing things! 💪"
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      await sendNtfyNotification(
        userData.notifications.ntfyTopic,
        "JustGoals - Morning Motivation",
        randomMessage,
        { priority: 3, tags: ['sunrise', 'muscle'] }
      );
      
      // Update last sent timestamp
      await db.collection('users').doc(userId).update({
        'notifications.lastMorningMotivation': today
      });
    }
  }
}

// Check evening reflection notifications
async function checkEveningReflection(userId, userData, now) {
  const settings = userData.notifications?.eveningReflection;
  if (!settings?.enabled) return;
  
  const hour = now.getHours();
  const targetHour = parseInt(settings.time?.split(':')[0] || '20');
  
  if (hour === targetHour) {
    const today = now.toISOString().split('T')[0];
    const lastSent = userData.notifications?.lastEveningReflection;
    
    if (lastSent !== today) {
      const message = "Time to reflect on your day! How did you do with your goals? 🌙";
      
      await sendNtfyNotification(
        userData.notifications.ntfyTopic,
        "JustGoals - Evening Reflection",
        message,
        { priority: 2, tags: ['moon', 'thought_balloon'] }
      );
      
      await db.collection('users').doc(userId).update({
        'notifications.lastEveningReflection': today
      });
    }
  }
}

// Check goal deadline notifications
async function checkGoalDeadlines(userId, ntfyTopic, now) {
  const goalsSnapshot = await db.collection('goals')
    .where('userId', '==', userId)
    .where('completed', '==', false)
    .get();
  
  for (const goalDoc of goalsSnapshot.docs) {
    const goal = goalDoc.data();
    if (!goal.deadline || !goal.notifications?.deadlineAlerts) continue;
    
    const deadlineDate = new Date(goal.deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysUntilDeadline = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Check if we should send a deadline alert
    const alertDays = [7, 3, 1]; // Alert 7, 3, and 1 days before
    const lastAlert = goal.notifications?.lastDeadlineAlert;
    
    for (const alertDay of alertDays) {
      if (daysUntilDeadline === alertDay && lastAlert !== alertDay) {
        let title, message;
        
        if (alertDay === 1) {
          title = "🚨 Deadline Tomorrow!";
          message = `"${goal.title}" is due tomorrow! Time to push hard!`;
        } else {
          title = "📅 Deadline Approaching";
          message = `"${goal.title}" is due in ${alertDay} days. Keep pushing!`;
        }
        
        await sendNtfyNotification(ntfyTopic, title, message, {
          priority: alertDay === 1 ? 5 : 4,
          tags: ['calendar', 'warning']
        });
        
        // Update last alert sent
        await db.collection('goals').doc(goalDoc.id).update({
          'notifications.lastDeadlineAlert': alertDay
        });
        
        break; // Only send one alert per check
      }
    }
  }
}

// Check streak reminder notifications
async function checkStreakReminders(userId, ntfyTopic, now) {
  // This would check for habit streaks or goal streaks that need attention
  // Implementation depends on your streak tracking system
  console.log(`Checking streak reminders for user ${userId}`);
}

// Process test notifications queue
exports.processTestNotifications = functions.firestore
  .document('notificationQueue/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    if (data.type === 'test' && !data.processed) {
      // Get user's ntfy topic
      const userDoc = await db.collection('users').doc(data.userId).get();
      const ntfyTopic = userDoc.data()?.notifications?.ntfyTopic;
      
      if (ntfyTopic) {
        await sendNtfyNotification(
          ntfyTopic,
          "JustGoals Backend Test",
          data.message,
          { priority: 3, tags: ['test_tube', 'checkmark'] }
        );
      }
      
      // Mark as processed
      await snap.ref.update({ processed: true });
    }
    
    return null;
  });

// Clean up old processed notifications
exports.cleanupNotificationQueue = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const oldDocs = await db.collection('notificationQueue')
      .where('processed', '==', true)
      .where('timestamp', '<', cutoffTime.toISOString())
      .get();
    
    const batch = db.batch();
    oldDocs.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    console.log(`Cleaned up ${oldDocs.docs.length} old notification queue items`);
    
    return null;
  });
