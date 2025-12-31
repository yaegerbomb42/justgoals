import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';
import GoalCreationCard from './GoalCreationCard';
import HabitCreationCard from './HabitCreationCard';

const MessageBubble = ({ message, isProcessing = false, onActionComplete }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'assistant' || message.sender === 'ai' || message.sender === 'drift';
  const [showInteractiveUI, setShowInteractiveUI] = useState(false);
  const [activeUIType, setActiveUIType] = useState(null);
  const [initialUIData, setInitialUIData] = useState({});

  const hasUIActions = message.metadata?.actions?.some(action => 
    ['create_goal', 'edit_goal', 'create_habit', 'edit_habit', 'show_goal_ui', 'show_habit_ui'].includes(action.type)
  );

  const handleUIAction = (action) => {
    setActiveUIType(action.type);
    setInitialUIData(action.data || {});
    setShowInteractiveUI(true);
  };

  const handleUISubmit = (data) => {
    setShowInteractiveUI(false);
    setActiveUIType(null);
    if (onActionComplete) {
      onActionComplete(activeUIType, data);
    }
  };

  const handleUICancel = () => {
    setShowInteractiveUI(false);
    setActiveUIType(null);
    setInitialUIData({});
  };

  const renderInteractiveUI = () => {
    if (!showInteractiveUI) return null;

    switch (activeUIType) {
      case 'create_goal':
      case 'edit_goal':
        return (
          <GoalCreationCard
            isVisible={showInteractiveUI}
            initialData={initialUIData}
            onSubmit={handleUISubmit}
            onCancel={handleUICancel}
          />
        );
      case 'create_habit':
      case 'edit_habit':
        return (
          <HabitCreationCard
            isVisible={showInteractiveUI}
            initialData={initialUIData}
            onSubmit={handleUISubmit}
            onCancel={handleUICancel}
          />
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // User Message
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        className="flex justify-end mb-4"
      >
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl rounded-br-md blur opacity-30" />
            <div className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
          <div className="flex justify-end mt-1.5">
            <span className="text-[10px] text-text-muted">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // AI Message
  if (isAI) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        className="flex justify-start mb-4"
      >
        <div className="flex items-start space-x-3 max-w-[85%] md:max-w-[70%]">
          {/* AI Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="flex-shrink-0"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-sm opacity-50" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-lg">
                <Icon name="Sparkles" className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
          
          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="glass-card px-4 py-3">
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                        className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-text-secondary">Drift is thinking...</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                    {message.content}
                  </p>
                  
                  {/* Interactive Action Buttons */}
                  {hasUIActions && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {message.metadata.actions
                        .filter(action => ['create_goal', 'edit_goal', 'create_habit', 'edit_habit', 'show_goal_ui', 'show_habit_ui'].includes(action.type))
                        .map((action, index) => {
                          const mappedActionType = action.type.replace('show_', '').replace('_ui', '');
                          
                          const actionConfig = {
                            create_goal: { label: 'Create Goal', icon: 'Target', gradient: 'from-primary to-secondary' },
                            edit_goal: { label: 'Edit Goal', icon: 'Edit', gradient: 'from-warning to-orange-400' },
                            create_habit: { label: 'Create Habit', icon: 'Repeat', gradient: 'from-accent to-emerald-400' },
                            edit_habit: { label: 'Edit Habit', icon: 'Edit', gradient: 'from-violet-500 to-purple-500' },
                            goal: { label: 'Create Goal', icon: 'Target', gradient: 'from-primary to-secondary' },
                            habit: { label: 'Create Habit', icon: 'Repeat', gradient: 'from-accent to-emerald-400' }
                          }[mappedActionType] || { label: 'Action', icon: 'Plus', gradient: 'from-surface-600 to-surface-700' };

                          return (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleUIAction({ ...action, type: mappedActionType.includes('_') ? mappedActionType : `create_${mappedActionType}` })}
                              className={`flex items-center space-x-2 px-3 py-2 bg-gradient-to-r ${actionConfig.gradient} text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-shadow`}
                            >
                              <Icon name={actionConfig.icon} className="w-4 h-4" />
                              <span>{actionConfig.label}</span>
                            </motion.button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {!isProcessing && (
              <div className="flex items-center mt-1.5 space-x-2">
                <span className="text-[10px] text-text-muted">{formatTime(message.timestamp)}</span>
                <span className="text-[10px] text-text-muted">•</span>
                <span className="text-[10px] text-primary font-medium">Drift</span>
              </div>
            )}
          </div>
        </div>
        
        {renderInteractiveUI()}
      </motion.div>
    );
  }

  // System Message
  if (message.sender === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-3"
      >
        <div className="px-4 py-2 bg-surface-700/50 border border-border/30 rounded-full">
          <p className="text-xs text-text-secondary">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default MessageBubble;
