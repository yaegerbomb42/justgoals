// Unified AI Service for JustGoals
// Provides a single Drift personality and shared memory for all AI interactions

import ContextAggregationService from './contextAggregationService';
import { geminiService } from './geminiService';

class UnifiedAIService {
  constructor() {
    this.personality = 'Drift'; // Consistent AI name
    this.conversationHistory = []; // Shared memory for all AI tabs
    this.contextService = new ContextAggregationService();
    this.maxHistoryLength = 100; // Limit memory size for performance
  }

  // Add message to shared memory
  addMessage(role, content) {
    this.conversationHistory.push({ role, content, timestamp: new Date().toISOString() });
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  // Get shared conversation history
  getHistory() {
    return [...this.conversationHistory];
  }

  // Get comprehensive context for AI
  async getContext(userId, currentGoals = [], settings = {}) {
    return await this.contextService.getComprehensiveContext(userId, currentGoals, settings);
  }

  // Generate AI response using Gemini service
  async getResponse(userId, message, currentGoals = [], settings = {}, domain = 'general') {
    this.addMessage('user', message);
    const context = await this.getContext(userId, currentGoals, settings);

    // Add conversation history to context for better responses
    context.conversationHistory = this.getHistory();

    // Define domain-specific capabilities
    const capabilitiesMap = {
      'meals': { canCreateMeals: true, canUpdatePreferences: true },
      'habits': { canManageHabits: true },
      'milestones': { canCreateMilestones: true },
      'goal-planning': { canCreateGoals: true },
      'general': {}
    };

    const capabilities = capabilitiesMap[domain] || {};

    try {
      const response = await geminiService.generateResponse(message, context, capabilities);
      const aiReply = response.message || 'Sorry, I did not understand that.';
      this.addMessage('assistant', aiReply);
      return aiReply;
    } catch (error) {
      const errorMessage = error.message || 'AI service error';
      this.addMessage('assistant', errorMessage);
      return errorMessage;
    }
  }
}

export default new UnifiedAIService();
