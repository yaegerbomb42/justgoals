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
import { saveGoal } from '../../utils/goalUtils'; // Import the saveGoal utility
import * as entityService from '../../services/entityManagementService'; // For milestone management
import { useAchievements } from '../../context/AchievementContext';

const AiAssistantChatDrift = () => {
  const { user, isAuthenticated } = useAuth();
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
  const [isTyping, setIsTyping] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingGoalForConfirmation, setPendingGoalForConfirmation] = useState(null); // For AI goal creation
  const [goalCreationFlow, setGoalCreationFlow] = useState(null); // Track goal creation conversation state
  const [goalCreationData, setGoalCreationData] = useState({}); // Store goal data during creation flow
  const [milestoneCreationFlow, setMilestoneCreationFlow] = useState(null); // Track milestone creation flow
  const [milestoneCreationData, setMilestoneCreationData] = useState({}); // Store milestone data during creation
  const [dayPlanEditFlow, setDayPlanEditFlow] = useState(null); // Track day plan editing flow
  const [dayPlanEditData, setDayPlanEditData] = useState({}); // Store day plan edit data
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  // Track milestones updated in this session
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
    // Clear old milestone questions when user changes
    localStorage.removeItem('aiAskedMilestones');
    // Optionally clear chat if you want a fresh chat per user:
    // setMessages([]);
    // Or, restore chat for the new user:
    try {
      const saved = localStorage.getItem(getMessagesStorageKey());
      if (saved) setMessages(JSON.parse(saved));
      else setMessages([]);
    } catch (e) { setMessages([]); }
  }, [user?.id, isAuthenticated]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear session-specific data when component unmounts
      localStorage.removeItem('aiAskedMilestones');
      setGoalCreationFlow(null);
      setGoalCreationData({});
      setMilestoneCreationFlow(null);
      setMilestoneCreationData({});
      setDayPlanEditFlow(null);
      setDayPlanEditData({});
    };
  }, []);

  // Initialize Gemini service
  useEffect(() => {
    const initializeGemini = async () => {
      try {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (apiKey) {
          geminiService.initialize(apiKey);
          const connected = await geminiService.testConnection();
          setIsConnected(connected);
          setIsInitialized(true);
        } else {
          // If no API key is found, we are still "initialized" from the perspective
          // of the loading screen, but we are not connected.
          setIsConnected(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        setIsConnected(false);
        setIsInitialized(true); // Ensure we always move past initializing, even on error
      }
    };

    initializeGemini();
  }, []);

  // Add a useEffect to re-check Gemini connection whenever the API key changes
  useEffect(() => {
    const checkGeminiConnection = async () => {
      const apiKey = getUserApiKey();
      if (apiKey) {
        geminiService.initialize(apiKey);
        const connection = await geminiService.testConnection(apiKey);
        setIsConnected(connection.success);
        setIsInitialized(true);
      } else {
        setIsConnected(false);
        setIsInitialized(true);
      }
    };
    checkGeminiConnection();
  }, [user && user.id, localStorage.getItem(`gemini_api_key_${user && user.id}`)]);

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
                isUser: false,
                timestamp: new Date()
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

    const apiKey = localStorage.getItem(`gemini_api_key_${user.id}`);
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
        3. Category (Learning, Health & Fitness, Career & Work, Personal Development, Relationships, Hobbies & Recreation, Financial, General)
        4. Priority (high, medium, low)
        5. Deadline (if mentioned, in YYYY-MM-DD format)
        6. Target value and unit (if measurable)
        7. Specific milestones or sub-goals
        
        Return ONLY a JSON object with this structure:
        {
          "title": "Goal Title",
          "description": "Detailed description",
          "category": "Category",
          "priority": "priority",
          "deadline": "YYYY-MM-DD or null",
          "targetValue": "value or null",
          "unit": "unit or null",
          "milestones": ["milestone1", "milestone2"],
          "confidence": 0.8
        }
      `;

      const analysisResponse = await geminiService.generateText(analysisPrompt, apiKey);
      let goalData = null;
      
      try {
        const jsonMatch = analysisResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          goalData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse goal analysis:', e);
      }

      if (!goalData) {
        return "I couldn't understand your goal request. Please try being more specific about what you want to achieve.";
      }

      // Step 2: Validate and refine the goal
      const validationPrompt = `
        Validate and improve this goal:
        ${JSON.stringify(goalData, null, 2)}
        
        Check for:
        1. Is the title clear and actionable?
        2. Is the description detailed enough?
        3. Is the category appropriate?
        4. Is the priority reasonable?
        5. Is the deadline realistic?
        6. Are the milestones specific and achievable?
        
        If any issues are found, fix them. Return the improved goal as JSON.
        If the goal is good, return it as-is.
      `;

      const validationResponse = await geminiService.generateText(validationPrompt, apiKey);
      let validatedGoal = null;
      
      try {
        const jsonMatch = validationResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          validatedGoal = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        validatedGoal = goalData; // Fallback to original
      }

      // Step 3: Generate SMART goal criteria
      const smartPrompt = `
        Make this goal SMART (Specific, Measurable, Achievable, Relevant, Time-bound):
        ${JSON.stringify(validatedGoal, null, 2)}
        
        Enhance the goal to be:
        - Specific: Clear and unambiguous
        - Measurable: Quantifiable progress
        - Achievable: Realistic and attainable
        - Relevant: Aligned with user's values
        - Time-bound: Clear timeline
        
        Return the enhanced goal as JSON.
      `;

      const smartResponse = await geminiService.generateText(smartPrompt, apiKey);
      let finalGoal = null;
      
      try {
        const jsonMatch = smartResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          finalGoal = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        finalGoal = validatedGoal; // Fallback to validated goal
      }

      // Step 4: Create the goal
      try {
        const savedGoal = saveGoal(finalGoal, user.id);
        
        // Step 5: Generate initial milestones
        if (finalGoal.milestones && finalGoal.milestones.length > 0) {
          for (const milestoneTitle of finalGoal.milestones) {
            const milestoneData = {
              title: milestoneTitle,
              description: `Milestone for: ${finalGoal.title}`,
              goalId: savedGoal.id,
              dueDate: finalGoal.deadline ? new Date(finalGoal.deadline).toISOString().split('T')[0] : null,
              priority: finalGoal.priority
            };
            entityService.createMilestone(user, milestoneData);
          }
        }

        return `✅ Goal created successfully!

**${finalGoal.title}**
${finalGoal.description}

**Category:** ${finalGoal.category}
**Priority:** ${finalGoal.priority}
**Deadline:** ${finalGoal.deadline ? formatDate(finalGoal.deadline) : 'No deadline'}
${finalGoal.targetValue ? `**Target:** ${finalGoal.targetValue} ${finalGoal.unit}` : ''}

${finalGoal.milestones && finalGoal.milestones.length > 0 ? `**Initial Milestones:**\n${finalGoal.milestones.map(m => `• ${m}`).join('\n')}` : ''}

Your goal has been saved and is ready to track! You can view it in the Goals dashboard or create milestones to break it down further.`;
        
      } catch (error) {
        console.error('Error saving goal:', error);
        return "I created the goal but had trouble saving it. Please try creating it manually in the Goals dashboard.";
      }

    } catch (error) {
      console.error('Error in goal creation flow:', error);
      return "I'm having trouble processing your goal request. Please try again or create your goal manually in the Goals dashboard.";
    }
  };

  // Handle goal creation conversation flow
  const handleGoalCreationStep = async (userInput, currentStep) => {
    switch (currentStep) {
      case 'title':
        // Use Gemini to polish the title
        try {
          const polishedTitle = await geminiService.generateText(`
            As Drift, polish this user's goal title into a clear, professional, and motivating title:
            "${userInput}"
            
            Make it:
            - Clear and specific
            - Professional but personal
            - Motivating and inspiring
            - Under 5 words if possible
            - Action-oriented
            
            Return only the polished title, no additional text.
          `);
          
          setGoalCreationData(prev => ({ ...prev, title: polishedTitle }));
          setGoalCreationFlow('description');
          return `Perfect! I've polished your title to: "${polishedTitle}"\n\nNow tell me a bit more about this goal. What does success look like for you? (I'll help polish this into a clear, professional description)`;
        } catch (error) {
          setGoalCreationData(prev => ({ ...prev, title: userInput }));
          setGoalCreationFlow('description');
          return "Great! Now tell me a bit more about this goal. What does success look like for you? (I'll help polish this into a clear, professional description)";
        }
        
      case 'description':
        // Use Gemini to polish the description
        try {
          const polishedDescription = await geminiService.generateText(`
            As Drift, polish this user's goal description into a clear, professional, and motivating description:
            "${userInput}"
            
            Make it:
            - Specific and actionable
            - Professional but personal
            - Motivating and inspiring
            - Clear about what success looks like
            - Under 2 sentences
            
            Return only the polished description, no additional text.
          `);
          
          setGoalCreationData(prev => ({ ...prev, description: polishedDescription }));
          setGoalCreationFlow('category');
          return `Perfect! I've polished your description to: "${polishedDescription}"\n\nWhat category would this goal fall under?\n\n• Learning (skills, education)\n• Health & Fitness\n• Career & Work\n• Personal Development\n• Relationships\n• Hobbies & Recreation\n• Financial\n• Other`;
        } catch (error) {
          setGoalCreationData(prev => ({ ...prev, description: userInput }));
          setGoalCreationFlow('category');
          return "What category would this goal fall under?\n\n• Learning (skills, education)\n• Health & Fitness\n• Career & Work\n• Personal Development\n• Relationships\n• Hobbies & Recreation\n• Financial\n• Other";
        }
        
      case 'category':
        // Infer category from user input or map common responses
        const categoryMap = {
          'learning': 'Learning',
          'education': 'Learning',
          'skills': 'Learning',
          'health': 'Health & Fitness',
          'fitness': 'Health & Fitness',
          'workout': 'Health & Fitness',
          'career': 'Career & Work',
          'work': 'Career & Work',
          'job': 'Career & Work',
          'personal': 'Personal Development',
          'development': 'Personal Development',
          'relationships': 'Relationships',
          'hobbies': 'Hobbies & Recreation',
          'recreation': 'Hobbies & Recreation',
          'financial': 'Financial',
          'money': 'Financial',
          'other': 'Other'
        };
        
        const mappedCategory = categoryMap[userInput.toLowerCase()] || userInput;
        setGoalCreationData(prev => ({ ...prev, category: mappedCategory }));
        
        // Infer priority based on context and category
        const { title: goalTitle, description } = goalCreationData;
        let inferredPriority = 'medium';
        if (goalTitle.toLowerCase().includes('urgent') || description.toLowerCase().includes('urgent')) {
          inferredPriority = 'high';
        } else if (goalTitle.toLowerCase().includes('someday') || description.toLowerCase().includes('when i have time')) {
          inferredPriority = 'low';
        }
        
        setGoalCreationFlow('priority');
        return `I've categorized this as "${mappedCategory}". Based on your description, I think this might be a ${inferredPriority} priority goal. How important is this goal to you right now?\n\n• High - I want to focus on this immediately\n• Medium - Important but not urgent\n• Low - Something I'd like to work on when I have time\n\n(You can say "that's right" if you agree with ${inferredPriority})`;
        
      case 'priority':
        // Handle "that's right" responses
        let priority = userInput.toLowerCase();
        if (userInput.toLowerCase().includes("that's right") || userInput.toLowerCase().includes('agree')) {
          priority = goalCreationData.priority || 'medium';
        }
        setGoalCreationData(prev => ({ ...prev, priority }));
        
        // Suggest deadline based on category and priority
        const { category: goalCategory } = goalCreationData;
        let deadlineSuggestion = '';
        if (goalCategory === 'Learning' && priority === 'high') {
          deadlineSuggestion = '\n\n💡 Tip: For learning goals, I suggest setting a 3-6 month deadline to maintain momentum.';
        } else if (goalCategory === 'Health & Fitness') {
          deadlineSuggestion = '\n\n💡 Tip: For fitness goals, consider a 12-week timeframe for sustainable habits.';
        }
        
        setGoalCreationFlow('deadline');
        return `Do you have a specific deadline in mind? You can say:${deadlineSuggestion}\n\n• A specific date (e.g., 'December 31st')\n• A timeframe (e.g., 'in 3 months', 'by end of year')\n• 'No deadline' if you want to keep it flexible`;
        
      case 'deadline':
        // Parse and format deadline intelligently
        let formattedDeadline = userInput;
        if (userInput.toLowerCase().includes('no deadline')) {
          formattedDeadline = null;
        } else if (userInput.toLowerCase().includes('in ') && userInput.toLowerCase().includes('month')) {
          // Convert "in X months" to actual date
          const months = parseInt(userInput.match(/\d+/)?.[0] || '3');
          const futureDate = new Date();
          futureDate.setMonth(futureDate.getMonth() + months);
          formattedDeadline = futureDate.toISOString().split('T')[0];
        }
        
        setGoalCreationData(prev => ({ ...prev, deadline: formattedDeadline }));
        
        // Suggest measurable targets based on goal type
        const { title: goalTitle2, category: goalCategory2 } = goalCreationData;
        let measurableSuggestion = '';
        if (goalCategory2 === 'Learning') {
          measurableSuggestion = '\n\n💡 Tip: For learning goals, consider measurable targets like "complete 3 courses" or "practice 30 minutes daily".';
        } else if (goalCategory2 === 'Health & Fitness') {
          measurableSuggestion = '\n\n💡 Tip: For fitness goals, consider targets like "run 5km" or "workout 3 times per week".';
        }
        
        setGoalCreationFlow('measurable');
        return `Is this a measurable goal? For example:${measurableSuggestion}\n\n• 'Read 12 books this year' (measurable)\n• 'Get better at guitar' (not measurable)\n\nIf it's measurable, tell me the target and unit (e.g., '10 books', '5km run', 'fluent in Spanish'). If not, just say 'not measurable'.`;
        
      case 'measurable':
        if (userInput.toLowerCase() !== 'not measurable') {
          // Use Gemini to polish measurable targets
          try {
            const polishedTarget = await geminiService.generateText(`
              As Drift, polish this measurable goal target into a clear, specific format:
              "${userInput}"
              
              Make it:
              - Specific and quantifiable
              - Clear about the unit of measurement
              - Professional and actionable
              
              Return only the polished target, no additional text.
            `);
            setGoalCreationData(prev => ({ ...prev, targetValue: polishedTarget }));
          } catch (error) {
            setGoalCreationData(prev => ({ ...prev, targetValue: userInput }));
          }
        }
        setGoalCreationFlow('confirm');
        return generateGoalConfirmation();
        
      case 'confirm':
        if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('confirm')) {
          return await createGoalFromData();
        } else {
          setGoalCreationFlow(null);
          setGoalCreationData({});
          return "No problem! Let's start over. What would you like to create a goal for?";
        }
        
      default:
        return "I'm not sure what step we're on. Let's start over!";
    }
  };

  // Generate goal confirmation message
  const generateGoalConfirmation = () => {
    const { title, description, category, priority, deadline, targetValue } = goalCreationData;
    
    let confirmation = `Perfect! Let me confirm the goal details:\n\n`;
    confirmation += `**Title:** ${title}\n`;
    confirmation += `**Description:** ${description}\n`;
    confirmation += `**Category:** ${category}\n`;
    confirmation += `**Priority:** ${priority}\n`;
    if (deadline && deadline.toLowerCase() !== 'no deadline') {
      confirmation += `**Deadline:** ${deadline}\n`;
    }
    if (targetValue) {
      confirmation += `**Target:** ${targetValue}\n`;
    }
    
    confirmation += `\nDoes this look right? Type 'yes' to create this goal, or 'no' to start over.`;
    return confirmation;
  };

  // Create goal from collected data
  const createGoalFromData = async () => {
    if (!user || !user.id) {
      setGoalCreationFlow(null);
      setGoalCreationData({});
      return "You need to be logged in to create goals. Please sign in and try again.";
    }

    try {
      const goalData = {
        ...goalCreationData,
        progress: 0,
        createdAt: new Date().toISOString()
      };

      const savedGoal = saveGoal(goalData, user.id);
      setGoalCreationFlow(null);
      setGoalCreationData({});
      
      return `🎉 Excellent! I've created your goal: **"${savedGoal.title}"**\n\nYou can now see it on your goals dashboard and start tracking your progress. Would you like me to help you create some milestones for this goal? Just say "yes" and I'll guide you through creating your first milestones!`;
    } catch (error) {
      console.error("Error creating goal:", error);
      setGoalCreationFlow(null);
      setGoalCreationData({});
      return `I tried to create the goal, but something went wrong: ${error.message}. Please try again or create it manually from the goals page.`;
    }
  };

  // Handle milestone creation intent from natural language
  const detectMilestoneCreationIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const milestoneKeywords = [
      'create milestone', 'make milestone', 'set milestone', 'new milestone', 'add milestone',
      'help me create milestone', 'help me make milestone', 'help me set milestone', 'want to create milestone',
      'need a milestone', 'milestone for', 'milestone to', 'milestone about'
    ];
    
    return milestoneKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Detect day plan editing intent
  const detectDayPlanEditIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const dayPlanKeywords = [
      'edit my day', 'edit day plan', 'change my day', 'modify day plan',
      'update my day', 'edit today', 'change today', 'modify today',
      'edit my schedule', 'change my schedule', 'update schedule'
    ];
    
    return dayPlanKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Detect planner customization intent
  const detectPlannerCustomizationIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    const plannerKeywords = [
      'customize planner', 'planner preferences', 'planning style', 'daily planner settings',
      'more sleep', 'less sleep', 'more tasks', 'fewer tasks', 'less tasks',
      'packed schedule', 'relaxed schedule', 'planning preferences', 'customize daily plan',
      'change planner', 'modify planner', 'adjust planner', 'planner customization'
    ];
    
    return plannerKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Handle planner customization through chat
  const handlePlannerCustomization = async (userInput) => {
    if (!user?.id) {
      return "You need to be logged in to customize your planner preferences.";
    }

    try {
      const apiKey = localStorage.getItem(`gemini_api_key_${user.id}`);
      if (!apiKey) {
        return "Please configure your Gemini API key in Settings to customize your planner.";
      }

      const prompt = `
        As Drift, analyze this user's planner customization request and extract their preferences:
        "${userInput}"
        
        Extract the following preferences:
        1. Sleep focus: 'more_sleep', 'balanced', or 'less_sleep'
        2. Task density: 'more_tasks', 'balanced', or 'less_tasks'
        3. Custom instructions: Any specific preferences mentioned
        
        Return ONLY a JSON object with this structure:
        {
          "sleepFocus": "more_sleep|balanced|less_sleep",
          "taskDensity": "more_tasks|balanced|less_tasks",
          "customInstructions": "string with specific preferences",
          "explanation": "brief explanation of what was changed"
        }
      `;

      const response = await geminiService.generateText(prompt, apiKey);
      
      let preferences = null;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          preferences = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse planner preferences:', e);
      }

      if (preferences) {
        // Save the preferences
        const prefsKey = `planner_preferences_${user.id}`;
        localStorage.setItem(prefsKey, JSON.stringify({
          sleepFocus: preferences.sleepFocus || 'balanced',
          taskDensity: preferences.taskDensity || 'balanced',
          customInstructions: preferences.customInstructions || ''
        }));

        return `✅ Planner preferences updated!\n\n${preferences.explanation}\n\nYour new preferences will be applied to future daily plan generations.`;
      } else {
        return "I couldn't understand your planner customization request. Please try being more specific about your preferences.";
      }
    } catch (error) {
      console.error('Error handling planner customization:', error);
      return "I'm having trouble processing your planner customization request. Please try again or use the planner customization modal.";
    }
  };

  // Handle day plan editing through chat
  const handleDayPlanEdit = async (userInput) => {
    if (!user?.id) {
      return "You need to be logged in to edit your day plan.";
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const planKey = `daily_plan_${user.id}_${today}`;
      const savedPlan = localStorage.getItem(planKey);
      const currentPlan = savedPlan ? JSON.parse(savedPlan) : [];

      const prompt = `
        As Drift, help the user edit their daily plan. Here's their current plan for today:
        ${JSON.stringify(currentPlan, null, 2)}
        
        User's request: "${userInput}"
        
        Based on their request, provide specific instructions for what changes to make to their day plan.
        Be specific about:
        - Which activities to add, remove, or modify
        - Time changes
        - Duration adjustments
        - Priority changes
        
        Return a clear, actionable response that explains what changes to make.
      `;

      const response = await geminiService.generateText(prompt);
      return response;
    } catch (error) {
      console.error('Error handling day plan edit:', error);
      return "I'm having trouble processing your day plan edit request. Please try again or edit your plan directly from the Day tab.";
    }
  };

  // Start interactive milestone creation flow
  const startMilestoneCreationFlow = () => {
    setMilestoneCreationFlow('title');
    setMilestoneCreationData({ context: 'milestone' }); // Context for milestone creation
    return "I'd love to help you create a milestone! Let's start with the basics.\n\nWhat would you like to call this milestone? (e.g., 'Practice guitar for 30 minutes', 'Research guitar lessons', 'Buy a guitar')";
  };

  // Handle milestone creation conversation flow
  const handleMilestoneCreationStep = async (userInput, currentStep) => {
    switch (currentStep) {
      case 'title':
        setMilestoneCreationData(prev => ({ ...prev, title: userInput }));
        setMilestoneCreationFlow('goal');
        return "Great! Now tell me which goal this milestone is for. (e.g., 'Learn Guitar', 'Run a Marathon', 'Read More Books')";
        
      case 'goal':
        setMilestoneCreationData(prev => ({ ...prev, goalTitle: userInput }));
        setMilestoneCreationFlow('priority');
        return "What priority would this milestone have?\n\n• High - I want to focus on this immediately\n• Medium - Important but not urgent\n• Low - Something I'd like to work on when I have time";
        
      case 'priority':
        setMilestoneCreationData(prev => ({ ...prev, priority: userInput.toLowerCase() }));
        setMilestoneCreationFlow('deadline');
        return "Do you have a specific deadline in mind? You can say:\n\n• A specific date (e.g., 'December 31st')\n• A timeframe (e.g., 'in 3 months', 'by end of year')\n• 'No deadline' if you want to keep it flexible";
        
      case 'deadline':
        setMilestoneCreationData(prev => ({ ...prev, deadline: userInput }));
        setMilestoneCreationFlow('confirm');
        return generateMilestoneConfirmation();
        
      case 'confirm':
        if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('confirm')) {
          return await createMilestoneFromData();
        } else {
          setMilestoneCreationFlow(null);
          setMilestoneCreationData({});
          return "No problem! Let's start over. What would you like to create a milestone for?";
        }
        
      default:
        return "I'm not sure what step we're on. Let's start over!";
    }
  };

  // Generate milestone confirmation message
  const generateMilestoneConfirmation = () => {
    const { title, goalTitle, priority, deadline } = milestoneCreationData;
    
    let confirmation = `Perfect! Let me confirm the milestone details:\n\n`;
    confirmation += `**Title:** ${title}\n`;
    confirmation += `**Goal:** ${goalTitle}\n`;
    confirmation += `**Priority:** ${priority}\n`;
    if (deadline && deadline.toLowerCase() !== 'no deadline') {
      confirmation += `**Deadline:** ${deadline}\n`;
    }
    
    confirmation += `\nDoes this look right? Type 'yes' to create this milestone, or 'no' to start over.`;
    return confirmation;
  };

  // Create milestone from collected data
  const createMilestoneFromData = async () => {
    if (!user || !user.id) {
      setMilestoneCreationFlow(null);
      setMilestoneCreationData({});
      return "You need to be logged in to create milestones. Please sign in and try again.";
    }

    try {
      const milestoneData = {
        ...milestoneCreationData,
        progress: 0,
        createdAt: new Date().toISOString()
      };

      const goals = entityService.getGoals(user);
      const goal = goals.find(g => g.title.toLowerCase() === (milestoneCreationData.goalTitle || '').toLowerCase());

      if (!goal) {
        setMilestoneCreationFlow(null);
        setMilestoneCreationData({});
        return `I couldn't find a goal named '${milestoneCreationData.goalTitle}'. You can create milestones for these goals: ${goals.map(g => g.title).join(', ')}. Please specify the correct goal name.`;
      }

      const newMilestone = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // Unique ID
        title: milestoneData.title,
        goalId: goal.id,
        goalName: goal.title,
        priority: milestoneData.priority,
        estimatedTime: null,
        dueTime: milestoneData.deadline || '',
        completed: false,
        createdAt: new Date(),
        date: new Date().toISOString().split('T')[0]
      };

      const created = entityService.createMilestone(user, newMilestone);
      setMilestoneCreationFlow(null);
      setMilestoneCreationData({});

      if (created) {
        return `✅ Milestone '${newMilestone.title}' created for goal '${goal.title}'! You can now track your progress on this milestone.`;
      } else {
        return `❌ Sorry, I couldn't create the milestone. Please try again or add it manually from the daily milestones page.`;
      }
    } catch (error) {
      console.error("Error creating milestone:", error);
      setMilestoneCreationFlow(null);
      setMilestoneCreationData({});
      return `I tried to create the milestone, but something went wrong: ${error.message}. Please try again or create it manually from the daily milestones page.`;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Utility to get user-specific API key
  const getUserApiKey = () => (user && user.id ? localStorage.getItem(`gemini_api_key_${user.id}`) : null);

  // Always re-initialize Gemini and update connection state when user or key changes
  useEffect(() => {
    const checkGeminiConnection = async () => {
      const apiKey = getUserApiKey();
      if (apiKey) {
        geminiService.initialize(apiKey);
        const connection = await geminiService.testConnection(apiKey);
        setIsConnected(connection.success);
        setIsInitialized(true);
      } else {
        setIsConnected(false);
        setIsInitialized(true);
      }
    };
    checkGeminiConnection();
  }, [user && user.id, localStorage.getItem(`gemini_api_key_${user && user.id}`)]);

  // In every AI call (generateText, etc):
  const ensureGeminiReady = async () => {
    const apiKey = getUserApiKey();
    if (!apiKey) return false;
    geminiService.initialize(apiKey);
    const connection = await geminiService.testConnection(apiKey);
    return connection.success;
  };

  const generateAiResponse = async (userMessageContent) => {
    const ready = await ensureGeminiReady();
    if (!ready) {
      return "I'm not connected to the Gemini API. Please check your API key in Settings.";
    }

    try {
      // Utility to get user-specific storage key
      const getUserSpecificKey = (baseKey) => {
        if (isAuthenticated && user && user.id) {
          return `${baseKey}_${user.id}`;
        }
        // Fallback to a generic key if no user, though context-sensitive data might be empty/irrelevant
        // Or, decide not to fetch this data if no user. For now, using a non-user-specific default.
        return baseKey;
      };

      // Get user context for better responses
      const userContext = {
        journalEntries: JSON.parse(localStorage.getItem(getUserSpecificKey('journal_entries')) || '[]'), // all journal entries
        goals: JSON.parse(localStorage.getItem(getUserSpecificKey('goals_data')) || '[]'),
        events: JSON.parse(localStorage.getItem(getUserSpecificKey('events_data')) || '[]'), // all events
        timeSpent: JSON.parse(localStorage.getItem(getUserSpecificKey('focus_session_stats')) || '{}'),
        permanentNotes: JSON.parse(localStorage.getItem(getUserSpecificKey('focus_permanent_notes')) || '[]')
      };

      // Include recent chat history (last 15 messages)
      const recentHistory = messages.slice(-15).map(msg => {
        return `${msg.isUser ? 'User' : 'Drift'}: ${msg.content}`;
      }).join('\n');

      // Analyze user intent more intelligently
      const userIntent = await analyzeUserIntent(userMessageContent, userContext);

      const prompt = `
        You are Drift, an AI assistant specialized in goal achievement and personal development.
        You have access to the user's journal entries, events, time tracking data, permanent session notes, and recent conversation history.

        Recent Conversation History (if any):
        ${recentHistory || "No recent conversation history."}
        \nCurrent User message: "${userMessageContent}"
        \nDetected User Intent: ${userIntent}
        \nAdditional Context:
        - Recent journal entries: ${userContext.journalEntries.length > 0 ? userContext.journalEntries.map(entry => `${entry.date}: ${entry.content}`).join('\n') : 'No recent entries'}
        - Events: ${userContext.events.length > 0 ? userContext.events.map(event => `${event.date}: ${event.title || event.name || ''}`).join('\n') : 'No events'}
        - Active goals: ${userContext.goals.length > 0 ? userContext.goals.map(goal => goal.title).join(', ') : 'No active goals'}
        - Total focus time: ${Math.round((userContext.timeSpent.totalFocusTime || 0) / 60)} minutes
        - Permanent session notes: ${userContext.permanentNotes.length > 0 ? userContext.permanentNotes.map(note => `${note.createdAt}: ${note.content}`).join('\n') : 'No permanent notes'}
        \nYour Capabilities:
        - You can engage in general conversation, provide advice, and help users reflect.
        - **Goal Creation:** You can help users create new goals through natural conversation. If a user expresses a desire to create a goal, you can guide them through an interactive process by asking questions about their goal. You can also help with milestone creation, progress tracking, and goal management.
        - **Proactive Assistance:** Based on the user's context, proactively suggest relevant actions, insights, or next steps.
        - **Contextual Understanding:** Use the user's goals, journal entries, events, and focus time to provide personalized advice.
        - **Intelligent Recommendations:** Suggest milestones, focus sessions, or journal prompts based on their current situation.
        - (Future capabilities like modifying goals, creating milestones, starting focus sessions will be listed here as they are implemented.)
        \nInteraction Style:
        Respond as Drift. Be personalized, encouraging, specific, and reference their context (including past conversation if relevant) when helpful.
        Keep responses concise (e.g., under 150-200 words) unless asked for detail.
        If the user asks about something from much earlier in the conversation that isn't in the recent history, you can say you don't have access to it.
        \nProactive Suggestions:
        - If they have goals but no recent progress, suggest next steps or milestones
        - If they have low focus time, suggest focus sessions or time management tips
        - If they have journal entries, reference patterns or insights from them
        - If they seem stuck or overwhelmed, offer to help break down goals into smaller steps
      `;

      return await geminiService.generateText(prompt);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing your request right now. Please try again in a moment.";
    }
  };

  // Analyze user intent more intelligently
  const analyzeUserIntent = async (message, userContext) => {
    try {
      const intentAnalysis = await geminiService.generateText(`
        Analyze this user message and provide a brief intent summary:
        "${message}"
        
        User Context:
        - Goals: ${userContext.goals.map(g => g.title).join(', ') || 'None'}
        - Recent focus time: ${Math.round((userContext.timeSpent.totalFocusTime || 0) / 60)} minutes
        - Recent journal entries: ${userContext.journalEntries.length} entries
        
        Provide a 1-2 sentence summary of what the user wants or needs, including:
        - Primary intent (goal creation, progress update, advice, etc.)
        - Emotional state (frustrated, motivated, stuck, etc.)
        - Suggested proactive actions you could take
        
        Keep it concise and actionable.
      `);
      
      return intentAnalysis;
    } catch (error) {
      return "General conversation or question";
    }
  };

  const handleSendMessage = async (messageContent) => {
    try {
      const userMessage = {
        id: Date.now(),
        content: messageContent,
        isUser: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      let aiResponseContent = "";
      let handled = false;

      // Check if we're in an active goal creation flow
      if (goalCreationFlow) {
        handled = true;
        aiResponseContent = await handleGoalCreationStep(messageContent, goalCreationFlow);
      }
      // Check if we're in an active milestone creation flow
      else if (milestoneCreationFlow) {
        handled = true;
        aiResponseContent = await handleMilestoneCreationStep(messageContent, milestoneCreationFlow);
      }
      // Check for natural language goal creation intent
      else if (detectGoalCreationIntent(messageContent)) {
        handled = true;
        aiResponseContent = await startGoalCreationFlow(messageContent);
      }
      // Check for milestone creation intent after goal creation
      else if (messageContent.toLowerCase().includes('yes') && messageContent.toLowerCase().includes('milestone')) {
        handled = true;
        aiResponseContent = startMilestoneCreationFlow();
      }
      // Check for day plan editing intent
      else if (detectDayPlanEditIntent(messageContent)) {
        handled = true;
        aiResponseContent = await handleDayPlanEdit(messageContent);
      }
      // Check for planner customization intent
      else if (detectPlannerCustomizationIntent(messageContent)) {
        handled = true;
        aiResponseContent = await handlePlannerCustomization(messageContent);
      }

      // --- Natural Language Intent Parsing ---
      let intent = null;
      if (!handled && isConnected) {
        try {
          intent = await geminiService.parseUserIntent(messageContent);
        } catch (e) {
          console.error('Intent parsing failed:', e);
          intent = null;
        }
      }

      if (intent && intent.action && intent.confidence > 0.7) {
        const action = intent.action;
        const targetType = intent.targetType;
        const targetTitle = intent.targetTitle;
        const goalTitle = intent.goalTitle;
        const details = intent.details;

        // --- Plan My Day ---
        if (action === 'plan' && targetType === 'plan') {
          handled = true;
          if (!user || !user.id) {
            aiResponseContent = "You must be logged in to generate a daily plan. Please sign in and try again.";
          } else {
            const goals = entityService.getGoals(user);
            if (!goals.length) {
              aiResponseContent = "You have no goals set. Please create a goal first.";
            } else {
              const today = new Date().toISOString().split('T')[0];
              let createdMilestones = [];
              goals.forEach(goal => {
                const milestoneTitle = `Progress on '${goal.title}'`;
                const newMilestone = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                  title: milestoneTitle,
                  goalId: goal.id,
                  goalName: goal.title,
                  priority: goal.priority || 'medium',
                  estimatedTime: null,
                  dueTime: '',
                  completed: false,
                  createdAt: new Date(),
                  date: today
                };
                const created = entityService.createMilestone(user, newMilestone);
                if (created) {
                  createdMilestones.push(milestoneTitle);
                }
              });
              if (createdMilestones.length) {
                aiResponseContent = `Today's plan created! Suggested milestones:\n- ${createdMilestones.join('\n- ')}`;
              } else {
                aiResponseContent = "No new milestones were created. You may already have milestones for today.";
              }
            }
          }
        }
        // --- Create Milestone ---
        else if (action === 'create' && targetType === 'milestone') {
          handled = true;
          if (!user || !user.id) {
            aiResponseContent = "You must be logged in to create milestones. Please sign in and try again.";
          } else {
            // Find goalId by title
            const goals = entityService.getGoals(user);
            const goal = goals.find(g => g.title.toLowerCase() === (goalTitle || '').toLowerCase());
            if (!goal) {
              aiResponseContent = `I couldn't find a goal named '${goalTitle}'. You can create milestones for these goals: ${goals.map(g => g.title).join(', ')}. Please specify the correct goal name.`;
            } else {
              const newMilestone = {
                id: Date.now().toString(),
                title: targetTitle,
                goalId: goal.id,
                goalName: goal.title,
                priority: 'medium',
                estimatedTime: null,
                dueTime: '',
                completed: false,
                createdAt: new Date(),
                date: new Date().toISOString().split('T')[0]
              };
              const created = entityService.createMilestone(user, newMilestone);
              if (created) {
                aiResponseContent = `✅ Milestone '${targetTitle}' created for goal '${goal.title}'! You can now track your progress on this milestone.`;
              } else {
                aiResponseContent = `❌ Sorry, I couldn't create the milestone. Please try again or add it manually from the daily milestones page.`;
              }
            }
          }
        }
        // --- Complete Milestone ---
        else if (action === 'complete' && targetType === 'milestone') {
          handled = true;
          if (!user || !user.id) {
            aiResponseContent = "You must be logged in to complete milestones. Please sign in and try again.";
          } else {
            const milestones = entityService.getMilestones(user);
            const milestone = milestones.find(m => m.title.toLowerCase() === (targetTitle || '').toLowerCase());
            if (!milestone) {
              aiResponseContent = `I couldn't find a milestone titled '${targetTitle}'. Here are your current milestones: ${milestones.filter(m => !m.completed).map(m => m.title).join(', ')}.`;
            } else {
              const updated = entityService.updateMilestone(user, milestone.id, { completed: true });
              if (updated) {
                aiResponseContent = `🎉 Congratulations! Milestone '${targetTitle}' marked as complete! Keep up the great work!`;
              } else {
                aiResponseContent = `❌ Sorry, I couldn't update the milestone. Please try again or mark it complete from the daily milestones page.`;
              }
            }
          }
        }
        // --- Update Milestone ---
        else if (action === 'update' && targetType === 'milestone') {
          handled = true;
          if (!user || !user.id) {
            aiResponseContent = "You must be logged in to update milestones. Please sign in and try again.";
          } else {
            const milestones = entityService.getMilestones(user);
            const milestone = milestones.find(m => m.title.toLowerCase() === (targetTitle || '').toLowerCase());
            if (!milestone) {
              aiResponseContent = `I couldn't find a milestone titled '${targetTitle}'. Here are your current milestones: ${milestones.map(m => m.title).join(', ')}.`;
            } else {
              const updated = entityService.updateMilestone(user, milestone.id, { title: details });
              if (updated) {
                aiResponseContent = `✅ Milestone '${targetTitle}' updated to '${details}'. The change has been saved!`;
              } else {
                aiResponseContent = `❌ Sorry, I couldn't update the milestone. Please try again or edit it from the daily milestones page.`;
              }
            }
          }
        }
        // --- Progress Update ---
        else if (action === 'progress_update') {
          handled = true;
          // If the user mentions a milestone, mark it as updated for this session
          if (intent && intent.targetType === 'milestone' && intent.targetTitle) {
            setUpdatedMilestones(prev => [...prev, intent.targetTitle]);
            aiResponseContent = `Great job updating '${intent.targetTitle}'! Keep up the momentum. Would you like to plan your next step or celebrate this win?`;
          } else {
            aiResponseContent = "Thanks for the update! I've noted your progress.";
          }
          // Optionally, update progress in the future
        }
      }

      // If not handled by intent, fall back to legacy command parsing and AI chat
      if (!handled) {
        // --- Milestone Creation ---
        if (messageContent.toLowerCase().startsWith('/create milestone ')) {
          handled = true;
          if (!user || !user.id) {
            aiResponseContent = "You must be logged in to create milestones. Please sign in and try again.";
          } else {
            // Parse: /create milestone [title] for [goal] [optional: due time]
            // Example: /create milestone Write report for Project X at 3pm
            const regex = /\/create milestone (.+?)(?: for (.+?))?(?: at (.+))?$/i;
            const match = messageContent.match(regex);
            if (match) {
              const title = match[1]?.trim();
              const goalTitle = match[2]?.trim();
              const dueTime = match[3]?.trim();
              // Find goalId by title
              const goals = entityService.getGoals(user);
              const goal = goals.find(g => g.title.toLowerCase() === (goalTitle || '').toLowerCase());
              if (!goal) {
                aiResponseContent = `I couldn't find a goal named '${goalTitle}'. You can create milestones for these goals: ${goals.map(g => g.title).join(', ')}. Please specify the correct goal name.`;
              } else {
                const newMilestone = {
                  id: Date.now().toString(),
                  title,
                  goalId: goal.id,
                  goalName: goal.title,
                  priority: 'medium',
                  estimatedTime: null,
                  dueTime: dueTime || '',
                  completed: false,
                  createdAt: new Date(),
                  date: new Date().toISOString().split('T')[0]
                };
                const created = entityService.createMilestone(user, newMilestone);
                if (created) {
                  aiResponseContent = `✅ Milestone '${title}' created for goal '${goal.title}'${dueTime ? ' at ' + dueTime : ''}.`;
                } else {
                  aiResponseContent = `❌ Sorry, I couldn't create the milestone. Please try again or add it manually from the daily milestones page.`;
                }
              }
            } else {
              aiResponseContent = "Please use the format: /create milestone [title] for [goal] at [time]";
            }
          }
        }
        // --- Milestone Completion ---
        else if (messageContent.toLowerCase().startsWith('/complete milestone ')) {
          handled = true;
          if (!user || !user.id) {
            aiResponseContent = "You must be logged in to complete milestones. Please sign in and try again.";
          } else {
            // Parse: /complete milestone [title]
            const regex = /\/complete milestone (.+)$/i;
            const match = messageContent.match(regex);
            if (match) {
              const title = match[1]?.trim();
              const milestones = entityService.getMilestones(user);
              const milestone = milestones.find(m => m.title.toLowerCase() === title.toLowerCase());
              if (!milestone) {
                aiResponseContent = `I couldn't find a milestone titled '${title}'. Here are your current milestones: ${milestones.filter(m => !m.completed).map(m => m.title).join(', ')}.`;
              } else {
                const updated = entityService.updateMilestone(user, milestone.id, { completed: true });
                if (updated) {
                  aiResponseContent = `🎉 Congratulations! Milestone '${title}' marked as complete! Keep up the great work!`;
                } else {
                  aiResponseContent = `❌ Sorry, I couldn't update the milestone. Please try again or mark it complete from the daily milestones page.`;
                }
              }
            } else {
              aiResponseContent = "Please use the format: /complete milestone [title]";
            }
          }
        }
        // --- Milestone Update ---
        else if (messageContent.toLowerCase().startsWith('/update milestone ')) {
          handled = true;
          if (!user || !user.id) {
            aiResponseContent = "You must be logged in to update milestones. Please sign in and try again.";
          } else {
            // Parse: /update milestone [title] to [new title]
            const regex = /\/update milestone (.+?) to (.+)$/i;
            const match = messageContent.match(regex);
            if (match) {
              const oldTitle = match[1]?.trim();
              const newTitle = match[2]?.trim();
              const milestones = entityService.getMilestones(user);
              const milestone = milestones.find(m => m.title.toLowerCase() === oldTitle.toLowerCase());
              if (!milestone) {
                aiResponseContent = `I couldn't find a milestone titled '${oldTitle}'. Here are your current milestones: ${milestones.map(m => m.title).join(', ')}.`;
              } else {
                const updated = entityService.updateMilestone(user, milestone.id, { title: newTitle });
                if (updated) {
                  aiResponseContent = `✅ Milestone '${oldTitle}' updated to '${newTitle}'. The change has been saved!`;
                } else {
                  aiResponseContent = `❌ Sorry, I couldn't update the milestone. Please try again or edit it from the daily milestones page.`;
                }
              }
            } else {
              aiResponseContent = "Please use the format: /update milestone [title] to [new title]";
            }
          }
        }
        // --- Legacy AI Chat Fallback ---
        else {
          // If no specific intent was detected, use the general AI chat
          try {
            const apiKey = getUserSpecificKey('gemini_api_key');
            if (apiKey) {
              const response = await geminiService.generateText(messageContent, apiKey);
              aiResponseContent = response;
            } else {
              aiResponseContent = "I'd love to help you with that! Please configure your Gemini API key in Settings to enable AI chat features.";
            }
          } catch (error) {
            console.error('Error generating AI response:', error);
            aiResponseContent = "I'm having trouble processing your request right now. Please try again or check your API key configuration.";
          }
        }
      }

      return aiResponseContent;
    } catch (error) {
      console.error('Error in generateAiResponse:', error);
      return "I'm having trouble processing your request. Please try again.";
    }
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isProcessing) return;

    const userMessage = message.trim();
    setMessage('');
    setIsProcessing(true);

    // Add user message to chat
    const userMessageObj = {
      id: Date.now(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessageObj]);

    try {
      // Generate AI response
      const aiResponse = await generateAiResponse(userMessage);
      
      // Add AI response to chat
      const aiMessageObj = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessageObj]);

      // Check for new achievements
      checkAchievements();
      
    } catch (error) {
      console.error('Error handling message:', error);
      
      const errorMessageObj = {
        id: Date.now() + 1,
        content: "I'm having trouble processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <WelcomeScreen onStartChat={() => setMessages([{
              id: Date.now(),
              content: "Hello! I'm Drift, your AI productivity assistant. I can help you create goals, manage milestones, plan your day, and much more. What would you like to work on today?",
              sender: 'ai',
              timestamp: new Date().toISOString()
            }])} />
          )}

          {/* Chat Interface */}
          {messages.length > 0 && (
            <>
              {/* Conversation Header */}
              <ConversationHeader onClearChat={handleClearChat} />
              
              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="bg-surface rounded-lg border border-border mb-4 overflow-hidden"
                style={{ height: '60vh' }}
              >
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

              {/* Quick Actions */}
              <QuickActionChips onAction={handleQuickAction} />

              {/* Gemini Connection Status */}
              <div className="mb-2 text-sm">
                {isInitialized && (
                  isConnected ? (
                    <span className="text-success">API Key Connected</span>
                  ) : (
                    <span className="text-error">API Key Required. Please configure your Gemini API key in Settings to start chatting.</span>
                  )
                )}
              </div>

              {/* Message Input */}
              {isConnected ? (
                <MessageInput
                  message={message}
                  setMessage={setMessage}
                  onSubmit={handleSubmit}
                  isProcessing={isProcessing}
                />
              ) : (
                <div className="text-error text-center mt-4">API Key Required. Please configure your Gemini API key in Settings to start chatting.</div>
              )}
            </>
          )}
        </div>
      </div>

      <FloatingActionButton />
    </div>
  );
};

export default AiAssistantChatDrift;