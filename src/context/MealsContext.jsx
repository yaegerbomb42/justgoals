import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import firestoreService from '../services/firestoreService';

const MealsContext = createContext();

export const useMeals = () => {
  const context = useContext(MealsContext);
  if (!context) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
};

export const MealsProvider = ({ children }) => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [mealPreferences, setMealPreferences] = useState({
    goal: 'maintain', // maintain, gain, lose
    dailyCalories: 2000,
    macroTargets: {
      protein: 25, // percentage
      carbs: 45,
      fat: 30
    },
    dietaryRestrictions: [],
    allergens: [],
    preferredMealCount: 3, // meals per day
    cookingTime: 'medium', // quick, medium, elaborate
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user meal data on mount
  useEffect(() => {
    if (user?.id) {
      loadUserMealData();
    }
  }, [user?.id]);

  const loadUserMealData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load meals, meal plans, and preferences from Firestore
      const [mealsData, mealPlansData, preferencesData] = await Promise.all([
        firestoreService.getMeals(user.id),
        firestoreService.getMealPlans(user.id),
        firestoreService.getMealPreferences(user.id)
      ]);

      setMeals(mealsData || []);
      setMealPlans(mealPlansData || []);
      if (preferencesData) {
        setMealPreferences(prev => ({ ...prev, ...preferencesData }));
      }
    } catch (err) {
      console.error('Error loading meal data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMeal = async (mealData) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const savedMeal = await firestoreService.saveMeal(user.id, mealData);
      setMeals(prev => {
        const existing = prev.findIndex(m => m.id === savedMeal.id);
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = savedMeal;
          return updated;
        }
        return [...prev, savedMeal];
      });
      return savedMeal;
    } catch (err) {
      console.error('Error saving meal:', err);
      throw err;
    }
  };

  const deleteMeal = async (mealId) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      await firestoreService.deleteMeal(user.id, mealId);
      setMeals(prev => prev.filter(m => m.id !== mealId));
    } catch (err) {
      console.error('Error deleting meal:', err);
      throw err;
    }
  };

  const saveMealPlan = async (mealPlanData) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const savedPlan = await firestoreService.saveMealPlan(user.id, mealPlanData);
      setMealPlans(prev => {
        const existing = prev.findIndex(p => p.id === savedPlan.id);
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = savedPlan;
          return updated;
        }
        return [...prev, savedPlan];
      });
      return savedPlan;
    } catch (err) {
      console.error('Error saving meal plan:', err);
      throw err;
    }
  };

  const updateMealPreferences = async (newPreferences) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const updatedPreferences = { ...mealPreferences, ...newPreferences };
      await firestoreService.saveMealPreferences(user.id, updatedPreferences);
      setMealPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating meal preferences:', err);
      throw err;
    }
  };

  const markMealCompleted = async (mealId, date, completed = true) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      await firestoreService.markMealCompleted(user.id, mealId, date, completed);
      // Reload meal plans to reflect completion status
      const updatedPlans = await firestoreService.getMealPlans(user.id);
      setMealPlans(updatedPlans || []);
    } catch (err) {
      console.error('Error marking meal completion:', err);
      throw err;
    }
  };

  const getCurrentWeekMealPlan = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
    
    return mealPlans.find(plan => {
      const planStart = new Date(plan.startDate);
      const planEnd = new Date(plan.endDate);
      return planStart <= startOfWeek && planEnd >= endOfWeek;
    });
  };

  const value = {
    meals,
    mealPlans,
    mealPreferences,
    loading,
    error,
    saveMeal,
    deleteMeal,
    saveMealPlan,
    updateMealPreferences,
    markMealCompleted,
    getCurrentWeekMealPlan,
    loadUserMealData,
  };

  return (
    <MealsContext.Provider value={value}>
      {children}
    </MealsContext.Provider>
  );
};