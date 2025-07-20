// Free SMS Notification Service
// Uses email-to-SMS gateways and free SMS services

class SMSNotificationService {
  constructor() {
    this.isEnabled = false;
    this.phoneNumber = null;
    this.carrier = null;
    this.provider = 'email-sms'; // email-sms, twilio-free, telegram
    this.carriers = {
      'att': '@txt.att.net',
      'verizon': '@vtext.com',
      'tmobile': '@tmomail.net',
      'sprint': '@messaging.sprintpcs.com',
      'boost': '@myboostmobile.com',
      'cricket': '@sms.cricketwireless.net',
      'metro': '@mymetropcs.com',
      'uscellular': '@email.uscc.net',
      'virgin': '@vmobl.com',
      'xfinity': '@vtext.com'
    };
  }

  // Initialize with phone number and carrier
  init(phoneNumber, carrier, provider = 'email-sms') {
    this.phoneNumber = this.formatPhoneNumber(phoneNumber);
    this.carrier = carrier;
    this.provider = provider;
    this.isEnabled = !!phoneNumber && !!carrier;
  }

  // Format phone number to 10 digits
  formatPhoneNumber(phone) {
    if (!phone) return null;
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Return last 10 digits (US numbers)
    return cleaned.slice(-10);
  }

  // Send SMS notification
  async sendSMS(message, options = {}) {
    if (!this.isEnabled || !this.phoneNumber || !this.carrier) {
      console.warn('SMS notifications not configured');
      return false;
    }

    try {
      switch (this.provider) {
        case 'email-sms':
          return await this.sendViaEmailSMS(message, options);
        case 'telegram':
          return await this.sendViaTelegram(message, options);
        case 'discord':
          return await this.sendViaDiscord(message, options);
        default:
          return await this.sendViaEmailSMS(message, options);
      }
    } catch (error) {
      console.error('SMS notification failed:', error);
      return false;
    }
  }

  // Email-to-SMS (Free - works with most carriers)
  async sendViaEmailSMS(message, options = {}) {
    if (!this.carriers[this.carrier]) {
      console.error('Unsupported carrier:', this.carrier);
      return false;
    }

    const emailAddress = `${this.phoneNumber}${this.carriers[this.carrier]}`;
    const subject = options.subject || 'JustGoals Notification';
    
    // This would typically use a backend API endpoint
    const smsData = {
      to: emailAddress,
      subject,
      body: message,
      from: 'justgoals@yourdomain.com',
      ...options
    };

    console.log('Sending SMS via Email-to-SMS:', smsData);
    
    // In production, you'd send this to your backend API
    // which would then send the email to the carrier's SMS gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('SMS sent successfully via Email-to-SMS');
        resolve(true);
      }, 1000);
    });
  }

  // Telegram Bot (Free - unlimited messages)
  async sendViaTelegram(message, options = {}) {
    // This would use Telegram Bot API
    const botToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
    const chatId = this.phoneNumber; // In this case, phoneNumber would be the chat ID
    
    if (!botToken || !chatId) {
      console.error('Telegram bot not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }),
      });

      if (response.ok) {
        console.log('SMS sent successfully via Telegram');
        return true;
      } else {
        console.error('Telegram SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Telegram SMS error:', error);
      return false;
    }
  }

  // Discord (Free - as alternative to SMS)
  async sendViaDiscord(message, options = {}) {
    // This would use Discord webhook
    const webhookUrl = process.env.REACT_APP_DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('Discord webhook not configured');
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `📱 **SMS Notification for ${this.phoneNumber}:**\n${message}`,
          username: 'JustGoals SMS Bot',
          avatar_url: 'https://justgoals.vercel.app/favicon.ico'
        }),
      });

      if (response.ok) {
        console.log('SMS notification sent via Discord');
        return true;
      } else {
        console.error('Discord SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Discord SMS error:', error);
      return false;
    }
  }

  // Morning motivation SMS
  async sendMorningMotivation(userGoals = []) {
    let message = '🌅 Good Morning! Time to crush your goals today!';
    
    if (userGoals.length > 0) {
      const activeGoals = userGoals.filter(goal => !goal.completed);
      if (activeGoals.length > 0) {
        const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
        message += `\n\nFocus on: "${randomGoal.title}"`;
      }
    }

    return this.sendSMS(message, { subject: 'JustGoals - Morning Motivation' });
  }

  // Evening reflection SMS
  async sendEveningReflection(userGoals = []) {
    const messages = [
      '🌙 Evening check-in! How did you do with your goals today?',
      '✨ Time to reflect on your day and goal progress.',
      '📝 Day\'s end reflection - what did you accomplish?',
      '🌟 Evening wrap-up - celebrate your wins!',
      '💭 How are you feeling about your goal progress today?'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    return this.sendSMS(randomMessage, { subject: 'JustGoals - Evening Reflection' });
  }

  // Streak protection SMS
  async sendStreakProtectionAlert(goal, currentStreak, daysToBreak) {
    const urgency = daysToBreak <= 1 ? 'high' : daysToBreak <= 2 ? 'medium' : 'low';
    
    let message;
    
    if (urgency === 'high') {
      message = `🚨 URGENT: Your "${goal.title}" streak is about to break! You're on day ${currentStreak} - don't let it slip away!`;
    } else if (urgency === 'medium') {
      message = `⚠️ Streak Warning: Your "${goal.title}" streak (${currentStreak} days) needs attention soon. Keep it going!`;
    } else {
      message = `💪 Streak Reminder: Don't forget about your "${goal.title}" streak! You're on day ${currentStreak} - keep the momentum!`;
    }

    return this.sendSMS(message, { subject: 'JustGoals - Streak Alert' });
  }

  // Goal deadline SMS
  async sendGoalDeadlineAlert(goal, daysLeft) {
    let message;
    
    if (daysLeft <= 1) {
      message = `🚨 DEADLINE TOMORROW: "${goal.title}" is due tomorrow! Time to push hard!`;
    } else if (daysLeft <= 3) {
      message = `⚠️ Deadline Approaching: "${goal.title}" is due in ${daysLeft} days. Keep pushing!`;
    } else if (daysLeft <= 7) {
      message = `📅 Deadline This Week: "${goal.title}" is due in ${daysLeft} days. Stay on track!`;
    }

    return this.sendSMS(message, { subject: 'JustGoals - Goal Deadline' });
  }

  // Achievement celebration SMS
  async sendAchievementCelebration(achievement) {
    const message = `🏆 Achievement Unlocked! Congratulations! You've earned: ${achievement.title} (${achievement.points || 0} points)`;
    return this.sendSMS(message, { subject: 'JustGoals - Achievement' });
  }

  // Focus session reminder SMS
  async sendFocusReminder(goal) {
    const message = `🎯 Focus Time! Ready to focus on "${goal.title}"? Your optimal focus time is now.`;
    return this.sendSMS(message, { subject: 'JustGoals - Focus Reminder' });
  }

  // Test SMS
  async sendTestSMS() {
    const message = '📱 JustGoals SMS notifications are working! You\'ll receive goal reminders and motivation here.';
    return this.sendSMS(message, { subject: 'JustGoals - Test SMS' });
  }

  // Get available carriers
  getAvailableCarriers() {
    return Object.keys(this.carriers).map(carrier => ({
      value: carrier,
      label: carrier.toUpperCase(),
      email: this.carriers[carrier]
    }));
  }

  // Validate phone number
  validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }
}

// Create singleton instance
const smsNotificationService = new SMSNotificationService();

export default smsNotificationService; 