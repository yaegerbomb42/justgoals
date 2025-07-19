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
import { useAuth } from '../../context/AuthContext';

const AiAssistantChatDrift = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load messages from localStorage
  const getMessagesStorageKey = () => {
    if (isAuthenticated && user?.id) {
      return `drift_chat_messages_${user.id}`;
    }
    return 'drift_chat_messages_guest';
  };

  // Initialize on mount
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        // Load API key
        const key = await geminiService.loadApiKey(user?.id);
        setApiKey(key);
        
        if (key) {
          // Test connection
          const result = await geminiService.testConnection(key);
          setIsConnected(result.success);
        }

        // Load saved messages
        try {
          const saved = localStorage.getItem(getMessagesStorageKey());
          if (saved) {
            setMessages(JSON.parse(saved));
          }
        } catch (e) {
          console.warn('Failed to load saved messages:', e);
        }
      } catch (error) {
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
      
      if (newApiKey) {
        try {
          const result = await geminiService.testConnection(newApiKey);
          setIsConnected(result.success);
        } catch (error) {
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    };

    window.addEventListener('apiKeyChanged', handleApiKeyChange);
    return () => window.removeEventListener('apiKeyChanged', handleApiKeyChange);
  }, []);

  // Save messages when they change
  useEffect(() => {
    try {
      localStorage.setItem(getMessagesStorageKey(), JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save messages:', e);
    }
  }, [messages, getMessagesStorageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900">
      <Header title="Drift AI Assistant" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!apiKey ? (
          <div className="text-center py-12">
            <Icon name="MessageCircle" className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">API Key Required</h3>
            <p className="text-text-secondary mb-6">Please configure your Gemini API key in Settings to chat with Drift.</p>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-12">
            <Icon name="AlertCircle" className="w-16 h-16 mx-auto text-error mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">Connection Failed</h3>
            <p className="text-text-secondary mb-6">Unable to connect to Gemini API. Please check your API key in Settings.</p>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <WelcomeScreen onStartChat={() => setMessages([{
                id: Date.now(),
                content: "Hello! I'm Drift, your AI productivity assistant. I can help you create goals, plan your day, and provide productivity insights. What would you like to work on today?",
                sender: 'ai',
                timestamp: new Date().toISOString()
              }])} />
            )}
            {messages.length > 0 && (
              <>
                <ConversationHeader onClearChat={handleClearChat} />
                <div className="bg-surface rounded-lg border border-border mb-4 overflow-hidden" style={{ height: '60vh' }}>
                  <div className="p-4 overflow-y-auto h-full">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {isProcessing && (
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Drift is thinking...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <QuickActionChips onAction={handleQuickAction} />
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleSubmit}
                  isProcessing={isProcessing}
                />
              </>
            )}
          </>
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
};

export default AiAssistantChatDrift;