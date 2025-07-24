import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { geminiService } from '../../../services/geminiService';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';

const ProgressAIAssistant = ({ 
  isExpanded, 
  onToggle, 
  selectedGoal, 
  progressMarks = [],
  onCreateProgressPath,
  onUpdateProgress 
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPath, setGeneratedPath] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-analyze progress when goal or marks change
  useEffect(() => {
    if (selectedGoal && progressMarks.length > 0) {
      analyzeProgress();
    }
  }, [selectedGoal, progressMarks]);

  const analyzeProgress = async () => {
    if (!selectedGoal) return;
    
    setIsAnalyzing(true);
    try {
      const context = {
        goal: selectedGoal,
        progressMarks: progressMarks,
        completedCount: progressMarks.filter(m => m.completed).length,
        totalCount: progressMarks.length
      };

      const analysis = await geminiService.generateResponse(
        `Analyze my progress toward "${selectedGoal.title}". I have ${context.completedCount} out of ${context.totalCount} progress marks completed. Provide insights and suggestions.`,
        { currentGoals: [selectedGoal], progressMarks: progressMarks },
        { canCreateMilestones: true }
      );

      setChatHistory(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        message: analysis.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error analyzing progress:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateProgressPath = async () => {
    if (!selectedGoal) return;
    
    setIsGenerating(true);
    try {
      const prompt = `Create a detailed progression path for achieving the goal: "${selectedGoal.title}". 

Goal Details:
- Title: ${selectedGoal.title}
- Description: ${selectedGoal.description || 'No description provided'}
- Category: ${selectedGoal.category || 'general'}
- Target Date: ${selectedGoal.deadline || 'No deadline set'}

Please create 5-8 progressive milestones that build toward this goal. Each milestone should be:
1. Specific and actionable
2. Measurable 
3. Building on the previous milestone
4. Realistic and achievable

Return the response as a JSON array with this structure:
[
  {
    "title": "Milestone title",
    "description": "Detailed description of what needs to be accomplished",
    "priority": "high|medium|low",
    "estimatedDays": 3,
    "dependencies": ["previous milestone if any"],
    "successCriteria": "How to know this is complete"
  }
]

Return ONLY the JSON array, no other text.`;

      const response = await geminiService.generateContent(prompt);
      
      // Try to parse JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const path = JSON.parse(jsonMatch[0]);
          setGeneratedPath(path);
          
          setChatHistory(prev => [...prev, {
            id: Date.now(),
            type: 'ai',
            message: `I've generated a customized progression path for "${selectedGoal.title}" with ${path.length} milestones. Review the path below and click "Apply Path" to add these milestones to your progress journey.`,
            timestamp: new Date(),
            generatedPath: path
          }]);
        } catch (parseError) {
          throw new Error('Could not parse the generated progression path');
        }
      } else {
        throw new Error('No valid progression path found in response');
      }
    } catch (error) {
      console.error('Error generating progression path:', error);
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        message: 'I encountered an error while generating your progression path. Please try again or create milestones manually.',
        timestamp: new Date()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPath = () => {
    if (generatedPath && onCreateProgressPath) {
      onCreateProgressPath(generatedPath);
      setGeneratedPath(null);
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: 'Progression path applied successfully! Your new milestones have been added to your progress journey.',
        timestamp: new Date()
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message to chat
    setChatHistory(prev => [...prev, {
      id: Date.now(),
      type: 'user', 
      message: userMessage,
      timestamp: new Date()
    }]);

    try {
      const context = {
        goal: selectedGoal,
        progressMarks: progressMarks,
        user: user
      };

      const response = await geminiService.generateResponse(
        userMessage,
        context,
        { canCreateMilestones: true, canUpdateProgress: true }
      );

      setChatHistory(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        message: response.message,
        timestamp: new Date(),
        actions: response.actions
      }]);

      // Handle any actions returned by AI
      if (response.actions && response.actions.length > 0) {
        response.actions.forEach(action => {
          if (action.type === 'create_milestone' && onCreateProgressPath) {
            onCreateProgressPath([action.data]);
          }
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        message: 'I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      }]);
    }
  };

  if (!isExpanded) {
    return (
      <motion.div 
        className="fixed bottom-20 right-4 lg:relative lg:bottom-auto lg:right-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Button
          onClick={onToggle}
          className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
          size="lg"
        >
          <Icon name="Bot" size={20} className="mr-2" />
          Progress AI
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:w-96 bg-surface border border-border rounded-lg lg:shadow-lg"
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Bot" size={20} className="text-primary" />
          <h3 className="font-heading-medium text-text-primary">Progress AI</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <Icon name="X" size={16} />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border">
        <div className="space-y-2">
          <Button
            onClick={generateProgressPath}
            disabled={!selectedGoal || isGenerating}
            className="w-full"
            variant="primary"
          >
            {isGenerating ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Generating Path...
              </>
            ) : (
              <>
                <Icon name="Route" size={16} className="mr-2" />
                Generate Progress Path
              </>
            )}
          </Button>
          
          <Button
            onClick={analyzeProgress}
            disabled={!selectedGoal || isAnalyzing}
            className="w-full"
            variant="secondary"
          >
            {isAnalyzing ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Icon name="BarChart3" size={16} className="mr-2" />
                Analyze Progress
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-96">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-text-secondary">
              <Icon name="MessageCircle" size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ask me about your progress or let me help optimize your journey!</p>
            </div>
          ) : (
            chatHistory.map(message => (
              <div key={message.id} className={`${message.type === 'user' ? 'ml-8' : 'mr-8'}`}>
                <div className={`p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : message.type === 'system'
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-surface-700 text-text-primary'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  {message.generatedPath && (
                    <div className="mt-3 space-y-2">
                      <h4 className="font-medium text-sm">Generated Path:</h4>
                      {message.generatedPath.slice(0, 3).map((milestone, index) => (
                        <div key={index} className="text-xs bg-black/10 p-2 rounded">
                          <span className="font-medium">{milestone.title}</span>
                          <p className="text-xs opacity-75 mt-1">{milestone.description}</p>
                        </div>
                      ))}
                      {message.generatedPath.length > 3 && (
                        <p className="text-xs opacity-75">...and {message.generatedPath.length - 3} more milestones</p>
                      )}
                      <Button
                        onClick={handleApplyPath}
                        size="sm"
                        className="mt-2"
                        variant="secondary"
                      >
                        Apply Path
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-border p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your progress..."
              className="flex-1 px-3 py-2 bg-surface-700 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleSendMessage} size="sm">
              <Icon name="Send" size={16} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressAIAssistant;