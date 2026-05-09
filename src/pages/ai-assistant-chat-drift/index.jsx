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
import Button from '../../components/ui/Button';
import Page from '../../components/ui/Page';
import EmptyState from '../../components/ui/EmptyState';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';
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
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize API key
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

  // Load comprehensive context
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

  // Load conversation history
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!user?.uid) return;

      try {
        const driftMemory = await firestoreService.getDriftMemory(user.uid);
        if (driftMemory?.messages?.length > 0) {
          setMessages(driftMemory.messages);
          setConversationHistory(driftMemory.conversationHistory || []);
          return;
        }
      } catch (error) {
        console.error('Error loading from Firestore:', error);
      }

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

  // Save conversation history
  useEffect(() => {
    const saveConversationHistory = async () => {
      if (!user?.uid || messages.length === 0) return;

      const historyData = {
        messages,
        conversationHistory,
        timestamp: Date.now(),
      };

      localStorage.setItem(`drift-conversation-${user.uid}`, JSON.stringify(historyData));

      try {
        await firestoreService.saveDriftMemory(user.uid, historyData);
      } catch (error) {
        console.error('Error saving to Firestore:', error);
      }
    };

    const timer = setTimeout(saveConversationHistory, 1000);
    return () => clearTimeout(timer);
  }, [messages, conversationHistory, user?.uid]);

  const getRecentActivity = () => {
    const recentGoals = goals?.slice(0, 5) || [];
    const recentMilestones = JSON.parse(localStorage.getItem('recent-milestones') || '[]');
    const recentJournalEntries = JSON.parse(localStorage.getItem('recent-journal-entries') || '[]');
    
    return { recentGoals, recentMilestones, recentJournalEntries };
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

  const getPersona = () => {
    if (location.pathname.startsWith('/meals')) return 'meal';
    if (location.pathname.startsWith('/goals-dashboard')) return 'goal';
    if (location.pathname.startsWith('/daily-milestones')) return 'todo';
    if (location.pathname.startsWith('/habits')) return 'habit';
    return 'general';
  };

  const processUserMessage = async (message) => {
    setIsLoading(true);
    try {
      addMessage(message, 'user');

      const context = comprehensiveContext || {
        user: { name: user?.displayName || user?.email, email: user?.email },
        currentGoals: goals || [],
        recentActivity: getRecentActivity(),
        userPreferences: { theme: settings?.theme, notifications: settings?.notifications },
        conversationHistory: conversationHistory.slice(-20),
        persona: getPersona(),
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
      addMessage('I apologize, but I encountered an error. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
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

    const existingHabits = JSON.parse(localStorage.getItem('habits') || '[]');
    existingHabits.push(habit);
    localStorage.setItem('habits', JSON.stringify(existingHabits));

    addMessage(`✅ Created habit: "${habitData.title}"`, 'system');
  };

  const handleActionComplete = async (actionType, data) => {
    try {
      switch (actionType) {
        case 'create_goal':
          await handleCreateGoal(data);
          contextAggregationService.clearCache(user?.uid);
          break;
        case 'create_habit':
          await handleCreateHabit(data);
          contextAggregationService.clearCache(user?.uid);
          break;
      }
    } catch (error) {
      console.error(`Error completing action ${actionType}:`, error);
      addMessage(`❌ Error: ${error.message}`, 'system');
    }
  };

  const handleQuickAction = (action, customPrompt) => {
    const quickMessages = {
      'create_goal': 'I\'d love to help you create a new goal! What would you like to achieve?',
      'check_progress': 'Let me analyze your progress and provide some insights...',
      'add_milestone': 'Great! Which goal would you like to add a milestone to?',
      'journal_entry': 'I\'m here to help you reflect. What\'s on your mind today?',
      'focus_session': 'Ready to focus! What would you like to work on?',
      'habit_tracker': 'Let\'s check your habits and see how you\'re doing!',
    };

    const message = customPrompt || quickMessages[action] || 'How can I help you today?';
    processUserMessage(message);
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const clearAllHistory = async () => {
    setMessages([]);
    setConversationHistory([]);
    localStorage.removeItem(`drift-conversation-${user?.uid}`);
    
    try {
      await firestoreService.clearDriftMemory(user?.uid);
    } catch (error) {
      console.error('Error clearing drift memory:', error);
    }
  };

  // Loading/Error States
  if (!user?.id) {
    return (
      <Page width="sm">
        <EmptyState
          icon="AlertCircle"
          title="Sign In Required"
          description="Please sign in to chat with Drift."
          action={(
            <Button variant="primary" onClick={() => navigate('/login')}>Sign In</Button>
          )}
          size="lg"
        />
      </Page>
    );
  }

  if (!settings?.geminiApiKey) {
    return (
      <Page width="sm">
        <EmptyState
          icon="Key"
          title="API Key Required"
          description="Configure your Gemini API key in Settings to use Drift."
          action={(
            <Button variant="primary" onClick={() => navigate('/settings-configuration')}>Go to Settings</Button>
          )}
          size="lg"
        />
      </Page>
    );
  }

  if (apiKeyStatus === 'invalid') {
    return (
      <Page width="sm">
        <EmptyState
          icon="AlertCircle"
          title="Invalid API Key"
          description="Your Gemini API key appears to be invalid."
          action={(
            <Button variant="primary" onClick={() => navigate('/settings-configuration')}>Update Settings</Button>
          )}
          size="lg"
        />
      </Page>
    );
  }

  if (apiKeyStatus === 'checking') {
    return (
      <Page width="sm">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-lg opacity-50 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center">
              <Icon name="Sparkles" className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Initializing Drift</h3>
          <p className="text-text-secondary">Connecting to AI services...</p>
        </div>
      </Page>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl blur-sm opacity-50" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <Icon name="Sparkles" className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Drift AI</h1>
              <div className="flex items-center space-x-2 text-xs text-text-muted">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span>Online • Ready to help</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <span className="px-2 py-1 bg-surface-700/50 rounded-lg text-xs text-text-muted">
                {messages.length} messages
              </span>
            )}
            {conversationHistory.length > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-primary/10 rounded-lg">
                <Icon name="Brain" className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">{conversationHistory.length} in memory</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div ref={chatContainerRef} className="h-full overflow-y-auto px-4 py-4 scrollbar-hide">
          {messages.length === 0 ? (
            <WelcomeScreen onQuickAction={handleQuickAction} />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id}
                  message={message} 
                  onActionComplete={handleActionComplete}
                />
              ))}
            </AnimatePresence>
          )}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-3 mb-4"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center">
                <Icon name="Sparkles" className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="glass-card px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                        className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-text-secondary">Drift is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions (when has messages) */}
      {messages.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-border/30 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2">
            {[
              { id: 'create_goal', label: 'New Goal', icon: 'Target' },
              { id: 'check_progress', label: 'Progress', icon: 'BarChart3' },
              { id: 'add_milestone', label: 'Milestone', icon: 'CheckSquare' },
              { id: 'journal_entry', label: 'Journal', icon: 'BookOpen' },
              { id: 'focus_session', label: 'Focus', icon: 'Zap' },
              { id: 'habit_tracker', label: 'Habits', icon: 'Repeat' },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-700/30 hover:bg-surface-700/60 border border-border/20 hover:border-primary/30 rounded-lg transition-all whitespace-nowrap"
              >
                <Icon name={action.icon} className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-text-secondary">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-border/30 bg-surface/50 backdrop-blur-sm">
        <MessageInput
          onSendMessage={processUserMessage}
          isLoading={isLoading}
          placeholder="Ask Drift anything..."
          onClearChat={clearConversation}
          onClearAllHistory={clearAllHistory}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  );
};

export default DriftChat;
