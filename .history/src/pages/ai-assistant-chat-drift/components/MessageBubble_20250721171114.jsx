import React from 'react';
import Icon from '../../../components/AppIcon';
import { motion } from 'framer-motion';

const MessageBubble = ({ message, isProcessing = false }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'assistant' || message.sender === 'ai' || message.sender === 'drift';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end mb-4"
      >
        <div className="max-w-[80%] lg:max-w-[70%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex justify-end mt-2">
            <span className="text-xs text-text-secondary">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isAI) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start mb-4"
      >
        <div className="flex items-start space-x-3 max-w-[80%] lg:max-w-[70%]">
          {/* AI Avatar */}
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
            <Icon name="Bot" className="w-4 h-4 text-white" />
          </div>
          
          {/* Message Content */}
          <div className="flex-1">
            <div className="bg-surface-700 border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-text-secondary">Drift is thinking...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center mt-2 space-x-2">
              <span className="text-xs text-text-secondary">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {!isProcessing && (
                <div className="flex items-center space-x-1">
                  <Icon name="Check" className="w-3 h-3 text-success" />
                  <span className="text-xs text-success">Delivered</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default MessageBubble;