import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI Service for goal tracking and assistance
 * Provides real AI functionality for the progress app
 */
class GeminiService {
  constructor() {
    this.apiKey = null;
    this.isInitialized = false;
    // Use Gemini 2.5 Flash from Google AI Studio
    this.model = 'gemini-2.5-flash';
    this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    console.log('[GeminiService] Initialized with model:', this.model);
  }

  initialize(apiKey = null) {
    // If no API key provided, try to get using standardized method
    if (!apiKey) {
      apiKey = this.getApiKey();
    }

    if (apiKey && apiKey.trim()) {
      this.apiKey = apiKey.trim();
      this.isInitialized = true;
      console.log('[GeminiService] Initialized successfully with model:', this.model);
      console.log('[GeminiService] Base URL:', this.baseUrl);
      return true;
    } else {
      this.isInitialized = false;
      console.warn('[GeminiService] No API key provided');
      return false;
    }
  }

  getCurrentUserId() {
    // Try to get user ID from auth context or localStorage
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
   * Get API key with fallback logic for user-specific and global keys
   * @param {string} userId - Optional user ID. If not provided, uses current user ID
   * @returns {string} API key or empty string if not found
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
    
    // Final fallback to legacy key
    const legacyKey = localStorage.getItem('gemini_api_key');
    if (legacyKey && legacyKey.trim()) {
      return legacyKey.trim();
    }
    
    return '';
  }

  /**
   * Set API key for user or globally
   * @param {string} apiKey - The API key to store
   * @param {string} userId - Optional user ID. If not provided, uses current user ID or stores globally
   */
  setApiKey(apiKey, userId = null) {
    const targetUserId = userId || this.getCurrentUserId();
    
    if (targetUserId) {
      // Store user-specific key
      if (apiKey && apiKey.trim()) {
        localStorage.setItem(`gemini_api_key_${targetUserId}`, apiKey.trim());
      } else {
        localStorage.removeItem(`gemini_api_key_${targetUserId}`);
      }
    } else {
      // Store global key if no user ID available
      if (apiKey && apiKey.trim()) {
        localStorage.setItem('gemini_api_key_global', apiKey.trim());
      } else {
        localStorage.removeItem('gemini_api_key_global');
      }
    }
    
    // Initialize with the new key
    if (apiKey && apiKey.trim()) {
      this.initialize(apiKey);
    }
  }

  /**
   * Get model information
   * @returns {object} Model information
   */
  getModelInfo() {
    return {
      model: this.model,
      baseUrl: this.baseUrl,
      isInitialized: this.isInitialized,
      provider: 'Google AI Studio'
    };
  }

  /**
   * Check connection using user's API key
   * @param {string} userId - Optional user ID. If not provided, uses current user ID
   * @returns {Promise<object>} Connection test result
   */
  async checkConnection(userId = null) {
    const apiKey = this.getApiKey(userId);
    if (!apiKey) {
      return { 
        success: false, 
        status: 'no_key', 
        message: 'No API key found. Please configure your Gemini API key.' 
      };
    }
    
    return this.testConnection(apiKey);
  }

