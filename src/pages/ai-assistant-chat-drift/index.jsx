import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/ui/Header';
import FloatingActionButton from '../../components/ui/FloatingActionButton';
import ConversationHeader from './components/ConversationHeader';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';
import QuickActionChips from './components/QuickActionChips';
import MessageSearch from './components/MessageSearch';
import WelcomeScreen from './components/WelcomeScreen';
import Icon from '../../components/AppIcon';
import geminiService from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
import { saveGoal } from '../../utils/goalUtils';
import * as entityService from '../../services/entityManagementService';
import { useAchievements } from '../../context/AchievementContext';
import { useGemini } from '../../context/GeminiContext';

const AiAssistantChatDrift = () => {
  const { user, isAuthenticated } = useAuth();
  const { apiKey, isConnected, connectionError, setApiKey, resetGemini } = useGemini();
  const { addAchievement } = useAchievements();
  
  // Persist messages in localStorage by user id (if available)
  const getMessagesStorageKey = () => {
    if (isAuthenticated && user && user.id) {
      return `drift_chat_messages_${user.id}`;
    }
    return 'drift_chat_messages_guest';
  };

  // Load messages from localStorage on mount
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(getMessagesStorageKey());
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pendingGoalForConfirmation, setPendingGoalForConfirmation] = useState(null);
  const [goalCreationFlow, setGoalCreationFlow] = useState(null);
  const [goalCreationData, setGoalCreationData] = useState({});
  const [milestoneCreationFlow, setMilestoneCreationFlow] = useState(null);
  const [milestoneCreationData, setMilestoneCreationData] = useState({});
  const [dayPlanEditFlow, setDayPlanEditFlow] = useState(null);
  const [dayPlanEditData, setDayPlanEditData] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [updatedMilestones, setUpdatedMilestones] = useState([]);
  const [lastProactiveCheck, setLastProactiveCheck] = useState(0);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(getMessagesStorageKey(), JSON.stringify(messages));
    } catch (e) {}
  }, [messages, isAuthenticated, user?.id]);

  // Clean up session state when user changes
  useEffect(() => {
    setUpdatedMilestones([]);
    setGoalCreationFlow(null);
    setGoalCreationData({});
    setMilestoneCreationFlow(null);
    setMilestoneCreationData({});
    setDayPlanEditFlow(null);
    setDayPlanEditData({});
    localStorage.removeItem('aiAskedMilestones');
    try {
      const saved = localStorage.getItem(getMessagesStorageKey());
      if (saved) setMessages(JSON.parse(saved));
      else setMessages([]);
    } catch (e) { setMessages([]); }
  }, [user?.id, isAuthenticated]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('aiAskedMilestones');
      setGoalCreationFlow(null);
      setGoalCreationData({});
      setMilestoneCreationFlow(null);
      setMilestoneCreationData({});
      setDayPlanEditFlow(null);
      setDayPlanEditData({});
    };
  }, []);

  useEffect(() => {
    // Listen for post-focus-session AI prompt
    const checkForFocusSessionMessage = () => {
      const msg = localStorage.getItem('focusSessionEndedMessage');
      if (msg) {
        try {
          const { prompt } = JSON.parse(msg);
          if (prompt) {
            setMessages(prev => [
              ...prev,
              {
                id: Date.now(),
                content: prompt,
                sender: 'ai',
                timestamp: new Date().toISOString()
              }
            ]);
          }
        } catch (e) { /* ignore */ }
        localStorage.removeItem('focusSessionEndedMessage');
      }
    };
    checkForFocusSessionMessage();
    const interval = setInterval(checkForFocusSessionMessage, 2000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Detect goal creation intent from natural language
  const detectGoalCreationIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const goalKeywords = [
      'create a goal', 'make a goal', 'set a goal', 'new goal', 'add a goal',
      'help me create', 'help me make', 'help me set', 'want to create',
      'need a goal', 'goal for', 'goal to', 'goal about'
    ];
    
    return goalKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Enhanced goal creation with better accuracy
  const startGoalCreationFlow = async (userInput) => {
    if (!isAuthenticated || !user) {
      return "Please log in to create goals.";
    }

    if (!apiKey) {
      return "Please configure your Gemini API key in Settings to create intelligent goals.";
    }

    try {
      // Step 1: Analyze user intent and extract goal information
      const analysisPrompt = `
        Analyze this user input and extract goal information:
        "${userInput}"
        
        Extract and structure the following information:
        1. Goal title (clear, concise, actionable)
        2. Goal description (detailed explanation)
        3. Goal category (health, career, learning, personal, financial, etc.)
        4. Priority level (high, medium, low)
        5. Target completion date (if mentioned, otherwise suggest a reasonable timeframe)
        6. Success criteria (how will we know when this goal is achieved?)
        
        Respond with a JSON object containing these fields. If any information is missing, make reasonable assumptions based on the context.
      `;

      const analysisResponse = await geminiService.generateResponse(analysisPrompt, apiKey);
      let goalData;
      
      try {
        goalData = JSON.parse(analysisResponse);
      } catch (parseError) {
        // If JSON parsing fails, try to extract information manually
        goalData = {
          title: userInput.split(' ').slice(0, 5).join(' '),
          description: userInput,
          category: 'personal',
          priority: 'medium',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          successCriteria: 'Goal completion will be determined by user assessment'
        };
      }

      // Step 2: Generate confirmation message
      const confirmationMessage = `
        I've analyzed your goal request. Here's what I understand:
        
        **Goal Title:** ${goalData.title}
        **Description:** ${goalData.description}
        **Category:** ${goalData.category}
        **Priority:** ${goalData.priority}
        **Target Date:** ${goalData.targetDate}
        **Success Criteria:** ${goalData.successCriteria}
        
        Does this look correct? You can say "yes" to confirm, or tell me what you'd like to change.
      `;

      setGoalCreationData(goalData);
      setGoalCreationFlow('confirmation');
      
      return confirmationMessage;
    } catch (error) {
      console.error('Error in goal creation flow:', error);
      return "I encountered an error while processing your goal request. Please try again or rephrase your request.";
    }
  };

  const handleGoalCreationStep = async (userInput, currentStep) => {
    if (currentStep === 'confirmation') {
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('yes') || lowerInput.includes('correct') || lowerInput.includes('confirm')) {
        // Create the goal
        const result = await createGoalFromData();
        setGoalCreationFlow(null);
        setGoalCreationData({});
        return result;
      } else if (lowerInput.includes('no') || lowerInput.includes('change') || lowerInput.includes('modify')) {
        // Ask for specific changes
        setGoalCreationFlow('modification');
        return "What would you like to change about the goal? Please be specific about what needs to be modified.";
      } else {
        // Ambiguous response, ask for clarification
        return "I'm not sure if you want to confirm or modify the goal. Please say 'yes' to confirm or tell me what you'd like to change.";
      }
    } else if (currentStep === 'modification') {
      // Handle goal modification
      try {
        const modificationPrompt = `
          The user wants to modify this goal:
          ${JSON.stringify(goalCreationData)}
          
          User's modification request: "${userInput}"
          
          Please update the goal data based on the user's request. Respond with the updated JSON object.
        `;

        const modificationResponse = await geminiService.generateResponse(modificationPrompt, apiKey);
        let updatedGoalData;
        
        try {
          updatedGoalData = JSON.parse(modificationResponse);
        } catch (parseError) {
          // If parsing fails, return to confirmation with original data
          setGoalCreationFlow('confirmation');
          return "I had trouble processing your modification. Let me show you the original goal again. Does this look correct?";
        }

        setGoalCreationData(updatedGoalData);
        setGoalCreationFlow('confirmation');
        
        return `
          I've updated the goal based on your request:
          
          **Goal Title:** ${updatedGoalData.title}
          **Description:** ${updatedGoalData.description}
          **Category:** ${updatedGoalData.category}
          **Priority:** ${updatedGoalData.priority}
          **Target Date:** ${updatedGoalData.targetDate}
          **Success Criteria:** ${updatedGoalData.successCriteria}
          
          Does this updated version look correct? Say "yes" to confirm or tell me what else you'd like to change.
        `;
      } catch (error) {
        console.error('Error in goal modification:', error);
        return "I encountered an error while processing your modification. Please try again.";
      }
    }
  };

  const generateGoalConfirmation = () => {
    if (!goalCreationData.title) return "I couldn't extract goal information. Please try again with more details.";
    
    return `
      I've prepared your goal:
      
      **${goalCreationData.title}**
      ${goalCreationData.description}
      
      Category: ${goalCreationData.category}
      Priority: ${goalCreationData.priority}
      Target Date: ${goalCreationData.targetDate}
      
      Say "confirm" to create this goal, or tell me what you'd like to change.
    `;
  };

  const createGoalFromData = async () => {
    if (!goalCreationData.title) {
      return "I couldn't extract goal information. Please try again with more details.";
    }

    try {
      const goal = {
        id: Date.now().toString(),
        title: goalCreationData.title,
        description: goalCreationData.description,
        category: goalCreationData.category,
        priority: goalCreationData.priority,
        targetDate: goalCreationData.targetDate,
        successCriteria: goalCreationData.successCriteria,
        createdAt: new Date().toISOString(),
        status: 'active',
        progress: 0,
        milestones: []
      };

      saveGoal(goal, user.id);
      
      // Add achievement for goal creation
      addAchievement('goal_creator', 'Created your first goal with AI assistance');
      
      return `✅ Goal "${goal.title}" has been created successfully! You can view and manage it in your Goals dashboard.`;
    } catch (error) {
      console.error('Error creating goal:', error);
      return "I encountered an error while creating your goal. Please try again.";
    }
  };

  // Detect milestone creation intent
  const detectMilestoneCreationIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const milestoneKeywords = [
      'create milestone', 'add milestone', 'new milestone', 'set milestone',
      'milestone for', 'milestone to', 'milestone about'
    ];
    
    return milestoneKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Detect day plan editing intent
  const detectDayPlanEditIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const planKeywords = [
      'edit plan', 'modify plan', 'change plan', 'update plan',
      'adjust plan', 'revise plan', 'plan edit', 'plan change'
    ];
    
    return planKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Detect planner customization intent
  const detectPlannerCustomizationIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const customizationKeywords = [
      'customize planner', 'planner preferences', 'planner settings',
      'change preferences', 'modify preferences', 'planner customization'
    ];
    
    return customizationKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Handle planner customization
  const handlePlannerCustomization = async (userInput) => {
    if (!isAuthenticated || !user) {
      return "Please log in to customize your planner preferences.";
    }

    if (!apiKey) {
      return "Please configure your Gemini API key in Settings to customize your planner.";
    }

    try {
      const customizationPrompt = `
        The user wants to customize their planner preferences. Their request: "${userInput}"
        
        Current user preferences (if any):
        - Sleep focus: balanced
        - Task density: balanced
        - Custom instructions: (none)
        
        Please analyze their request and suggest appropriate planner preferences. Consider:
        1. Sleep patterns and preferences
        2. Task load preferences (more vs fewer tasks)
        3. Any specific instructions or requirements
        
        Respond with a JSON object containing:
        {
          "sleepFocus": "more_sleep|balanced|less_sleep",
          "taskDensity": "more_tasks|balanced|less_tasks", 
          "customInstructions": "string with specific instructions"
        }
      `;

      const response = await geminiService.generateResponse(customizationPrompt, apiKey);
      let preferences;
      
      try {
        preferences = JSON.parse(response);
      } catch (parseError) {
        preferences = {
          sleepFocus: 'balanced',
          taskDensity: 'balanced',
          customInstructions: 'User prefers balanced planning approach'
        };
      }

      // Save preferences
      const prefsKey = `planner_preferences_${user.id}`;
      localStorage.setItem(prefsKey, JSON.stringify(preferences));
      
      return `
        I've updated your planner preferences based on your request:
        
        **Sleep Focus:** ${preferences.sleepFocus.replace('_', ' ')}
        **Task Density:** ${preferences.taskDensity.replace('_', ' ')}
        **Custom Instructions:** ${preferences.customInstructions}
        
        These preferences will be used when generating your daily plans. You can modify them anytime by asking me to customize your planner again.
      `;
    } catch (error) {
      console.error('Error in planner customization:', error);
      return "I encountered an error while customizing your planner. Please try again.";
    }
  };

  // Handle day plan editing
  const handleDayPlanEdit = async (userInput) => {
    if (!isAuthenticated || !user) {
      return "Please log in to edit your day plan.";
    }

    if (!apiKey) {
      return "Please configure your Gemini API key in Settings to edit your day plan.";
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const planKey = `daily_plan_${user.id}_${today}`;
      const currentPlan = localStorage.getItem(planKey);
      
      if (!currentPlan) {
        return "I couldn't find a plan for today. Please generate a daily plan first, then I can help you edit it.";
      }

      const editPrompt = `
        The user wants to edit their day plan. Current plan: ${currentPlan}
        User's edit request: "${userInput}"
        
        Please modify the plan according to the user's request. Respond with the updated JSON array of plan items.
        Each item should have: time, title, description (optional), category (optional)
      `;

      const response = await geminiService.generateResponse(editPrompt, apiKey);
      let updatedPlan;
      
      try {
        updatedPlan = JSON.parse(response);
      } catch (parseError) {
        return "I had trouble processing your edit request. Please try again with more specific instructions.";
      }

      // Save updated plan
      localStorage.setItem(planKey, JSON.stringify(updatedPlan));
      
      return `
        I've updated your day plan based on your request. The plan has been saved and you can view it in your Day Planner.
        
        Here's a summary of your updated plan:
        ${updatedPlan.map(item => `- ${item.time}: ${item.title}`).join('\n')}
      `;
    } catch (error) {
      console.error('Error in day plan editing:', error);
      return "I encountered an error while editing your day plan. Please try again.";
    }
  };

  // Start milestone creation flow
  const startMilestoneCreationFlow = () => {
    setMilestoneCreationFlow('title');
    return "I'll help you create a milestone. What would you like to title this milestone?";
  };

  const handleMilestoneCreationStep = async (userInput, currentStep) => {
    if (currentStep === 'title') {
      setMilestoneCreationData({ ...milestoneCreationData, title: userInput });
      setMilestoneCreationFlow('description');
      return "Great! Now please describe what this milestone involves and when you'd like to achieve it.";
    } else if (currentStep === 'description') {
      setMilestoneCreationData({ ...milestoneCreationData, description: userInput });
      setMilestoneCreationFlow('confirmation');
      return generateMilestoneConfirmation();
    } else if (currentStep === 'confirmation') {
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('yes') || lowerInput.includes('confirm')) {
        const result = await createMilestoneFromData();
        setMilestoneCreationFlow(null);
        setMilestoneCreationData({});
        return result;
      } else {
        setMilestoneCreationFlow('title');
        setMilestoneCreationData({});
        return "Let's start over. What would you like to title this milestone?";
      }
    }
  };

  const generateMilestoneConfirmation = () => {
    return `
      I've prepared your milestone:
      
      **${milestoneCreationData.title}**
      ${milestoneCreationData.description}
      
      Say "confirm" to create this milestone, or tell me what you'd like to change.
    `;
  };

  const createMilestoneFromData = async () => {
    if (!milestoneCreationData.title || !milestoneCreationData.description) {
      return "I need both a title and description to create a milestone. Please try again.";
    }

    try {
      const milestone = {
        id: Date.now().toString(),
        title: milestoneCreationData.title,
        description: milestoneCreationData.description,
        createdAt: new Date().toISOString(),
        status: 'active',
        progress: 0
      };

      entityService.createMilestone(milestone, user);
      setUpdatedMilestones(prev => [...prev, milestone.id]);
      
      return `✅ Milestone "${milestone.title}" has been created successfully!`;
    } catch (error) {
      console.error('Error creating milestone:', error);
      return "I encountered an error while creating your milestone. Please try again.";
    }
  };

  const handleForceRecheck = () => {
    // This function is no longer needed as we use context
    return "Connection status is managed automatically. If you're having issues, try refreshing the page.";
  };

  const ensureGeminiReady = async () => {
    // This function is no longer needed as we use context
    return isConnected;
  };

  const generateAiResponse = async (userMessageContent) => {
    if (!apiKey) {
      return "Please configure your Gemini API key in Settings to chat with me.";
    }

    try {
      // Build context for the AI
      const userContext = {
        userId: user?.id,
        isAuthenticated,
        goals: entityService.getGoals(user),
        milestones: entityService.getMilestones(user),
        preferences: localStorage.getItem(`planner_preferences_${user?.id}`) ? JSON.parse(localStorage.getItem(`planner_preferences_${user?.id}`)) : null
      };

      // Analyze user intent
      const intent = await analyzeUserIntent(userMessageContent, userContext);
      
      // Handle different intents
      if (intent.type === 'goal_creation') {
        return await startGoalCreationFlow(userMessageContent);
      } else if (intent.type === 'milestone_creation') {
        return await startMilestoneCreationFlow();
      } else if (intent.type === 'planner_customization') {
        return await handlePlannerCustomization(userMessageContent);
      } else if (intent.type === 'day_plan_edit') {
        return await handleDayPlanEdit(userMessageContent);
      } else {
        // General conversation
        const response = await geminiService.generateResponse(userMessageContent, apiKey);
        return response;
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I encountered an error while processing your message. Please try again.";
    }
  };

  const analyzeUserIntent = async (message, userContext) => {
    const lowerMessage = message.toLowerCase();
    
    if (detectGoalCreationIntent(message)) {
      return { type: 'goal_creation' };
    } else if (detectMilestoneCreationIntent(message)) {
      return { type: 'milestone_creation' };
    } else if (detectPlannerCustomizationIntent(message)) {
      return { type: 'planner_customization' };
    } else if (detectDayPlanEditIntent(message)) {
      return { type: 'day_plan_edit' };
    } else {
      return { type: 'general_conversation' };
    }
  };

  const handleSendMessage = async (messageContent) => {
    if (!messageContent.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsProcessing(true);

    try {
      let aiResponse;
      
      // Handle goal creation flow
      if (goalCreationFlow) {
        aiResponse = await handleGoalCreationStep(messageContent, goalCreationFlow);
      } else if (milestoneCreationFlow) {
        aiResponse = await handleMilestoneCreationStep(messageContent, milestoneCreationFlow);
      } else if (dayPlanEditFlow) {
        aiResponse = await handleDayPlanEdit(messageContent);
        setDayPlanEditFlow(null);
      } else {
        // Check for specific intents
        if (detectGoalCreationIntent(messageContent)) {
          aiResponse = await startGoalCreationFlow(messageContent);
        } else if (detectMilestoneCreationIntent(messageContent)) {
          aiResponse = await startMilestoneCreationFlow();
        } else if (detectPlannerCustomizationIntent(messageContent)) {
          aiResponse = await handlePlannerCustomization(messageContent);
        } else if (detectDayPlanEditIntent(messageContent)) {
          aiResponse = await handleDayPlanEdit(messageContent);
        } else {
          // Generate general AI response
          aiResponse = await generateAiResponse(messageContent);
        }
      }

      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: "I encountered an error while processing your message. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;
    await handleSendMessage(message);
  };

  const handleQuickAction = async (action) => {
    const actionMessages = {
      'create_goal': 'I can help you create a goal! Tell me what you want to achieve.',
      'view_goals': 'I can help you view your goals. You can also check your Goals dashboard for a complete overview.',
      'create_milestone': 'I can help you create a milestone! What would you like to title this milestone?',
      'view_milestones': 'I can help you view your milestones. You can also check your Milestones dashboard for a complete overview.',
      'daily_plan': 'I can help you with your daily plan. You can generate a new plan or edit your existing one. What would you like to do?',
      'planner_preferences': 'I can help you customize your planner preferences. Tell me how you\'d like to adjust your planning approach.',
      'productivity_tips': 'Here are some productivity tips:\n\n1. **Time Blocking**: Schedule specific time slots for different tasks\n2. **Pomodoro Technique**: Work in 25-minute focused sessions\n3. **Priority Matrix**: Use the Eisenhower Matrix to prioritize tasks\n4. **Batch Similar Tasks**: Group similar activities together\n5. **Regular Breaks**: Take short breaks to maintain focus\n\nWould you like me to elaborate on any of these techniques?',
      'motivation': 'Here\'s some motivation for you:\n\n🌟 Every expert was once a beginner. Your progress, no matter how small, is still progress.\n\n🎯 Focus on the process, not just the outcome. The journey is where growth happens.\n\n💪 You have the power to change your habits and achieve your goals. Start with one small step today.\n\nWhat specific goal or challenge would you like to tackle?'
    };

    const message = actionMessages[action] || 'How can I help you today?';
    await handleSendMessage(message);
  };

  const handleClearChat = () => {
    setMessages([]);
    setGoalCreationFlow(null);
    setGoalCreationData({});
    setMilestoneCreationFlow(null);
    setMilestoneCreationData({});
    setDayPlanEditFlow(null);
    setDayPlanEditData({});
  };

  const handleSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSearchResultClick = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Proactive milestone suggestions
  useEffect(() => {
    if (!isAuthenticated || !user || updatedMilestones.includes('asked')) return;
    
    const now = Date.now();
    if (now - lastProactiveCheck < 300000) return; // 5 minutes
    
    const milestones = entityService.getMilestones(user);
    if (milestones.length === 0) {
      const suggestionMessage = {
        id: Date.now(),
        content: "I notice you don't have any milestones yet. Would you like me to help you create some milestones to track your progress toward your goals?",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, suggestionMessage]);
      setUpdatedMilestones(prev => [...prev, 'asked']);
    }
    setLastProactiveCheck(now);
  }, [isAuthenticated, user, updatedMilestones, lastProactiveCheck]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900">
      <Header title="Drift AI Assistant" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Connection Status and Debug Info */}
        <div className="mb-4 p-4 bg-surface-800 rounded-lg border border-border">
          {isConnected ? (
            <span className="text-success">API Key Connected</span>
          ) : (
            <span className="text-error">API Key Required. {connectionError}</span>
          )}
          <div className="text-xs text-text-secondary mt-1">
            [Debug] API Key: {apiKey ? 'Present' : 'Missing'} | Connected: {isConnected ? 'Yes' : 'No'} | {connectionError}
          </div>
          <button 
            className="ml-2 px-2 py-1 bg-surface-700 text-xs rounded hover:bg-surface-600" 
            onClick={resetGemini}
          >
            Reset Gemini State
          </button>
        </div>

        {/* Chat Interface */}
        {isConnected ? (
          <>
            {messages.length === 0 && (
              <WelcomeScreen onStartChat={() => setMessages([{
                id: Date.now(),
                content: "Hello! I'm Drift, your AI productivity assistant. I can help you create goals, manage milestones, plan your day, and much more. What would you like to work on today?",
                sender: 'ai',
                timestamp: new Date().toISOString()
              }])} />
            )}
            {messages.length > 0 && (
              <>
                <ConversationHeader onClearChat={handleClearChat} />
                <div ref={chatContainerRef} className="bg-surface rounded-lg border border-border mb-4 overflow-hidden" style={{ height: '60vh' }}>
                  <div className="p-4 overflow-y-auto h-full">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {isProcessing && (
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Drift is thinking...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <QuickActionChips onAction={handleQuickAction} />
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleSubmit}
                  isProcessing={isProcessing}
                />
              </>
            )}
          </>
        ) : (
          <div className="text-error text-center mt-4">API Key Required. {connectionError}</div>
        )}

        {/* Search Modal */}
        {isSearchOpen && (
          <MessageSearch
            onClose={() => setIsSearchOpen(false)}
            onSearch={handleSearch}
            searchResults={searchResults}
            onResultClick={handleSearchResultClick}
          />
        )}
      </div>

      <FloatingActionButton
        icon={<Icon name="search" className="w-5 h-5" />}
        onClick={() => setIsSearchOpen(true)}
        className="fixed bottom-6 right-6"
      />
    </div>
  );
};

export default AiAssistantChatDrift;