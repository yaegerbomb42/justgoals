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

Available Actions:`;

    let actionsPrompt = "";
    if (capabilities.canCreateGoals) {
      actionsPrompt += `
- CREATE GOAL: When user wants to create a goal, use: [ACTION]{"type": "create_goal", "data": {"title": "Goal Title", "description": "Goal Description", "category": "personal|health|career|education", "priority": "high|medium|low", "deadline": "YYYY-MM-DD"}}[/ACTION]`;
    }
    
    if (capabilities.canCreateMilestones) {
      actionsPrompt += `
- CREATE MILESTONE: When user wants to add milestones, use: [ACTION]{"type": "create_milestone", "data": {"title": "Milestone Title", "description": "Description", "goalId": "goal_id", "deadline": "YYYY-MM-DD", "priority": "high|medium|low"}}[/ACTION]`;
    }
    
    if (capabilities.canManageHabits) {
      actionsPrompt += `
- CREATE HABIT: When user wants to create habits, use: [ACTION]{"type": "create_habit", "data": {"title": "Habit Title", "description": "Description", "frequency": "daily|weekly", "category": "health|productivity|personal"}}[/ACTION]`;
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
3. Use actions when appropriate to help users
4. Provide specific, helpful advice
5. Be encouraging and supportive
6. When creating items for users, use the action format shown above
7. Always explain what you're doing when taking actions

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

  // Enhanced AI-powered goal prioritization using strategic importance analysis
  async prioritizeGoals(goals, userContext = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini service not initialized. Please set your API key.');
    }

    if (!Array.isArray(goals) || goals.length === 0) {
      return goals;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const daysInYear = 365;
    const currentDayOfYear = Math.floor((now - new Date(currentYear, 0, 0)) / 86400000);

    // Analyze goals for priority factors
    const goalsForAI = goals.map((goal, index) => {
      const deadline = goal.targetDate || goal.deadline;
      const daysUntilDeadline = deadline ? 
        Math.floor((new Date(deadline) - now) / 86400000) : null;
      
      // Calculate impact signals
      const title = goal.title?.toLowerCase() || '';
      const description = goal.description?.toLowerCase() || '';
      const text = `${title} ${description}`;
      
      // Impact indicators
      const careerKeywords = ['career', 'job', 'promotion', 'skill', 'learning', 'certification', 'degree', 'network'];
      const healthKeywords = ['health', 'fitness', 'exercise', 'diet', 'medical', 'wellness', 'weight', 'mental'];
      const financialKeywords = ['money', 'financial', 'save', 'invest', 'debt', 'income', 'budget', 'retire'];
      const relationshipKeywords = ['family', 'relationship', 'social', 'friend', 'marriage', 'children', 'parent'];
      const personalKeywords = ['personal', 'growth', 'happiness', 'hobby', 'passion', 'travel', 'experience'];
      
      const hasCareerImpact = careerKeywords.some(k => text.includes(k));
      const hasHealthImpact = healthKeywords.some(k => text.includes(k));
      const hasFinancialImpact = financialKeywords.some(k => text.includes(k));
      const hasRelationshipImpact = relationshipKeywords.some(k => text.includes(k));
      const hasPersonalImpact = personalKeywords.some(k => text.includes(k));
      
      // Time sensitivity indicators
      const urgentKeywords = ['urgent', 'deadline', 'soon', 'immediate', 'critical', 'emergency'];
      const hasTimeUrgency = urgentKeywords.some(k => text.includes(k));
      
      return {
        originalIndex: index,
        id: goal.id,
        title: goal.title,
        description: goal.description || 'No description',
        category: goal.category || 'general',
        currentPriority: goal.priority || 'medium',
        progress: goal.progress || 0,
        deadline: deadline,
        daysUntilDeadline,
        hasCareerImpact,
        hasHealthImpact,
        hasFinancialImpact,
        hasRelationshipImpact,
        hasPersonalImpact,
        hasTimeUrgency,
        createdAt: goal.createdAt,
        milestoneCount: goal.milestones?.length || 0
      };
    });

    const prompt = `You are a strategic life coach specializing in goal prioritization using evidence-based frameworks. Analyze and prioritize these ${goals.length} goals.

CURRENT CONTEXT:
- Date: ${now.toISOString().split('T')[0]}
- Progress through year: ${Math.round((currentDayOfYear / daysInYear) * 100)}%
- User context: ${JSON.stringify(userContext, null, 2)}

GOALS TO PRIORITIZE:
${goalsForAI.map((g, i) => `${i + 1}. "${g.title}"
   Category: ${g.category}
   Current Priority: ${g.currentPriority}
   Progress: ${g.progress}%
   Deadline: ${g.deadline || 'No deadline'}
   Days until deadline: ${g.daysUntilDeadline || 'N/A'}
   Impact areas: ${[
     g.hasCareerImpact ? 'CAREER' : '',
     g.hasHealthImpact ? 'HEALTH' : '', 
     g.hasFinancialImpact ? 'FINANCIAL' : '',
     g.hasRelationshipImpact ? 'RELATIONSHIPS' : '',
     g.hasPersonalImpact ? 'PERSONAL' : ''
   ].filter(Boolean).join(', ') || 'GENERAL'}
   Time urgency: ${g.hasTimeUrgency ? 'HIGH' : 'NORMAL'}
   Description: ${g.description}`).join('\n\n')}

