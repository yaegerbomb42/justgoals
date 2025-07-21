import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { useMeals } from '../../../context/MealsContext';
import { useAchievements } from '../../../context/AchievementContext';
import { geminiService } from '../../../services/geminiService';
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
        timestamp: Date.now(),
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
      const response = await generateMealResponse(userMessage, context);

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
      console.error('Error processing message:', error);
      addMessage('I apologize, but I encountered an error processing your request. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMealResponse = async (message, context) => {
    const systemPrompt = `You are a specialized meal planning AI assistant for the JustGoals app. You help users create personalized, macro-optimized meal plans.

Your expertise includes:
- Creating weekly meal plans based on user goals (weight loss, maintenance, gain)
- Generating recipes with accurate macro calculations
- Adapting meals for dietary restrictions and allergies
- Optimizing nutrition for fitness goals
- Meal prep strategies and timing

Current user context:
- User: ${context.user?.name || 'User'} (${context.user?.email || 'No email'})
- Goal: ${context.mealData?.preferences?.goal || 'not set'}
- Daily Calories: ${context.mealData?.preferences?.dailyCalories || 'not set'}
- Macro Targets: ${JSON.stringify(context.mealData?.preferences?.macroTargets) || 'not set'}
- Dietary Restrictions: ${context.mealData?.preferences?.dietaryRestrictions?.join(', ') || 'none'}
- Allergens: ${context.mealData?.preferences?.allergens?.join(', ') || 'none'}
- Meals per Day: ${context.mealData?.preferences?.preferredMealCount || 3}
- Cooking Time Preference: ${context.mealData?.preferences?.cookingTime || 'medium'}

When creating meal plans or recipes:
- Always calculate accurate macros (protein, carbs, fat, calories)
- Consider the user's goals and restrictions
- Provide ingredient lists and clear instructions
- Include prep time estimates
- Suggest variations when possible

For actions, use JSON format:
{
  "type": "create_meal_plan" | "create_meal" | "update_preferences",
  "data": { ... }
}

Be encouraging, knowledgeable, and focus on practical, achievable meal planning.`;

    try {
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
      // Use apiKey for Gemini API call
      const text = await geminiService.generateContent(fullPrompt, apiKey);
      
      // Parse response for actions
      const actionMatch = text.match(/\{[\s\S]*"type"[\s\S]*\}/);
      let actions = [];
      let cleanMessage = text;

      if (actionMatch) {
        try {
          const actionData = JSON.parse(actionMatch[0]);
          actions = [actionData];
          cleanMessage = text.replace(actionMatch[0], '').trim();
        } catch (parseError) {
          console.error('Error parsing action JSON:', parseError);
        }
      }

      return {
        message: cleanMessage,
        actions,
        suggestions: [],
      };
    } catch (error) {
      console.error('Error generating meal response:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  };

  const processActions = async (actions) => {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_meal_plan':
            await handleCreateMealPlan(action.data);
            break;
          case 'create_meal':
            await handleCreateMeal(action.data);
            break;
          case 'update_preferences':
            await handleUpdatePreferences(action.data);
            break;
        }
      } catch (error) {
        console.error(`Error processing action ${action.type}:`, error);
      }
    }
  };

  const handleCreateMealPlan = async (planData) => {
    const mealPlan = {
      id: `plan_${Date.now()}`,
      title: planData.title || 'AI Generated Meal Plan',
      startDate: planData.startDate || new Date().toISOString().split('T')[0],
      endDate: planData.endDate || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      days: planData.days || [],
      generatedBy: 'ai',
      createdAt: new Date().toISOString(),
    };

    await saveMealPlan(mealPlan);
    addMessage(`✅ Created meal plan: "${planData.title || 'AI Generated Meal Plan'}"`, 'system');
    
    // Achievement for first AI meal plan
    await addAchievement({
      id: 'first_ai_meal_plan',
      title: 'AI Chef',
      description: 'Created your first AI-generated meal plan',
      icon: 'Bot',
      category: 'meals',
      points: 50,
    });
  };

  const handleCreateMeal = async (mealData) => {
    const meal = {
      id: `meal_${Date.now()}`,
      title: mealData.title,
      type: mealData.type || 'meal',
      calories: mealData.calories || 0,
      macros: mealData.macros || { protein: 0, carbs: 0, fat: 0 },
      ingredients: mealData.ingredients || [],
      instructions: mealData.instructions || '',
      prepTime: mealData.prepTime || 30,
      notes: mealData.notes || '',
      generatedBy: 'ai',
      createdAt: new Date().toISOString(),
    };

    await saveMeal(meal);
    addMessage(`✅ Created meal: "${mealData.title}"`, 'system');
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

  const handleQuickAction = (text) => {
    setInputMessage(text);
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
                  {message.timestamp.toLocaleTimeString()}
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
                className="flex items-center space-x-2 p-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-colors"
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