  /**
   * Test Gemini API key connection by making a minimal request.
   * Returns an object: { success: boolean, status: string, message: string }
   */
  async testConnection(apiKey) {
    try {
      const response = await fetch(this.baseUrl + '?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: 'Hello' }] }],
          generationConfig: {
            maxOutputTokens: 10
          }
        })
      });
      
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error && errData.error.message) {
            errorMsg = errData.error.message;
            // Check for quota exceeded
            if (response.status === 429 || errorMsg.includes('quota')) {
              return { success: true, status: 'quota_exceeded', message: 'API key is valid but quota exceeded. Please check your billing.' };
            }
          }
        } catch {}
        return { success: false, status: 'error', message: errorMsg };
      }
      
      const data = await response.json();
      if (Array.isArray(data.candidates)) {
        return { success: true, status: 'success', message: 'Connection successful!' };
      } else {
        return { success: false, status: 'error', message: 'No candidates returned. API key may be invalid or not enabled for Gemini.' };
      }
    } catch (e) {
      return { success: false, status: 'error', message: e.message || 'Unknown error' };
    }
  }

  /**
   * Generate text response from Gemini (alias for generateText for compatibility)
   * @param {string} prompt - The input prompt
   * @param {string} apiKey - Optional API key override
   * @returns {Promise<string>} AI response
   */
  async generateResponse(prompt, apiKey = null) {
    if (apiKey) {
      this.initialize(apiKey);
    }
    return this.generateText(prompt);
  }

  /**
   * Generate text response from Gemini
   * @param {string} prompt - The input prompt
   * @returns {Promise<string>} AI response
   */
  async generateText(prompt) {
    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        let errorMsg = `API request failed: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error && errData.error.message) {
            errorMsg = errData.error.message;
            // Check for quota exceeded
            if (response.status === 429 || errorMsg.includes('quota')) {
              throw new Error('API quota exceeded. Please check your billing and try again later.');
            }
          }
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from API');
      }
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  /**
   * Stream text response from Gemini
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback for each chunk
   */
  async streamText(prompt, onChunk) {
    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }

    try {
      const result = await this.model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          onChunk(text);
        }
      }
    } catch (error) {
      console.error('Error streaming text:', error);
      throw error;
    }
  }

  /**
   * Get goal-specific advice and recommendations
   * @param {object} goalData - Goal information
   * @param {array} journalEntries - Recent journal entries
   * @param {object} timeSpent - Time tracking data
   * @returns {Promise<string>} Personalized advice
   */
  async getGoalAdvice(goalData, journalEntries, timeSpent) {
    const prompt = `
      As Drift, an AI assistant specialized in goal achievement, provide personalized advice for this goal:
      
      Goal: ${goalData.title}
      Description: ${goalData.description}
      Progress: ${goalData.progress}%
      Priority: ${goalData.priority}
      Category: ${goalData.category}
      
      Recent Journal Entries:
      ${journalEntries?.map(entry => `- ${entry.date}: ${entry.content}`).join('\n') || 'No recent entries'}
      
      Time Spent: ${timeSpent?.totalMinutes || 0} minutes over ${timeSpent?.sessions || 0} sessions
      
      Provide specific, actionable advice to help achieve this goal. Focus on:
      - Next steps to take
      - Potential obstacles and solutions
      - Time management strategies
      - Motivation techniques
      
      Keep the response encouraging and under 200 words.
    `;

    return this.generateText(prompt);
  }

  /**
   * Analyze journal entries for insights
   * @param {array} journalEntries - Journal entries to analyze
   * @returns {Promise<string>} Analysis and insights
   */
  async analyzeJournalEntries(journalEntries) {
    const prompt = `
      As Drift, analyze these journal entries and provide insights:
      
      ${journalEntries.map(entry => `
        Date: ${entry.date}
        Content: ${entry.content}
        Mood: ${entry.mood || 'Not specified'}
        Goals worked on: ${entry.goals?.join(', ') || 'None specified'}
      `).join('\n')}
      
      Provide:
      1. Patterns you notice (be specific, avoid generalizations if possible)
      2. Emotional trends (highlight any notable shifts or consistencies)
      3. Progress insights (connect to the goals mentioned, if any)
      4. Suggestions for improvement (offer actionable advice)
      
      Be supportive, constructive, and as specific as the provided entries allow. Keep response under 250 words.
    `;

    return this.generateText(prompt);
  }

  /**
   * Suggest daily milestones based on goals and progress
   * @param {array} goals - User's goals
   * @param {object} todaysProgress - Today's progress
   * @returns {Promise<string>} Milestone suggestions
   */
  async suggestDailyMilestones(goals, todaysProgress) {
    const prompt = `
      As Drift, suggest 3-5 daily milestones for today based on these goals:
      
      ${goals.map(goal => `
        - ${goal.title} (${goal.progress}% complete, Priority: ${goal.priority})
          Category: ${goal.category}
          Deadline: ${goal.deadline}
      `).join('\n')}
      
      Today's existing progress: ${todaysProgress?.completed || 0}/${todaysProgress?.total || 0} milestones completed
      
      Suggest specific, achievable milestones that:
      - Balance different goal categories
      - Consider priorities and deadlines
      - Are realistic for one day
      - Build momentum
      
      Format as a numbered list with estimated time for each.
    `;

    return this.generateText(prompt);
  }

  /**
   * Auto-determine progress meter update
   * @param {object} goalData - Goal information
   * @param {array} recentActivities - Recent activities
   * @returns {Promise<number>} Suggested progress percentage
   */
  async determineProgressUpdate(goalData, recentActivities) {
    const prompt = `
      As Drift, determine appropriate progress update for this goal:
      
      Goal: ${goalData.title}
      Current Progress: ${goalData.progress}%
      Target: ${goalData.targetValue} ${goalData.unit}
      
      Recent Activities:
      ${recentActivities?.map(activity => `- ${activity.date}: ${activity.description} (${activity.timeSpent} minutes)`).join('\n') || 'No recent activities'}
      
      Based on the activities, suggest a new progress percentage (0-100).
      Consider:
      - Time invested
      - Quality of work
      - Milestones achieved
      - Consistency
      
      Respond with only a number between ${goalData.progress} and 100.
    `;

    const response = await this.generateText(prompt);
    const progressMatch = response.match(/\d+/);
    const suggestedProgress = progressMatch ? parseInt(progressMatch[0]) : goalData.progress;
    
    return Math.min(Math.max(suggestedProgress, goalData.progress), 100);
  }

  /**
   * Get focus session recommendations
   * @param {object} goalData - Goal information
   * @param {array} previousSessions - Previous focus sessions
   * @returns {Promise<object>} Session recommendations
   */
  async getFocusSessionRecommendations(goalData, previousSessions) {
    const prompt = `
      As Drift, recommend an optimal focus session for this goal:
      
      Goal: ${goalData.title}
      Progress: ${goalData.progress}%
      Category: ${goalData.category}
      
      Previous Sessions:
      ${previousSessions?.map(session => `- ${session.date}: ${session.duration} minutes, Notes: ${session.notes}`).join('\n') || 'No previous sessions'}
      
      Recommend:
      1. Optimal session duration (15-120 minutes)
      2. Specific tasks to focus on
      3. Break schedule
      4. Success metrics
      
      Format as JSON with keys: duration, tasks, breaks, metrics
    `;

    const response = await this.generateText(prompt);
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        duration: 25,
        tasks: ['Work on next milestone'],
        breaks: ['5 minutes every 25 minutes'],
        metrics: ['Time spent', 'Tasks completed']
      };
    }
  }

  /**
   * Generate motivational message
   * @param {object} userContext - User's current context
   * @returns {Promise<string>} Motivational message
   */
  async getMotivationalMessage(userContext) {
    const prompt = `
      As Drift, provide a motivational message for this user:
      
      Current streak: ${userContext.streak || 0} days
      Goals completed: ${userContext.completedGoals || 0}/${userContext.totalGoals || 0}
      Time of day: ${userContext.timeOfDay || 'unknown'}
      Recent mood: ${userContext.mood || 'neutral'}
      
      Provide an encouraging, personalized message that:
      - Acknowledges their progress
      - Motivates continued action
      - Is specific to their situation
      - Includes an actionable next step
      
      Keep it under 100 words and energetic but not overwhelming.
    `;

    return this.generateText(prompt);
  }

  /**
   * Parses user input text to extract structured goal information.
   * @param {string} userInputText - The user's message about creating a goal.
   * @returns {Promise<object>} An object with status, goal_data, clarification_questions, or error_message.
   */
  async parseGoalFromString(userInputText) {
    if (!this.isInitialized) {
      // Return an error object consistent with the expected JSON structure
      return {
        status: "error",
        goal_data: null,
        clarification_questions: null,
        error_message: "Gemini service not initialized. Please ensure API key is set."
      };
    }

    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // The detailed prompt designed in the previous step
    const goalParsingPrompt = `
You are an expert at understanding user requests to create new goals.
Your task is to parse the user's input text and extract information to create a structured goal object.
The user's input will be provided last.

Output Format:
Return a single JSON object. The JSON object should have the following fields:
- "status": (string) Can be "success", "clarification_needed", or "error".
- "goal_data": (object, present if status is "success" or "clarification_needed") Contains the parsed goal attributes:
    - "title": (string) The main title of the goal. This is mandatory. If a title cannot be confidently identified, set status to "clarification_needed" and add a question to "clarification_questions".
    - "description": (string, optional) A more detailed description of the goal.
    - "category": (string, optional) A category for the goal (e.g., "Learning", "Health", "Work", "Personal"). If the user doesn't specify, you can try to infer a common category or leave it null.
    - "priority": (string, optional, default: "medium") Can be "low", "medium", or "high".
    - "deadline": (string, optional) The deadline for the goal in "YYYY-MM-DD" format. Try to parse dates like "next Friday", "in 3 months", "end of year". If a specific date cannot be determined, leave it null.
    - "targetValue": (number, optional) For measurable goals, the target numerical value.
    - "unit": (string, optional) The unit for the measurable goal (e.g., "books", "kg", "hours").
- "clarification_questions": (array of strings, present if status is "clarification_needed") A list of questions to ask the user to get missing essential information (like a title) or to clarify ambiguities.
- "error_message": (string, present if status is "error") A message explaining why parsing failed fundamentally.

Guidelines for Parsing:
1.  **Title is Key:** A goal *must* have a title. If no clear title can be extracted, ask for one (status: "clarification_needed").
2.  **Deadline Parsing:**
    *   Today's date is ${currentDate}.
    *   Parse relative dates ("tomorrow", "next week", "in 2 months", "by end of year") into "YYYY-MM-DD".
    *   If a vague timeframe is given (e.g., "soon"), do not set a deadline; it can be added later.
3.  **Priority:** If not specified, default to "medium".
4.  **Category Inference:** If the user implies a category (e.g., "I want to learn Spanish" -> "Learning"), use it. Otherwise, it's optional.
5.  **Measurable Goals:** If the user mentions quantities (e.g., "run 5 km", "read 10 articles"), try to populate \`targetValue\` and \`unit\`.
6.  **Confirmation vs. Clarification:**
    *   If all essential information (at least title) is present and reasonably clear, set status to "success". The application will then confirm these details with the user.
    *   If the title is missing, or if there's significant ambiguity that prevents forming a basic goal, set status to "clarification_needed" and provide specific questions.
7.  **Be Concise:** Keep descriptions and extracted text close to what the user provided, unless summarization is implied for brevity.

---
User's request to parse for goal creation:
"${userInputText}"
`;

    try {
      const rawResponse = await this.generateText(goalParsingPrompt);
      // Gemini's response might include markdown ```json ... ```, so we need to extract the JSON part.
      const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
      let parsedJson;

      if (jsonMatch && jsonMatch[1]) {
        parsedJson = JSON.parse(jsonMatch[1]);
      } else {
        // If no markdown block, try to parse the whole string directly (less robust)
        parsedJson = JSON.parse(rawResponse);
      }

      // Basic validation of the parsed structure
      if (typeof parsedJson.status !== 'string') {
          throw new Error("Parsed JSON is missing 'status' field or it's not a string.");
      }
      if (parsedJson.status === 'success' && typeof parsedJson.goal_data !== 'object') {
          throw new Error("Parsed JSON has status 'success' but 'goal_data' is missing or not an object.");
      }

      return parsedJson;

    } catch (error) {
      console.error('Error parsing goal from string or validating structure:', error);
      return {
        status: "error",
        goal_data: null,
        clarification_questions: null,
        error_message: `Failed to parse goal information from AI response: ${error.message}`
      };
    }
  }

  /**
   * Parse user intent from natural language for goal/milestone management.
   * @param {string} userInputText - The user's message.
   * @returns {Promise<object>} An object with action, targetType, targetTitle, goalTitle, details, confidence.
   */
  async parseUserIntent(userInputText) {
    if (!this.isInitialized) {
      return {
        action: null,
        targetType: null,
        targetTitle: null,
        goalTitle: null,
        details: null,
        confidence: 0,
        error: "Gemini service not initialized. Please ensure API key is set."
      };
    }

    const intentPrompt = `
You are an expert at understanding user requests for managing goals and milestones in a productivity app. Parse the user's message and extract the following fields as a single JSON object:
- action: (string) One of "create", "update", "complete", "plan", "progress_update", or "other".
- targetType: (string) "goal", "milestone", or "plan".
- targetTitle: (string) The title of the milestone or goal (if applicable).
- goalTitle: (string) The goal this milestone is associated with (if applicable).
- details: (string) Any extra details (e.g., new title, time, description, progress, etc.).
- confidence: (number, 0-1) How confident you are in the intent extraction.

Guidelines:
- If the user is asking to plan their day, set action to "plan" and targetType to "plan".
- If the user is updating progress, set action to "progress_update" and include the relevant milestone/goal in targetTitle/goalTitle.
- If the intent is unclear or ambiguous, set action to "other" and confidence to 0.5 or less.
- If the user is asking general questions or seeking advice, set action to "other".
- Be conservative with confidence scores - if unsure, use lower confidence.
- For milestone creation, look for phrases like "add", "create", "make", "set up" followed by a task.
- For completion, look for phrases like "done", "finished", "complete", "mark as done".
- For updates, look for phrases like "change", "update", "modify", "edit".

Respond ONLY with a JSON object, no extra text or markdown.

User message:
"${userInputText}"
`;
    try {
      const rawResponse = await this.generateText(intentPrompt);
      // Try to parse the response as JSON
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      let parsedJson;
      if (jsonMatch && jsonMatch[0]) {
        parsedJson = JSON.parse(jsonMatch[0]);
      } else {
        parsedJson = JSON.parse(rawResponse);
      }
      
      // Validate the parsed response
      if (!parsedJson.action || !parsedJson.targetType || typeof parsedJson.confidence !== 'number') {
        throw new Error('Invalid response structure');
      }
      
      return parsedJson;
    } catch (error) {
      console.error('Error parsing user intent from string:', error);
      return {
        action: 'other',
        targetType: 'milestone',
        targetTitle: null,
        goalTitle: null,
        details: null,
        confidence: 0,
        error: `Failed to parse intent: ${error.message}`
      };
    }
  }
}

