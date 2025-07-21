import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useMeals } from '../../context/MealsContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../../components/ui/Icon';
import MealPlanView from './components/MealPlanView';
import MealPreferences from './components/MealPreferences';
import AIAssistantPanel from './components/AIAssistantPanel';

const MealsPage = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { 
    meals, 
    mealPlans, 
    mealPreferences, 
    loading, 
    error,
    getCurrentWeekMealPlan,
    loadUserMealData 
  } = useMeals();
  const { addAchievement } = useAchievements();

  const [activeTab, setActiveTab] = useState('plan'); // plan, preferences, ai
  const [currentWeekPlan, setCurrentWeekPlan] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadUserMealData();
    }
  }, [user?.uid]);

  useEffect(() => {
    const weekPlan = getCurrentWeekMealPlan();
    setCurrentWeekPlan(weekPlan);
  }, [mealPlans]);

  const tabs = [
    { id: 'plan', label: 'Weekly Plan', icon: 'Calendar' },
    { id: 'preferences', label: 'Preferences', icon: 'Settings' },
    { id: 'ai', label: 'AI Assistant', icon: 'Bot' },
  ];

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" className="w-16 h-16 mx-auto text-error mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Sign In Required</h3>
          <p className="text-text-secondary">Please sign in to access your meal plans.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your meal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Icon name="UtensilsCrossed" className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading-bold text-text-primary">Meals</h1>
              <p className="text-text-secondary">Plan and track your macro-optimized meals</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Target" className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-text-secondary">Daily Goal</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{mealPreferences.dailyCalories}</p>
              <p className="text-xs text-text-secondary">calories</p>
            </div>
            
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Activity" className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-text-secondary">Protein</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{mealPreferences.macroTargets.protein}%</p>
              <p className="text-xs text-text-secondary">target</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Zap" className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-text-secondary">Carbs</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{mealPreferences.macroTargets.carbs}%</p>
              <p className="text-xs text-text-secondary">target</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Droplets" className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-text-secondary">Fat</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{mealPreferences.macroTargets.fat}%</p>
              <p className="text-xs text-text-secondary">target</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-surface border border-border rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                }`}
              >
                <Icon name={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'plan' && (
              <MealPlanView 
                currentWeekPlan={currentWeekPlan}
                mealPreferences={mealPreferences}
              />
            )}
            
            {activeTab === 'preferences' && (
              <MealPreferences 
                preferences={mealPreferences}
              />
            )}
            
            {activeTab === 'ai' && (
              <AIAssistantPanel 
                mealData={{ meals, mealPlans, mealPreferences }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MealsPage;