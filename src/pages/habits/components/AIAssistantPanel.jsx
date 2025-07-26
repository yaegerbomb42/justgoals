import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import unifiedAIService from '../../../services/unifiedAIService';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';

const HabitsAIAssistant = ({ 
  isExpanded, 
  onToggle, 
  habits, 
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit 
}) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = settings?.geminiApiKey;

  useEffect(() => {
    // Load conversation history
    const savedHistory = localStorage.getItem(`habits-ai-conversation-${user?.uid}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.messages || []);
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    } else {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: `Hello! I'm your habit formation assistant. I can help you:

• Create effective habit plans and routines
• Provide motivation and streak maintenance tips
• Analyze your habit patterns and suggest improvements
• Offer science-based advice for building lasting habits
• Help you overcome common habit-building obstacles

What would you like me to help you with today?`,
        timestamp: new Date(),
      }]);
    }
  }, [user?.uid]);

  // Save conversation history
  useEffect(() => {
    if (user?.uid && messages.length > 0) {
      const historyData = {
        messages,
        timestamp: Date.now(),
      };
      localStorage.setItem(`habits-ai-conversation-${user?.uid}`, JSON.stringify(historyData));
    }
  }, [messages, user?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content, type = 'user', metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date(),
      metadata,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add user message
      addMessage(userMessage, 'user');

      // Prepare context for AI
      const context = {
        user: {
          name: user?.displayName || user?.email,
          email: user?.email,
        },
        habitsData: {
          habits: habits || [],
          totalHabits: habits?.length || 0,
          activeHabits: habits?.filter(h => h.status === 'active').length || 0,
          completedHabits: habits?.filter(h => h.status === 'completed').length || 0,
          currentStreaks: habits?.map(h => ({
            title: h.title,
            streak: h.streak || 0,
            category: h.category
          })) || [],
        },
        currentDate: new Date().toISOString(),
      };

      // Use unifiedAIService for shared Drift memory, with domain 'habits'
      const aiResponseContent = await unifiedAIService.getResponse(
        user?.uid || 'anonymous',
        userMessage,
        [],
        context,
        'habits'
      );

      addMessage(aiResponseContent, 'assistant');
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('I apologize, but I encountered an error processing your request. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const generateHabitsResponse = async (message, context) => {
    const systemPrompt = `You are a helpful habit formation and tracking assistant. Provide practical, science-based advice for building and maintaining habits.

User context:
- Total habits: ${context.habitsData.totalHabits}
- Active habits: ${context.habitsData.activeHabits}
- Current streaks: ${context.habitsData.currentStreaks.map(s => `${s.title}: ${s.streak} days`).join(', ') || 'none'}

IMPORTANT: When the user asks to create habits or needs specific habit suggestions, include an action at the end.

For habit creation use this EXACT format:
[ACTION]{"type": "create_habit", "data": {"title": "Habit Name", "description": "Brief description", "category": "health|productivity|personal", "trackingType": "check|count|amount", "targetChecks": 1, "emoji": "🎯"}}[/ACTION]

For habit updates use:
[ACTION]{"type": "update_habit", "data": {"habitId": "id", "updates": {"title": "New title"}}}[/ACTION]

Provide practical advice about:
- Habit stacking and cue-based formation
- Motivation and consistency strategies  
- Streak recovery and progress tracking
- Science-backed habit formation techniques
- Overcoming common obstacles

Keep responses encouraging, actionable, and focused on sustainable habit building.`;

    try {
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Response timeout')), 15000);
      });
      
      const responsePromise = geminiService.generateContent(fullPrompt, apiKey);
      const text = await Promise.race([responsePromise, timeoutPromise]);
      
      // Check if this is a habit creation request
      const isHabitCreationRequest = message.toLowerCase().includes('create habit') || 
                                   message.toLowerCase().includes('new habit') ||
                                   message.toLowerCase().includes('add habit') ||
                                   message.toLowerCase().includes('start habit');
      
      // Clean response - remove action blocks
      let cleanMessage = text
        .replace(/\[ACTION\].*?\[\/ACTION\]/gs, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\{[\s\S]*?"type"[\s\S]*?\}/g, '')
        .replace(/^\s*\{[\s\S]*$/gm, '')
        .trim();

      // Parse actions
      const actionMatches = text.match(/\[ACTION\](.*?)\[\/ACTION\]/gs);
      let actions = [];

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

      // Force create habit action if request detected but no action found
      if (isHabitCreationRequest && actions.length === 0) {
        const fallbackHabit = {
          type: "create_habit",
          data: {
            title: "New Daily Habit",
            description: "A habit to help you achieve your goals",
            category: "personal",
            trackingType: "check",
            targetChecks: 1,
            emoji: "🎯"
          }
        };
        actions.push(fallbackHabit);
      }

      return {
        message: cleanMessage || "I'm here to help with your habit formation! What would you like to know?",
        actions,
        suggestions: [],
      };
    } catch (error) {
      console.error('Error generating habits response:', error);
      if (error.message.includes('timeout')) {
        throw new Error('Response took too long. Please try a more specific question.');
      }
      throw new Error('I had trouble processing that request. Please try rephrasing.');
    }
  };

  const processActions = async (actions) => {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_habit':
            await handleCreateHabit(action.data);
            break;
          case 'update_habit':
            await handleUpdateHabit(action.data);
            break;
          case 'delete_habit':
            await handleDeleteHabit(action.data);
            break;
        }
      } catch (error) {
        console.error(`Error processing action ${action.type}:`, error);
      }
    }
  };

  const handleCreateHabit = async (habitData) => {
    try {
      const habit = {
        title: habitData.title || 'New Habit',
        description: habitData.description || '',
        category: habitData.category || 'personal',
        trackingType: habitData.trackingType || 'check',
        targetChecks: habitData.targetChecks || 1,
        targetAmount: habitData.targetAmount || null,
        unit: habitData.unit || null,
        emoji: habitData.emoji || '🎯',
        allowMultipleChecks: habitData.allowMultipleChecks || false,
      };

      await onCreateHabit(habit);
      
      addMessage(
        `✅ **Habit Created Successfully!**\n\n` +
        `**"${habit.title}"** ${habit.emoji}\n` +
        `📋 **Category:** ${habit.category}\n` +
        `🎯 **Tracking:** ${habit.trackingType === 'check' ? 'Simple daily check' : habit.trackingType}\n` +
        `📝 **Description:** ${habit.description}\n\n` +
        `Your new habit has been added! Start building your streak today.`,
        'system',
        { type: 'habit_created', habitData: habit }
      );
      
    } catch (error) {
      console.error('Error creating habit:', error);
      addMessage(
        `❌ **Error creating habit:** ${error.message}\n\nPlease try again.`,
        'system',
        { type: 'error' }
      );
    }
  };

  const handleUpdateHabit = async (updateData) => {
    try {
      await onUpdateHabit(updateData.habitId, updateData.updates);
      addMessage(`✅ Updated habit successfully`, 'system');
    } catch (error) {
      console.error('Error updating habit:', error);
      addMessage(`❌ Error updating habit: ${error.message}`, 'system');
    }
  };

  const handleDeleteHabit = async (deleteData) => {
    try {
      await onDeleteHabit(deleteData.habitId);
      addMessage(`✅ Habit deleted successfully`, 'system');
    } catch (error) {
      console.error('Error deleting habit:', error);
      addMessage(`❌ Error deleting habit: ${error.message}`, 'system');
    }
  };

  const quickActions = [
    { text: 'Help me create a morning routine', icon: 'Sunrise' },
    { text: 'How to maintain habit streaks?', icon: 'Flame' },
    { text: 'Suggest habits for productivity', icon: 'Zap' },
    { text: 'Create a fitness habit plan', icon: 'Dumbbell' },
  ];

  const handleQuickAction = async (text) => {
    setInputMessage(text);
    setIsLoading(true);

    try {
      addMessage(text, 'user');

      const context = {
        user: {
          name: user?.displayName || user?.email,
          email: user?.email,
        },
        habitsData: {
          habits: habits || [],
          totalHabits: habits?.length || 0,
          activeHabits: habits?.filter(h => h.status === 'active').length || 0,
        },
        currentDate: new Date().toISOString(),
      };

      const response = await generateHabitsResponse(text, context);

      if (response.actions && response.actions.length > 0) {
        await processActions(response.actions);
      }

      addMessage(response.message, 'assistant', {
        actions: response.actions,
        suggestions: response.suggestions,
      });

    } catch (error) {
      console.error('Error processing quick action:', error);
      addMessage('I apologize, but I encountered an error processing your request. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        >
          <Icon name="Bot" size={24} />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
            <Icon name="Repeat" size={12} />
          </div>
        </motion.button>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="fixed right-0 top-16 bottom-16 w-80 bg-surface border-l border-border z-40 p-8 text-center">
        <Icon name="Key" className="w-16 h-16 mx-auto text-warning mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">API Key Required</h3>
        <p className="text-text-secondary">Please configure your Gemini API key in Settings to use the AI assistant.</p>
        <Button
          onClick={onToggle}
          variant="outline"
          className="mt-4"
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-16 bottom-16 w-80 bg-surface border-l border-border z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
              <Icon name="Bot" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Habits AI</h3>
              <p className="text-sm text-text-secondary">Your habit formation assistant</p>
            </div>
          </div>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.type === 'system'
                    ? 'bg-accent/20 text-text-primary border border-accent/30'
                    : 'bg-surface-700 text-text-primary'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                {message.type !== 'user' && (
                  <div className="text-xs text-text-secondary mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-surface-700 text-text-primary p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-text-secondary">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-border">
          <p className="text-sm text-text-secondary mb-3">Quick actions:</p>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.text)}
                disabled={isLoading}
                className="w-full flex items-center space-x-2 p-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name={action.icon} className="w-4 h-4" />
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about habits, routines, motivation..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="Send" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitsAIAssistant;
