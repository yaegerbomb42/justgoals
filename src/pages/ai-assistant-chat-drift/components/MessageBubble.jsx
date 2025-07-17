import React from 'react';
import Icon from '../../../components/AppIcon';

const MessageBubble = ({ message, isUser, isTyping = false }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-gradient-to-br from-accent to-secondary text-white'
          }`}>
            {isUser ? (
              <Icon name="User" size={16} color="#FFFFFF" />
            ) : (
              <Icon name="Bot" size={16} color="#FFFFFF" />
            )}
          </div>
          
          {/* Message Content */}
          <div className={`relative px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-primary text-primary-foreground rounded-br-md' 
              : 'bg-surface-700 text-text-primary rounded-bl-md border border-border'
          }`}>
            {isTyping ? (
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm text-text-secondary ml-2">Drift is thinking...</span>
              </div>
            ) : (
              <>
                <div className="text-sm font-body leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
                
                {/* Message Actions for AI responses */}
                {!isUser && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-light">
                    <span className="text-xs text-text-secondary font-caption">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 rounded text-text-secondary hover:text-accent transition-colors duration-fast">
                        <Icon name="Copy" size={12} />
                      </button>
                      <button className="p-1 rounded text-text-secondary hover:text-warning transition-colors duration-fast">
                        <Icon name="Star" size={12} />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Timestamp for user messages */}
                {isUser && (
                  <div className="text-xs text-primary-foreground/70 mt-1 text-right font-caption">
                    {formatTimestamp(message.timestamp)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;