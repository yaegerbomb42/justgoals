import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemporaryTodos } from '../../context/TemporaryTodosContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { todoAIService } from '../../services/todoAIService';
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

  // Quick suggestion prompts
  const quickSuggestions = [
    "Call doctor about appointment",
    "Buy groceries for dinner",
    "Reply to important emails", 
    "Schedule meeting with team",
    "Review project proposal",
    "Book flight tickets",
    "Pay utility bills",
    "Exercise for 30 minutes"
  ];

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Initialize AI personality
  useEffect(() => {
    if (user?.uid) {
      todoAIService.loadPersonality(user.uid);
    }
  }, [user?.uid]);

  const handleInputFocus = () => {
    if (!newTodoText.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
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
      const todosContext = {
        active: todos.length,
        completed: archivedTodos.length,
        topPriority: todos.filter(t => (t.priority || 1) >= 7).length,
        recentTodos: todos.slice(0, 3).map(t => ({ text: t.text, priority: t.priority || 1 }))
      };

      const response = await todoAIService.generateResponse(userMessage, todosContext, apiKey);
      
      // Add AI response
      addAiMessage(response, 'assistant');

    } catch (error) {
      console.error('Error generating AI response:', error);
      addAiMessage('I encountered an error. Please try again! 🤖', 'system');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-heading-bold text-text-primary mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Quick Todos ⚡
              </h1>
              <p className="text-text-secondary">
                Capture quick thoughts and let Drift AI help prioritize what matters most
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowArchive(!showArchive)}
                variant="secondary"
                className="flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Icon name="Archive" className="w-4 h-4" />
                {showArchive ? 'Hide Archive' : 'Show Archive'}
              </Button>
              <Button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                variant="primary"
                className="flex items-center gap-2 hover:scale-105 transition-transform bg-gradient-to-r from-primary to-secondary"
              >
                <Icon name="Zap" className="w-4 h-4" />
                Drift AI
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Add Todo Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <form onSubmit={handleAddTodo} className="relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Add a quick todo... (tip: include 'urgent' or 'quick' for smart prioritization)"
                className="w-full px-6 py-4 text-lg bg-surface/80 backdrop-blur-sm border-2 border-border/60 rounded-2xl 
                focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/20 
                placeholder-text-muted transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isAddingTodo}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {isAddingTodo && (
                  <Icon name="Loader2" className="w-5 h-5 animate-spin text-primary" />
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newTodoText.trim() || isAddingTodo}
                  className="bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-transform shadow-md"
                >
                  <Icon name="Plus" className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto"
                >
                  <div className="p-4">
                    <p className="text-sm text-text-muted mb-3">Quick suggestions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickSuggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-left p-2 text-sm bg-surface/50 hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-102"
                        >
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

        {/* Priority Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex items-center justify-between bg-surface/60 backdrop-blur-sm rounded-xl p-4 border border-border/40"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">
              {todos.length} active • {archivedTodos.length} completed
            </span>
            {todos.filter(t => (t.priority || 1) >= 7).length > 0 && (
              <span className="text-sm text-primary font-medium">
                {todos.filter(t => (t.priority || 1) >= 7).length} high priority
              </span>
            )}
          </div>
          <Button
            onClick={handleAiPrioritize}
            disabled={isAiProcessing || todos.length === 0}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            {isAiProcessing ? (
              <Icon name="Loader2" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon name="Wand2" className="w-4 h-4" />
            )}
            {isAiProcessing ? 'Prioritizing...' : 'AI Prioritize'}
          </Button>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-4 bg-error/10 border border-error/20 rounded-xl backdrop-blur-sm"
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
              className="mt-12 border-t border-border/60 pt-8"
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
                      className="bg-surface/50 border border-border/50 rounded-lg p-3 opacity-75 hover:opacity-90 transition-opacity"
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
            className="fixed top-0 right-0 h-full w-96 bg-gradient-to-b from-surface to-surface/95 border-l border-border/60 shadow-2xl backdrop-blur-md z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <Icon name="Zap" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading-semibold text-text-primary">
                      Drift AI
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Your focused productivity assistant
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIAssistant(false)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  <Icon name="X" className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                    <Icon name="MessageCircle" className="w-8 h-8 text-primary/50" />
                  </div>
                  <p className="text-text-muted text-sm">
                    Hi! I'm Drift, your AI productivity assistant. Ask me anything about organizing your todos!
                  </p>
                </div>
              ) : (
                aiMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-white'
                          : message.type === 'system'
                          ? 'bg-error/10 text-error border border-error/20'
                          : 'bg-surface border border-border text-text-primary'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={aiMessagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/60">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={handleAiKeyPress}
                  placeholder="Ask Drift for help..."
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary text-sm"
                  disabled={isAiLoading}
                />
                <Button
                  onClick={handleAiSubmit}
                  disabled={!aiInput.trim() || isAiLoading}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  {isAiLoading ? (
                    <Icon name="Loader2" className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon name="Send" className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemporaryTodosPage;