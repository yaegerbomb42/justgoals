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
          sender: 'drift',
          text: "Hi! I'm Drift, your AI assistant. I can help you plan your day, add goals, milestones, or habits, and track your progress. What would you like to do today?",
          timestamp: Date.now(),
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
      <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900">
        <Header title="Drift AI Assistant" />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading Drift...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if connection failed
  if (!apiKey || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900">
        <Header title="Drift AI Assistant" />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <Icon name={!apiKey ? "MessageCircle" : "AlertCircle"} className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">{!apiKey ? 'API Key Required' : 'Connection Failed'}</h3>
            <p className="text-text-secondary mb-6">{connectionError || (!apiKey ? 'Please configure your Gemini API key in Settings to chat with Drift.' : 'Unable to connect to Gemini API. Please check your API key in Settings.')}</p>
            <Button variant="outline" iconName="RefreshCw" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
        <FloatingActionButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900">
      <Header title="Drift AI Assistant" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                  isAuthenticated
                });
                const aiMessage = {
                  id: Date.now() + 1,
                  content: aiResponse,
                  sender: 'ai',
                  timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMessage]);
              } catch (error) {
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
            }}
          />
        ) : messages.length === 0 ? (
          <WelcomeScreen isConnected={isConnected} />
        ) : (
          <>
            <ConversationHeader onClearChat={handleClearChat} />
            {/* Chat UI */}
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto pb-32">
                {/* Message bubbles */}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>
              {/* Quick Features */}
              <div className="fixed bottom-24 left-0 right-0 flex justify-center gap-4 z-40">
                <Button onClick={() => handleQuickAction('add_goal')}>Add Goal</Button>
                <Button onClick={() => handleQuickAction('add_milestone')}>Add Milestone</Button>
                <Button onClick={() => handleQuickAction('add_habit')}>Add Habit</Button>
                <Button variant="outline" onClick={handleClearChat}>Clear Chat</Button>
              </div>
              {/* Chat Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 flex items-center z-50">
                <MessageInput
                  value={message}
                  onChange={setMessage}
                  onSend={handleSendMessage}
                  disabled={!isConnected || isProcessing}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
};

export default AiAssistantChatDrift;