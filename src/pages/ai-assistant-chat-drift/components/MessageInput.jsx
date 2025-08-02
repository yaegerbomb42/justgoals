import React, { useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { motion } from 'framer-motion';

const MessageInput = ({ onSendMessage, isLoading, placeholder = "Type your message...", onClearChat, onClearAllHistory, hasMessages = false }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={`
            w-full resize-none bg-surface-700 border border-border rounded-xl px-4 py-3 pr-12
            text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50
            transition-all duration-200 min-h-[48px] max-h-32 overflow-hidden
            ${isFocused ? 'border-primary/50 bg-surface-600' : ''}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            resize: 'none',
            height: 'auto',
            minHeight: '48px',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
          }}
        />
        
        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`
            absolute right-2 top-1/2 transform -translate-y-1/2
            w-8 h-8 rounded-lg flex items-center justify-center
            transition-all duration-200
            ${message.trim() && !isLoading
              ? 'bg-primary text-primary-foreground hover:bg-primary-dark shadow-lg cursor-pointer'
              : 'bg-surface-600 text-text-secondary cursor-not-allowed'
            }
          `}
          whileHover={message.trim() && !isLoading ? { scale: 1.05 } : {}}
          whileTap={message.trim() && !isLoading ? { scale: 0.95 } : {}}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Icon name="Send" className="w-4 h-4" />
          )}
        </motion.button>
      </div>
      
      {/* Character count, status, and clear buttons */}
      <div className="flex justify-between items-center mt-2 px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary">
            {message.length}/2000
          </span>
          {hasMessages && (
            <div className="flex items-center space-x-1">
              <button
                onClick={onClearChat}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-surface-700"
                title="Clear chat display"
              >
                Clear Chat
              </button>
              <span className="text-text-muted">•</span>
              <button
                onClick={onClearAllHistory}
                className="text-xs text-error hover:text-error/80 transition-colors px-2 py-1 rounded hover:bg-error/10"
                title="Clear all history and AI memory"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-1"
            >
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs text-primary">Processing...</span>
            </motion.div>
          )}
        </div>
      </div>
    </form>
  );
};

export default MessageInput;