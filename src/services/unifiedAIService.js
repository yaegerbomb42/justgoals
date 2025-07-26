// Unified AI Service for JustGoals
// Provides a single Drift personality and shared memory for all AI interactions

import ContextAggregationService from './contextAggregationService';

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

  // Generate AI response (stub: replace with Gemini/OpenAI integration)
  async getResponse(userId, message, currentGoals = [], settings = {}, domain = 'general') {
    this.addMessage('user', message);
    const context = await this.getContext(userId, currentGoals, settings);
    // Compose prompt with personality, history, and context
    const prompt = `You are Drift, the unified AI assistant for JustGoals. Your memory and personality are shared across all tabs. Domain: ${domain}.\n\nRecent conversation:\n${this.getHistory().map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser context:\n${JSON.stringify(context)}`;
    // TODO: Integrate with Gemini/OpenAI API here
    const aiReply = `Drift: (AI response for '${message}' in domain '${domain}')`;
    this.addMessage('assistant', aiReply);
    return aiReply;
  }
}

export default new UnifiedAIService();
