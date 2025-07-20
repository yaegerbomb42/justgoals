import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { geminiService } from '../../../services/geminiService';

const AIAssistantPanel = ({ isExpanded, onToggle, selectedDate, milestones, goals }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: `Good morning! I'm Drift, your AI productivity assistant. I can help you plan your daily milestones, suggest task priorities, and provide achievement strategies.\n\nHow can I help you make today productive?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage) => {
    try {
      const isConnected = geminiService.isInitialized;
      
      if (!isConnected) {
        return "I'm not connected to my AI services right now. Please check your API key in settings to enable AI assistance.";
      }

      const context = {
        selectedDate: selectedDate.toISOString().split('T')[0],
        milestones: milestones,
        goals: goals,
        completedCount: milestones.filter(m => m.completed).length,
        totalCount: milestones.length,
        highPriorityTasks: milestones.filter(m => m.priority === 'high' && !m.completed)
      };

      const prompt = `
You are Drift, an AI productivity assistant helping with daily milestone management. 

Context:
- Date: ${context.selectedDate}
- Milestones: ${context.totalCount} total, ${context.completedCount} completed
- Goals: ${context.goals.length} active goals
- High priority incomplete tasks: ${context.highPriorityTasks.length}

User message: "${userMessage}"

Provide helpful, actionable advice about:
- Task prioritization and time management
- Motivation and productivity strategies
- Goal alignment and progress tracking
- Specific suggestions based on their current milestone status

Keep responses concise, encouraging, and practical. Focus on actionable next steps.
      `;

      return await geminiService.generateText(prompt);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing your request right now. Please try again in a moment.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const aiResponseContent = await generateAIResponse(inputValue);
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedPrompts = [
    "Help me prioritize today\'s tasks",
    "Suggest a daily routine",
    "How to stay motivated?",
    "Time management tips"
  ];

  return (
    <div className={`
      fixed right-0 top-16 bottom-16 bg-surface border-l border-border transition-all duration-normal z-300
      ${isExpanded ? 'w-80' : 'w-12'}
      md:relative md:top-0 md:bottom-0
    `}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          absolute top-4 bg-primary text-primary-foreground rounded-lg p-2 shadow-elevation transition-all duration-normal
          ${isExpanded ? '-left-10' : '-left-10'}
        `}
      >
        <Icon name={isExpanded ? "ChevronRight" : "MessageCircle"} size={16} />
      </button>

      {isExpanded && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                <Icon name="Bot" size={16} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="font-heading-medium text-text-primary">Drift</h3>
                <p className="text-xs text-text-secondary">AI Assistant</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[80%] p-3 rounded-lg text-sm
                  ${message.type === 'user' ?'bg-primary text-primary-foreground' :'bg-surface-800 text-text-primary border border-border'
                  }
                `}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`
                    text-xs mt-2 opacity-75
                    ${message.type === 'user' ? 'text-primary-foreground' : 'text-text-secondary'}
                  `}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-800 border border-border p-3 rounded-lg">
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

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-text-secondary mb-2">Try asking:</p>
              <div className="space-y-1">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(prompt)}
                    className="w-full text-left text-xs text-text-secondary hover:text-text-primary p-2 rounded hover:bg-surface-700 transition-colors duration-fast"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Drift for help..."
                rows={2}
                className="flex-1 px-3 py-2 bg-surface-800 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-fast resize-none text-sm"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                iconName="Send"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;