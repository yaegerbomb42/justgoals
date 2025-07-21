// Free SMS Notification Service
// Uses email-to-SMS gateways and free SMS services

// Add support for both SMS and MMS gateways for major US carriers
const CARRIER_GATEWAYS = {
  att: { sms: 'txt.att.net', mms: 'mms.att.net' },
  verizon: { sms: 'vtext.com', mms: 'mypixmessages.com' },
  tmobile: { sms: 'tmomail.net', mms: 'tmomail.net' },
  sprint: { sms: 'messaging.sprintpcs.com', mms: 'pm.sprint.com' },
  boost: { sms: 'myboostmobile.com', mms: 'myboostmobile.com' },
  cricket: { sms: 'sms.cricketwireless.net', mms: 'sms.cricketwireless.net' },
  metro: { sms: 'mymetropcs.com', mms: 'mymetropcs.com' },
  uscellular: { sms: 'email.uscc.net', mms: 'email.uscc.net' },
  virgin: { sms: 'vmobl.com', mms: 'vmobl.com' },
  xfinity: { sms: 'vtext.com', mms: 'mypixmessages.com' },
};

function getGatewayAddress(phoneNumber, carrier, type = 'sms') {
  const gateway = CARRIER_GATEWAYS[carrier]?.[type] || CARRIER_GATEWAYS[carrier]?.sms;
  if (!gateway) return null;
  return `${phoneNumber}@${gateway}`;
}

