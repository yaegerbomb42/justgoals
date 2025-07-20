import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const MessageInput = ({ message, setMessage, onSubmit, isProcessing, placeholder = "Type your message..." }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isProcessing}
          className={`
            w-full resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12
            text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50
            transition-all duration-200 min-h-[48px] max-h-32
            ${isFocused ? 'border-purple-500/50 bg-white/10' : ''}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ 
            background: isFocused 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' 
              : 'rgba(255,255,255,0.05)'
          }}
        />
        
        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || isProcessing}
          className={`
            absolute right-2 top-1/2 transform -translate-y-1/2
            w-8 h-8 rounded-lg flex items-center justify-center
            transition-all duration-200
            ${message.trim() && !isProcessing
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
              : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
            }
          `}
          whileHover={message.trim() && !isProcessing ? { scale: 1.05 } : {}}
          whileTap={message.trim() && !isProcessing ? { scale: 0.95 } : {}}
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
        <span className="text-xs text-gray-400">
          {message.length}/2000
        </span>
        <div className="flex items-center space-x-2">
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-1"
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-400">Processing...</span>
            </motion.div>
          )}
        </div>
      </div>
    </form>
  );
};

export default MessageInput;