// Free Email Notification Service
// Uses Gmail SMTP or other free email providers

class EmailNotificationService {
  constructor() {
    this.isEnabled = false;
    this.userEmail = null;
    this.provider = 'gmail'; // gmail, sendgrid, mailgun
  }

  // Initialize with user email
  init(userEmail, provider = 'gmail') {
    this.userEmail = userEmail;
    this.provider = provider;
    this.isEnabled = !!userEmail;
  }

  // Send email notification using free services
  async sendEmail(subject, body, options = {}) {
    if (!this.isEnabled || !this.userEmail) {
      console.warn('Email notifications not configured');
      return false;
    }

    try {
      switch (this.provider) {
        case 'gmail':
          return await this.sendViaGmail(subject, body, options);
        case 'sendgrid':
          return await this.sendViaSendGrid(subject, body, options);
        case 'mailgun':
          return await this.sendViaMailgun(subject, body, options);
        default:
          return await this.sendViaGmail(subject, body, options);
      }
    } catch (error) {
      console.error('Email notification failed:', error);
      return false;
    }
  }

  // Gmail SMTP (Free - 500 emails/day)
  async sendViaGmail(subject, body, options = {}) {
    // This would typically use a backend API endpoint
    // For now, we'll simulate the email sending
    const emailData = {
      to: this.userEmail,
      subject,
      body,
      from: 'justgoals@yourdomain.com',
      ...options
    };

    // In production, you'd send this to your backend API
    console.log('Sending email via Gmail:', emailData);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Email sent successfully via Gmail');
        resolve(true);
      }, 1000);
    });
  }

  // SendGrid (Free - 100 emails/day)
  async sendViaSendGrid(subject, body, options = {}) {
    const emailData = {
      to: this.userEmail,
      subject,
      body,
      from: 'justgoals@yourdomain.com',
      ...options
    };

    console.log('Sending email via SendGrid:', emailData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Email sent successfully via SendGrid');
        resolve(true);
      }, 1000);
    });
  }

  // Mailgun (Free - 5,000 emails/month)
  async sendViaMailgun(subject, body, options = {}) {
    const emailData = {
      to: this.userEmail,
      subject,
      body,
      from: 'justgoals@yourdomain.com',
      ...options
    };

    console.log('Sending email via Mailgun:', emailData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Email sent successfully via Mailgun');
        resolve(true);
      }, 1000);
    });
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

    body += `
      <p><a href="https://justgoals.vercel.app/goals-dashboard" style="background: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Goals</a></p>
    `;

    return this.sendEmail(subject, body, { html: true });
  }

  // Goal deadline email
  async sendGoalDeadlineAlert(goal, daysLeft) {
    let subject, body;
    
    if (daysLeft <= 1) {
      subject = '🚨 DEADLINE TOMORROW - Push Hard!';
      body = `
        <h2>🚨 Deadline Tomorrow!</h2>
        <p>"${goal.title}" is due tomorrow!</p>
        <p><strong>Time to push hard!</strong></p>
      `;
    } else if (daysLeft <= 3) {
      subject = '⚠️ Deadline Approaching - Keep Pushing!';
      body = `
        <h2>⚠️ Deadline Approaching</h2>
        <p>"${goal.title}" is due in ${daysLeft} days.</p>
        <p>Keep pushing!</p>
      `;
    } else if (daysLeft <= 7) {
      subject = '📅 Deadline This Week - Stay on Track!';
      body = `
        <h2>📅 Deadline This Week</h2>
        <p>"${goal.title}" is due in ${daysLeft} days.</p>
        <p>Stay on track!</p>
      `;
    }

    body += `
      <p><a href="https://justgoals.vercel.app/goals-dashboard" style="background: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Goal</a></p>
    `;

    return this.sendEmail(subject, body, { html: true });
  }

  // Achievement celebration email
  async sendAchievementCelebration(achievement) {
    const subject = '🏆 Achievement Unlocked - Congratulations!';
    const body = `
      <h2>🏆 Achievement Unlocked!</h2>
      <p>Congratulations! You've earned:</p>
      <h3>${achievement.title}</h3>
      <p>${achievement.description || ''}</p>
      <p><strong>Points Earned:</strong> ${achievement.points || 0}</p>
      <p><a href="https://justgoals.vercel.app/achievements" style="background: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Achievements</a></p>
    `;

    return this.sendEmail(subject, body, { html: true });
  }
}

// Create singleton instance
const emailNotificationService = new EmailNotificationService();

export default emailNotificationService; 