// Create a singleton instance
const geminiService = new GeminiService();

// Export the singleton instance and individual methods
export default geminiService;

// Export individual methods for direct import
export const initialize = (apiKey) => geminiService.initialize(apiKey);
export const testConnection = (apiKey) => geminiService.testConnection(apiKey);
export const generateText = (prompt) => geminiService.generateText(prompt);
export const streamText = (prompt, onChunk) => geminiService.streamText(prompt, onChunk);
export const getGoalAdvice = (goalData, journalEntries, timeSpent) => geminiService.getGoalAdvice(goalData, journalEntries, timeSpent);
export const analyzeJournalEntries = (journalEntries) => geminiService.analyzeJournalEntries(journalEntries);
export const suggestDailyMilestones = (goals, todaysProgress) => geminiService.suggestDailyMilestones(goals, todaysProgress);
export const determineProgressUpdate = (goalData, recentActivities) => geminiService.determineProgressUpdate(goalData, recentActivities);
export const getFocusSessionRecommendations = (goalData, previousSessions) => geminiService.getFocusSessionRecommendations(goalData, previousSessions);
export const getMotivationalMessage = (userContext) => geminiService.getMotivationalMessage(userContext);
export const parseGoalFromString = (userInputText) => geminiService.parseGoalFromString(userInputText);
export const parseUserIntent = (userInputText) => geminiService.parseUserIntent(userInputText);

// Export new standardized API key methods
export const getApiKey = (userId) => geminiService.getApiKey(userId);
export const setApiKey = (apiKey, userId) => geminiService.setApiKey(apiKey, userId);
export const checkConnection = (userId) => geminiService.checkConnection(userId);
export const getModelInfo = () => geminiService.getModelInfo();

// Export properties
export const isInitialized = () => geminiService.isInitialized;