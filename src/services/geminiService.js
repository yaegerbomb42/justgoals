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
    
    // Test the API key to ensure it's valid
    try {
      await this.generateContent('Hello');
      return true;
    } catch (error) {
      this.apiKey = null;
      throw new Error('Invalid API key provided');
    }
  }

  // Enhanced method to initialize from settings context
  initializeFromSettings(settings) {
    const apiKey = settings?.geminiApiKey;
    if (!apiKey) {
      console.warn('No Gemini API key found in settings');
      return false;
    }
    
    this.setApiKey(apiKey);
    return true;
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
      
      // Parse actions from the response
      const actions = this.parseActions(text);
      
      // Clean the message by removing action blocks
      const cleanMessage = text
        .replace(/===ACTION===[\s\S]*?===END_ACTION===/g, '')
        .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '')
        .trim();

      // Extract suggestions from the response
      const suggestions = this.extractSuggestions(cleanMessage);

      return {
        message: cleanMessage || text || "I'm here to help! How can I assist you with your goals today?",
        actions: actions,
        suggestions: suggestions,
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
- Recent Activity: ${context?.recentActivity ? JSON.stringify(context.recentActivity).substring(0, 200) : 'None'}
- User Patterns: ${context?.userPatterns ? Object.keys(context.userPatterns).join(', ') : 'None'}

Available Actions:`;

    let actionsPrompt = "";
    if (capabilities.canCreateGoals) {
      actionsPrompt += `
- CREATE GOAL: When user wants to create a goal, use: [ACTION]{"type": "create_goal", "data": {"title": "Goal Title", "description": "Goal Description", "category": "personal|health|career|education", "priority": "high|medium|low", "deadline": "YYYY-MM-DD"}}[/ACTION]
- CREATE GOAL UI: To show interactive goal creation UI, use: [ACTION]{"type": "show_goal_ui", "data": {"action": "create", "prefilled": {}}}[/ACTION]`;
    }
    
    if (capabilities.canCreateMilestones) {
      actionsPrompt += `
- CREATE MILESTONE: When user wants to add milestones, use: [ACTION]{"type": "create_milestone", "data": {"title": "Milestone Title", "description": "Description", "goalId": "goal_id", "deadline": "YYYY-MM-DD", "priority": "high|medium|low"}}[/ACTION]`;
    }
    
    if (capabilities.canManageHabits) {
      actionsPrompt += `
- CREATE HABIT: When user wants to create habits, use: [ACTION]{"type": "create_habit", "data": {"title": "Habit Title", "description": "Description", "frequency": "daily|weekly", "category": "health|productivity|personal"}}[/ACTION]
- CREATE HABIT UI: To show interactive habit creation UI, use: [ACTION]{"type": "show_habit_ui", "data": {"action": "create", "prefilled": {}}}[/ACTION]`;
    }
    
    if (capabilities.canAddJournalEntries) {
      actionsPrompt += `
- ADD JOURNAL ENTRY: When user wants to journal, use: [ACTION]{"type": "add_journal_entry", "data": {"title": "Entry Title", "content": "Journal content", "mood": "happy|neutral|sad", "tags": ["tag1", "tag2"]}}[/ACTION]`;
    }

    actionsPrompt += `
- NAVIGATE: To send user to specific page, use: [ACTION]{"type": "navigate_to", "data": {"path": "/goals-dashboard|/habits|/meals|/day|/analytics-dashboard"}}[/ACTION]`;

    const instructionsPrompt = `
Instructions:
1. Keep responses conversational and friendly
2. Be practical and actionable
3. Use interactive UI actions (show_goal_ui, show_habit_ui) when users want to create or edit items
4. Provide specific, helpful advice based on user's context and patterns
5. Be encouraging and supportive
6. When creating items for users, prefer showing UI over direct actions for better user experience
7. Always explain what you're doing when taking actions
8. Use the user's historical data and patterns to provide personalized recommendations

Context Usage:
- Reference user's existing goals when suggesting new ones
- Consider their patterns and preferences
- Build on their previous conversations
- Acknowledge their progress and achievements

Respond naturally first, then add appropriate actions if needed.`;

    return basePrompt + actionsPrompt + instructionsPrompt;
  }

  parseActions(responseText) {
    const actions = [];
    
    // Look for [ACTION] blocks
    const actionMatches = responseText.match(/\[ACTION\](.*?)\[\/ACTION\]/gs);
    if (actionMatches) {
      for (const match of actionMatches) {
        try {
          const jsonStr = match.replace(/\[ACTION\]|\[\/ACTION\]/g, '').trim();
          const actionData = JSON.parse(jsonStr);
          actions.push(actionData);
        } catch (parseError) {
          console.warn('Could not parse action:', parseError);
        }
      }
    }
    
    // Also look for legacy ===ACTION=== format
    const legacyMatches = responseText.match(/===ACTION===\s*(\{[\s\S]*?\})\s*===END_ACTION===/g);
    if (legacyMatches) {
      for (const match of legacyMatches) {
        try {
          const jsonStr = match.replace(/===ACTION===|===END_ACTION===/g, '').trim();
          const actionData = JSON.parse(jsonStr);
          actions.push(actionData);
        } catch (parseError) {
          console.warn('Could not parse legacy action:', parseError);
        }
      }
    }
    
    return actions;
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

  // New method for AI-powered note prioritization
  async prioritizeNotes(notes, context = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini service not initialized. Please set your API key.');
    }

    if (!Array.isArray(notes) || notes.length === 0) {
      return notes;
    }

    const prompt = `Analyze and prioritize these notes based on importance and urgency:

Notes:
${notes.map((note, index) => `${index + 1}. ${note.title || 'Untitled'}: ${note.content || note.description || 'No content'}`).join('\n')}

Return a JSON array with reordered note indices by priority:
[{"originalIndex": 0, "priorityScore": 8, "reason": "High priority reason"}]

Return ONLY the JSON array.`;

    try {
      const text = await this.generateContent(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          const priorities = JSON.parse(jsonMatch[0]);
          
          // Reorder notes based on priorities
          const prioritizedNotes = priorities
            .filter(p => p.originalIndex < notes.length)
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .map(p => ({
              ...notes[p.originalIndex],
              priorityScore: p.priorityScore,
              priorityReason: p.reason
            }));
          
          return prioritizedNotes;
        } catch (parseError) {
          console.warn('Could not parse prioritization response:', parseError);
          return notes;
        }
      }
      
      return notes;
    } catch (error) {
      console.error('Error prioritizing notes:', error);
      return notes; // Return original notes if AI fails
    }
  }
}

// Create singleton instance
const geminiService = new GeminiService();

export { geminiService };