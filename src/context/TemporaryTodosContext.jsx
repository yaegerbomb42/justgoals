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

      // Check if API key is available
      const apiKey = settings?.geminiApiKey;
      if (!apiKey?.trim()) {
        setError('AI prioritization requires a Gemini API key. Please set it in Settings.');
        return;
      }

      // Prepare todos for AI analysis
      const todosForAI = todos.map(todo => ({
        id: todo.id,
        text: todo.text,
        currentPriority: todo.priority || 0,
        createdAt: todo.createdAt,
        isUrgent: todo.text.toLowerCase().includes('urgent') || todo.text.toLowerCase().includes('asap'),
        hasDeadline: todo.text.toLowerCase().includes('deadline') || todo.text.toLowerCase().includes('due'),
        isQuickTask: todo.text.toLowerCase().includes('quick') || todo.text.toLowerCase().includes('5 min')
      }));

      // Enhanced prompt for better AI prioritization
      const prompt = `
        You are an expert productivity assistant. Analyze these ${todosForAI.length} todos and assign priority scores from 1-10 based on:
        
        PRIORITY FACTORS:
        - Urgency (time-sensitive tasks get higher priority 7-10)
        - Impact (high-value outcomes get priority 6-9)  
        - Effort required (quick wins get slight boost +1)
        - Dependencies (blocking other tasks gets priority 7-10)
        - Context clues (urgent, deadline, asap = high priority)
        
        TODOS TO PRIORITIZE:
        ${todosForAI.map((todo, i) => `${i + 1}. "${todo.text}" (current: ${todo.currentPriority}, created: ${new Date(todo.createdAt?.toDate?.() || todo.createdAt).toLocaleDateString()})`).join('\n')}

        INSTRUCTIONS:
        - Distribute priorities evenly (not all 8s and 9s)
        - Use full 1-10 scale
        - Consider variety in task types
        - Quick tasks can be 3-5 priority
        - Important but not urgent: 4-6
        - Urgent and important: 8-10
        - Low value busy work: 1-3

        Return ONLY a JSON array with objects containing "id" and "priority" (1-10, where 10 is highest):
        [{"id": "todo_id", "priority": 8}, {"id": "todo_id", "priority": 3}]
      `;

      const response = await geminiService.generateContent(prompt, apiKey);
      
      // Parse AI response with enhanced error handling
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
        setError('AI prioritization failed - invalid response format. Please try again.');
        return;
      }

      // Enhanced validation and application of priorities
      const validPriorities = aiPriorities.filter(item => 
        item.id && 
        typeof item.priority === 'number' && 
        item.priority >= 1 && 
        item.priority <= 10 &&
        todos.some(todo => todo.id === item.id)
      );

      if (validPriorities.length === 0) {
        setError('AI could not prioritize any todos. Please try again.');
        return;
      }

      if (validPriorities.length < todos.length * 0.5) {
        console.warn(`Only ${validPriorities.length}/${todos.length} todos were prioritized by AI`);
      }

      // Update in Firestore with batch operation
      await firestoreService.batchUpdateTempTodosPriority(user.uid, validPriorities);
      
      // Update local state with immediate visual feedback
      setTodos(prev => {
        const updated = [...prev];
        validPriorities.forEach(({ id, priority }) => {
          const index = updated.findIndex(t => t.id === id);
          if (index !== -1) {
            updated[index] = { 
              ...updated[index], 
              priority, 
              aiPrioritized: true,
              lastPrioritized: new Date().toISOString()
            };
          }
        });
        
        // Sort by priority (highest first), then by creation date
        return updated.sort((a, b) => {
          const priorityDiff = (b.priority || 0) - (a.priority || 0);
          if (priorityDiff !== 0) return priorityDiff;
          
          const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt);
          const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt);
          return dateB - dateA;
        });
      });

      // Success feedback
      console.log(`AI successfully prioritized ${validPriorities.length} todos`);
      
    } catch (err) {
      console.error('Error in AI prioritization:', err);
      
      // Provide specific error messages
      if (err.message.includes('API key')) {
        setError('Invalid API key. Please check your Gemini API key in Settings.');
      } else if (err.message.includes('rate limit')) {
        setError('Too many AI requests. Please wait a moment and try again.');
      } else if (err.message.includes('timeout')) {
        setError('AI prioritization timed out. Please try again.');
      } else {
        setError(`AI prioritization failed: ${err.message}`);
      }
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