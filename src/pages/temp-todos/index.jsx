import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemporaryTodos } from '../../context/TemporaryTodosContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import TodoItem from '../../components/ui/TodoItem';
import CelebrationEffect from '../../components/ui/CelebrationEffect';

const TemporaryTodosPage = () => {
  const { user, isAuthenticated } = useAuth();
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
  const inputRef = useRef(null);

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
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await deleteTodo(todoId);
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
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
            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" className="w-5 h-5 text-red-500" />
              <span className="text-red-500 font-medium">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Active Todos */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {todos.length === 0 ? (
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
                        <Icon name="Check" className="w-4 h-4 text-green-500" />
                        <span className="text-text-secondary line-through flex-1">
                          {todo.text}
                        </span>
                        <span className="text-xs text-text-muted">
                          {todo.completedAt && new Date(todo.completedAt.toDate?.() || todo.completedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-1 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded transition-all duration-200"
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
    </div>
  );
};

export default TemporaryTodosPage;