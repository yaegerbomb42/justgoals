import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Simplified Gemini AI Service using exact curl format from requirements
 * Supports both Gemini 2.0 Flash and 2.5 Flash models
 */
class GeminiService {
  constructor() {
    this.apiKey = null;
    this.modelName = 'gemini-2.0-flash';
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  async initialize(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  async generateContent(prompt, customApiKey = null) {
    const apiKey = customApiKey || this.apiKey;
    if (!apiKey) {
      throw new Error('Gemini service not initialized. Please set your API key.');
    }

    const body = JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
        } else if (response.status >= 500) {
          throw new Error('Gemini service is temporarily unavailable. Please try again later.');
        } else {
          throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Received empty response from Gemini. Please try rephrasing your request.');
      }
      
      return text;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try a shorter or simpler request.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw error;
    }
  }

  async generateResponse(userMessage, context, capabilities = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini service not initialized. Please set your API key.');
    }

    const systemPrompt = this.buildSystemPrompt(context, capabilities);
    const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nDrift:`;
    
    try {
      const text = await this.generateContent(fullPrompt);
      
      // Simple parsing - just return the text with minimal processing
      const cleanMessage = text
        .replace(/===ACTION===[\s\S]*?===END_ACTION===/g, '')
        .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '')
        .trim();

      return {
        message: cleanMessage || text || "I'm here to help! How can I assist you with your goals today?",
        actions: [],
        suggestions: [],
      };
    } catch (error) {
      console.error('Error generating response:', error);
      if (error.message.includes('API key')) {
        throw new Error('Please check your Gemini API key in Settings.');
      }
      throw new Error('I encountered an issue generating a response. Please try again.');
    }
  }

  buildSystemPrompt(context, capabilities) {
    const basePrompt = `You are Drift, a helpful AI assistant for goal achievement and productivity.

User Context:
- Name: ${context?.user?.name || 'User'}
- Current Goals: ${context?.currentGoals?.length || 0} active goals
- Conversation History: ${context?.conversationHistory?.length || 0} previous messages

Keep responses:
- Conversational and friendly
- Practical and actionable
- Concise (2-3 sentences max)
- Focused on helping with goals and productivity

Be encouraging and supportive in your responses.`;

    return basePrompt;
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
    if (!this.apiKey) {
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
      const text = await this.generateContent(prompt);
      return text;
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return 'I encountered an error while analyzing your progress. Please try again.';
    }
  }

  async generateGoalSuggestions(userPreferences, currentGoals) {
    if (!this.apiKey) {
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
      const text = await this.generateContent(prompt);
      return text;
    } catch (error) {
      console.error('Error generating goal suggestions:', error);
      return 'I encountered an error while generating goal suggestions. Please try again.';
    }
  }

  async generateDailyPlan(goals, preferences) {
    if (!this.apiKey) {
      throw new Error('Gemini service not initialized');
    }

    // Ensure goals is an array
    const goalsArray = Array.isArray(goals) ? goals : [];
    const userPrefs = preferences || {};

    const prompt = `Create a daily plan for the user based on their goals and preferences:

Active Goals:
${goalsArray.filter(g => g && !g.completed).map(goal => `- ${goal.title || 'Untitled Goal'}: ${goal.description || 'No description'}`).join('\n') || 'No active goals currently'}

User Preferences:
${JSON.stringify(userPrefs, null, 2)}

Create a structured daily plan that:
1. Prioritizes the most important goals
2. Includes specific tasks and time blocks
3. Accounts for user preferences and energy levels
4. Provides motivation and context for each task

Return a JSON array of daily tasks with this structure:
[
  {
    "title": "Task name",
    "startTime": "09:00",
    "endTime": "10:00",
    "description": "Brief description",
    "priority": "high|medium|low",
    "type": "work|personal|health|break"
  }
]

Format ONLY as valid JSON array, no other text.`;

    try {
      const text = await this.generateContent(prompt);
      
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const tasks = JSON.parse(jsonMatch[0]);
          if (Array.isArray(tasks)) {
            return tasks;
          }
        } catch (parseError) {
          console.warn('Could not parse JSON from daily plan response:', parseError);
        }
      }
      
      // Fallback: return the raw text
      return text;
    } catch (error) {
      console.error('Error generating daily plan:', error);
      throw new Error('Failed to generate daily plan. Please check your API key and try again.');
    }
  }

  async generateMotivationalMessage(goals, recentActivity) {
    if (!this.apiKey) {
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
      const text = await this.generateContent(prompt);
      return text;
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
      const text = await this.generateContent('Hello');
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