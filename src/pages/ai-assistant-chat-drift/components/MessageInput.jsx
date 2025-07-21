import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const MessageInput = ({ message, setMessage, onSubmit, isProcessing, placeholder = "Type your message..." }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof message === 'string' && message.trim() && !isProcessing) {
      onSubmit(e);
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
          value={typeof message === 'string' ? message : ''}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isProcessing}
          className={`
            w-full resize-none bg-surface-700 border border-border rounded-xl px-4 py-3 pr-12
            text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50
            transition-all duration-200 min-h-[48px] max-h-32
            ${isFocused ? 'border-primary/50 bg-surface-600' : ''}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        
        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!message || typeof message !== 'string' || !message.trim() || isProcessing}
          className={
            `
              absolute right-2 top-1/2 transform -translate-y-1/2
              w-8 h-8 rounded-lg flex items-center justify-center
              transition-all duration-200
              ${typeof message === 'string' && message.trim() && !isProcessing
                ? 'bg-primary text-primary-foreground hover:bg-primary-dark shadow-lg'
                : 'bg-surface-600 text-text-secondary cursor-not-allowed'
              }
            `
          }
          whileHover={typeof message === 'string' && message.trim() && !isProcessing ? { scale: 1.05 } : {}}
          whileTap={typeof message === 'string' && message.trim() && !isProcessing ? { scale: 0.95 } : {}}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Icon name="Send" className="w-4 h-4" />
          )}
        </motion.button>
      </div>
      
      {/* Character count and status */}
      <div className="flex justify-between items-center mt-2 px-1">
        <span className="text-xs text-text-secondary">
          {(typeof message === 'string' ? message.length : 0)}/2000
        </span>
        <div className="flex items-center space-x-2">
          {isProcessing && (
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