import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { usePlanData } from './PlanDataContext';
import { geminiService } from '../services/geminiService';
import unifiedAIService from '../services/unifiedAIService';
import contextAggregationService from '../services/contextAggregationService';

const UnifiedAIContext = createContext(null);

export const useUnifiedAI = () => {
  const context = useContext(UnifiedAIContext);
  if (!context) {
    throw new Error('useUnifiedAI must be used within a UnifiedAIProvider');
  }
  return context;
};

export const UnifiedAIProvider = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { goals } = usePlanData();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [conversationMemory, setConversationMemory] = useState([]);
  const [comprehensiveContext, setComprehensiveContext] = useState(null);

  // Initialize AI service when settings change
  useEffect(() => {
    const initializeAI = async () => {
      if (settings?.geminiApiKey) {
        try {
          await geminiService.initialize(settings.geminiApiKey);
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize AI:', error);
          setIsInitialized(false);
        }
      }
    };

    initializeAI();
  }, [settings?.geminiApiKey]);

  // Load comprehensive context
  useEffect(() => {
    const loadContext = async () => {
      if (!user?.uid || !isInitialized) return;

      try {
        const context = await contextAggregationService.getComprehensiveContext(
          user.uid,
          goals || [],
          settings || {}
        );
        setComprehensiveContext(context);
      } catch (error) {
        console.error('Error loading comprehensive context:', error);
      }
    };

    loadContext();
  }, [user?.uid, goals, settings, isInitialized]);

  // Send message to AI
  const sendMessage = useCallback(async (message, domain = 'general', additionalContext = {}) => {
    if (!isInitialized) {
      return { error: 'AI not initialized. Please configure your API key in settings.' };
    }

    setIsProcessing(true);
    
    try {
      const context = {
        ...comprehensiveContext,
        ...additionalContext,
        conversationMemory: conversationMemory.slice(-20),
        currentGoals: goals || [],
        userPreferences: settings,
      };

      const response = await unifiedAIService.getResponse(
        user?.uid || 'anonymous',
        message,
        goals || [],
        context,
        domain
      );

      // Update conversation memory
      setConversationMemory(prev => [
        ...prev,
        { role: 'user', content: message, timestamp: Date.now() },
        { role: 'assistant', content: response, timestamp: Date.now() }
      ].slice(-50));

      setLastResponse(response);
      return { response, success: true };
    } catch (error) {
      console.error('AI Error:', error);
      return { error: error.message, success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized, comprehensiveContext, conversationMemory, goals, settings, user?.uid]);

  // Quick AI actions
  const quickActions = {
    suggestGoal: () => sendMessage('Suggest a meaningful goal I could work on based on my current goals and progress.', 'goal-planning'),
    analyzeProgress: () => sendMessage('Analyze my current progress across all goals and give me insights.', 'analytics'),
    prioritizeTasks: () => sendMessage('Help me prioritize my tasks for today based on my goals and deadlines.', 'todo'),
    motivateMe: () => sendMessage('Give me a personalized motivational message based on my current journey.', 'general'),
    planWeek: () => sendMessage('Help me plan my week ahead to make progress on my goals.', 'planning'),
    suggestHabit: () => sendMessage('Suggest a new habit that would help me achieve my goals faster.', 'habits'),
  };

  // Clear conversation memory
  const clearMemory = useCallback(() => {
    setConversationMemory([]);
    setLastResponse(null);
  }, []);

  // Refresh context
  const refreshContext = useCallback(async () => {
    if (!user?.uid) return;

    try {
      contextAggregationService.clearCache(user.uid);
      const context = await contextAggregationService.getComprehensiveContext(
        user.uid,
        goals || [],
        settings || {}
      );
      setComprehensiveContext(context);
    } catch (error) {
      console.error('Error refreshing context:', error);
    }
  }, [user?.uid, goals, settings]);

  const value = {
    isInitialized,
    isProcessing,
    lastResponse,
    conversationMemory,
    comprehensiveContext,
    sendMessage,
    quickActions,
    clearMemory,
    refreshContext,
    aiName: 'Drift',
  };

  return (
    <UnifiedAIContext.Provider value={value}>
      {children}
    </UnifiedAIContext.Provider>
  );
};

export default UnifiedAIContext;
