// Free Email Notification Service
// Uses EmailJS (free tier) or other free email providers

import emailjs from 'emailjs-com';

class EmailNotificationService {
  constructor() {
    this.isEnabled = false;
    this.userEmail = null;
    this.provider = 'emailjs'; // emailjs, sendgrid, mailgun
    this.emailjsUserId = process.env.REACT_APP_EMAILJS_USER_ID;
    this.emailjsServiceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_q8rpz6m';
    this.emailjsTemplateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_default';
  }

  // Initialize with user email
  init(userEmail, provider = 'emailjs') {
    this.userEmail = userEmail;
    this.provider = provider;
    this.isEnabled = !!userEmail;
    if (provider === 'emailjs') {
      this.emailjsUserId = process.env.REACT_APP_EMAILJS_USER_ID;
      this.emailjsServiceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_q8rpz6m';
      this.emailjsTemplateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_default';
    }
  }

  // Send email notification using EmailJS
  async sendEmail(subject, body, options = {}) {
    if (!this.isEnabled || !this.userEmail) {
      console.warn('Email notifications not configured');
      return false;
    }
    if (this.provider !== 'emailjs') {
      console.error('Only EmailJS is currently supported for real email sending.');
      return false;
    }
    if (!this.emailjsUserId || !this.emailjsServiceId || !this.emailjsTemplateId) {
      console.error('EmailJS is not fully configured. Please set REACT_APP_EMAILJS_USER_ID, REACT_APP_EMAILJS_SERVICE_ID, and REACT_APP_EMAILJS_TEMPLATE_ID in your environment.');
      return false;
    }
    const templateParams = {
      to_email: this.userEmail,
      subject: subject,
      message: body,
      from_name: 'JustGoals',
      ...options
    };
    try {
      const result = await emailjs.send(
        this.emailjsServiceId,
        this.emailjsTemplateId,
        templateParams,
        this.emailjsUserId
      );
      console.log('Email sent successfully via EmailJS', result);
      return true;
    } catch (error) {
      console.error('EmailJS error:', error);
      return false;
    }
  }

  // Morning motivation email
  async sendMorningMotivation(userGoals = []) {
    const subject = '🌅 Good Morning - Time to Crush Your Goals!';
    let body = `
      <h2>Good Morning! 🌅</h2>
      <p>Time to crush your goals today!</p>
    `;

    if (userGoals.length > 0) {
      const activeGoals = userGoals.filter(goal => !goal.completed);
      if (activeGoals.length > 0) {
        body += '<h3>Today\'s Focus:</h3><ul>';
        activeGoals.slice(0, 3).forEach(goal => {
          body += `<li>${goal.title} - ${goal.progress || 0}% complete</li>`;
        });
        body += '</ul>';
      }
    }

    body += `
      <p><a href="https://justgoals.vercel.app" style="background: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open JustGoals</a></p>
    `;

    return this.sendEmail(subject, body, { html: true });
  }

  // Evening reflection email
  async sendEveningReflection(userGoals = []) {
    const subject = '🌙 Evening Reflection - How Did You Do Today?';
    let body = `
      <h2>Evening Reflection 🌙</h2>
      <p>Take a moment to reflect on your day and your goal progress.</p>
    `;

    if (userGoals.length > 0) {
      const completedGoals = userGoals.filter(goal => goal.completed);
      const activeGoals = userGoals.filter(goal => !goal.completed);
      
      body += '<h3>Today\'s Progress:</h3>';
      body += `<p>✅ Completed: ${completedGoals.length} goals</p>`;
      body += `<p>🎯 Active: ${activeGoals.length} goals</p>`;
    }

    body += `
      <p><a href="https://justgoals.vercel.app" style="background: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open JustGoals</a></p>
    `;

    return this.sendEmail(subject, body, { html: true });
  }

  // Streak protection email
  async sendStreakProtectionAlert(goal, currentStreak, daysToBreak) {
    const urgency = daysToBreak <= 1 ? 'high' : daysToBreak <= 2 ? 'medium' : 'low';
    
    let subject, body;
    
    if (urgency === 'high') {
      subject = '🚨 URGENT: Your Streak is About to Break!';
      body = `
        <h2>🚨 Streak Alert!</h2>
        <p>Your "${goal.title}" streak is about to break!</p>
        <p><strong>Current Streak:</strong> ${currentStreak} days</p>
        <p><strong>Don't let it slip away!</strong></p>
      `;
    } else if (urgency === 'medium') {
      subject = '⚠️ Streak Warning - Action Needed Soon';
      body = `
        <h2>⚠️ Streak Warning</h2>
        <p>Your "${goal.title}" streak needs attention soon.</p>
        <p><strong>Current Streak:</strong> ${currentStreak} days</p>
        <p>Keep it going!</p>
      `;
    } else {
      subject = '💪 Streak Reminder - Keep the Momentum!';
      body = `
        <h2>💪 Streak Reminder</h2>
        <p>Don't forget about your "${goal.title}" streak!</p>
        <p><strong>Current Streak:</strong> ${currentStreak} days</p>
        <p>Keep the momentum going!</p>
      `;
    }
  }
}

// Create singleton instance
const emailNotificationService = new EmailNotificationService();

export default emailNotificationService;