PRIORITIZATION FRAMEWORK:
Use the Strategic Goal Priority Matrix considering:

1. LIFE IMPACT WEIGHT (40%):
   - Career/Financial: High long-term impact
   - Health: Critical foundation for everything else
   - Relationships: Essential for happiness and support
   - Personal Growth: Important for fulfillment

2. TIME SENSITIVITY (30%):
   - Immediate deadlines (days/weeks)
   - Time-bound opportunities
   - Seasonal/cyclical goals
   - Age-dependent goals

3. MOMENTUM & FEASIBILITY (20%):
   - Current progress
   - Available resources
   - Skill requirements
   - Dependencies on other goals

4. COMPOUND EFFECTS (10%):
   - Goals that enable other goals
   - Habit-forming goals
   - Network/relationship building
   - Skill acquisition goals

PRIORITY SCALE:
- CRITICAL (9-10): Life-changing impact + urgent timing
- HIGH (7-8): Major impact + good timing, or critical foundation goals
- MEDIUM (4-6): Important but flexible timing, or moderate impact
- LOW (1-3): Nice-to-have, exploratory, or can be delayed

STRATEGIC GUIDELINES:
- Limit CRITICAL to 1-2 goals max (focus is key)
- Ensure balance across life areas (don't neglect health for career)
- Consider goal interdependencies (some goals unlock others)
- Factor in energy and time constraints
- Prioritize foundational goals (health, relationships, core skills)
- Time-bound opportunities get urgency boost
- Goals with momentum (>50% progress) may need completion focus

For each goal, return priority score (1-10), confidence (1-10), strategic reasoning, and recommended action:

[{
  "originalIndex": 0,
  "priorityScore": 8,
  "confidence": 9,
  "strategicReason": "Health foundation enables all other goals + time-sensitive window",
  "recommendedAction": "immediate_focus",
  "impactAreas": ["health", "energy", "longevity"],
  "timeframe": "next_3_months"
}]

Return ONLY the JSON array.`;

    try {
      const text = await this.generateContent(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          const priorities = JSON.parse(jsonMatch[0]);
          
          // Validate and enhance response
          if (!Array.isArray(priorities) || priorities.length === 0) {
            console.warn('Invalid goal prioritization response');
            return goals;
          }

          // Balance priority distribution
          const balancedPriorities = this.balanceGoalPriorities(priorities);
          
          // Reorder goals based on priorities and add metadata
          const prioritizedGoals = balancedPriorities
            .filter(p => p.originalIndex < goals.length)
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .map(p => ({
              ...goals[p.originalIndex],
              aiPriorityScore: p.priorityScore,
              aiConfidence: p.confidence,
              aiReasoning: p.strategicReason,
              aiRecommendedAction: p.recommendedAction,
              aiImpactAreas: p.impactAreas,
              aiTimeframe: p.timeframe,
              aiPrioritizedAt: new Date().toISOString()
            }));
          
          return prioritizedGoals;
        } catch (parseError) {
          console.warn('Could not parse goal prioritization response:', parseError);
          return goals;
        }
      }
      
      return goals;
    } catch (error) {
      console.error('Error prioritizing goals:', error);
      return goals; // Return original goals if AI fails
    }
  }

  // Balance goal priority distribution
  balanceGoalPriorities(priorities) {
    if (priorities.length <= 3) return priorities;
    
    // Limit critical priorities to avoid "everything is urgent" syndrome
    const maxCritical = Math.max(1, Math.floor(priorities.length * 0.20)); // Max 20% critical
    const maxHigh = Math.max(1, Math.floor(priorities.length * 0.35)); // Max 35% high
    
    const criticalPriorities = priorities.filter(p => p.priorityScore >= 9);
    const highPriorities = priorities.filter(p => p.priorityScore >= 7 && p.priorityScore < 9);
    
    // If too many critical priorities, demote the least confident ones
    if (criticalPriorities.length > maxCritical) {
      const sortedByConfidence = criticalPriorities.sort((a, b) => b.confidence - a.confidence);
      
      sortedByConfidence.slice(maxCritical).forEach(p => {
        p.priorityScore = Math.max(7, p.priorityScore - 2);
        p.strategicReason = `${p.strategicReason} (Balanced from critical to maintain focus)`;
      });
    }
    
    // Similar balancing for high priorities
    if (highPriorities.length > maxHigh) {
      const sortedByConfidence = highPriorities.sort((a, b) => b.confidence - a.confidence);
      
      sortedByConfidence.slice(maxHigh).forEach(p => {
        p.priorityScore = Math.max(4, p.priorityScore - 2);
        p.strategicReason = `${p.strategicReason} (Balanced to medium priority for realistic execution)`;
      });
    }
    
    return priorities;
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