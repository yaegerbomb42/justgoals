import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/ui/Icon';
import firestoreService from '../../../services/firestoreService';
import { geminiService } from '../../../services/geminiService';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';

const FocusSessionNotes = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [sessionNotes, setSessionNotes] = useState('');
  const [isNotesVisible, setIsNotesVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isAiMode, setIsAiMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const addMessage = (content, type = 'user') => {
    const newMessage = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleAiChat = async () => {
    if (!sessionNotes.trim() || isAiLoading) return;

    const apiKey = settings?.geminiApiKey;
    if (!apiKey?.trim()) {
      addMessage('AI assistant requires a Gemini API key. Please set it in Settings.', 'system');
      return;
    }

    const userMessage = sessionNotes.trim();
    setSessionNotes('');
    setIsAiLoading(true);

    // Add user message
    addMessage(userMessage, 'user');

    try {
      const prompt = `You are a helpful focus assistant for someone in a focus/work session. Provide brief, encouraging, and practical responses to help them stay focused and productive.

User's message: "${userMessage}"

Respond with:
- Quick tips for maintaining focus
- Brief motivation or encouragement
- Practical advice for productivity
- Solutions to common focus challenges

Keep responses concise (1-2 sentences) since they're in a focus session.`;

      const response = await geminiService.generateContent(prompt, apiKey);
      
      if (!response || response.trim().length === 0) {
        throw new Error('Received empty response from AI');
      }

      addMessage(response, 'assistant');

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      let errorMessage = 'I encountered an error. Please try again.';
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your settings.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      addMessage(errorMessage, 'system');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNotesSubmit = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isAiMode) {
        await handleAiChat();
      } else {
        await saveNote();
      }
    }
  };

  const saveNote = async () => {
    if (!sessionNotes.trim() || !user?.uid) return;

    try {
      setIsSaving(true);
      
      // Save to drift memory/session notes
      const noteData = {
        type: 'focus_session_note',
        content: sessionNotes.trim(),
        timestamp: new Date(),
        userId: user.uid,
        session: 'focus_mode'
      };

      // Save to firestore under a special collection for session notes
      await firestoreService.saveData(`users/${user.uid}/sessionNotes`, noteData);

      // Clear notes and add to chat history
      addMessage(sessionNotes.trim(), 'note');
      setSessionNotes('');
      
      console.log('Focus session note saved');
    } catch (error) {
      console.error('Error saving focus session note:', error);
      addMessage('Error saving note. Please try again.', 'system');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotes = () => {
    setIsNotesVisible(!isNotesVisible);
    if (!isNotesVisible) {
      // Focus the textarea when opening
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isNotesVisible ? (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleToggleNotes}
            className="bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg transition-all duration-200 group"
            title="Add focus session note"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="MessageCircle" className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-surface-800 border border-border rounded-lg p-3 w-80 shadow-xl backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon name="MessageCircle" className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-text-primary">Session Note</span>
              </div>
              <button
                onClick={() => setIsNotesVisible(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <Icon name="X" className="w-4 h-4" />
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              onKeyDown={handleNotesSubmit}
              placeholder="Add a note about your focus session... (Press Enter to save)"
              className="w-full h-20 px-3 py-2 bg-surface-700 border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isSaving}
            />
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-text-secondary">
                {isSaving ? 'Saving...' : 'Saves to drift memory'}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-text-secondary">Enter to send</span>
                {isSaving && (
                  <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FocusSessionNotes;
