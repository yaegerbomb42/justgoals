import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/ui/Header';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import ConversationHeader from './components/ConversationHeader';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';
import QuickActionChips from './components/QuickActionChips';
import WelcomeScreen from './components/WelcomeScreen';
import Icon from '../../components/AppIcon';
import geminiService from '../../services/geminiService';
import firestoreService from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const AiAssistantChatDrift = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const messagesEndRef = useRef(null);
  const [profile, setProfile] = useState({});

  // Load messages from localStorage
  const getMessagesStorageKey = () => {
    if (isAuthenticated && user?.id) {
      return `drift_chat_messages_${user.id}`;
    }
    return 'drift_chat_messages_guest';
  };

  // Load messages and profile from Firestore on mount
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      setConnectionError('');
      try {
        // Load API key
        const key = await geminiService.loadApiKey(user?.id);
        setApiKey(key);
        if (key) {
          const result = await geminiService.testConnection(key);
          setIsConnected(result.success);
          setConnectionError(result.success ? '' : (result.error || 'Unable to connect to Gemini API.'));
        } else {
          setIsConnected(false);
          setConnectionError('No API key found. Please configure your Gemini API key in Settings.');
        }
        // Load Drift memory from Firestore
        let memory = null;
        try {
          memory = await firestoreService.getDriftMemory(user?.id);
        } catch {}
        if (memory && Array.isArray(memory.chats)) {
          setMessages(memory.chats);
          setProfile(memory.profile || {});
        } else {
          // Fallback to localStorage
          try {
            const saved = localStorage.getItem(getMessagesStorageKey());
            if (saved) {
              setMessages(JSON.parse(saved));
            }
          } catch (e) {
            console.warn('Failed to load saved messages:', e);
          }
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionError('Failed to initialize chat: ' + (error?.message || error));
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeChat();
  }, [user?.id, isAuthenticated]);

  // Listen for API key changes
  useEffect(() => {
    const handleApiKeyChange = async (event) => {
      const newApiKey = event.detail.apiKey;
      setApiKey(newApiKey);
      setConnectionError('');
      if (newApiKey) {
        try {
          const result = await geminiService.testConnection(newApiKey);
          setIsConnected(result.success);
          setConnectionError(result.success ? '' : (result.error || 'Unable to connect to Gemini API.'));
        } catch (error) {
          setIsConnected(false);
          setConnectionError('Unable to connect to Gemini API.');
        }
      } else {
        setIsConnected(false);
        setConnectionError('No API key found. Please configure your Gemini API key in Settings.');
      }
    };

    window.addEventListener('apiKeyChanged', handleApiKeyChange);
    return () => window.removeEventListener('apiKeyChanged', handleApiKeyChange);
  }, []);

  // Save messages and profile to Firestore/localStorage when messages change
  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(getMessagesStorageKey(), JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save messages:', e);
    }
    // Save to Firestore
    firestoreService.saveDriftMemory(user.id, { profile, chats: messages });
  }, [messages, profile, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add intro message if messages.length === 0
  useEffect(() => {
    if (isConnected && messages.length === 0) {
      setMessages([
        {
          id: 'intro',
          sender: 'ai',
          content: "Hi! I'm Drift, your AI assistant. I can help you plan your day, add goals, milestones, or habits, and track your progress. What would you like to do today?",
          timestamp: new Date().toISOString()
        },
      ]);
    }
  }, [isConnected, messages.length]);

  const handleSendMessage = async (messageContent) => {
    if (!messageContent.trim() || isProcessing) return;
    const userMessage = {
      id: Date.now(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsProcessing(true);
    try {
      const aiResponse = await geminiService.generateChatResponse(messageContent, {
        userId: user?.id,
        isAuthenticated,
        profile
      });
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      // Optionally update profile here based on AI response or user message
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: "I encountered an error while processing your message. Please check your API key in Settings and try again.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSendMessage(message);
  };

  const handleQuickAction = async (action) => {
    const actionMessages = {
      'create_goal': 'I can help you create a goal! Tell me what you want to achieve.',
      'daily_plan': 'I can help you with your daily plan. What would you like to focus on today?',
      'productivity_tips': 'Here are some productivity tips:\n\n1. **Time Blocking**: Schedule specific time slots for different tasks\n2. **Pomodoro Technique**: Work in 25-minute focused sessions\n3. **Priority Matrix**: Use the Eisenhower Matrix to prioritize tasks\n\nWould you like me to elaborate on any of these techniques?',
      'motivation': 'Here\'s some motivation for you:\n\n🌟 Every expert was once a beginner. Your progress, no matter how small, is still progress.\n\n🎯 Focus on the process, not just the outcome. The journey is where growth happens.\n\nWhat specific goal or challenge would you like to tackle?'
    };

    const message = actionMessages[action] || 'How can I help you today?';
    await handleSendMessage(message);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Drift AI Assistant" />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" style={{ animationDelay: '-0.5s' }}></div>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Loading Drift</h2>
            <p className="text-text-secondary">Preparing your AI assistant...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show error if connection failed
  if (!apiKey || !isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Drift AI Assistant" />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto p-8"
          >
            <div className="w-20 h-20 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name={!apiKey ? "MessageCircle" : "AlertCircle"} className="w-10 h-10 text-error" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">{!apiKey ? 'API Key Required' : 'Connection Failed'}</h3>
            <p className="text-text-secondary mb-8 leading-relaxed">
              {connectionError || (!apiKey ? 'Please configure your Gemini API key in Settings to chat with Drift.' : 'Unable to connect to Gemini API. Please check your API key in Settings.')}
            </p>
            <Button 
              variant="outline" 
              iconName="RefreshCw" 
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </motion.div>
        </div>
        <FloatingActionButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Drift AI Assistant" />
      
      <div className="flex flex-col h-screen pt-16">
        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
          {messages.length === 0 && isConnected ? (
            <WelcomeScreen
              isConnected={isConnected}
              onQuickStart={async (prompt) => {
                // Add a user message and trigger chat UI
                const userMessage = {
                  id: Date.now(),
                  content: prompt,
                  sender: 'user',
                  timestamp: new Date().toISOString()
                };
                setMessages([userMessage]);
                setMessage('');
                setIsProcessing(true);
                try {
                  const aiResponse = await geminiService.generateChatResponse(prompt, {
                    userId: user?.id,
                    isAuthenticated,
                    profile
                  });
                  const aiMessage = {
                    id: Date.now() + 1,
                    content: aiResponse,
                    sender: 'ai',
                    timestamp: new Date().toISOString()
                  };
                  setMessages([userMessage, aiMessage]);
                } catch (error) {
                  console.error('Error generating AI response:', error);
                  const errorMessage = {
                    id: Date.now() + 1,
                    content: "I encountered an error while processing your message. Please check your API key in Settings and try again.",
                    sender: 'ai',
                    timestamp: new Date().toISOString()
                  };
                  setMessages([userMessage, errorMessage]);
                } finally {
                  setIsProcessing(false);
                }
              }}
            />
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto mb-6 space-y-4">
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <MessageBubble
                        message={msg}
                        isProcessing={isProcessing && index === messages.length - 1}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <QuickActionChips onAction={handleQuickAction} />
                </motion.div>
              )}

              {/* Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-2xl border border-border p-4 shadow-lg"
              >
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleSubmit}
                  isProcessing={isProcessing}
                  placeholder="Message Drift..."
                />
              </motion.div>
            </>
          )}
        </div>
      </div>
      <FloatingActionButton />
    </div>
  );
};

export default AiAssistantChatDrift;