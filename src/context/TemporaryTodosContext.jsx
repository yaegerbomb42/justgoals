import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import firestoreService from '../services/firestoreService';
import { todoAIService } from '../services/todoAIService';

const TemporaryTodosContext = createContext();

export const useTemporaryTodos = () => {
  const context = useContext(TemporaryTodosContext);
  if (!context) {
    throw new Error('useTemporaryTodos must be used within a TemporaryTodosProvider');
  }
  return context;
};

export const TemporaryTodosProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [todos, setTodos] = useState([]);
  const [archivedTodos, setArchivedTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Load AI personality when user changes
  useEffect(() => {
    if (user?.uid) {
      todoAIService.loadPersonality(user.uid);
    }
  }, [user?.uid]);

  // Load todos from Firestore
  const loadTodos = useCallback(async () => {
    if (!user?.uid || !isAuthenticated) {
      console.log('User not authenticated, skipping todos load');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading todos for user:', user.uid);
      
      const [activeTodos, archived] = await Promise.all([
        firestoreService.getTempTodos(user.uid),
        firestoreService.getArchivedTempTodos(user.uid)
      ]);
      
      console.log('Loaded todos:', { activeTodos, archived });
      setTodos(Array.isArray(activeTodos) ? activeTodos : []);
      setArchivedTodos(Array.isArray(archived) ? archived : []);
    } catch (err) {
      console.error('Error loading temp todos:', err);
      setError('Failed to load todos');
      // Set empty arrays on error to prevent crashes
      setTodos([]);
      setArchivedTodos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isAuthenticated]);

  // Load todos when user changes
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Add a new todo
  const addTodo = async (todoText, priority = 1) => {
    if (!user?.uid || !todoText.trim()) {
      console.log('Cannot add todo: user not authenticated or empty text');
      return null;
    }

    try {
      console.log('Adding new todo:', todoText);
      const newTodo = {
        text: todoText.trim(),
        completed: false,
        archived: false,
        priority: priority,
        aiPrioritized: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedTodo = await firestoreService.saveTempTodo(user.uid, newTodo);
      console.log('Todo saved successfully:', savedTodo);
      
      // Force state update and reload
      setTodos(prev => {
        const updated = [savedTodo, ...prev];
        console.log('Updated todos list:', updated);
        return updated;
      });
      
      // Also reload todos to ensure consistency
      setTimeout(() => loadTodos(), 100);
      
      return savedTodo;
    } catch (err) {
      console.error('Error adding todo:', err);
      setError('Failed to add todo');
      return null;
    }
  };

  // Complete a todo (move to archive)
  const completeTodo = async (todoId) => {
    if (!user?.uid) return;

    try {
      await firestoreService.completeTempTodo(user.uid, todoId);
      
      // Move from active to archived
      const completedTodo = todos.find(t => t.id === todoId);
      if (completedTodo) {
        const archivedTodo = {
          ...completedTodo,
          completed: true,
          archived: true,
          completedAt: new Date()
        };
        setTodos(prev => prev.filter(t => t.id !== todoId));
        setArchivedTodos(prev => [archivedTodo, ...prev]);
      }
    } catch (err) {
      console.error('Error completing todo:', err);
      setError('Failed to complete todo');
    }
  };

  // Delete a todo permanently
  const deleteTodo = async (todoId) => {
    if (!user?.uid) return;

    try {
      await firestoreService.deleteTempTodo(user.uid, todoId);
      setTodos(prev => prev.filter(t => t.id !== todoId));
      setArchivedTodos(prev => prev.filter(t => t.id !== todoId));
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo');
    }
  };

  // Update a todo
  const updateTodo = async (todoId, updates) => {
    if (!user?.uid) return;

    try {
      await firestoreService.updateTempTodo(user.uid, todoId, updates);
      setTodos(prev => prev.map(t => 
        t.id === todoId ? { ...t, ...updates } : t
      ));
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo');
    }
  };

  // AI-powered priority sorting
  const aiPrioritizeTodos = async () => {
    if (!user?.uid) {
      setError('Please sign in to use AI prioritization.');
      return;
    }

    if (todos.length === 0) {
      setError('No todos to prioritize.');
      return;
    }

    try {
      setIsAiProcessing(true);
      setError(null);

      const apiKey = settings?.geminiApiKey;
      const priorities = await todoAIService.prioritizeTodos(todos, apiKey);

      // Update todos with new priorities
      const updatedTodos = todos.map(todo => {
        const priorityUpdate = priorities.find(p => p.id === todo.id);
        if (priorityUpdate) {
          return { ...todo, priority: priorityUpdate.priority };
        }
        return todo;
      });

      // Save updated todos to Firestore
      await Promise.all(
        updatedTodos
          .filter(todo => {
            const original = todos.find(t => t.id === todo.id);
            return original && original.priority !== todo.priority;
          })
          .map(todo => firestoreService.updateTempTodo(user.uid, todo.id, { priority: todo.priority }))
      );

      setTodos(updatedTodos);
      
    } catch (error) {
      console.error('Error during AI prioritization:', error);
      
      // Better error messages
      const errorMessages = {
        'API_KEY_MISSING': 'AI prioritization requires a Gemini API key. Please set it in Settings.',
        'NO_TODOS_TO_PRIORITIZE': 'No todos available to prioritize.',
        'INVALID_AI_RESPONSE': 'AI service returned invalid response. Please try again.',
        'INVALID_PRIORITY_FORMAT': 'AI priority format error. Please try again.'
      };
      
      setError(errorMessages[error.message] || 'AI prioritization failed. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Get priority color based on priority score
  const getPriorityColor = (priority) => {
    const p = priority || 1; // Default to 1 instead of 0
    if (p < 3) return 'text-text-secondary';
    if (p < 6) return 'text-amber-500';
    if (p < 8) return 'text-orange-500';
    return 'text-red-500';
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    const p = priority || 1; // Default to 1 instead of 0
    if (p < 3) return 'Low';
    if (p < 6) return 'Medium';
    if (p < 8) return 'High';
    return 'Critical';
  };

  const value = {
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
    loadTodos,
    // AI service functions
    aiService: todoAIService
  };

  return (
    <TemporaryTodosContext.Provider value={value}>
      {children}
    </TemporaryTodosContext.Provider>
  );
};