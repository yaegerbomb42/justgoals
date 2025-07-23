import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemporaryTodos } from '../../context/TemporaryTodosContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { geminiService } from '../../services/geminiService';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import TodoItem from '../../components/ui/TodoItem';
import CelebrationEffect from '../../components/ui/CelebrationEffect';

const TemporaryTodosPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const {
    todos,
    archivedTodos,
    loading,
    error,
    isAiProcessing,
    addTodo,
    completeTodo,
    deleteTodo,
    updateTodo,
    aiPrioritizeTodos,
    getPriorityColor,
    getPriorityLabel,
    loadTodos
  } = useTemporaryTodos();

  const [newTodoText, setNewTodoText] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTodoText, setCompletedTodoText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // AI Assistant state
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const inputRef = useRef(null);
  const aiMessagesEndRef = useRef(null);

  // Quick suggestion prompts based on common todo patterns
  const quickSuggestions = [
    "Call doctor about appointment",
    "Buy groceries for dinner",
    "Reply to important emails", 
    "Schedule meeting with team",
    "Review project proposal",
    "Book flight tickets",
    "Pay utility bills",
    "Exercise for 30 minutes",
    "Read chapter of book",
    "Clean desk and organize files"
  ];

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Show suggestions when input is focused and empty
  const handleInputFocus = () => {
    if (!newTodoText.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion) => {
    setNewTodoText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim() || isAddingTodo) return;

    setIsAddingTodo(true);
    try {
      await addTodo(newTodoText);
      setNewTodoText('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleCompleteTodo = async (todoId) => {
    try {
      // Find the todo being completed for celebration
      const completedTodo = todos.find(t => t.id === todoId);
      if (completedTodo) {
        setCompletedTodoText(completedTodo.text);
        setShowCelebration(true);
      }
      
      await completeTodo(todoId);
    } catch (error) {
      console.error('Error completing todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await deleteTodo(todoId);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const getPriorityIcon = (priority) => {
    if (!priority || priority < 3) return 'Circle';
    if (priority < 6) return 'Minus';
    if (priority < 8) return 'ArrowUp';
    return 'AlertTriangle';
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setCompletedTodoText('');
  };

  const handleAiPrioritize = async () => {
    const apiKey = settings?.geminiApiKey;
    if (!apiKey?.trim()) {
      console.error('AI prioritization failed: Missing API key.');
      return;
    }

    try {
      await aiPrioritizeTodos();
      console.log('AI prioritization completed successfully.');
    } catch (error) {
      console.error('Error during AI prioritization:', error);
    }
  };

  // AI Assistant functions
  const scrollToBottomAI = () => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottomAI();
  }, [aiMessages]);

  const addAiMessage = (content, type = 'user') => {
    const newMessage = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date(),
    };
    setAiMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    const apiKey = settings?.geminiApiKey;
    if (!apiKey?.trim()) {
      addAiMessage('AI assistant requires a Gemini API key. Please set it in Settings.', 'system');
      return;
    }

    const userMessage = aiInput.trim();
    setAiInput('');
    setIsAiLoading(true);

    // Add user message
    addAiMessage(userMessage, 'user');

    try {
      // Prepare context for AI
      const context = {
        user: {
          name: user?.displayName || user?.email,
          email: user?.email,
        },
        todos: {
          active: todos.length,
          completed: archivedTodos.length,
          topPriority: todos.filter(t => (t.priority || 0) >= 7).length,
          recentTodos: todos.slice(0, 5).map(t => ({ text: t.text, priority: t.priority }))
        },
        currentDate: new Date().toISOString(),
      };

      const prompt = `You are a helpful productivity assistant for a todo management app. Help the user manage their todos effectively.

User Context:
- User: ${context.user.name || 'User'}
- Active todos: ${context.todos.active}
- Completed todos: ${context.todos.completed}
- High priority todos: ${context.todos.topPriority}
- Recent todos: ${context.todos.recentTodos.map(t => `"${t.text}" (priority: ${t.priority || 0})`).join(', ')}

User message: "${userMessage}"

Provide helpful advice about:
- Todo organization and prioritization
- Time management strategies
- Breaking down complex tasks
- Productivity tips and techniques
- Motivation and goal achievement

If the user asks you to create todos, suggest 3-5 specific, actionable todos they could add.

Keep responses conversational, practical, and encouraging. Focus on actionable advice.`;

      const response = await geminiService.generateContent(prompt, apiKey);
      
      if (!response || response.trim().length === 0) {
        throw new Error('Received empty response from AI');
      }

      // Add AI response
      addAiMessage(response, 'assistant');

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      let errorMessage = 'I encountered an error. Please try again.';
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your settings.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      addAiMessage(errorMessage, 'system');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSubmit();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-heading-bold text-text-primary mb-4">
            Please sign in to access Temporary Todos
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-heading-bold text-text-primary mb-2">
                Quick Todos
              </h1>
              <p className="text-text-secondary">
                Capture quick thoughts and let AI help prioritize what matters most
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowArchive(!showArchive)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Icon name="Archive" className="w-4 h-4" />
                {showArchive ? 'Hide Archive' : 'Show Archive'}
              </Button>
              <Button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Icon name="MessageCircle" className="w-4 h-4" />
                AI Assistant
              </Button>
              <Button
                onClick={aiPrioritizeTodos}
                disabled={isAiProcessing || todos.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Icon 
                  name={isAiProcessing ? "Loader2" : "Sparkles"} 
                  className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} 
                />
                {isAiProcessing ? 'AI Thinking...' : 'AI Prioritize'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Quick Add Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <form onSubmit={handleAddTodo} className="relative">
            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={newTodoText}
                onChange={(e) => {
                  setNewTodoText(e.target.value);
                  setShowSuggestions(false);
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="What needs to be done? (e.g., 'Call dentist about appointment')"
                className="w-full px-6 py-4 text-lg bg-surface border-2 border-border rounded-2xl focus:border-primary focus:outline-none transition-all duration-200 pr-16 placeholder-text-muted"
                disabled={isAddingTodo}
              />
              <button
                type="submit"
                disabled={!newTodoText.trim() || isAddingTodo}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <Icon 
                  name={isAddingTodo ? "Loader2" : "Plus"} 
                  className={`w-5 h-5 ${isAddingTodo ? 'animate-spin' : ''}`} 
                />
              </button>
            </div>

            {/* Quick Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto"
                >
                  <div className="p-3">
                    <div className="text-sm text-text-muted mb-2 flex items-center gap-2">
                      <Icon name="Lightbulb" className="w-4 h-4" />
                      Quick suggestions:
                    </div>
                    <div className="space-y-1">
                      {quickSuggestions.slice(0, 6).map((suggestion, index) => (
                        <motion.button
                          key={suggestion}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          <Icon name="Plus" className="w-3 h-3 text-text-muted" />
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-4 bg-error/10 border border-error/20 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" className="w-5 h-5 text-error" />
              <span className="text-error font-medium">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-text-secondary">Loading todos...</span>
          </div>
        )}

        {/* Debug Info for Development */}
        {!loading && process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>User authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>User ID: {user?.uid || 'None'}</p>
            <p>Todos count: {todos?.length || 0}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
          </div>
        )}

        {/* Active Todos */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {(!todos || todos.length === 0) ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                  <Icon name="CheckSquare" className="w-12 h-12 text-primary/50" />
                </div>
                <h3 className="text-xl font-heading-semibold text-text-primary mb-2">
                  No todos yet
                </h3>
                <p className="text-text-secondary">
                  Add your first todo above to get started!
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {todos.map((todo, index) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    index={index}
                    onComplete={handleCompleteTodo}
                    onDelete={handleDeleteTodo}
                    onUpdate={updateTodo}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}

        {/* Archive Section */}
        <AnimatePresence>
          {showArchive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-12 border-t border-border pt-8"
            >
              <h2 className="text-xl font-heading-semibold text-text-primary mb-6 flex items-center gap-2">
                <Icon name="Archive" className="w-5 h-5" />
                Completed Todos ({archivedTodos.length})
              </h2>
              
              {archivedTodos.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  No completed todos yet
                </div>
              ) : (
                <div className="space-y-2">
                  {archivedTodos.map((todo, index) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-surface/50 border border-border/50 rounded-lg p-3 opacity-75"
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="Check" className="w-4 h-4 text-success" />
                        <span className="text-text-secondary line-through flex-1">
                          {todo.text}
                        </span>
                        <span className="text-xs text-text-muted">
                          {todo.completedAt && new Date(todo.completedAt.toDate?.() || todo.completedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-1 text-error/50 hover:text-error hover:bg-error/10 rounded transition-all duration-200"
                          title="Delete permanently"
                        >
                          <Icon name="Trash2" className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Celebration Effect */}
      <CelebrationEffect 
        show={showCelebration} 
        onComplete={handleCelebrationComplete}
      />

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-96 bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Icon name="MessageCircle" className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Todo Assistant</h3>
                    <p className="text-sm text-text-secondary">AI-powered productivity help</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIAssistant(false)}
                  className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <Icon name="X" className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="MessageCircle" className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary mb-4">
                    I'm here to help you manage your todos more effectively!
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setAiInput("How can I be more productive with my todos?")}
                      className="w-full text-left p-2 text-sm bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors"
                    >
                      How can I be more productive?
                    </button>
                    <button
                      onClick={() => setAiInput("Help me prioritize my current todos")}
                      className="w-full text-left p-2 text-sm bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors"
                    >
                      Help me prioritize my todos
                    </button>
                    <button
                      onClick={() => setAiInput("Suggest some todos for today")}
                      className="w-full text-left p-2 text-sm bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors"
                    >
                      Suggest some todos for today
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {aiMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-white'
                            : message.type === 'system'
                            ? 'bg-warning/20 text-warning border border-warning/30'
                            : 'bg-surface-700 text-text-primary border border-border'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAiLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-surface-700 border border-border rounded-lg px-3 py-2">
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
                  
                  <div ref={aiMessagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={handleAiKeyPress}
                  placeholder="Ask about todo management, productivity tips..."
                  className="flex-1 px-3 py-2 bg-surface-700 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder-text-secondary"
                  disabled={isAiLoading}
                />
                <button
                  onClick={handleAiSubmit}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon name="Send" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemporaryTodosPage;