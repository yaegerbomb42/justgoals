// Comprehensive security service with input validation, XSS protection, rate limiting, and data sanitization

class SecurityService {
  constructor() {
    this.rateLimitStore = new Map();
    this.blockedIPs = new Set();
    this.suspiciousActivities = new Map();
    
    // Rate limiting configuration
    this.rateLimits = {
      login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
      focus: { maxSessions: 10, windowMs: 60 * 60 * 1000 }, // 10 sessions per hour
      goals: { maxCreations: 20, windowMs: 24 * 60 * 60 * 1000 } // 20 goals per day
    };

    // Security headers
    this.securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com;"
    };

    // Input validation patterns
    this.validationPatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      username: /^[a-zA-Z0-9_-]{3,20}$/,
      goalTitle: /^[a-zA-Z0-9\s\-_.,!?()]{1,100}$/,
      milestoneTitle: /^[a-zA-Z0-9\s\-_.,!?()]{1,200}$/,
      journalEntry: /^[\s\S]{1,10000}$/, // Allow any character, 1-10000 chars
      apiKey: /^[A-Za-z0-9_-]{20,}$/
    };

    // XSS patterns to detect
    this.xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
      /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi
    ];

    // SQL injection patterns
    this.sqlInjectionPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/gi,
      /(\b(and|or)\b\s+\d+\s*=\s*\d+)/gi,
      /(\b(and|or)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/gi,
      /(--|\/\*|\*\/|;)/g
    ];

    // Start security monitoring
    this.startSecurityMonitoring();
  }

  // Input validation
  validateInput(input, type, options = {}) {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input must be a non-empty string' };
    }

    const { minLength = 1, maxLength = 1000, allowHtml = false } = options;

    // Check length
    if (input.length < minLength || input.length > maxLength) {
      return { 
        isValid: false, 
        error: `Input must be between ${minLength} and ${maxLength} characters` 
      };
    }

    // Check for XSS if HTML is not allowed
    if (!allowHtml && this.detectXSS(input)) {
      return { isValid: false, error: 'Input contains potentially malicious content' };
    }

    // Check for SQL injection
    if (this.detectSQLInjection(input)) {
      return { isValid: false, error: 'Input contains potentially malicious SQL content' };
    }

    // Pattern validation
    if (type && this.validationPatterns[type]) {
      if (!this.validationPatterns[type].test(input)) {
        return { isValid: false, error: `Input does not match required pattern for ${type}` };
      }
    }

    return { isValid: true, sanitized: this.sanitizeInput(input, allowHtml) };
  }

  // Detect XSS attacks
  detectXSS(input) {
    return this.xssPatterns.some(pattern => pattern.test(input));
  }

  // Detect SQL injection attempts
  detectSQLInjection(input) {
    return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  // Sanitize input
  sanitizeInput(input, allowHtml = false) {
    if (!input) return '';

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    if (!allowHtml) {
      // Escape HTML entities
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    return sanitized.trim();
  }

  // Rate limiting
  checkRateLimit(userId, action) {
    const now = Date.now();
    const limit = this.rateLimits[action];
    
    if (!limit) {
      return { allowed: true, remaining: 999 };
    }

    const key = `${userId}_${action}`;
    const attempts = this.rateLimitStore.get(key) || [];

    // Remove expired attempts
    const validAttempts = attempts.filter(timestamp => now - timestamp < limit.windowMs);

    if (validAttempts.length >= limit.maxAttempts) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: validAttempts[0] + limit.windowMs 
      };
    }

    // Add current attempt
    validAttempts.push(now);
    this.rateLimitStore.set(key, validAttempts);

    return { 
      allowed: true, 
      remaining: limit.maxAttempts - validAttempts.length 
    };
  }

  // Validate user data
  validateUserData(userData) {
    const errors = [];

    // Validate required fields
    if (!userData.email) {
      errors.push('Email is required');
    } else {
      const emailValidation = this.validateInput(userData.email, 'email');
      if (!emailValidation.isValid) {
        errors.push(`Email: ${emailValidation.error}`);
      }
    }

    if (!userData.name) {
      errors.push('Name is required');
    } else {
      const nameValidation = this.validateInput(userData.name, null, { maxLength: 100 });
      if (!nameValidation.isValid) {
        errors.push(`Name: ${nameValidation.error}`);
      }
    }

    // Validate optional fields
    if (userData.username) {
      const usernameValidation = this.validateInput(userData.username, 'username');
      if (!usernameValidation.isValid) {
        errors.push(`Username: ${usernameValidation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeUserData(userData) : null
    };
  }

  // Validate goal data
  validateGoalData(goalData) {
    const errors = [];

    if (!goalData.title) {
      errors.push('Goal title is required');
    } else {
      const titleValidation = this.validateInput(goalData.title, 'goalTitle');
      if (!titleValidation.isValid) {
        errors.push(`Title: ${titleValidation.error}`);
      }
    }

    if (goalData.description) {
      const descValidation = this.validateInput(goalData.description, null, { maxLength: 1000 });
      if (!descValidation.isValid) {
        errors.push(`Description: ${descValidation.error}`);
      }
    }

    if (goalData.category) {
      const categoryValidation = this.validateInput(goalData.category, null, { maxLength: 50 });
      if (!categoryValidation.isValid) {
        errors.push(`Category: ${categoryValidation.error}`);
      }
    }

    // Validate progress
    if (goalData.progress !== undefined) {
      const progress = parseFloat(goalData.progress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        errors.push('Progress must be a number between 0 and 100');
      }
    }

    // Validate deadline
    if (goalData.deadline) {
      const deadline = new Date(goalData.deadline);
      if (isNaN(deadline.getTime())) {
        errors.push('Invalid deadline format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeGoalData(goalData) : null
    };
  }

  // Validate milestone data
  validateMilestoneData(milestoneData) {
    const errors = [];

    if (!milestoneData.title) {
      errors.push('Milestone title is required');
    } else {
      const titleValidation = this.validateInput(milestoneData.title, 'milestoneTitle');
      if (!titleValidation.isValid) {
        errors.push(`Title: ${titleValidation.error}`);
      }
    }

    if (milestoneData.description) {
      const descValidation = this.validateInput(milestoneData.description, null, { maxLength: 500 });
      if (!descValidation.isValid) {
        errors.push(`Description: ${descValidation.error}`);
      }
    }

    // Validate due date
    if (milestoneData.dueDate) {
      const dueDate = new Date(milestoneData.dueDate);
      if (isNaN(dueDate.getTime())) {
        errors.push('Invalid due date format');
      }
    }

    // Validate priority
    if (milestoneData.priority && !['low', 'medium', 'high'].includes(milestoneData.priority)) {
      errors.push('Priority must be low, medium, or high');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeMilestoneData(milestoneData) : null
    };
  }

  // Validate journal entry
  validateJournalEntry(entryData) {
    const errors = [];

    if (!entryData.content) {
      errors.push('Journal content is required');
    } else {
      const contentValidation = this.validateInput(entryData.content, 'journalEntry', { allowHtml: false });
      if (!contentValidation.isValid) {
        errors.push(`Content: ${contentValidation.error}`);
      }
    }

    if (entryData.title) {
      const titleValidation = this.validateInput(entryData.title, null, { maxLength: 200 });
      if (!titleValidation.isValid) {
        errors.push(`Title: ${titleValidation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeJournalEntry(entryData) : null
    };
  }

  // Sanitize user data
  sanitizeUserData(userData) {
    return {
      ...userData,
      email: this.sanitizeInput(userData.email),
      name: this.sanitizeInput(userData.name),
      username: userData.username ? this.sanitizeInput(userData.username) : undefined,
      bio: userData.bio ? this.sanitizeInput(userData.bio, false) : undefined
    };
  }

  // Sanitize goal data
  sanitizeGoalData(goalData) {
    return {
      ...goalData,
      title: this.sanitizeInput(goalData.title),
      description: goalData.description ? this.sanitizeInput(goalData.description) : undefined,
      category: goalData.category ? this.sanitizeInput(goalData.category) : undefined,
      progress: goalData.progress !== undefined ? parseFloat(goalData.progress) : undefined
    };
  }

  // Sanitize milestone data
  sanitizeMilestoneData(milestoneData) {
    return {
      ...milestoneData,
      title: this.sanitizeInput(milestoneData.title),
      description: milestoneData.description ? this.sanitizeInput(milestoneData.description) : undefined,
      priority: milestoneData.priority || 'medium'
    };
  }

  // Sanitize journal entry
  sanitizeJournalEntry(entryData) {
    return {
      ...entryData,
      content: this.sanitizeInput(entryData.content, false),
      title: entryData.title ? this.sanitizeInput(entryData.title) : undefined
    };
  }

  // Validate API key
  validateApiKey(apiKey) {
    if (!apiKey) {
      return { isValid: false, error: 'API key is required' };
    }

    const validation = this.validateInput(apiKey, 'apiKey');
    if (!validation.isValid) {
      return { isValid: false, error: 'Invalid API key format' };
    }

    return { isValid: true, sanitized: validation.sanitized };
  }

  // Log suspicious activity
  logSuspiciousActivity(userId, action, details) {
    const activity = {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    const key = `${userId}_suspicious`;
    const activities = this.suspiciousActivities.get(key) || [];
    activities.push(activity);

    // Keep only last 10 suspicious activities per user
    if (activities.length > 10) {
      activities.splice(0, activities.length - 10);
    }

    this.suspiciousActivities.set(key, activities);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Suspicious activity detected:', activity);
    }

    // In production, this would be sent to a security monitoring service
    this.reportToSecurityService(activity);
  }

  // Get client IP (tries external service, falls back to 'unknown')
  async getClientIP() {
    try {
      if (typeof window !== 'undefined') {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
      }
    } catch (e) {
      console.warn('SecurityService: Failed to fetch client IP:', e);
    }
    return 'unknown';
  }

  // Report to security service
  reportToSecurityService(activity) {
    // In a real application, this would send the activity to a security monitoring service
    // For now, we'll just store it locally
    const securityLog = JSON.parse(localStorage.getItem('security_log') || '[]');
    securityLog.push(activity);
    
    // Keep only last 100 security events
    if (securityLog.length > 100) {
      securityLog.splice(0, securityLog.length - 100);
    }
    
    localStorage.setItem('security_log', JSON.stringify(securityLog));
  }

  // Check if user is blocked
  isUserBlocked(userId) {
    const key = `${userId}_suspicious`;
    const activities = this.suspiciousActivities.get(key) || [];
    
    // Block user if they have 5+ suspicious activities in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentActivities = activities.filter(activity => 
      new Date(activity.timestamp) > oneHourAgo
    );

    return recentActivities.length >= 5;
  }

  // Get security headers
  getSecurityHeaders() {
    return this.securityHeaders;
  }

  // Start security monitoring
  startSecurityMonitoring() {
    // Monitor for suspicious patterns
    setInterval(() => {
      this.cleanupRateLimits();
      this.analyzeSuspiciousPatterns();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Cleanup expired rate limit entries
  cleanupRateLimits() {
    const now = Date.now();
    
    for (const [key, attempts] of this.rateLimitStore.entries()) {
      const limit = this.rateLimits[key.split('_')[1]];
      if (limit) {
        const validAttempts = attempts.filter(timestamp => now - timestamp < limit.windowMs);
        if (validAttempts.length === 0) {
          this.rateLimitStore.delete(key);
        } else {
          this.rateLimitStore.set(key, validAttempts);
        }
      }
    }
  }

  // Analyze suspicious patterns
  analyzeSuspiciousPatterns() {
    for (const [key, activities] of this.suspiciousActivities.entries()) {
      const userId = key.split('_')[0];
      
      // Check for rapid-fire suspicious activities
      const recentActivities = activities.filter(activity => 
        Date.now() - new Date(activity.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
      );

      if (recentActivities.length >= 3) {
        console.warn(`High suspicious activity detected for user ${userId}:`, recentActivities.length, 'activities in 5 minutes');
      }
    }
  }

  // Generate secure random string
  generateSecureToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomArray[i] % chars.length);
    }
    
    return result;
  }

  // Hash sensitive data (simplified - in real app, use proper hashing)
  hashSensitiveData(data) {
    // This is a simplified hash - in production, use proper cryptographic hashing
    let hash = 0;
    const str = JSON.stringify(data);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  // Get security statistics
  getSecurityStats() {
    const totalSuspiciousActivities = Array.from(this.suspiciousActivities.values())
      .reduce((sum, activities) => sum + activities.length, 0);
    
    const blockedUsers = Array.from(this.suspiciousActivities.keys())
      .filter(key => this.isUserBlocked(key.split('_')[0])).length;

    return {
      totalSuspiciousActivities,
      blockedUsers,
      rateLimitEntries: this.rateLimitStore.size,
      securityLogSize: JSON.parse(localStorage.getItem('security_log') || '[]').length
    };
  }
}

// Create singleton instance
const securityService = new SecurityService();

export default securityService; 