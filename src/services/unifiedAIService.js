// Unified AI Service for JustGoals
// Provides a single Drift personality and shared memory for all AI interactions

import contextAggregationService from './contextAggregationService';
import { geminiService } from './geminiService';

class UnifiedAIService {
  constructor() {
    this.personality = 'Drift'; // Consistent AI name
    // Shared memory per user (persisted to localStorage)
    this.conversationHistoryByUser = new Map();
    this.contextService = contextAggregationService;
    this.maxHistoryLength = 100; // Limit memory size for performance
  }

  storageKey(userId) {
    return `unified-ai-history-${userId || 'anonymous'}`;
  }

  ensureLoaded(userId) {
    const keyUserId = userId || 'anonymous';
    if (this.conversationHistoryByUser.has(keyUserId)) return;

    try {
      const raw = localStorage.getItem(this.storageKey(keyUserId));
      if (!raw) {
        this.conversationHistoryByUser.set(keyUserId, []);
        return;
      }
      const parsed = JSON.parse(raw);
      const history = Array.isArray(parsed?.messages) ? parsed.messages : [];
      this.conversationHistoryByUser.set(keyUserId, history.slice(-this.maxHistoryLength));
    } catch (e) {
      // If localStorage is unavailable or data is malformed, fall back to in-memory only
      this.conversationHistoryByUser.set(keyUserId, []);
    }
  }

  persist(userId) {
    const keyUserId = userId || 'anonymous';
    const history = this.conversationHistoryByUser.get(keyUserId) || [];
    try {
      localStorage.setItem(
        this.storageKey(keyUserId),
        JSON.stringify({ messages: history, timestamp: Date.now() })
      );
    } catch (e) {
      // Ignore persistence failures (private mode, quota, etc.)
    }
  }

  // Add message to shared memory
  addMessage(userId, role, content) {
    const keyUserId = userId || 'anonymous';
    this.ensureLoaded(keyUserId);

    const history = this.conversationHistoryByUser.get(keyUserId) || [];
    history.push({ role, content, timestamp: new Date().toISOString() });
    if (history.length > this.maxHistoryLength) {
      history.splice(0, history.length - this.maxHistoryLength);
    }
    this.conversationHistoryByUser.set(keyUserId, history);
    this.persist(keyUserId);
  }

  // Get shared conversation history
  getHistory(userId) {
    const keyUserId = userId || 'anonymous';
    this.ensureLoaded(keyUserId);
    return [...(this.conversationHistoryByUser.get(keyUserId) || [])];
  }

  clearHistory(userId) {
    const keyUserId = userId || 'anonymous';
    this.conversationHistoryByUser.set(keyUserId, []);
    try {
      localStorage.removeItem(this.storageKey(keyUserId));
    } catch (e) {
      // ignore
    }
  }

  // Get comprehensive context for AI
  async getContext(userId, currentGoals = [], settings = {}) {
    return await this.contextService.getComprehensiveContext(userId, currentGoals, settings);
  }

  // Generate AI response using Gemini service
  async getResponse(userId, message, currentGoals = [], settings = {}, domain = 'general') {
    this.addMessage(userId, 'user', message);
    const context = await this.getContext(userId, currentGoals, settings);

    // Add conversation history to context for better responses
    context.conversationHistory = this.getHistory(userId);

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
      this.addMessage(userId, 'assistant', aiReply);
      return aiReply;
    } catch (error) {
      const errorMessage = error.message || 'AI service error';
      this.addMessage(userId, 'assistant', errorMessage);
      return errorMessage;
    }
  }
}

export default new UnifiedAIService();
