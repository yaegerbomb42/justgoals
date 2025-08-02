/**
 * AI Progress Journey Service
 * Generates intelligent progress milestones based on user data including:
 * - Journal entries and mood patterns
 * - Focus session data and notes
 * - Achievement history
 * - Progress meter updates
 * - User behavior patterns
 */

import { geminiService } from './geminiService';
import contextAggregationService from './contextAggregationService';

class AIProgressJourneyService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Generate AI-driven progress journey for a goal
   */
  async generateProgressJourney(goal, userId, userContext = null) {
    const cacheKey = `journey_${userId}_${goal.id}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.journey;
    }

    try {
      // Get comprehensive user context if not provided
      const context = userContext || await contextAggregationService.getComprehensiveContext(userId, [goal]);
      
      // Analyze user data to understand patterns
      const userAnalysis = this.analyzeUserPatterns(context);
      
      // Generate contextual milestones
      const journey = await this.generateContextualMilestones(goal, context, userAnalysis);
      
      // Cache the result
      this.cache.set(cacheKey, {
        journey,
        timestamp: Date.now()
      });
      
      return journey;
    } catch (error) {
      console.error('Error generating AI progress journey:', error);
      return this.getFallbackJourney(goal);
    }
  }

  /**
   * Analyze user patterns from their activity data
   */
  analyzeUserPatterns(context) {
    const patterns = {
      workingStyle: 'balanced', // balanced, intensive, gradual
      preferredSessionLength: 25, // minutes
      peakProductivityHours: [],
      strugglingAreas: [],
      motivationalFactors: [],
      completionTendencies: 'consistent' // consistent, burst, irregular
    };

    try {
      // Analyze focus sessions
      if (context.recentActivity?.focusSessions) {
        const sessions = context.recentActivity.focusSessions;
        const avgSessionLength = sessions.reduce((sum, s) => sum + (s.duration || 25), 0) / sessions.length;
        patterns.preferredSessionLength = Math.round(avgSessionLength);

        // Determine working style based on session patterns
        const shortSessions = sessions.filter(s => (s.duration || 25) < 20).length;
        const longSessions = sessions.filter(s => (s.duration || 25) > 45).length;
        
        if (longSessions > shortSessions) {
          patterns.workingStyle = 'intensive';
        } else if (shortSessions > longSessions) {
          patterns.workingStyle = 'gradual';
        }
      }

      // Analyze journal entries for mood and challenges
      if (context.journalEntries) {
        const recentEntries = context.journalEntries.slice(-10);
        patterns.strugglingAreas = this.extractStruggles(recentEntries);
        patterns.motivationalFactors = this.extractMotivators(recentEntries);
      }

      // Analyze completion patterns
      if (context.milestones) {
        const completedMilestones = context.milestones.filter(m => m.completed);
        const completionDates = completedMilestones.map(m => new Date(m.completedAt || m.updatedAt));
        patterns.completionTendencies = this.analyzeCompletionPattern(completionDates);
      }

    } catch (error) {
      console.warn('Error analyzing user patterns:', error);
    }

    return patterns;
  }

  /**
   * Generate contextual milestones using AI based on user patterns
   */
  async generateContextualMilestones(goal, context, userPatterns) {
    const prompt = `
Generate a personalized progress journey for this goal based on user behavior analysis:

GOAL:
- Title: ${goal.title}
- Description: ${goal.description || 'No description provided'}
- Category: ${goal.category || 'general'}
- Deadline: ${goal.deadline || 'No deadline set'}

USER PATTERNS:
- Working Style: ${userPatterns.workingStyle}
- Preferred Session Length: ${userPatterns.preferredSessionLength} minutes
- Completion Tendency: ${userPatterns.completionTendencies}
- Key Motivators: ${userPatterns.motivationalFactors.join(', ') || 'Achievement, Progress'}
- Challenge Areas: ${userPatterns.strugglingAreas.join(', ') || 'None identified'}

RECENT ACTIVITY:
- Journal Entries: ${context.journalEntries?.length || 0} recent entries
- Focus Sessions: ${context.recentActivity?.focusSessions?.length || 0} recent sessions
- Completed Milestones: ${context.milestones?.filter(m => m.completed).length || 0}

Generate 5-7 adaptive milestones that:
1. Match the user's working style and session preferences
2. Address their challenge areas with supportive steps
3. Leverage their motivational factors
4. Build progressively toward the goal
5. Include specific success metrics based on their data

Return as JSON array:
[
  {
    "title": "Milestone title",
    "description": "What needs to be accomplished",
    "aiGenerated": true,
    "priority": "high|medium|low",
    "estimatedDays": 3,
    "focusMinutes": ${userPatterns.preferredSessionLength},
    "successCriteria": "Specific measurable outcome",
    "userContext": "Why this step fits their pattern",
    "type": "milestone|checkpoint|reflection"
  }
]

Return ONLY the JSON array, no other text.`;

    try {
      const response = await geminiService.generateContent(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const milestones = JSON.parse(jsonMatch[0]);
        return this.enhanceMilestonesWithMetadata(milestones, goal, userPatterns);
      }
    } catch (error) {
      console.error('Error generating contextual milestones:', error);
    }

    return this.getFallbackJourney(goal);
  }

  /**
   * Enhance generated milestones with additional metadata
   */
  enhanceMilestonesWithMetadata(milestones, goal, userPatterns) {
    return milestones.map((milestone, index) => ({
      ...milestone,
      id: `ai_milestone_${goal.id}_${Date.now()}_${index}`,
      goalId: goal.id,
      goalName: goal.title,
      aiGenerated: true,
      createdAt: new Date(),
      completed: false,
      order: index,
      adaptiveFeatures: {
        recommendedTimeOfDay: this.getOptimalTimeOfDay(userPatterns),
        breakdownSuggestion: this.getBreakdownSuggestion(milestone, userPatterns),
        motivationalNote: this.getMotivationalNote(milestone, userPatterns)
      }
    }));
  }

  /**
   * Extract struggles from journal entries
   */
  extractStruggles(journalEntries) {
    const struggles = [];
    const strugglingKeywords = ['difficult', 'hard', 'struggle', 'challenge', 'stuck', 'frustrated', 'overwhelmed'];
    
    journalEntries.forEach(entry => {
      const text = (entry.content || entry.text || '').toLowerCase();
      strugglingKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          // Extract context around the keyword
          const sentences = text.split(/[.!?]+/);
          const relevantSentences = sentences.filter(s => s.includes(keyword));
          struggles.push(...relevantSentences);
        }
      });
    });

    return [...new Set(struggles)].slice(0, 3); // Unique, top 3
  }

  /**
   * Extract motivators from journal entries
   */
  extractMotivators(journalEntries) {
    const motivators = [];
    const positiveKeywords = ['excited', 'motivated', 'inspired', 'accomplished', 'proud', 'success', 'progress'];
    
    journalEntries.forEach(entry => {
      const text = (entry.content || entry.text || '').toLowerCase();
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          motivators.push(keyword);
        }
      });
    });

    return [...new Set(motivators)];
  }

  /**
   * Analyze completion patterns from milestone history
   */
  analyzeCompletionPattern(completionDates) {
    if (completionDates.length < 3) return 'consistent';

    // Sort dates and analyze intervals
    const sortedDates = completionDates.sort((a, b) => a - b);
    const intervals = [];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const days = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;

    if (variance < 2) return 'consistent';
    if (avgInterval < 3) return 'burst';
    return 'irregular';
  }

  /**
   * Get optimal time of day recommendation
   */
  getOptimalTimeOfDay(userPatterns) {
    // Default recommendations based on working style
    const timeRecommendations = {
      intensive: 'morning', // 9-11 AM for deep work
      gradual: 'afternoon', // 2-4 PM for steady progress
      balanced: 'flexible' // Any time with good energy
    };

    return timeRecommendations[userPatterns.workingStyle] || 'flexible';
  }

  /**
   * Get breakdown suggestion for complex milestones
   */
  getBreakdownSuggestion(milestone, userPatterns) {
    const sessionLength = userPatterns.preferredSessionLength;
    const estimatedMinutes = milestone.focusMinutes || sessionLength;
    
    if (estimatedMinutes > sessionLength * 1.5) {
      const sessions = Math.ceil(estimatedMinutes / sessionLength);
      return `Break this into ${sessions} focused sessions of ${sessionLength} minutes each`;
    }
    
    return `Complete in a single ${estimatedMinutes}-minute focused session`;
  }

  /**
   * Get personalized motivational note
   */
  getMotivationalNote(milestone, userPatterns) {
    const motivators = userPatterns.motivationalFactors;
    
    if (motivators.includes('progress')) {
      return 'Each step forward builds momentum toward your goal! 🚀';
    }
    if (motivators.includes('accomplished')) {
      return 'You\'ll feel great satisfaction completing this milestone! ⭐';
    }
    if (motivators.includes('success')) {
      return 'This brings you closer to the success you\'re working toward! 🎯';
    }
    
    return 'You\'ve got this! Trust in your ability to achieve. 💪';
  }

  /**
   * Generate fallback journey when AI generation fails
   */
  getFallbackJourney(goal) {
    return [
      {
        id: `fallback_${goal.id}_${Date.now()}_0`,
        title: 'Plan Your Approach',
        description: 'Break down your goal and create a clear action plan',
        goalId: goal.id,
        goalName: goal.title,
        priority: 'high',
        estimatedDays: 1,
        focusMinutes: 25,
        successCriteria: 'Clear action plan documented',
        aiGenerated: true,
        type: 'milestone',
        order: 0
      },
      {
        id: `fallback_${goal.id}_${Date.now()}_1`,
        title: 'Take First Action',
        description: 'Begin with the first concrete step toward your goal',
        goalId: goal.id,
        goalName: goal.title,
        priority: 'high',
        estimatedDays: 2,
        focusMinutes: 30,
        successCriteria: 'First meaningful progress made',
        aiGenerated: true,
        type: 'milestone',
        order: 1
      },
      {
        id: `fallback_${goal.id}_${Date.now()}_2`,
        title: 'Review and Adjust',
        description: 'Assess progress and refine your approach as needed',
        goalId: goal.id,
        goalName: goal.title,
        priority: 'medium',
        estimatedDays: 1,
        focusMinutes: 20,
        successCriteria: 'Progress reviewed and plan updated',
        aiGenerated: true,
        type: 'reflection',
        order: 2
      }
    ];
  }

  /**
   * Update journey based on new user activity
   */
  async updateJourneyFromActivity(goalId, userId, activityData) {
    const cacheKey = `journey_${userId}_${goalId}`;
    
    // Invalidate cache to trigger regeneration with new data
    this.cache.delete(cacheKey);
    
    // Optionally trigger immediate regeneration if goal is active
    // This would be called when significant user activity is detected
  }

  /**
   * Get journey progress insights
   */
  getJourneyInsights(journey, userActivity) {
    const insights = {
      adaptationNeeded: false,
      recommendedAdjustments: [],
      progressVelocity: 'on-track', // ahead, on-track, behind
      nextSuggestedAction: null
    };

    try {
      const completedMilestones = journey.filter(m => m.completed);
      const totalMilestones = journey.length;
      const completionRate = completedMilestones.length / totalMilestones;

      // Analyze if user is ahead, on track, or behind
      const daysSinceStart = 7; // This would be calculated from actual start date
      const expectedCompletionRate = daysSinceStart / (journey.reduce((sum, m) => sum + m.estimatedDays, 0));
      
      if (completionRate > expectedCompletionRate * 1.2) {
        insights.progressVelocity = 'ahead';
        insights.recommendedAdjustments.push('Consider adding more challenging milestones');
      } else if (completionRate < expectedCompletionRate * 0.8) {
        insights.progressVelocity = 'behind';
        insights.recommendedAdjustments.push('Break down current milestones into smaller steps');
      }

      // Find next suggested action
      const nextMilestone = journey.find(m => !m.completed);
      if (nextMilestone) {
        insights.nextSuggestedAction = {
          milestone: nextMilestone,
          timeEstimate: nextMilestone.focusMinutes,
          suggestion: nextMilestone.adaptiveFeatures?.motivationalNote
        };
      }

    } catch (error) {
      console.warn('Error generating journey insights:', error);
    }

    return insights;
  }
}

export default new AIProgressJourneyService();