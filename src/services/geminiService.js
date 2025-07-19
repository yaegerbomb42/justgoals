/**
 * Simplified Gemini AI Service using exact curl format from requirements
 * Supports both Gemini 2.0 Flash and 2.5 Flash models
 */
class GeminiService {
  constructor() {
    this.apiKey = null;
    this.isInitialized = false;
    // Use Gemini 2.0 Flash as primary model per requirements
    this.model = 'gemini-2.0-flash';
    this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  /**
   * Initialize the service with an API key
   * @param {string} apiKey - The Gemini API key
   * @returns {boolean} Success status
   */
  initialize(apiKey = null) {
    if (!apiKey) {
      apiKey = this.getApiKey();
    }

    if (apiKey && apiKey.trim()) {
      this.apiKey = apiKey.trim();
      this.isInitialized = true;
      return true;
    } else {
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get current user ID from localStorage
   * @returns {string|null} User ID or null
   */

  getCurrentUserId() {
    try {
      const authUser = localStorage.getItem('authUser');
      if (authUser) {
        const user = JSON.parse(authUser);
        return user.id;
      }
    } catch (e) {
      console.error('Error getting current user ID:', e);
    }
    return null;
  }

  /**
   * Get API key with fallback logic
   * @param {string} userId - Optional user ID
   * @returns {string} API key or empty string
   */
  getApiKey(userId = null) {
    const targetUserId = userId || this.getCurrentUserId();
    
    // Try user-specific key first
    if (targetUserId) {
      const userKey = localStorage.getItem(`gemini_api_key_${targetUserId}`);
      if (userKey && userKey.trim()) {
        return userKey.trim();
      }
    }
    
    // Fallback to global key
    const globalKey = localStorage.getItem('gemini_api_key_global');
    if (globalKey && globalKey.trim()) {
      return globalKey.trim();
    }
    
    return '';
  }

  /**
   * Set API key and sync to Firebase
   * @param {string} apiKey - The API key to store
   * @param {string} userId - Optional user ID
   */
  async setApiKey(apiKey, userId = null) {
    const targetUserId = userId || this.getCurrentUserId();
    
    // Store in localStorage
    if (targetUserId) {
      if (apiKey && apiKey.trim()) {
        localStorage.setItem(`gemini_api_key_${targetUserId}`, apiKey.trim());
      } else {
        localStorage.removeItem(`gemini_api_key_${targetUserId}`);
      }
    }
    
    // Store global key
    if (apiKey && apiKey.trim()) {
      localStorage.setItem('gemini_api_key_global', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key_global');
    }
    
    // Sync to Firebase if possible
    if (targetUserId && apiKey && apiKey.trim()) {
      try {
        const { default: firestoreService } = await import('./firestoreService');
        await firestoreService.saveApiKey(targetUserId, apiKey.trim());
      } catch (error) {
        console.warn('Failed to sync API key to Firebase:', error);
      }
    }
    
    // Initialize with the new key
    if (apiKey && apiKey.trim()) {
      this.initialize(apiKey);
    }
  }

  /**
   * Load API key from Firebase and localStorage
   * @param {string} userId - User ID
   * @returns {Promise<string>} API key or empty string
   */
  async loadApiKey(userId = null) {
    const targetUserId = userId || this.getCurrentUserId();
    
    if (targetUserId) {
      try {
        const { default: firestoreService } = await import('./firestoreService');
        const cloudKey = await firestoreService.loadApiKey(targetUserId);
        if (cloudKey && cloudKey.trim()) {
          // Update localStorage with cloud key
          localStorage.setItem(`gemini_api_key_${targetUserId}`, cloudKey.trim());
          localStorage.setItem('gemini_api_key_global', cloudKey.trim());
          this.initialize(cloudKey);
          return cloudKey.trim();
        }
      } catch (error) {
        console.warn('Failed to load API key from Firebase:', error);
      }
    }
    
    // Fallback to localStorage
    const localKey = this.getApiKey(targetUserId);
    if (localKey) {
      this.initialize(localKey);
    }
    return localKey;
  }

  /**
   * Test connection to Gemini API using exact curl format from requirements
   * @param {string} apiKey - API key to test
   * @returns {Promise<object>} Test result
   */
  async testConnection(apiKey = null) {
    const testKey = apiKey || this.apiKey;
    if (!testKey) {
      return { 
        success: false, 
        message: 'No API key provided' 
      };
    }
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': testKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello"
                }
              ]
            }
          ]
        })
      });
      
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) {
            errorMsg = errData.error.message;
          }
        } catch {}
        return { success: false, message: errorMsg };
      }
      
      const data = await response.json();
      if (data?.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        return { success: true, message: 'Connection successful!' };
      } else {
        return { success: false, message: 'Invalid response format' };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Connection failed' };
    }
  }

  /**
   * Generate text response using exact curl format from requirements
   * @param {string} prompt - The input prompt
   * @returns {Promise<string>} AI response
   */
  async generateText(prompt) {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('Gemini service not initialized');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        let errorMsg = `API request failed: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) {
            errorMsg = errData.error.message;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  /**
   * Generate daily plan using AI
   * @param {object} userInfo - User information and preferences
   * @returns {Promise<Array>} Daily plan items
   */
  async generateDailyPlan(userInfo) {
    let noveltyPrompt = '';
    if (userInfo.novelty === 'high') {
      noveltyPrompt = 'Be highly novel, include unique, surprising, and varied activities, and provide detailed descriptions for each event.';
    } else if (userInfo.novelty === 'low') {
      noveltyPrompt = 'Be practical and keep events simple and to the point.';
    } else {
      noveltyPrompt = 'Balance novelty and practicality, and provide some variety.';
    }
    const prompt = `Create a daily plan for the user based on their information:

Goals: ${userInfo.goals?.map(g => `${g.title} (${g.category}, priority: ${g.priority})`).join(', ') || 'None'}
Preferences: ${JSON.stringify(userInfo.preferences || {})}
Current date: ${new Date().toLocaleDateString()}

Create a realistic daily schedule with exactly ${userInfo.eventCount || 7} activities. Return as a JSON array of objects with properties:
- time: "HH:MM" format
- title: Brief activity title
- description: Optional details (be more descriptive if novelty is high)
- category: One of "work", "health", "personal", "learning", "goal", "journal"

Highlight any events that are related to the user's goals or journaling by setting category to "goal" or "journal". ${noveltyPrompt}

Focus on balanced productivity, well-being, and novelty.`;

    const response = await this.generateText(prompt);
    
    // Simple JSON extraction - look for array in response
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to parse AI response, using fallback plan');
    }
    
    // Fallback plan if parsing fails
    return [
      { time: "08:00", title: "Morning routine", category: "personal" },
      { time: "09:00", title: "Focus work session", category: "work" },
      { time: "12:00", title: "Lunch break", category: "personal" },
      { time: "14:00", title: "Goal progress review", category: "work" },
      { time: "17:00", title: "Exercise", category: "health" },
      { time: "19:00", title: "Evening reflection", category: "personal" }
    ];
  }

  /**
   * Generate chat response
   * @param {string} message - User message
   * @param {object} context - Chat context
   * @returns {Promise<string>} AI response
   */
  async generateChatResponse(message, context = {}) {
    const prompt = `You are Drift, an AI productivity assistant. The user said: "${message}"

Context: ${JSON.stringify(context)}

Respond helpfully and concisely in a conversational tone.`;
    
    return this.generateText(prompt);
  }
}

// Create and export singleton instance
const geminiService = new GeminiService();

export default geminiService;