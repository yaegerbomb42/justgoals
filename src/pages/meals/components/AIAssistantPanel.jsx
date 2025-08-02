import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { useMeals } from '../../../context/MealsContext';
import { useAchievements } from '../../../context/AchievementContext';
import unifiedAIService from '../../../services/unifiedAIService';
import Icon from '../../../components/ui/Icon';

const AIAssistantPanel = ({ mealData, apiKey: propApiKey }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { saveMeal, saveMealPlan, updateMealPreferences } = useMeals();
  const { addAchievement } = useAchievements();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = propApiKey || settings?.geminiApiKey;

  useEffect(() => {
    // Load conversation history from localStorage
    const savedHistory = localStorage.getItem(`meals-ai-conversation-${user?.uid}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed.messages || []);
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    } else {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: `Hi! I'm your meal planning assistant. I can help you:

• Create personalized meal plans for the week
• Generate macro-optimized recipes
• Suggest meals based on your goals and preferences
• Calculate nutrition information
• Adjust plans for dietary restrictions

What would you like me to help you with today?`,
        timestamp: new Date(),
      }]);
    }
  }, [user?.uid]);

  // Save conversation history
  useEffect(() => {
    if (user?.uid && messages.length > 0) {
      const historyData = {
        messages,
        timestamp: new Date(),
      };
      localStorage.setItem(`meals-ai-conversation-${user?.uid}`, JSON.stringify(historyData));
    }
  }, [messages, user?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content, type = 'user', metadata = {}) => {
    const newMessage = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date(),
      metadata,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add user message
      addMessage(userMessage, 'user');

      // Prepare context for AI
      const context = {
        user: {
          name: user?.displayName || user?.email || 'User',
          email: user?.email || '',
        },
        mealData: {
          meals: mealData?.meals || [],
          mealPlans: mealData?.mealPlans || [],
          preferences: mealData?.mealPreferences || {},
        },
        currentDate: new Date().toISOString(),
      };

      // Use unifiedAIService for shared Drift memory, with domain 'meals'
      const aiResponseContent = await unifiedAIService.getResponse(
        user?.uid || 'anonymous',
        userMessage,
        [], // currentGoals not relevant for meals
        context,
        'meals'
      );

      addMessage(aiResponseContent, 'assistant');
    } catch (error) {
      console.error('Error processing message:', error);
      let errorMessage = 'I apologize, but I encountered an error processing your request.';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'The request timed out. Please try asking a simpler question.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('API')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      }
      
      addMessage(errorMessage + ' Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMealResponse = async (message, context) => {
    // Enhanced input validation to prevent crashes
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Invalid message input');
    }

    if (!context || typeof context !== 'object') {
      context = { user: {}, mealData: {} };
    }

    // Safely access context properties with defaults
    const user = context.user || {};
    const mealData = context.mealData || {};
    const preferences = mealData.preferences || {};
    const meals = Array.isArray(mealData.meals) ? mealData.meals : [];
    const mealPlans = Array.isArray(mealData.mealPlans) ? mealData.mealPlans : [];

    // Enhanced system prompt for better action generation
    const systemPrompt = `You are an expert nutritionist and meal planning assistant. Create comprehensive, practical meal plans that are easy to follow and nutritionally balanced.

User context:
- Goal: ${context.mealData?.preferences?.goal || 'general health'}
- Daily Calories: ${context.mealData?.preferences?.dailyCalories || 'not set'}
- Restrictions: ${context.mealData?.preferences?.dietaryRestrictions?.join(', ') || 'none'}
- Macros: P${context.mealData?.preferences?.macroTargets?.protein || 0}g C${context.mealData?.preferences?.macroTargets?.carbs || 0}g F${context.mealData?.preferences?.macroTargets?.fat || 0}g
- Allergens: ${context.mealData?.preferences?.allergens?.join(', ') || 'none'}
- Cooking Time: ${context.mealData?.preferences?.cookingTime || 'medium'}
- Meals per Day: ${context.mealData?.preferences?.preferredMealCount || 3}

IMPORTANT: When the user asks for meal plans, recipes, or meal creation, ALWAYS include an action at the end.

For meal plans use this EXACT format with detailed recipes:
[ACTION]{"type": "create_meal_plan", "data": {"title": "Weekly Meal Plan", "description": "AI generated meal plan", "targetCalories": ${context.mealData?.preferences?.dailyCalories || 2000}, "duration": 7, "days": [{"day": "Monday", "breakfast": {"name": "Meal name", "calories": 400, "ingredients": ["ingredient1", "ingredient2"], "instructions": "Step by step cooking instructions", "prepTime": 10, "cookTime": 20}, "lunch": {...}, "dinner": {...}}, ...]}}[/ACTION]

For individual meals use:
[ACTION]{"type": "create_meal", "data": {"title": "Meal Name", "calories": 400, "macros": {"protein": 30, "carbs": 45, "fat": 15}, "ingredients": ["ingredient1", "ingredient2"], "instructions": "Cooking steps", "prepTime": 10, "cookTime": 20}}[/ACTION]

Always include detailed recipes with ingredients, instructions, and nutritional info. Respond naturally first, then add the action.`;

    try {
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
      
      // Add timeout for faster responses
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Response timeout')), 15000);
      });
      
      const responsePromise = geminiService.generateContent(fullPrompt, apiKey);
      const text = await Promise.race([responsePromise, timeoutPromise]);
      
      // Check if this is a meal plan request and force action if missing
      const isMealPlanRequest = message.toLowerCase().includes('meal plan') || 
                               message.toLowerCase().includes('create') && message.toLowerCase().includes('week') ||
                               message.toLowerCase().includes('plan');
      
      // Clean response - remove all JSON artifacts first
      let cleanMessage = text
        .replace(/\[ACTION\].*?\[\/ACTION\]/gs, '') // Remove action blocks
        .replace(/```json[\s\S]*?```/g, '') // Remove JSON code blocks  
        .replace(/```[\s\S]*?```/g, '') // Remove any code blocks
        .replace(/\{[\s\S]*?"type"[\s\S]*?\}/g, '') // Remove loose JSON
        .replace(/^\s*\{[\s\S]*$/gm, '') // Remove lines starting with {
        .trim();

      // Parse actions separately from clean blocks
      const actionMatches = text.match(/\[ACTION\](.*?)\[\/ACTION\]/gs);
      let actions = [];

      if (actionMatches) {
        for (const match of actionMatches) {
          try {
            const jsonStr = match.replace(/\[ACTION\]|\[\/ACTION\]/g, '').trim();
            const actionData = JSON.parse(jsonStr);
            actions.push(actionData);
          } catch (parseError) {
            console.warn('Could not parse action:', parseError);
          }
        }
      }

      // Force create meal plan action if request detected but no action found
      if (isMealPlanRequest && actions.length === 0) {
        const fallbackMealPlan = {
          type: "create_meal_plan",
          data: {
            title: "Weekly Meal Plan",
            description: "AI generated meal plan",
            targetCalories: context.mealData?.preferences?.dailyCalories || 2000,
            duration: 7,
            days: [
              { 
                day: "Monday", 
                breakfast: {
                  name: "Greek Yogurt with Berries",
                  calories: 300,
                  ingredients: ["Greek yogurt", "Mixed berries", "Honey", "Granola"],
                  instructions: "Mix yogurt with berries, drizzle with honey, top with granola",
                  prepTime: 5,
                  cookTime: 0
                },
                lunch: {
                  name: "Chicken Salad Sandwich",
                  calories: 450,
                  ingredients: ["Chicken breast", "Mixed greens", "Tomato", "Whole grain bread", "Olive oil"],
                  instructions: "Grill chicken, assemble sandwich with greens and tomato",
                  prepTime: 10,
                  cookTime: 15
                },
                dinner: {
                  name: "Baked Salmon with Vegetables",
                  calories: 550,
                  ingredients: ["Salmon fillet", "Broccoli", "Carrots", "Olive oil", "Lemon"],
                  instructions: "Season salmon, bake at 400°F for 20 minutes with vegetables",
                  prepTime: 15,
                  cookTime: 20
                }
              },
              { 
                day: "Tuesday", 
                breakfast: {
                  name: "Oatmeal with Banana",
                  calories: 350,
                  ingredients: ["Oats", "Banana", "Cinnamon", "Milk", "Honey"],
                  instructions: "Cook oats with milk, top with sliced banana and honey",
                  prepTime: 5,
                  cookTime: 10
                },
                lunch: {
                  name: "Turkey Wrap",
                  calories: 400,
                  ingredients: ["Turkey slices", "Tortilla", "Lettuce", "Tomato", "Mustard"],
                  instructions: "Layer turkey and vegetables on tortilla, roll and serve",
                  prepTime: 8,
                  cookTime: 0
                },
                dinner: {
                  name: "Grilled Chicken with Rice",
                  calories: 500,
                  ingredients: ["Chicken breast", "Brown rice", "Mixed vegetables", "Soy sauce"],
                  instructions: "Grill chicken, cook rice, stir-fry vegetables",
                  prepTime: 10,
                  cookTime: 25
                }
              }
            ]
          }
        };
        actions.push(fallbackMealPlan);
      }

      return {
        message: cleanMessage || "I'm here to help with your meal planning! What would you like to know?",
        actions,
        suggestions: [],
      };
    } catch (error) {
      console.error('Error generating meal response:', error);
      if (error.message.includes('timeout')) {
        throw new Error('Response took too long. Please try a more specific question.');
      }
      throw new Error('I had trouble processing that request. Please try rephrasing.');
    }
  };

  const processActions = async (actions) => {
    if (!Array.isArray(actions)) {
      console.warn('Invalid actions array:', actions);
      return;
    }

    for (const action of actions) {
      try {
        if (!action || typeof action !== 'object' || !action.type) {
          console.warn('Invalid action:', action);
          continue;
        }

        switch (action.type) {
          case 'create_meal_plan':
            if (typeof saveMealPlan === 'function') {
              await handleCreateMealPlan(action.data);
            } else {
              console.warn('saveMealPlan function not available');
              addMessage('Meal plan creation is temporarily unavailable.', 'system');
            }
            break;
          case 'create_meal':
            if (typeof saveMeal === 'function') {
              await handleCreateMeal(action.data);
            } else {
              console.warn('saveMeal function not available');
              addMessage('Meal creation is temporarily unavailable.', 'system');
            }
            break;
          case 'update_preferences':
            if (typeof updateMealPreferences === 'function') {
              await handleUpdatePreferences(action.data);
            } else {
              console.warn('updateMealPreferences function not available');
              addMessage('Preference updates are temporarily unavailable.', 'system');
            }
            break;
          default:
            console.warn('Unknown action type:', action.type);
        }
      } catch (error) {
        console.error(`Error processing action ${action.type}:`, error);
        addMessage(`Could not complete the ${action.type} action. Please try manually.`, 'system');
      }
    }
  };

  const handleCreateMealPlan = async (planData) => {
    try {
      const mealPlan = {
        id: `plan_${Date.now()}`,
        title: planData.title || 'AI Generated Meal Plan',
        description: planData.description || 'Created by AI Assistant',
        startDate: planData.startDate || new Date().toISOString().split('T')[0],
        endDate: planData.endDate || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: planData.duration || 7,
        targetCalories: planData.targetCalories || mealData?.preferences?.dailyCalories || 2000,
        mealsPerDay: planData.mealsPerDay || 3,
        days: planData.days || [],
        macroTargets: planData.macroTargets || mealData?.preferences?.macroTargets || {
          protein: 25,
          carbs: 45,
          fat: 30
        },
        generatedBy: 'ai',
        createdAt: new Date().toISOString(),
      };

      await saveMealPlan(mealPlan);
      
      // Enhanced success message
      addMessage(
        `🍽️ **Meal Plan Created Successfully!**\n\n` +
        `**"${mealPlan.title}"**\n` +
        `📅 **Duration:** ${mealPlan.duration} days\n` +
        `🎯 **Target Calories:** ${mealPlan.targetCalories} per day\n` +
        `🥗 **Meals per Day:** ${mealPlan.mealsPerDay}\n\n` +
        `Your meal plan has been saved! Switch to the **Weekly Plan** tab to view and manage your meals.`,
        'system',
        { type: 'meal_plan_created', mealPlanId: mealPlan.id }
      );
      
      // Achievement for first AI meal plan
      await addAchievement({
        id: 'first_ai_meal_plan',
        title: 'AI Chef',
        description: 'Created your first AI-generated meal plan',
        icon: 'Bot',
        category: 'meals',
        points: 50,
      });
      
      return mealPlan;
    } catch (error) {
      console.error('Error creating meal plan:', error);
      addMessage(
        `❌ **Error creating meal plan:** ${error.message}\n\nPlease try again or create one manually in the Weekly Plan tab.`,
        'system',
        { type: 'error' }
      );
    }
  };

  const handleCreateMeal = async (mealData) => {
    try {
      const meal = {
        id: `meal_${Date.now()}`,
        title: mealData.title || mealData.name || 'AI Generated Meal',
        type: mealData.type || 'meal',
        calories: mealData.calories || 0,
        macros: mealData.macros || { protein: 0, carbs: 0, fat: 0 },
        ingredients: mealData.ingredients || [],
        instructions: mealData.instructions || mealData.steps || '',
        prepTime: mealData.prepTime || 30,
        cookTime: mealData.cookTime || 0,
        servings: mealData.servings || 1,
        difficulty: mealData.difficulty || 'easy',
        tags: mealData.tags || [],
        notes: mealData.notes || '',
        generatedBy: 'ai',
        createdAt: new Date().toISOString(),
      };

      await saveMeal(meal);
      
      // Enhanced success message
      addMessage(
        `🍴 **Meal Recipe Created!**\n\n` +
        `**"${meal.title}"**\n` +
        `📊 **Calories:** ${meal.calories}\n` +
        `⏱️ **Prep Time:** ${meal.prepTime} minutes\n` +
        `🥗 **Servings:** ${meal.servings}\n` +
        `📝 **Ingredients:** ${meal.ingredients.length} items\n\n` +
        `Your meal recipe has been saved to your collection!`,
        'system',
        { type: 'meal_created', mealId: meal.id }
      );
      
      return meal;
    } catch (error) {
      console.error('Error creating meal:', error);
      addMessage(
        `❌ **Error creating meal:** ${error.message}\n\nPlease try again.`,
        'system',
        { type: 'error' }
      );
    }
  };

  const handleUpdatePreferences = async (preferencesData) => {
    await updateMealPreferences(preferencesData);
    addMessage(`✅ Updated meal preferences`, 'system');
  };

  const quickActions = [
    { text: 'Create this week\'s meal plan', icon: 'Calendar' },
    { text: 'Generate high-protein recipes', icon: 'Zap' },
    { text: 'Suggest meal prep ideas', icon: 'Package' },
    { text: 'Calculate macro-balanced meals', icon: 'Calculator' },
  ];

  const handleQuickAction = async (text) => {
    // Set the input message and immediately send it
    setInputMessage(text);
    setIsLoading(true);

    try {
      // Add user message
      addMessage(text, 'user');

      // Prepare context for AI
      const context = {
        user: {
          name: user?.displayName || user?.email,
          email: user?.email,
        },
        mealData: {
          meals: mealData.meals || [],
          mealPlans: mealData.mealPlans || [],
          preferences: mealData.mealPreferences || {},
        },
        currentDate: new Date().toISOString(),
      };

      // Generate AI response with meal-specific capabilities
      const response = await generateMealResponse(text, context);

      // Process any actions from the AI response
      if (response.actions && response.actions.length > 0) {
        await processActions(response.actions);
      }

      // Add AI response
      addMessage(response.message, 'assistant', {
        actions: response.actions,
        suggestions: response.suggestions,
      });

    } catch (error) {
      console.error('Error processing quick action:', error);
      addMessage('I apologize, but I encountered an error processing your request. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
      setInputMessage(''); // Clear input after sending
    }
  };

  // In the UI, check for apiKey
  if (!apiKey) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <Icon name="Key" className="w-16 h-16 mx-auto text-warning mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">API Key Required</h3>
        <p className="text-text-secondary">Please configure your Gemini API key in Settings to use the AI assistant.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Icon name="Bot" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Meal Planning AI</h3>
            <p className="text-sm text-text-secondary">Your nutrition and meal planning assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-xl ${
                  message.type === 'user'
                    ? 'bg-primary text-white'
                    : message.type === 'system'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-background border border-border text-text-primary'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {(() => {
                    try {
                      const timestamp = message.timestamp instanceof Date 
                        ? message.timestamp 
                        : new Date(message.timestamp);
                      return timestamp.toLocaleTimeString();
                    } catch (e) {
                      return new Date().toLocaleTimeString();
                    }
                  })()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-background border border-border rounded-xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-text-secondary">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-border">
          <p className="text-sm text-text-secondary mb-3">Quick actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.text)}
                disabled={isLoading}
                className="flex items-center space-x-2 p-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name={action.icon} className="w-4 h-4" />
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about meal planning, recipes, nutrition..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="Send" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;