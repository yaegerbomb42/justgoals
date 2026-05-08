import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useMeals } from '../../context/MealsContext';
import { useAchievements } from '../../context/AchievementContext';
import Icon from '../../components/ui/Icon';
import Page from '../../components/ui/Page';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import TabBar from '../../components/ui/TabBar';
import EmptyState from '../../components/ui/EmptyState';
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

  if (!user?.uid) {
    return (
      <Page>
        <EmptyState
          icon="LogIn"
          title="Sign In Required"
          description="Please sign in to access your meal plans."
          size="lg"
        />
      </Page>
    );
  }

  if (loading) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary">Loading your meal data...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        icon="UtensilsCrossed"
        title="Meals"
        subtitle="Plan and track your macro-optimized meals"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon="Target"
          label="Daily Goal"
          value={mealPreferences.dailyCalories}
          sublabel="calories"
          tone="primary"
        />
        <StatCard
          icon="Activity"
          label="Protein"
          value={`${mealPreferences.macroTargets.protein}%`}
          sublabel="target"
          tone="success"
        />
        <StatCard
          icon="Zap"
          label="Carbs"
          value={`${mealPreferences.macroTargets.carbs}%`}
          sublabel="target"
          tone="warning"
        />
        <StatCard
          icon="Droplets"
          label="Fat"
          value={`${mealPreferences.macroTargets.fat}%`}
          sublabel="target"
          tone="info"
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" className="w-5 h-5 text-error" />
            <p className="text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'plan' && (
            <MealPlanView currentWeekPlan={currentWeekPlan} mealPreferences={mealPreferences} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'preferences' && (
            <MealPreferences
              preferences={mealPreferences}
            />
          )}

          {activeTab === 'ai' && (
            <AIAssistantPanel mealData={{ meals, mealPlans, mealPreferences }} apiKey={settings.geminiApiKey} />
          )}
        </motion.div>
      </AnimatePresence>
    </Page>
  );
};

export default MealsPage;
