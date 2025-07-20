// Free Discord Webhook Notification Service
// Send notifications to Discord channel

class DiscordNotificationService {
  constructor() {
    this.isEnabled = false;
    this.webhookUrl = null;
    this.channelName = 'JustGoals Notifications';
  }

  // Initialize with Discord webhook URL
  init(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.isEnabled = !!webhookUrl;
  }

  // Send message to Discord
  async sendMessage(content, options = {}) {
    if (!this.isEnabled || !this.webhookUrl) {
      console.warn('Discord notifications not configured');
      return false;
    }

    try {
      const payload = {
        content,
        username: 'JustGoals',
        avatar_url: 'https://justgoals.vercel.app/assets/images/app-icon.png',
        ...options
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Discord notification sent successfully');
        return true;
      } else {
        console.error('Discord notification failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Discord notification error:', error);
      return false;
    }
  }

  // Send rich embed message
  async sendEmbed(embed) {
    if (!this.isEnabled || !this.webhookUrl) {
      console.warn('Discord notifications not configured');
      return false;
    }

    try {
      const payload = {
        username: 'JustGoals Bot',
        avatar_url: 'https://justgoals.vercel.app/favicon.ico',
        embeds: [embed],
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Discord embed sent successfully');
        return true;
      } else {
        console.error('Discord embed failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Discord embed error:', error);
      return false;
    }
  }

  // Morning motivation notification
  async sendMorningMotivation(userGoals = []) {
    const embed = {
      title: '🌅 Good Morning - Time to Crush Your Goals!',
      description: 'Time to crush your goals today!',
      color: 0xff9800,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'JustGoals - Goal Tracking & Focus',
        icon_url: 'https://justgoals.vercel.app/favicon.ico'
      }
    };

    if (userGoals.length > 0) {
      const activeGoals = userGoals.filter(goal => !goal.completed);
      if (activeGoals.length > 0) {
        embed.fields = [{
          name: '🎯 Today\'s Focus',
          value: activeGoals.slice(0, 3).map(goal => 
            `• ${goal.title} - ${goal.progress || 0}% complete`
          ).join('\n'),
          inline: false
        }];
      }
    }

    return this.sendEmbed(embed);
  }

  // Evening reflection notification
  async sendEveningReflection(userGoals = []) {
    const embed = {
      title: '🌙 Evening Reflection - How Did You Do Today?',
      description: 'Take a moment to reflect on your day and your goal progress.',
      color: 0x9c27b0,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'JustGoals - Goal Tracking & Focus',
        icon_url: 'https://justgoals.vercel.app/favicon.ico'
      }
    };

    if (userGoals.length > 0) {
      const completedGoals = userGoals.filter(goal => goal.completed);
      const activeGoals = userGoals.filter(goal => !goal.completed);
      
      embed.fields = [
        {
          name: '✅ Completed Today',
          value: completedGoals.length > 0 ? 
            completedGoals.slice(0, 3).map(goal => `• ${goal.title}`).join('\n') : 
            'No goals completed today',
          inline: true
        },
        {
          name: '🎯 Still Active',
          value: activeGoals.length > 0 ? 
            activeGoals.slice(0, 3).map(goal => `• ${goal.title}`).join('\n') : 
            'No active goals',
          inline: true
        }
      ];
    }

    return this.sendEmbed(embed);
  }

  // Streak protection notification
  async sendStreakProtectionAlert(goal, currentStreak, daysToBreak) {
    const urgency = daysToBreak <= 1 ? 'high' : daysToBreak <= 2 ? 'medium' : 'low';
    
    let color, title, description;
    
    if (urgency === 'high') {
      color = 0xf44336; // Red
      title = '🚨 URGENT: Your Streak is About to Break!';
      description = `Your "${goal.title}" streak is about to break! Don't let it slip away!`;
    } else if (urgency === 'medium') {
      color = 0xff9800; // Orange
      title = '⚠️ Streak Warning - Action Needed Soon';
      description = `Your "${goal.title}" streak needs attention soon. Keep it going!`;
    } else {
      color = 0x4caf50; // Green
      title = '💪 Streak Reminder - Keep the Momentum!';
      description = `Don't forget about your "${goal.title}" streak! Keep the momentum going!`;
    }

    const embed = {
      title,
      description,
      color,
      fields: [{
        name: '📊 Streak Stats',
        value: `**Current Streak:** ${currentStreak} days\n**Goal:** ${goal.title}`,
        inline: false
      }],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'JustGoals - Goal Tracking & Focus',
        icon_url: 'https://justgoals.vercel.app/favicon.ico'
      }
    };

    return this.sendEmbed(embed);
  }

  // Goal deadline notification
  async sendGoalDeadlineAlert(goal, daysLeft) {
    let color, title, description;
    
    if (daysLeft <= 1) {
      color = 0xf44336; // Red
      title = '🚨 DEADLINE TOMORROW - Push Hard!';
      description = `"${goal.title}" is due tomorrow! Time to push hard!`;
    } else if (daysLeft <= 3) {
      color = 0xff9800; // Orange
      title = '⚠️ Deadline Approaching - Keep Pushing!';
      description = `"${goal.title}" is due in ${daysLeft} days. Keep pushing!`;
    } else if (daysLeft <= 7) {
      color = 0x2196f3; // Blue
      title = '📅 Deadline This Week - Stay on Track!';
      description = `"${goal.title}" is due in ${daysLeft} days. Stay on track!`;
    }

    const embed = {
      title,
      description,
      color,
      fields: [{
        name: '📋 Goal Details',
        value: `**Goal:** ${goal.title}\n**Days Left:** ${daysLeft}\n**Progress:** ${goal.progress || 0}%`,
        inline: false
      }],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'JustGoals - Goal Tracking & Focus',
        icon_url: 'https://justgoals.vercel.app/favicon.ico'
      }
    };

    return this.sendEmbed(embed);
  }

  // Achievement celebration notification
  async sendAchievementCelebration(achievement) {
    const embed = {
      title: '🏆 Achievement Unlocked - Congratulations!',
      description: `Congratulations! You've earned: **${achievement.title}**`,
      color: 0xffd700, // Gold
      fields: [
        {
          name: '🏅 Achievement Details',
          value: achievement.description || 'No description available',
          inline: false
        },
        {
          name: '⭐ Points Earned',
          value: `${achievement.points || 0} points`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'JustGoals - Goal Tracking & Focus',
        icon_url: 'https://justgoals.vercel.app/favicon.ico'
      }
    };

    return this.sendEmbed(embed);
  }

  // Focus session reminder
  async sendFocusReminder(goal) {
    const embed = {
      title: '🎯 Focus Time!',
      description: `Ready to focus on "${goal.title}"? Your optimal focus time is now.`,
      color: 0x4caf50, // Green
      fields: [{
        name: '🎯 Focus Goal',
        value: `**Goal:** ${goal.title}\n**Progress:** ${goal.progress || 0}%`,
        inline: false
      }],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'JustGoals - Goal Tracking & Focus',
        icon_url: 'https://justgoals.vercel.app/favicon.ico'
      }
    };

    return this.sendEmbed(embed);
  }

  // Simple text notification
  async sendSimpleNotification(message) {
    return this.sendMessage(message);
  }
}

// Create singleton instance
const discordNotificationService = new DiscordNotificationService();

export default discordNotificationService; 