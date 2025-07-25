// Enhanced AI service for todo management with personality and memory
import { geminiService } from './geminiService';

class TodoAIService {
  constructor() {
    this.personality = {
      name: "Drift",
      traits: ["focused", "encouraging", "concise", "practical"],
      memory: [],
      userPreferences: {},
      sessionContext: {}
    };
    this.maxMemorySize = 10; // Keep last 10 interactions
  }

  // Load user's AI personality preferences
  loadPersonality(userId) {
    const saved = localStorage.getItem(`ai_personality_${userId}`);
    if (saved) {
      try {
        this.personality = { ...this.personality, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed to load AI personality');
      }
    }
  }

  // Save personality updates
  savePersonality(userId) {
    localStorage.setItem(`ai_personality_${userId}`, JSON.stringify(this.personality));
  }

  // Add interaction to memory
  addToMemory(userInput, aiResponse, context = {}) {
    const interaction = {
      timestamp: Date.now(),
      user: userInput,
      ai: aiResponse,
      context
    };
    
    this.personality.memory.push(interaction);
    
    // Keep only recent interactions
    if (this.personality.memory.length > this.maxMemorySize) {
      this.personality.memory = this.personality.memory.slice(-this.maxMemorySize);
    }
  }

  // Generate concise response with personality
  async generateResponse(userInput, todosContext, apiKey) {
    const memoryContext = this.personality.memory.slice(-3); // Last 3 interactions
    
    const prompt = `You are Drift, a smart todo assistant. You're ${this.personality.traits.join(', ')}.

CONTEXT:
- Active todos: ${todosContext.active}
- Recent todos: ${todosContext.recentTodos.slice(0, 3).map(t => `"${t.text}"`).join(', ')}

${memoryContext.length > 0 ? `RECENT CONVERSATION:
${memoryContext.map(m => `User: ${m.user}\nDrift: ${m.ai}`).join('\n')}` : ''}

USER: "${userInput}"

RESPONSE RULES:
- Keep responses under 50 words
- Be encouraging but practical
- Use emojis sparingly (max 1-2)
- If suggesting todos, format as: "Try adding: • Task 1 • Task 2"
- Remember context from recent conversation

DRIFT:`;

    try {
      const response = await geminiService.generateContent(prompt, apiKey);
      
      // Clean and shorten response
      const cleanResponse = response
        .replace(/^DRIFT:\s*/i, '')
        .replace(/^Drift:\s*/i, '')
        .trim()
        .split('\n')[0] // Take first line only
        .slice(0, 200); // Max 200 characters

      // Add to memory
      this.addToMemory(userInput, cleanResponse, todosContext);
      
      return cleanResponse;
    } catch (error) {
      console.error('Drift AI error:', error);
      
      // Fallback responses based on input
      const fallbacks = {
        'prioritize': "I need API access to prioritize your todos. Check your Gemini API key in settings! 🔑",
        'help': "I can help organize, prioritize, and break down your todos. What specific help do you need?",
        'motivate': "You've got this! Focus on one task at a time and celebrate small wins. 💪",
        'organize': "Try grouping similar tasks together and tackling quick wins first!",
        'default': "I'm having trouble connecting right now. Try again in a moment! 🤖"
      };
      
      const key = Object.keys(fallbacks).find(k => userInput.toLowerCase().includes(k));
      return fallbacks[key] || fallbacks.default;
    }
  }

  // Enhanced prioritization with better error handling
  async prioritizeTodos(todos, apiKey) {
    if (!apiKey?.trim()) {
      throw new Error('API_KEY_MISSING');
    }

    if (!todos || todos.length === 0) {
      throw new Error('NO_TODOS_TO_PRIORITIZE');
    }

    const todosForAI = todos.map(todo => ({
      id: todo.id,
      text: todo.text.substring(0, 100), // Limit text length
      current: todo.priority || 1
    }));

    const prompt = `Prioritize these ${todosForAI.length} todos (1-10 scale):

${todosForAI.map((t, i) => `${i + 1}. "${t.text}"`).join('\n')}

Rules:
- Use full 1-10 scale evenly
- Quick tasks: 2-4
- Important: 6-8  
- Urgent+Important: 9-10

Return JSON only: [{"id":"${todosForAI[0].id}","priority":5}...]`;

    try {
      const response = await geminiService.generateContent(prompt, apiKey);
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      
      if (!jsonMatch) {
        throw new Error('INVALID_AI_RESPONSE');
      }

      const priorities = JSON.parse(jsonMatch[0]);
      
      // Validate response
      if (!Array.isArray(priorities) || priorities.length === 0) {
        throw new Error('INVALID_PRIORITY_FORMAT');
      }

      return priorities.filter(p => 
        p.id && 
        typeof p.priority === 'number' && 
        p.priority >= 1 && 
        p.priority <= 10
      );
      
    } catch (error) {
      console.error('Priority AI error:', error);
      throw error;
    }
  }

  // Update personality traits
  updatePersonality(userId, updates) {
    this.personality = { ...this.personality, ...updates };
    this.savePersonality(userId);
  }

  // Get personality summary
  getPersonalitySummary() {
    return {
      name: this.personality.name,
      traits: this.personality.traits,
      memoryCount: this.personality.memory.length,
      lastInteraction: this.personality.memory.length > 0 ? 
        new Date(this.personality.memory[this.personality.memory.length - 1].timestamp) : null
    };
  }
}

export const todoAIService = new TodoAIService();
