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
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[85%] lg:max-w-[75%] pl-10">
          <div className="glass-button rounded-2xl rounded-br-sm px-5 py-4 text-white shadow-xl">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-text-muted font-medium">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isAI) {
    return (
      <div className="flex justify-start mb-6 group">
        <div className="flex items-start space-x-3 max-w-[90%] lg:max-w-[80%]">
          {/* AI Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-surface-700/50 flex items-center justify-center border border-white/5 mt-1">
            <Icon name="Bot" className="w-5 h-5 text-primary-300" />
          </div>
          
          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="glass-card rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm border-white/5 bg-surface/40 backdrop-blur-xl">
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm leading-7 text-text-primary whitespace-pre-wrap font-light tracking-wide">
                    {message.content}
                  </p>
                  
                  {/* Interactive Action Buttons */}
                  {hasUIActions && (
                    <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                      {message.metadata.actions
                        .filter(action => ['create_goal', 'edit_goal', 'create_habit', 'edit_habit', 'show_goal_ui', 'show_habit_ui'].includes(action.type))
                        .map((action, index) => {
                          const mappedActionType = action.type.replace('show_', '').replace('_ui', '');
                          const actionConfig = {
                            create_goal: { label: 'Create Goal', icon: 'Target', color: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' },
                            edit_goal: { label: 'Edit Goal', icon: 'Edit', color: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' },
                            create_habit: { label: 'Create Habit', icon: 'Repeat', color: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' },
                            edit_habit: { label: 'Edit Habit', icon: 'Edit', color: 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20' },
                          }[mappedActionType] || { label: 'Action', icon: 'Plus', color: 'text-gray-400 bg-gray-500/10 hover:bg-gray-500/20' };

                          return (
                            <button
                              key={index}
                              onClick={() => handleUIAction({ ...action, type: mappedActionType.includes('_') ? mappedActionType : `create_${mappedActionType}` })}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${actionConfig.color}`}
                            >
                              <Icon name={actionConfig.icon} className="w-3.5 h-3.5" />
                              <span>{actionConfig.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {!isProcessing && (
              <div className="flex items-center mt-1.5 space-x-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-text-muted">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {message.metadata?.type === 'analysis' && (
                  <span className="text-[10px] text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20">
                    Analysis
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Render Interactive UI */}
        {renderInteractiveUI()}
      </div>
    );
  }

  return null;
};

export default MessageBubble;