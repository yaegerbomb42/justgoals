// Free Email Notification Service
// Uses EmailJS (free tier) or other free email providers

// Remove all EmailJS logic and replace with a stub
class EmailNotificationService {
  constructor() {
    this.isEnabled = false;
    this.userEmail = null;
    this.provider = null;
  }

  init(userEmail, provider = null) {
    this.userEmail = userEmail;
    this.provider = provider;
    this.isEnabled = false;
  }

  async sendEmail(subject, body, options = {}) {
    console.warn('Email notifications are not supported. EmailJS has been removed.');
    return false;
  }

  async sendMorningMotivation() { return false; }
  async sendEveningReflection() { return false; }
  async sendStreakProtectionAlert() { return false; }
}

const emailNotificationService = new EmailNotificationService();
export default emailNotificationService;