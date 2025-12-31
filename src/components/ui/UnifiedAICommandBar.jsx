import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import unifiedAIService from '../../services/unifiedAIService';
import { geminiService } from '../../services/geminiService';

const UnifiedAICommandBar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('command'); // 'command' | 'chat'
  const [suggestions, setSuggestions] = useState([]);

  // Quick commands for command mode
  const quickCommands = [
    { icon: 'Target', label: 'Create Goal', action: 'create_goal', description: 'Start a new goal' },
    { icon: 'ListTodo', label: 'Add Todo', action: 'add_todo', description: 'Quick task entry' },
    { icon: 'Repeat', label: 'Track Habit', action: 'track_habit', description: 'Log habit completion' },
    { icon: 'Zap', label: 'Focus Mode', action: 'focus_mode', description: 'Start focused work' },
    { icon: 'BookOpen', label: 'Journal', action: 'journal', description: 'Write an entry' },
    { icon: 'BarChart3', label: 'Analytics', action: 'analytics', description: 'View progress' },
    { icon: 'UtensilsCrossed', label: 'Meal Plan', action: 'meals', description: 'Plan your meals' },
    { icon: 'MessageCircle', label: 'Chat with Drift', action: 'chat', description: 'AI conversation' },
  ];

  // Navigation routes
  const navigationRoutes = {
    'goals': '/goals-dashboard',
    'todos': '/temp-todos',
    'habits': '/habits',
    'focus': '/focus-mode',
    'journal': '/journal',
    'analytics': '/analytics-dashboard',
    'meals': '/meals',
    'settings': '/settings-configuration',
    'progress': '/progress',
    'day': '/day',
    'achievements': '/achievements',
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter suggestions based on query
    if (query.trim()) {
      const filtered = quickCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions(quickCommands);
    }
  }, [query]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      // Cmd/Ctrl + K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCommand = async (action) => {
    switch (action) {
      case 'create_goal':
        navigate('/goal-creation-management');
        onClose();
        break;
      case 'add_todo':
        navigate('/temp-todos');
        onClose();
        break;
      case 'track_habit':
        navigate('/habits');
        onClose();
        break;
      case 'focus_mode':
        navigate('/focus-mode');
        onClose();
        break;
      case 'journal':
        navigate('/journal');
        onClose();
        break;
      case 'analytics':
        navigate('/analytics-dashboard');
        onClose();
        break;
      case 'meals':
        navigate('/meals');
        onClose();
        break;
      case 'chat':
        setMode('chat');
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check for navigation commands
    const lowerQuery = query.toLowerCase().trim();
    for (const [key, route] of Object.entries(navigationRoutes)) {
      if (lowerQuery.includes(`go to ${key}`) || lowerQuery.includes(`open ${key}`) || lowerQuery === key) {
        navigate(route);
        onClose();
        setQuery('');
        return;
      }
    }

    // If in command mode and query matches a command
    const matchedCommand = quickCommands.find(cmd => 
      cmd.label.toLowerCase() === lowerQuery || 
      cmd.action === lowerQuery
    );
    if (matchedCommand && mode === 'command') {
      handleCommand(matchedCommand.action);
      setQuery('');
      return;
    }

    // Otherwise, send to AI
    setMode('chat');
    const userMessage = { role: 'user', content: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // Initialize Gemini if needed
      if (settings?.geminiApiKey) {
        await geminiService.initialize(settings.geminiApiKey);
      }

      const response = await unifiedAIService.getResponse(
        user?.uid || 'anonymous',
        query,
        [],
        { currentPage: location.pathname },
        'general'
      );

      const aiMessage = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please check your API key in settings.', 
        timestamp: Date.now(),
        isError: true 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPageContext = () => {
    const path = location.pathname;
    if (path.includes('goals')) return 'Goals';
    if (path.includes('todos')) return 'Todos';
    if (path.includes('habits')) return 'Habits';
    if (path.includes('focus')) return 'Focus';
    if (path.includes('journal')) return 'Journal';
    if (path.includes('meals')) return 'Meals';
    if (path.includes('analytics')) return 'Analytics';
    return 'Dashboard';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
        
        {/* Command Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl mx-4"
        >
          <div className="bg-surface/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary via-secondary to-accent rounded-lg flex items-center justify-center animate-pulse-gentle">
                  <Icon name="Sparkles" className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">Drift AI</span>
                  <span className="text-xs text-text-muted ml-2">• {getCurrentPageContext()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {mode === 'chat' && messages.length > 0 && (
                  <button
                    onClick={() => { setMode('command'); setMessages([]); }}
                    className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-surface-700/50 rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-700/50 rounded-lg transition-colors"
                >
                  <Icon name="X" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages (when in chat mode) */}
            {mode === 'chat' && messages.length > 0 && (
              <div className="max-h-[40vh] overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white rounded-br-md' 
                        : msg.isError
                          ? 'bg-error/10 border border-error/20 text-error rounded-bl-md'
                          : 'bg-surface-700/70 text-text-primary rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-2 text-text-secondary"
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs">Drift is thinking...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3">
              <div className="flex items-center space-x-3 bg-surface-700/50 rounded-xl px-4 py-3 border border-border/30 focus-within:border-primary/50 transition-colors">
                <Icon name={mode === 'chat' ? 'MessageCircle' : 'Search'} className="w-5 h-5 text-text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={mode === 'chat' ? "Ask Drift anything..." : "Search commands or ask Drift..."}
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
                />
                <div className="flex items-center space-x-1 text-xs text-text-muted">
                  <kbd className="px-1.5 py-0.5 bg-surface-600/50 rounded text-[10px]">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 bg-surface-600/50 rounded text-[10px]">K</kbd>
                </div>
              </div>
            </form>

            {/* Quick Commands (when in command mode) */}
            {mode === 'command' && (
              <div className="px-3 pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {suggestions.slice(0, 8).map((cmd) => (
                    <motion.button
                      key={cmd.action}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCommand(cmd.action)}
                      className="flex flex-col items-center justify-center p-3 bg-surface-700/30 hover:bg-surface-700/60 rounded-xl border border-border/20 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 rounded-lg flex items-center justify-center mb-2 transition-colors">
                        <Icon name={cmd.icon} className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-text-primary">{cmd.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/30 bg-surface-800/30">
              <div className="flex items-center justify-between text-[10px] text-text-muted">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <Icon name="ArrowUp" className="w-3 h-3" />
                    <Icon name="ArrowDown" className="w-3 h-3" />
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Icon name="CornerDownLeft" className="w-3 h-3" />
                    <span>Select</span>
                  </span>
                </div>
                <span className="flex items-center space-x-1">
                  <kbd className="px-1 py-0.5 bg-surface-600/50 rounded">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedAICommandBar;
