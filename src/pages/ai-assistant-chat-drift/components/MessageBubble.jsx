import React, { useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { motion } from 'framer-motion';
import GoalCreationCard from './GoalCreationCard';
import HabitCreationCard from './HabitCreationCard';

const MessageBubble = ({ message, isProcessing = false, onActionComplete }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'assistant' || message.sender === 'ai' || message.sender === 'drift';
  const [showInteractiveUI, setShowInteractiveUI] = useState(false);
  const [activeUIType, setActiveUIType] = useState(null);
  const [initialUIData, setInitialUIData] = useState({});

  // Check if message has interactive UI triggers
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
                  
                  {/* Interactive Action Buttons */}
                  {hasUIActions && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {message.metadata.actions
                        .filter(action => ['create_goal', 'edit_goal', 'create_habit', 'edit_habit', 'show_goal_ui', 'show_habit_ui'].includes(action.type))
                        .map((action, index) => {
                          // Map show_*_ui actions to their corresponding action types
                          const mappedActionType = action.type.replace('show_', '').replace('_ui', '');
                          
                          const actionConfig = {
                            create_goal: { label: 'Create Goal', icon: 'Target', color: 'bg-blue-500 hover:bg-blue-600' },
                            edit_goal: { label: 'Edit Goal', icon: 'Edit', color: 'bg-yellow-500 hover:bg-yellow-600' },
                            create_habit: { label: 'Create Habit', icon: 'Repeat', color: 'bg-green-500 hover:bg-green-600' },
                            edit_habit: { label: 'Edit Habit', icon: 'Edit', color: 'bg-purple-500 hover:bg-purple-600' },
                            goal: { label: 'Create Goal', icon: 'Target', color: 'bg-blue-500 hover:bg-blue-600' },
                            habit: { label: 'Create Habit', icon: 'Repeat', color: 'bg-green-500 hover:bg-green-600' }
                          }[mappedActionType] || { label: 'Action', icon: 'Plus', color: 'bg-gray-500 hover:bg-gray-600' };

                          return (
                            <button
                              key={index}
                              onClick={() => handleUIAction({ ...action, type: mappedActionType.includes('_') ? mappedActionType : `create_${mappedActionType}` })}
                              className={`flex items-center space-x-2 px-3 py-2 text-white text-sm font-medium rounded-lg transition-colors ${actionConfig.color}`}
                            >
                              <Icon name={actionConfig.icon} className="w-4 h-4" />
                              <span>{actionConfig.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
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
        
        {/* Render Interactive UI */}
        {renderInteractiveUI()}
      </motion.div>
    );
  }

  return null;
};

export default MessageBubble;