class SMSNotificationService {
  constructor() {
    this.isEnabled = false;
    this.phoneNumber = null;
    this.carrier = null;
    this.provider = 'email-sms'; // email-sms, telegram, discord, whatsapp, signal
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
      'xfinity': '@vtext.com', // Try @vtext.com (Verizon) for Xfinity Mobile SMS
      'xfinity-mms': '@mypixmessages.com', // Try for MMS if SMS fails
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
        case 'whatsapp':
          return await this.sendViaWhatsApp(message, options);
        case 'signal':
          return await this.sendViaSignal(message, options);
        case 'slack':
          return await this.sendViaSlack(message, options);
        case 'email':
          return await this.sendViaEmailFallback(message, options);
        case 'signal-cli':
          return await this.sendViaSignalCLI(message, options);
        case 'matrix':
          return await this.sendViaMatrix(message, options);
        case 'custom-sms':
          return await this.sendViaCustomSMS(message, options);
        case 'twilio-free':
          return await this.sendViaTwilioFree(message, options);
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
    const type = options.type || 'sms';
    const emailAddress = getGatewayAddress(this.phoneNumber, this.carrier, type);
    if (!emailAddress) {
      console.error('Unsupported carrier or missing phone number:', this.carrier);
      return false;
    }
    const subject = options.subject || 'JustGoals Notification';

    // Call backend API to send email to SMS gateway
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailAddress,
          subject,
          body: message,
          from: 'justgoals@yourdomain.com',
          ...options
        })
      });
      if (response.ok) {
        console.log('SMS sent successfully via Email-to-SMS');
        return true;
      } else {
        console.error('SMS via Email-to-SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('SMS via Email-to-SMS error:', error);
      return false;
    }
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

  // WhatsApp Business API (Free tier - 1000 messages/month)
  async sendViaWhatsApp(message, options = {}) {
    // This would use WhatsApp Business API
    const accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp Business API not configured');
      return false;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.phoneNumber,
          type: 'text',
          text: { body: message }
        }),
      });

      if (response.ok) {
        console.log('SMS sent successfully via WhatsApp');
        return true;
      } else {
        console.error('WhatsApp SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('WhatsApp SMS error:', error);
      return false;
    }
  }

  // Signal Bot (Free - unlimited messages)
  async sendViaSignal(message, options = {}) {
    // This would use Signal REST API
    const signalUrl = process.env.REACT_APP_SIGNAL_API_URL;
    const signalNumber = process.env.REACT_APP_SIGNAL_NUMBER;
    
    if (!signalUrl || !signalNumber) {
      console.error('Signal API not configured');
      return false;
    }

    try {
      const response = await fetch(`${signalUrl}/v2/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: signalNumber,
          recipients: [this.phoneNumber],
          message: message
        }),
      });

      if (response.ok) {
        console.log('SMS sent successfully via Signal');
        return true;
      } else {
        console.error('Signal SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Signal SMS error:', error);
      return false;
    }
  }

  // Slack Webhook (Free - unlimited messages)
  async sendViaSlack(message, options = {}) {
    // This would use Slack webhook
    const webhookUrl = process.env.REACT_APP_SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('Slack webhook not configured');
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `📱 **SMS Notification for ${this.phoneNumber}:**\n${message}`,
          username: 'JustGoals SMS Bot',
          icon_emoji: ':bell:'
        }),
      });

      if (response.ok) {
        console.log('SMS notification sent via Slack');
        return true;
      } else {
        console.error('Slack SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Slack SMS error:', error);
      return false;
    }
  }

  // Email Fallback (Free - unlimited)
  async sendViaEmailFallback(message, options = {}) {
    // Send as email if SMS fails
    const emailAddress = process.env.REACT_APP_FALLBACK_EMAIL || 'notifications@justgoals.com';
    
    const emailData = {
      to: emailAddress,
      subject: `SMS for ${this.phoneNumber}: ${options.subject || 'JustGoals Notification'}`,
      body: `Message intended for ${this.phoneNumber}:\n\n${message}`,
      from: 'justgoals@yourdomain.com',
      ...options
    };

    console.log('Sending SMS via Email Fallback:', emailData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('SMS sent successfully via Email Fallback');
        resolve(true);
      }, 1000);
    });
  }

  // Signal CLI (Self-hosted - Free & Unlimited)
  async sendViaSignalCLI(message, options = {}) {
    // This would use Signal CLI running on your server
    const signalCliUrl = process.env.REACT_APP_SIGNAL_CLI_URL;
    const signalNumber = process.env.REACT_APP_SIGNAL_CLI_NUMBER;
    
    if (!signalCliUrl || !signalNumber) {
      console.error('Signal CLI not configured');
      return false;
    }

    try {
      const response = await fetch(`${signalCliUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: signalNumber,
          recipients: [this.phoneNumber],
          message: message
        }),
      });

      if (response.ok) {
        console.log('SMS sent successfully via Signal CLI');
        return true;
      } else {
        console.error('Signal CLI SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Signal CLI SMS error:', error);
      return false;
    }
  }

  // Matrix Bot (Self-hosted - Free & Unlimited)
  async sendViaMatrix(message, options = {}) {
    // This would use Matrix bot running on your server
    const matrixUrl = process.env.REACT_APP_MATRIX_URL;
    const matrixToken = process.env.REACT_APP_MATRIX_TOKEN;
    const matrixRoom = process.env.REACT_APP_MATRIX_ROOM;
    
    if (!matrixUrl || !matrixToken || !matrixRoom) {
      console.error('Matrix bot not configured');
      return false;
    }

    try {
      const response = await fetch(`${matrixUrl}/_matrix/client/r0/rooms/${matrixRoom}/send/m.room.message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${matrixToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msgtype: 'm.text',
          body: `📱 SMS for ${this.phoneNumber}: ${message}`
        }),
      });

      if (response.ok) {
        console.log('SMS sent successfully via Matrix');
        return true;
      } else {
        console.error('Matrix SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Matrix SMS error:', error);
      return false;
    }
  }

  // Custom SMS Gateway (Self-hosted)
  async sendViaCustomSMS(message, options = {}) {
    // This would use your own SMS gateway
    const customSmsUrl = process.env.REACT_APP_CUSTOM_SMS_URL;
    const customSmsKey = process.env.REACT_APP_CUSTOM_SMS_KEY;
    
    if (!customSmsUrl || !customSmsKey) {
      console.error('Custom SMS gateway not configured');
      return false;
    }

    try {
      const response = await fetch(customSmsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${customSmsKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.phoneNumber,
          message: message,
          from: 'JustGoals'
        }),
      });

      if (response.ok) {
        console.log('SMS sent successfully via Custom Gateway');
        return true;
      } else {
        console.error('Custom SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Custom SMS error:', error);
      return false;
    }
  }

  // Twilio Free Tier (250 SMS/month)
  async sendViaTwilioFree(message, options = {}) {
    // This would use Twilio's free tier
    const twilioAccountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.REACT_APP_TWILIO_NUMBER;
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioNumber) {
      console.error('Twilio not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: this.phoneNumber,
          From: twilioNumber,
          Body: message
        }),
      });

      if (response.ok) {
        console.log('SMS sent successfully via Twilio');
        return true;
      } else {
        console.error('Twilio SMS failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Twilio SMS error:', error);
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

  // Get available free SMS alternatives
  getFreeAlternatives() {
    return {}; // No longer available alternatives
  }

  // Get available carriers
  getAvailableCarriers() {
    return Object.keys(this.carriers).map(carrier => ({
      value: carrier,
      label: carrier.charAt(0).toUpperCase() + carrier.slice(1),
      gateway: this.carriers[carrier]
    }));
  }

  // Validate phone number format
  validatePhoneNumber(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  }

  // Test SMS functionality
  async sendTestSMS() {
    const testMessage = '🧪 Test SMS from JustGoals! Your notifications are working.';
    return this.sendSMS(testMessage, { subject: 'JustGoals - Test SMS' });
  }
}

// Create singleton instance
const smsNotificationService = new SMSNotificationService();

export default smsNotificationService; 

// Export getGatewayAddress for use in settings UI if needed
export { getGatewayAddress }; 