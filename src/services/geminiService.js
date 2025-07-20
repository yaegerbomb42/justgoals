import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Simplified Gemini AI Service using exact curl format from requirements
 * Supports both Gemini 2.0 Flash and 2.5 Flash models
 */
class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.apiKey = null;
  }

  async initialize(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateResponse(userMessage, context, capabilities = {}) {
    if (!this.model) {
      throw new Error('Gemini service not initialized. Please set your API key.');
    }

    const systemPrompt = this.buildSystemPrompt(context, capabilities);
    const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nDrift:`;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response for actions and suggestions
      const parsedResponse = this.parseResponse(text);
      
      return {
        message: parsedResponse.message,
        actions: parsedResponse.actions || [],
        suggestions: parsedResponse.suggestions || [],
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  buildSystemPrompt(context, capabilities) {
    const basePrompt = `You are Drift, an intelligent AI assistant for the JustGoals app. You help users achieve their goals, manage their time, and improve their productivity.

Your personality:
- Friendly, encouraging, and motivational
- Practical and actionable in your advice
- Understanding of human psychology and behavior change
- Always supportive and non-judgmental

Current user context:
- User: ${context.user?.name || 'User'} (${context.user?.email || 'No email'})
- Active goals: ${context.currentGoals?.length || 0} goals
- Recent activity: ${JSON.stringify(context.recentActivity)}
- User preferences: ${JSON.stringify(context.userPreferences)}

Conversation history (last 10 messages):
${context.conversationHistory?.map(msg => `${msg.role}: ${msg.content}`).join('\n') || 'No previous conversation'}

Your capabilities:`;

    let capabilitiesPrompt = '';
    if (capabilities.canCreateGoals) {
      capabilitiesPrompt += `
- CREATE_GOAL: You can create new goals for users. When a user wants to create a goal, respond with the goal details and include an action.
- UPDATE_GOAL: You can update existing goals (progress, status, details, etc.)
- CREATE_MILESTONE: You can create milestones for existing goals
- ADD_JOURNAL_ENTRY: You can help users add journal entries for reflection
- CREATE_HABIT: You can help users create new habits
- ANALYZE_PROGRESS: You can analyze user progress and provide insights
- NAVIGATE_TO: You can suggest navigation to different app sections`;
    }

    const actionFormatPrompt = `
When you need to perform an action, format your response like this:
===ACTION===
{
  "type": "action_type",
  "data": {
    // action-specific data
  }
}
===END_ACTION===

Available actions:
1. create_goal: Create a new goal
   Data: { title, description, category, priority, deadline, milestones }

2. update_goal: Update an existing goal
   Data: { goalId, updates: { field: value } }

3. create_milestone: Create a milestone for a goal
   Data: { title, description, goalId, dueDate }

4. add_journal_entry: Add a journal entry
   Data: { title, content, mood, tags }

5. create_habit: Create a new habit
   Data: { title, description, frequency }

6. analyze_progress: Analyze user progress
   Data: { goals, timeframe }

7. navigate_to: Navigate to app section
   Data: { path }

Always provide a helpful, conversational response first, then include any actions if needed.`;

    return basePrompt + capabilitiesPrompt + actionFormatPrompt;
  }

  parseResponse(responseText) {
    const message = responseText.replace(/===ACTION===\s*\{[\s\S]*?\}\s*===END_ACTION===/g, '').trim();
    
    const actionMatch = responseText.match(/===ACTION===\s*(\{[\s\S]*?\})\s*===END_ACTION===/);
    let actions = [];
    
    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1]);
        actions = Array.isArray(actionData) ? actionData : [actionData];
      } catch (error) {
        console.error('Error parsing action:', error);
      }
    }

    // Extract suggestions from the message
    const suggestions = this.extractSuggestions(message);

    return {
      message,
      actions,
      suggestions,
    };
  }

  extractSuggestions(message) {
    const suggestions = [];
    
    // Look for common suggestion patterns
    if (message.includes('Would you like me to')) {
      const suggestionMatch = message.match(/Would you like me to ([^?]+)\?/);
      if (suggestionMatch) {
        suggestions.push(suggestionMatch[1].trim());
      }
    }

    if (message.includes('I can help you')) {
      const suggestionMatch = message.match(/I can help you ([^.]+)/);
      if (suggestionMatch) {
        suggestions.push(suggestionMatch[1].trim());
      }
    }

    return suggestions;
  }

  async analyzeProgress(goals, recentActivity) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Analyze the user's progress and provide insights:

Current Goals:
${goals.map(goal => `- ${goal.title}: ${goal.progress}% complete, ${goal.completed ? 'COMPLETED' : 'IN PROGRESS'}`).join('\n')}

Recent Activity:
${JSON.stringify(recentActivity)}

Please provide:
1. Overall progress assessment
2. Areas of strength
3. Areas for improvement
4. Specific recommendations
5. Motivation and encouragement

Keep it concise but comprehensive.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return 'I encountered an error while analyzing your progress. Please try again.';
    }
  }

  async generateGoalSuggestions(userPreferences, currentGoals) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Based on the user's preferences and current goals, suggest 3-5 new goals that would be beneficial:

User Preferences:
${JSON.stringify(userPreferences)}

Current Goals:
${currentGoals.map(goal => `- ${goal.title} (${goal.category})`).join('\n')}

Suggest goals that:
1. Complement existing goals
2. Address different areas of life
3. Are realistic and achievable
4. Align with user preferences

Format each suggestion as: "Title: Brief description"`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating goal suggestions:', error);
      return 'I encountered an error while generating goal suggestions. Please try again.';
    }
  }

  async generateDailyPlan(goals, preferences) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Create a daily plan for the user based on their goals and preferences:

Active Goals:
${goals.filter(g => !g.completed).map(goal => `- ${goal.title}: ${goal.description}`).join('\n')}

User Preferences:
${JSON.stringify(preferences)}

Create a structured daily plan that:
1. Prioritizes the most important goals
2. Includes specific tasks and time blocks
3. Accounts for user preferences and energy levels
4. Provides motivation and context for each task

Format as a clear, actionable daily schedule.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating daily plan:', error);
      return 'I encountered an error while generating your daily plan. Please try again.';
    }
  }

  async generateMotivationalMessage(goals, recentActivity) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Generate a motivational message for the user based on their goals and recent activity:

Goals:
${goals.map(goal => `- ${goal.title}: ${goal.progress}% complete`).join('\n')}

Recent Activity:
${JSON.stringify(recentActivity)}

Create a motivational message that:
1. Acknowledges their progress
2. Provides encouragement
3. Offers specific, actionable advice
4. Maintains a positive, supportive tone
5. Is personalized to their situation

Keep it concise but impactful.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating motivational message:', error);
      return 'Keep pushing forward! Every step you take brings you closer to your goals.';
    }
  }

  // Legacy methods for backward compatibility
  async generateChatResponse(message, context) {
    return this.generateResponse(message, context);
  }

  async testConnection(apiKey) {
    try {
      await this.initialize(apiKey);
      const result = await this.model.generateContent('Hello');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadApiKey(userId) {
    try {
      const key = localStorage.getItem(`gemini_api_key_${userId}`);
      if (key) {
        await this.initialize(key);
        return key;
      }
      return null;
    } catch (error) {
      console.error('Error loading API key:', error);
      return null;
    }
  }
}

// Create singleton instance
const geminiService = new GeminiService();

export { geminiService };