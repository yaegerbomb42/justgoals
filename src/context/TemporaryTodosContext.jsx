import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import firestoreService from '../services/firestoreService';
import { geminiService } from '../services/geminiService';

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
  const [todos, setTodos] = useState([]);
  const [archivedTodos, setArchivedTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

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
  const addTodo = async (todoText, priority = 0) => {
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
    if (!user?.uid || todos.length === 0 || isAiProcessing) return;

    try {
      setIsAiProcessing(true);
      setError(null);

      // Prepare todos for AI analysis
      const todosForAI = todos.map(todo => ({
        id: todo.id,
        text: todo.text,
        currentPriority: todo.priority || 0
      }));

      // Generate prompt for AI
      const prompt = `
        You are a productivity assistant. Analyze these todos and assign priority scores from 1-10 based on:
        - Urgency (time-sensitive tasks get higher priority)
        - Impact (high-value outcomes get higher priority)  
        - Effort required (quick wins get slight boost)
        - Dependencies (blocking other tasks gets higher priority)

        Todos to prioritize:
        ${todosForAI.map((todo, i) => `${i + 1}. ${todo.text}`).join('\n')}

        Return ONLY a JSON array with objects containing "id" and "priority" (1-10, where 10 is highest):
        [{"id": "todo_id", "priority": 8}, ...]
      `;

      const response = await geminiService.generateContent(prompt);
      
      // Parse AI response
      let aiPriorities;
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiPriorities = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        setError('AI prioritization failed - invalid response format');
        return;
      }

      // Validate and apply priorities
      const validPriorities = aiPriorities.filter(item => 
        item.id && typeof item.priority === 'number' && 
        item.priority >= 1 && item.priority <= 10
      );

      if (validPriorities.length > 0) {
        // Update in Firestore
        await firestoreService.batchUpdateTempTodosPriority(user.uid, validPriorities);
        
        // Update local state
        setTodos(prev => {
          const updated = [...prev];
          validPriorities.forEach(({ id, priority }) => {
            const index = updated.findIndex(t => t.id === id);
            if (index !== -1) {
              updated[index] = { 
                ...updated[index], 
                priority, 
                aiPrioritized: true 
              };
            }
          });
          // Sort by priority (highest first)
          return updated.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        });
      }
    } catch (err) {
      console.error('Error in AI prioritization:', err);
      setError('AI prioritization failed');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Get priority color based on priority score
  const getPriorityColor = (priority) => {
    if (!priority || priority < 3) return 'text-text-secondary';
    if (priority < 6) return 'text-amber-500';
    if (priority < 8) return 'text-orange-500';
    return 'text-red-500';
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    if (!priority || priority < 3) return 'Low';
    if (priority < 6) return 'Medium';
    if (priority < 8) return 'High';
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
    loadTodos
  };

  return (
    <TemporaryTodosContext.Provider value={value}>
      {children}
    </TemporaryTodosContext.Provider>
  );
};