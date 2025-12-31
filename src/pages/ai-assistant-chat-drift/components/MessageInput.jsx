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
    <form onSubmit={handleSubmit} className="relative w-full max-w-4xl mx-auto">
      <div className={`
        relative rounded-2xl border transition-all duration-300
        ${isFocused 
          ? 'bg-surface/50 border-primary/30 shadow-lg shadow-primary/5' 
          : 'bg-surface/30 border-white/10 hover:border-white/20'
        }
      `}>
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
            w-full resize-none bg-transparent px-5 py-4 pr-14
            text-text-primary placeholder-text-muted focus:outline-none
            transition-all duration-200 min-h-[56px] max-h-40 overflow-hidden
            text-sm leading-relaxed
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            resize: 'none',
            height: 'auto',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
          }}
        />
        
        {/* Send Button */}
        <div className="absolute right-2 bottom-2">
          <motion.button
            type="submit"
            disabled={!message.trim() || isLoading}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              transition-all duration-200
              ${message.trim() && !isLoading
                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-500'
                : 'bg-white/5 text-text-muted cursor-not-allowed'
              }
            `}
            whileHover={message.trim() && !isLoading ? { scale: 1.05 } : {}}
            whileTap={message.trim() && !isLoading ? { scale: 0.95 } : {}}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Icon name="Send" className="w-5 h-5 ml-0.5" />
            )}
          </motion.button>
        </div>
      </div>
      
      {/* Footer / Controls */}
      <div className="flex justify-between items-center mt-3 px-2">
        <div className="flex items-center space-x-4">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
            {message.length} / 2000
          </span>
        </div>
        
        {hasMessages && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClearChat}
              className="text-[10px] font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Clear Chat
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

export default MessageInput;