import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConversationHeader = ({ onClearChat, onExportChat, messageCount, isConnected }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-b border-border px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Drift Avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <Icon name="Bot" size={20} color="#FFFFFF" />
            </div>
            {/* Connection Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${
              isConnected ? 'bg-success' : 'bg-error'
            }`}></div>
          </div>

          {/* Drift Info */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-heading-medium text-text-primary">Drift</h3>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            </div>
            <p className="text-xs text-text-secondary">
              {isConnected ? 'AI Goal Assistant • Online' : 'Offline - Check API Key'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {messageCount > 0 && (
            <span className="text-xs text-text-secondary px-2 py-1 bg-surface-700 rounded-full">
              {messageCount} messages
            </span>
          )}
          
          {messageCount > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportChat}
                iconName="Download"
                className="text-text-secondary hover:text-text-primary"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearChat}
                iconName="Trash2"
                className="text-text-secondary hover:text-error"
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationHeader;