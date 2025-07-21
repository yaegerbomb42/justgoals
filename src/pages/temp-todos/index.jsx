import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemporaryTodos } from '../../context/TemporaryTodosContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';

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
  const inputRef = useRef(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
                onChange={(e) => setNewTodoText(e.target.value)}
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
              <AnimatePresence>
                {todos.map((todo, index) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.95,
                      x: -100,
                      transition: { duration: 0.2 }
                    }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      {/* Priority Indicator */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <Icon 
                          name={getPriorityIcon(todo.priority)} 
                          className={`w-4 h-4 ${getPriorityColor(todo.priority)}`} 
                        />
                        {todo.priority && (
                          <span className={`text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                            {todo.priority}
                          </span>
                        )}
                      </div>

                      {/* Todo Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-medium mb-1 break-words">
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <span>
                            {new Date(todo.createdAt?.toDate?.() || todo.createdAt).toLocaleDateString()}
                          </span>
                          {todo.aiPrioritized && (
                            <span className="flex items-center gap-1 text-purple-500">
                              <Icon name="Sparkles" className="w-3 h-3" />
                              AI Prioritized
                            </span>
                          )}
                          {todo.priority && (
                            <span className={`${getPriorityColor(todo.priority)}`}>
                              {getPriorityLabel(todo.priority)} Priority
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleCompleteTodo(todo.id)}
                          className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Complete"
                        >
                          <Icon name="Check" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Delete"
                        >
                          <Icon name="Trash2" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
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
    </div>
  );
};

export default TemporaryTodosPage;