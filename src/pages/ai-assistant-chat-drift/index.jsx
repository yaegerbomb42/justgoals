import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { usePlanData } from '../../context/PlanDataContext';
import { useAchievements } from '../../context/AchievementContext';
import { geminiService } from '../../services/geminiService';
import contextAggregationService from '../../services/contextAggregationService';
import firestoreService from '../../services/firestoreService';
import Icon from '../../components/ui/Icon';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';
import QuickActionChips from './components/QuickActionChips';
import WelcomeScreen from './components/WelcomeScreen';
import unifiedAIService from '../../services/unifiedAIService';

const DriftChat = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { goals, addGoal, updateGoal, deleteGoal } = usePlanData();
  const { addAchievement } = useAchievements();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [comprehensiveContext, setComprehensiveContext] = useState(null);
  const [apiKeyStatus, setApiKeyStatus] = useState('checking'); // 'checking', 'valid', 'invalid', 'missing'
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize API key from settings
  useEffect(() => {
    const initializeApiKey = async () => {
      if (!settings?.geminiApiKey) {
        setApiKeyStatus('missing');
        return;
      }

      setApiKeyStatus('checking');
      try {
        await geminiService.initialize(settings.geminiApiKey);
        setApiKeyStatus('valid');
      } catch (error) {
        console.error('Failed to initialize Gemini API:', error);
        setApiKeyStatus('invalid');
      }
    };

    initializeApiKey();
  }, [settings?.geminiApiKey]);

  // Load comprehensive context when user or goals change
  useEffect(() => {
    const loadContext = async () => {
      if (!user?.uid || apiKeyStatus !== 'valid') return;

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
  }, [user?.uid, goals, settings, apiKeyStatus]);
  // Load conversation history from both localStorage and Firestore
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!user?.uid) return;

      try {
        // Try to load from Firestore first for better persistence
        const driftMemory = await firestoreService.getDriftMemory(user.uid);
        if (driftMemory && driftMemory.messages && driftMemory.messages.length > 0) {
          setMessages(driftMemory.messages);
          setConversationHistory(driftMemory.conversationHistory || []);
          return;
        }
      } catch (error) {
        console.error('Error loading from Firestore:', error);
      }

      // Fallback to localStorage
      const savedHistory = localStorage.getItem(`drift-conversation-${user.uid}`);
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setMessages(parsed.messages || []);
          setConversationHistory(parsed.conversationHistory || []);
        } catch (error) {
          console.error('Error loading conversation history:', error);
        }
      }
    };

    loadConversationHistory();
  }, [user?.uid]);

  // Save conversation history to both localStorage and Firestore
  useEffect(() => {
    const saveConversationHistory = async () => {
      if (!user?.uid || messages.length === 0) return;

      const historyData = {
        messages,
        conversationHistory,
        timestamp: Date.now(),
      };

      // Save to localStorage for immediate access
      localStorage.setItem(`drift-conversation-${user.uid}`, JSON.stringify(historyData));

      // Save to Firestore for persistence across devices
      try {
        await firestoreService.saveDriftMemory(user.uid, historyData);
      } catch (error) {
        console.error('Error saving to Firestore:', error);
      }
    };

    // Debounce the save operation
    const timer = setTimeout(saveConversationHistory, 1000);
    return () => clearTimeout(timer);
  }, [messages, conversationHistory, user?.uid]);

  // Update context with current app state
  useEffect(() => {
    // This effect is now handled by the comprehensive context loading above
    // Keeping for backward compatibility but may be removed later
  }, [goals, settings]);

  const getRecentActivity = () => {
    // Get recent activity from localStorage or other sources
    const recentGoals = goals?.slice(0, 5) || [];
    const recentMilestones = JSON.parse(localStorage.getItem('recent-milestones') || '[]');
    const recentJournalEntries = JSON.parse(localStorage.getItem('recent-journal-entries') || '[]');
    
    return {
      recentGoals,
      recentMilestones,
      recentJournalEntries,
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content, sender = 'user', metadata = {}) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      content,
      sender,
      timestamp: Date.now(),
      metadata,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  // Determine persona based on route
  const getPersona = () => {
    if (location.pathname.startsWith('/meals')) return 'meal';
    if (location.pathname.startsWith('/goals-dashboard')) return 'goal';
    if (location.pathname.startsWith('/daily-milestones')) return 'todo';
    if (location.pathname.startsWith('/habits')) return 'habit';
    // Add more as needed
    return 'general';
  };
  const persona = getPersona();

  const processUserMessage = async (message) => {
    setIsLoading(true);
    try {
      // Add user message
      addMessage(message, 'user');

      // Use unifiedAIService for shared Drift memory, with domain 'drift'
      const context = comprehensiveContext || {
        user: {
          name: user?.displayName || user?.email,
          email: user?.email,
        },
        currentGoals: goals || [],
        recentActivity: getRecentActivity(),
        userPreferences: {
          theme: settings?.theme,
          notifications: settings?.notifications,
          focusMode: settings?.focusMode,
        },
        conversationHistory: conversationHistory.slice(-10),
        persona, // Pass persona to AI
      };

      const aiResponse = await unifiedAIService.getResponse(
        user?.uid || 'anonymous',
        message,
        context.currentGoals || [],
        context,
        'drift'
      );

      addMessage(aiResponse, 'assistant');
      setConversationHistory(prev => [...prev, { role: 'user', content: message }, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('I apologize, but I encountered an error processing your request. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const processActions = async (actions) => {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_goal':
            await handleCreateGoal(action.data);
            break;
          case 'update_goal':
            await handleUpdateGoal(action.data);
            break;
          case 'create_milestone':
            await handleCreateMilestone(action.data);
            break;
          case 'add_journal_entry':
            await handleAddJournalEntry(action.data);
            break;
          case 'create_habit':
            await handleCreateHabit(action.data);
            break;
          case 'show_goal_ui':
          case 'show_habit_ui':
            // These actions are handled directly by the MessageBubble component
            // They don't need processing here as they trigger UI components
            break;
          case 'analyze_progress':
            await handleAnalyzeProgress(action.data);
            break;
          case 'navigate_to':
            navigate(action.data.path);
            break;
        }
      } catch (error) {
        console.error(`Error processing action ${action.type}:`, error);
      }
    }
  };

  const handleCreateGoal = async (goalData) => {
    const newGoal = {
      id: Date.now().toString(),
      title: goalData.title,
      description: goalData.description,
      category: goalData.category || 'personal',
      priority: goalData.priority || 'medium',
      deadline: goalData.deadline,
      milestones: goalData.milestones || [],
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await addGoal(newGoal);
    addMessage(`✅ Created new goal: "${goalData.title}"`, 'system');
  };

  const handleUpdateGoal = async (updateData) => {
    const goal = goals.find(g => g.id === updateData.goalId);
    if (goal) {
      const updatedGoal = { ...goal, ...updateData.updates };
      await updateGoal(updatedGoal);
      addMessage(`✅ Updated goal: "${goal.title}"`, 'system');
    }
  };

  const handleCreateMilestone = async (milestoneData) => {
    const milestone = {
      id: Date.now().toString(),
      title: milestoneData.title,
      description: milestoneData.description,
      goalId: milestoneData.goalId,
      dueDate: milestoneData.dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Add to localStorage for now (in a real app, this would go to a proper database)
    const existingMilestones = JSON.parse(localStorage.getItem('milestones') || '[]');
    existingMilestones.push(milestone);
    localStorage.setItem('milestones', JSON.stringify(existingMilestones));

    addMessage(`✅ Created milestone: "${milestoneData.title}"`, 'system');
  };

  const handleAddJournalEntry = async (entryData) => {
    const entry = {
      id: Date.now().toString(),
      title: entryData.title,
      content: entryData.content,
      mood: entryData.mood,
      tags: entryData.tags || [],
      createdAt: new Date().toISOString(),
    };

    // Add to localStorage for now
    const existingEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
    existingEntries.push(entry);
    localStorage.setItem('journal-entries', JSON.stringify(existingEntries));

    addMessage(`✅ Added journal entry: "${entryData.title}"`, 'system');
  };

  const handleCreateHabit = async (habitData) => {
    const habit = {
      id: Date.now().toString(),
      title: habitData.title,
      description: habitData.description,
      frequency: habitData.frequency || 'daily',
      streak: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Add to localStorage for now
    const existingHabits = JSON.parse(localStorage.getItem('habits') || '[]');
    existingHabits.push(habit);
    localStorage.setItem('habits', JSON.stringify(existingHabits));

    addMessage(`✅ Created habit: "${habitData.title}"`, 'system');
  };

  const handleAnalyzeProgress = async (analysisData) => {
    // Use comprehensive context for better analysis
    const analysisContext = comprehensiveContext || {
      allGoals: goals || [],
      recentActivity: getRecentActivity()
    };
    
    const insights = await geminiService.analyzeProgress(
      analysisContext.allGoals || analysisContext.currentGoals || [], 
      analysisContext.recentActivity || {}
    );
    addMessage(insights, 'assistant', { type: 'analysis' });
  };

  // Handle UI action completions from interactive components
  const handleActionComplete = async (actionType, data) => {
    try {
      switch (actionType) {
        case 'create_goal':
          await handleCreateGoal(data);
          // Clear context cache to refresh data
          contextAggregationService.clearCache(user?.uid);
          break;
        case 'create_habit':
          await handleCreateHabit(data);
          contextAggregationService.clearCache(user?.uid);
          break;
        case 'edit_goal':
          await handleUpdateGoal({ goalId: data.id, updates: data });
          contextAggregationService.clearCache(user?.uid);
          break;
        case 'edit_habit':
          // Handle habit editing
          const existingHabits = JSON.parse(localStorage.getItem('habits') || '[]');
          const updatedHabits = existingHabits.map(h => h.id === data.id ? data : h);
          localStorage.setItem('habits', JSON.stringify(updatedHabits));
          addMessage(`✅ Updated habit: "${data.title}"`, 'system');
          contextAggregationService.clearCache(user?.uid);
          break;
      }
    } catch (error) {
      console.error(`Error completing action ${actionType}:`, error);
      addMessage(`❌ Error completing action: ${error.message}`, 'system');
    }
  };

  const handleQuickAction = (action) => {
    const quickMessages = {
      'create_goal': 'I\'d love to help you create a new goal! What would you like to achieve?',
      'check_progress': 'Let me analyze your progress and provide some insights...',
      'add_milestone': 'Great! Which goal would you like to add a milestone to?',
      'journal_entry': 'I\'m here to help you reflect. What\'s on your mind today?',
      'focus_session': 'Ready to focus! What would you like to work on?',
      'habit_tracker': 'Let\'s check your habits and see how you\'re doing!',
    };

    const message = quickMessages[action] || 'How can I help you today?';
    processUserMessage(message);
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
    localStorage.removeItem(`drift-conversation-${user?.uid}`);
  };

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" className="w-16 h-16 mx-auto text-error mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Sign In Required</h3>
          <p className="text-text-secondary">Please sign in to use the Drift AI Assistant.</p>
        </div>
      </div>
    );
  }

  if (!settings?.geminiApiKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Icon name="Key" className="w-16 h-16 mx-auto text-warning mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">API Key Required</h3>
          <p className="text-text-secondary mb-4">Please configure your Gemini API key in Settings to use Drift.</p>
          <button
            onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  if (apiKeyStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Icon name="AlertCircle" className="w-16 h-16 mx-auto text-error mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Invalid API Key</h3>
          <p className="text-text-secondary mb-4">Your Gemini API key appears to be invalid. Please check your settings.</p>
          <button
            onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Update Settings
          </button>
        </div>
      </div>
    );
  }

  if (apiKeyStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">Initializing Drift</h3>
          <p className="text-text-secondary">Connecting to AI services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background max-w-6xl mx-auto">
      {/* Compact Header */}
      <div className="bg-surface border-b border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Icon name="MessageCircle" className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-heading-bold text-text-primary">Drift AI Assistant</h1>
              <p className="text-xs text-text-secondary">Your personal goal companion</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {messages.length > 0 && (
              <span className="text-xs text-text-secondary px-2 py-1 bg-surface-700 rounded-full">
                {messages.length} messages
              </span>
            )}
            <button
              onClick={clearConversation}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Icon name="Trash2" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div ref={chatContainerRef} className="h-full overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <WelcomeScreen onQuickAction={handleQuickAction} />
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble 
                    message={message} 
                    onActionComplete={handleActionComplete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-text-secondary"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">Drift is thinking...</span>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Compact Quick Actions */}
      {messages.length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-surface/50">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'create_goal', label: 'Goal', icon: 'Target' },
              { id: 'check_progress', label: 'Progress', icon: 'BarChart3' },
              { id: 'add_milestone', label: 'Milestone', icon: 'CheckSquare' },
              { id: 'journal_entry', label: 'Journal', icon: 'BookOpen' },
              { id: 'focus_session', label: 'Focus', icon: 'Zap' },
              { id: 'habit_tracker', label: 'Habits', icon: 'Repeat' },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-surface-700 hover:bg-surface-600 rounded-md transition-colors"
              >
                <Icon name={action.icon} className="w-3 h-3" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compact Message Input */}
      <div className="p-3 border-t border-border bg-surface/30">
        <MessageInput
          onSendMessage={processUserMessage}
          isLoading={isLoading}
          placeholder="Ask Drift anything..."
        />
      </div>
    </div>
  );
};

export default DriftChat;