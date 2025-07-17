import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import * as geminiService from '../../../services/geminiService';

const AIAssistantPanel = ({ isCollapsed, onToggle, goalContext = null }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: `Hello! I'm Drift, your AI goal planning assistant. I'm here to help you create meaningful goals and develop effective strategies to achieve them.\n\nWhat kind of goal are you working on today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "Help me break down my goal into smaller milestones",
    "What\'s a realistic timeline for this goal?",
    "Suggest strategies for staying motivated",
    "How can I track progress effectively?",
    "What obstacles should I prepare for?",
    "Help me prioritize my goals"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const aiResponseContent = await generateAIResponse(inputMessage, goalContext);
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userInput, context) => {
    try {
      const isConnected = geminiService.isInitialized;
      
      if (!isConnected) {
        return "I'm not connected to my AI services right now. Please check your API key in settings to enable AI assistance.";
      }

      const prompt = `
You are Drift, an AI goal planning assistant helping users create and manage meaningful goals.

${context ? `Current goal context: ${JSON.stringify(context, null, 2)}` : ''}

User question: "${userInput}"

Provide expert guidance on:
- Goal setting and planning strategies
- Breaking down goals into actionable milestones
- Timeline estimation and realistic planning
- Motivation and habit formation
- Progress tracking and accountability
- Overcoming common obstacles

Keep responses practical, encouraging, and actionable. Focus on specific strategies the user can implement immediately.
      `;

      return await geminiService.generateText(prompt);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing your request right now. Please try again in a moment.";
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 left-6 z-200">
        <button
          onClick={onToggle}
          className="w-14 h-14 bg-secondary hover:bg-secondary-600 text-secondary-foreground rounded-full shadow-elevation hover:shadow-elevation-2 transition-all duration-normal flex items-center justify-center group"
        >
          <Icon name="MessageCircle" size={24} color="#FFFFFF" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
            <Icon name="Sparkles" size={12} color="#FFFFFF" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border shadow-elevation h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
            <Icon name="Sparkles" size={16} color="#FFFFFF" />
          </div>
          <div>
            <h3 className="font-heading-medium text-text-primary">Drift AI Assistant</h3>
            <p className="text-xs text-text-secondary">Goal Planning Expert</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors duration-fast"
        >
          <Icon name="Minimize2" size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user' ?'bg-primary text-primary-foreground' :'bg-surface-700 text-text-primary'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm font-body">
                {message.content}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-primary-foreground/70' : 'text-text-secondary'
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-surface-700 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-secondary mb-2">Quick suggestions:</p>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-colors duration-fast"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Ask Drift for goal planning advice..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            iconName="Send"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;