// Vercel Cron API Route for Background Notifications
// This runs on Vercel's servers every hour for FREE

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  // You'll need to add your Firebase service account key to Vercel environment variables
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  // Verify this is a legitimate cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕐 Background notification check started:', new Date().toISOString());

    // Get all users with notification settings
    const usersSnapshot = await db.collection('userNotificationSettings').get();
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const today = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD

    let notificationsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const settings = userDoc.data();

      try {
        // Skip if notifications disabled
        if (!settings.enabled || !settings.ntfy?.enabled || !settings.ntfy?.topic) {
          continue;
        }

        // Check morning motivation (default 8:00 AM)
        if (settings.schedules?.morningMotivation) {
          const [hour, minute] = settings.schedules.morningMotivation.split(':').map(Number);
          if (currentHour === hour && currentMinute >= minute && currentMinute < minute + 15) {
            await sendNtfyNotification(
              settings.ntfy.topic,
              '🌅 Good morning!',
              'Time to start working on your goals! You\'ve got this! 💪'
            );
            notificationsSent++;
          }
        }

        // Check evening reflection (default 8:00 PM)
        if (settings.schedules?.eveningReflection) {
          const [hour, minute] = settings.schedules.eveningReflection.split(':').map(Number);
          if (currentHour === hour && currentMinute >= minute && currentMinute < minute + 15) {
            await sendNtfyNotification(
              settings.ntfy.topic,
              '🌙 Evening reflection',
              'How did your goals go today? Take a moment to reflect on your progress.'
            );
            notificationsSent++;
          }
        }

        // Check focus reminders (default 2:00 PM)
        if (settings.schedules?.focusReminders) {
          const [hour, minute] = settings.schedules.focusReminders.split(':').map(Number);
          if (currentHour === hour && currentMinute >= minute && currentMinute < minute + 15) {
            await sendNtfyNotification(
              settings.ntfy.topic,
              '🎯 Focus time!',
              'Time for a focused work session on your goals. Remove distractions and dive in!'
            );
            notificationsSent++;
          }
        }

        // Check streak protection (default 9:00 PM)
        if (settings.schedules?.streakProtection) {
          const [hour, minute] = settings.schedules.streakProtection.split(':').map(Number);
          if (currentHour === hour && currentMinute >= minute && currentMinute < minute + 15) {
            await sendNtfyNotification(
              settings.ntfy.topic,
              '🔥 Protect your streak!',
              'Don\'t break your streak! Make some progress on your goals before the day ends.'
            );
            notificationsSent++;
          }
        }

        // Check goal deadlines
        if (settings.deadlineAlerts?.enabled) {
          const userGoalsSnapshot = await db.collection('goals').where('userId', '==', userId).get();
          
          for (const goalDoc of userGoalsSnapshot.docs) {
            const goal = goalDoc.data();
            
            if (goal.deadline && !goal.completed) {
              const deadline = new Date(goal.deadline);
              const daysUntil = Math.ceil((deadline - currentTime) / (1000 * 60 * 60 * 24));
              
              // Send deadline alerts
              if (daysUntil === 7 || daysUntil === 3 || daysUntil === 1) {
                await sendNtfyNotification(
                  settings.ntfy.topic,
                  `⏰ Goal deadline approaching!`,
                  `"${goal.title}" is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}. Time to focus! 🎯`
                );
                notificationsSent++;
              } else if (daysUntil === 0) {
                await sendNtfyNotification(
                  settings.ntfy.topic,
                  `🚨 Goal deadline TODAY!`,
                  `"${goal.title}" is due today! Make it happen! 💪`
                );
                notificationsSent++;
              }
            }
          }
        }

      } catch (userError) {
        console.error(`Error processing notifications for user ${userId}:`, userError);
      }
    }

    // Process any test notifications in queue
    const testNotificationsSnapshot = await db.collection('notificationQueue').get();
    for (const testDoc of testNotificationsSnapshot.docs) {
      const testNotification = testDoc.data();
      
      await sendNtfyNotification(
        testNotification.topic,
        testNotification.title,
        testNotification.message
      );
      
      // Remove from queue
      await testDoc.ref.delete();
      notificationsSent++;
    }

    console.log(`✅ Background notifications completed. Sent: ${notificationsSent}`);

    res.json({
      success: true,
      timestamp: currentTime.toISOString(),
      notificationsSent,
      message: 'Background notifications processed successfully'
    });

  } catch (error) {
    console.error('❌ Background notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to send ntfy notifications
async function sendNtfyNotification(topic, title, message) {
  try {
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        title,
        message,
        priority: 'default',
        tags: ['justgoals', '🎯']
      })
    });

    if (!response.ok) {
      throw new Error(`ntfy request failed: ${response.status}`);
    }

    console.log(`📱 Sent notification to ${topic}: ${title}`);
    return true;
  } catch (error) {
    console.error('Failed to send ntfy notification:', error);
    return false;
  }
}
