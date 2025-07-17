import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MessageInput = ({ onSendMessage, disabled = false, isTyping = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Auto-focus input when typing stops (AI response is complete)
  useEffect(() => {
    if (!isTyping && textareaRef.current) {
      // Small delay to ensure the message has been added to the chat
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isTyping) {
      onSendMessage(message.trim());
      setMessage('');
      // Keep focus on input for quick follow-up messages
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea on mount to ensure proper height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="bg-surface border-t border-border p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTyping ? "Drift is responding..." : "Ask Drift anything about your goals, or say 'help me create a goal'..."}
            disabled={disabled || isTyping}
            className={`
              w-full px-4 py-3 bg-surface-700 border border-border rounded-2xl
              text-text-primary placeholder-text-muted font-body
              resize-none min-h-[48px] max-h-[120px]
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              transition-all duration-normal
              ${(disabled || isTyping) ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
            `}
            rows={1}
          />
          
          {/* Character Counter */}
          {message.length > 0 && (
            <div className="absolute bottom-1 right-3 text-xs text-text-muted font-caption">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!message.trim() || disabled || isTyping}
          className="flex-shrink-0 h-12 w-12 rounded-full p-0 transition-all duration-200 hover:scale-105"
        >
          {isTyping ? (
            <Icon name="Loader2" size={20} className="animate-spin" />
          ) : (
            <Icon name="Send" size={20} />
          )}
        </Button>
      </form>

      {/* Input Hints */}
      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        <span className="font-caption">
          {isTyping ? "Drift is thinking..." : "Press Enter to send, Shift+Enter for new line"}
        </span>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Icon name="Zap" size={12} />
            <span>AI-powered</span>
          </span>
          <span className="flex items-center space-x-1">
            <Icon name="Shield" size={12} />
            <span>Secure</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;