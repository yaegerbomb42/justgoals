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

  // Generate strategic response with improved context awareness
  async generateResponse(userInput, todosContext, apiKey) {
    const memoryContext = this.personality.memory.slice(-3); // Last 3 interactions
    
    // Analyze user intent for better responses
    const intent = this.analyzeUserIntent(userInput);
    
    const prompt = `You are Drift, a smart productivity assistant specializing in strategic task management. You're ${this.personality.traits.join(', ')}.

CURRENT CONTEXT:
- Active todos: ${todosContext.active}
- Completed todos: ${todosContext.completed || 0} 
- High priority tasks: ${todosContext.topPriority || 0}
- Recent todos: ${todosContext.recentTodos.slice(0, 3).map(t => `"${t.text}" (priority: ${t.priority || 1}/10)`).join(', ')}

${memoryContext.length > 0 ? `CONVERSATION HISTORY:
${memoryContext.map(m => `User: ${m.user}\nDrift: ${m.ai}`).join('\n')}` : ''}

USER INTENT: ${intent.type} - ${intent.description}
USER MESSAGE: "${userInput}"

STRATEGIC GUIDELINES:
- For PRIORITIZATION requests: Emphasize Eisenhower Matrix (urgent vs important)
- For MOTIVATION: Provide specific, actionable encouragement
- For ORGANIZATION: Suggest time-blocking, batching, or energy management
- For OVERWHELM: Recommend focus techniques and task breakdown
- For PLANNING: Consider time of day, energy levels, and dependencies

RESPONSE STYLE:
- Keep responses under 80 words for quick reading
- Be encouraging but realistic about time and energy
- Use 1-2 emojis maximum for personality
- If suggesting todos, format as: "Consider: • Task 1 • Task 2"
- Reference previous conversations when relevant
- Focus on strategic productivity principles

PRODUCTIVITY FRAMEWORKS TO REFERENCE:
- Eisenhower Matrix (urgent/important quadrants)
- Time blocking for deep work
- Energy management over time management
- The 2-minute rule for quick tasks
- Batch processing similar tasks
- Single-tasking for complex work

DRIFT RESPONSE:`;

    try {
      const response = await geminiService.generateContent(prompt, apiKey);
      
      // Clean and enhance response
      let cleanResponse = response
        .replace(/^DRIFT:?\s*/i, '')
        .replace(/^Drift:?\s*/i, '')
        .trim()
        .split('\n')[0] // Take first paragraph only
        .slice(0, 280); // Increased limit for strategic advice

      // Add strategic suggestions based on intent
      if (intent.type === 'prioritization' && todosContext.active > 0) {
        cleanResponse += this.addPrioritizationTip();
      } else if (intent.type === 'motivation' && todosContext.completed > 0) {
        cleanResponse += ` 🎯 You've completed ${todosContext.completed} tasks - great momentum!`;
      }

      // Add to memory with context
      this.addToMemory(userInput, cleanResponse, { ...todosContext, intent });
      
      return cleanResponse;
    } catch (error) {
      console.error('Drift AI error:', error);
      
      // Enhanced fallback responses based on intent
      const strategicFallbacks = {
        'prioritization': "I need API access to help prioritize your tasks. For now, try the Eisenhower Matrix: urgent+important first, then important tasks during your peak energy hours! 🎯",
        'motivation': "You're building great momentum! Focus on completing one high-impact task to maintain motivation. Every small win counts! 💪",
        'organization': "Try time-blocking: group similar tasks together and tackle them during your most productive hours. Batch processing saves mental energy! ⚡",
        'planning': "Start with your most important task when your energy is highest. Break large tasks into 25-minute focused sessions. Strategic planning beats busy work! 📋",
        'overwhelm': "Take a breath! Pick just ONE important task and focus only on that. Progress beats perfection every time. You've got this! 🌟",
        'default': "I'm having trouble connecting right now, but here's a quick tip: focus on high-impact tasks during your peak energy hours! 🚀"
      };
      
      const intent = this.analyzeUserIntent(userInput);
      return strategicFallbacks[intent.type] || strategicFallbacks.default;
    }
  }

  // Analyze user intent for more strategic responses
  analyzeUserIntent(userInput) {
    const input = userInput.toLowerCase();
    
    if (input.includes('priorit') || input.includes('important') || input.includes('urgent')) {
      return { type: 'prioritization', description: 'User wants help prioritizing tasks' };
    }
    
    if (input.includes('motivat') || input.includes('stuck') || input.includes('unmotivat') || input.includes('lazy')) {
      return { type: 'motivation', description: 'User needs motivational support' };
    }
    
    if (input.includes('organiz') || input.includes('manage') || input.includes('structure') || input.includes('system')) {
      return { type: 'organization', description: 'User wants organizational help' };
    }
    
    if (input.includes('plan') || input.includes('schedule') || input.includes('when') || input.includes('order')) {
      return { type: 'planning', description: 'User needs planning assistance' };
    }
    
    if (input.includes('overwhelm') || input.includes('too much') || input.includes('stress') || input.includes('busy')) {
      return { type: 'overwhelm', description: 'User feeling overwhelmed' };
    }
    
    return { type: 'general', description: 'General productivity inquiry' };
  }

  // Add strategic prioritization tips
  addPrioritizationTip() {
    const tips = [
      " Pro tip: Do urgent+important tasks first, then schedule important-only tasks for your peak hours.",
      " Strategy: Batch similar tasks and tackle your hardest work when your energy is highest.",
      " Remember: High-impact tasks during peak energy, quick wins during low energy periods.",
      " Focus hack: Use the 2-minute rule - if it takes less than 2 minutes, do it now!"
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Enhanced intelligent prioritization using Eisenhower Matrix + contextual analysis
  async prioritizeTodos(todos, apiKey) {
    if (!apiKey?.trim()) {
      throw new Error('API_KEY_MISSING');
    }

    if (!todos || todos.length === 0) {
      throw new Error('NO_TODOS_TO_PRIORITIZE');
    }

    // Get current time context
    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();
    const currentDateStr = now.toISOString().split('T')[0];

    // Analyze todos for contextual clues
    const todosForAI = todos.map(todo => {
      const text = todo.text.toLowerCase();
      
      // Detect urgency indicators
      const urgencyKeywords = ['urgent', 'asap', 'today', 'deadline', 'due', 'emergency', 'immediate', 'now'];
      const hasUrgency = urgencyKeywords.some(keyword => text.includes(keyword));
      
      // Detect importance indicators
      const importanceKeywords = ['important', 'critical', 'essential', 'key', 'major', 'crucial', 'vital', 'priority'];
      const hasImportance = importanceKeywords.some(keyword => text.includes(keyword));
      
      // Detect time-specific tasks
      const timeKeywords = ['morning', 'afternoon', 'evening', 'night', 'am', 'pm'];
      const hasTimeContext = timeKeywords.some(keyword => text.includes(keyword));
      
      // Detect work vs personal context
      const workKeywords = ['meeting', 'call', 'email', 'work', 'project', 'client', 'business', 'office'];
      const personalKeywords = ['personal', 'home', 'family', 'health', 'exercise', 'doctor', 'shopping'];
      const isWork = workKeywords.some(keyword => text.includes(keyword));
      const isPersonal = personalKeywords.some(keyword => text.includes(keyword));

      return {
        id: todo.id,
        text: todo.text.substring(0, 150),
        current: todo.priority || 1,
        createdAt: todo.createdAt || new Date().toISOString(),
        hasUrgency,
        hasImportance,
        hasTimeContext,
        isWork,
        isPersonal,
        textLength: todo.text.length
      };
    });

    const prompt = `You are an expert productivity consultant using the Eisenhower Matrix and contextual analysis to prioritize tasks intelligently.

CURRENT CONTEXT:
- Time: ${timeOfDay}:00 (${timeOfDay < 12 ? 'Morning' : timeOfDay < 17 ? 'Afternoon' : 'Evening'})
- Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}
- Date: ${currentDateStr}

TASKS TO PRIORITIZE (${todosForAI.length} total):
${todosForAI.map((t, i) => `${i + 1}. "${t.text}" 
   - Current priority: ${t.current}/10
   - Signals: ${[
     t.hasUrgency ? 'URGENT' : '',
     t.hasImportance ? 'IMPORTANT' : '',
     t.hasTimeContext ? 'TIME-SPECIFIC' : '',
     t.isWork ? 'WORK' : '',
     t.isPersonal ? 'PERSONAL' : ''
   ].filter(Boolean).join(', ') || 'NEUTRAL'}`).join('\n\n')}

PRIORITIZATION FRAMEWORK:
1. CRITICAL (9-10): Urgent + Important (Do First)
   - Deadlines today, emergencies, critical meetings
   
2. HIGH (7-8): Important but Not Urgent (Schedule)
   - Important goals, strategic work, skill development
   
3. MEDIUM (4-6): Urgent but Not Important (Delegate/Quick wins)
   - Interruptions that can be handled quickly, some emails
   
4. LOW (1-3): Neither Urgent nor Important (Eliminate/Later)
   - Distractions, busywork, some social activities

CONTEXTUAL ADJUSTMENTS:
- Morning (6-12): Favor cognitively demanding and important tasks
- Afternoon (12-17): Good for meetings, communications, routine work  
- Evening (17-24): Personal tasks, planning, low-energy work
- Weekdays: Prioritize work tasks higher
- Weekends: Prioritize personal/family tasks higher
- Consider energy levels for task types
- Time-specific tasks get urgency boost during relevant times

SMART PRIORITY RULES:
- Tasks with explicit deadlines/urgency signals get immediate boost
- Important strategic work gets high priority during peak hours
- Quick tasks (<5 min estimated) can be medium priority for momentum
- Batch similar tasks by giving them close priority scores
- Consider dependencies (some tasks unlock others)
- Balance work/life based on time context

Analyze each task's true impact, effort required, and time sensitivity. Return JSON with priority (1-10), confidence (1-10), and reasoning:

[{"id":"${todosForAI[0]?.id}","priority":8,"confidence":9,"reasoning":"Critical deadline today with high impact"}]

Return ONLY the JSON array.`;

    try {
      const response = await geminiService.generateContent(prompt, apiKey);
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      
      if (!jsonMatch) {
        throw new Error('INVALID_AI_RESPONSE');
      }

      const priorities = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance response
      if (!Array.isArray(priorities) || priorities.length === 0) {
        throw new Error('INVALID_PRIORITY_FORMAT');
      }

      // Filter and validate priorities
      const validPriorities = priorities.filter(p => 
        p.id && 
        typeof p.priority === 'number' && 
        p.priority >= 1 && 
        p.priority <= 10 &&
        typeof p.confidence === 'number' &&
        p.reasoning
      );

      // Ensure priority distribution is reasonable (avoid all tasks being high priority)
      const priorityDistribution = this.balancePriorityDistribution(validPriorities);
      
      return priorityDistribution;
      
    } catch (error) {
      console.error('Priority AI error:', error);
      throw error;
    }
  }

  // Balance priority distribution to avoid everything being "urgent"
  balancePriorityDistribution(priorities) {
    if (priorities.length <= 3) return priorities; // Small lists don't need balancing
    
    // Count priorities in each range
    const ranges = {
      critical: priorities.filter(p => p.priority >= 9).length,
      high: priorities.filter(p => p.priority >= 7 && p.priority < 9).length,
      medium: priorities.filter(p => p.priority >= 4 && p.priority < 7).length,
      low: priorities.filter(p => p.priority < 4).length
    };
    
    // If too many critical priorities (>25% of tasks), redistribute
    const maxCritical = Math.max(1, Math.floor(priorities.length * 0.25));
    const maxHigh = Math.max(1, Math.floor(priorities.length * 0.40));
    
    if (ranges.critical > maxCritical) {
      // Sort by confidence and keep only the most confident critical priorities
      const sortedByConfidence = priorities
        .filter(p => p.priority >= 9)
        .sort((a, b) => b.confidence - a.confidence);
      
      // Keep top critical priorities, demote others to high
      sortedByConfidence.slice(maxCritical).forEach(p => {
        p.priority = Math.max(7, p.priority - 2);
        p.reasoning = `${p.reasoning} (Auto-adjusted from critical due to distribution balancing)`;
      });
    }
    
    // Similar balancing for high priorities
    if (ranges.high > maxHigh) {
      const sortedHighByConfidence = priorities
        .filter(p => p.priority >= 7 && p.priority < 9)
        .sort((a, b) => b.confidence - a.confidence);
      
      sortedHighByConfidence.slice(maxHigh).forEach(p => {
        p.priority = Math.max(4, p.priority - 2);
        p.reasoning = `${p.reasoning} (Auto-adjusted from high due to distribution balancing)`;
      });
    }
    
    return priorities;
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
