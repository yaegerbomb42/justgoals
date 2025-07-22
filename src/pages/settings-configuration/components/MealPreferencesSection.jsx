import React, { useState } from 'react';
import { useMeals } from '../../../context/MealsContext';
import MealPreferences from '../../meals/components/MealPreferences';
import Icon from '../../../components/ui/Icon';

const MealPreferencesSection = () => {
  const { mealPreferences, loading, error } = useMeals();
  const [localError, setLocalError] = useState(null);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon name="UtensilsCrossed" className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-text-primary">Meal Preferences</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-text-secondary">Loading meal preferences...</span>
        </div>
      </div>
    );
  }

  if (error || localError) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon name="UtensilsCrossed" className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-text-primary">Meal Preferences</h2>
        </div>
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" className="w-5 h-5 text-error" />
            <span className="text-error font-medium">Error loading meal preferences</span>
          </div>
          <p className="text-text-secondary text-sm mt-2">
            {error?.message || localError || 'Unable to load meal preferences. Please try refreshing the page.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Icon name="UtensilsCrossed" className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold text-text-primary">Meal Preferences</h2>
      </div>
      
      <div className="mb-4">
        <p className="text-text-secondary text-sm">
          Configure your dietary goals, macro targets, and meal planning preferences. 
          These settings will be used by the AI assistant to create personalized meal plans.
        </p>
      </div>

      <div className="max-w-none">
        <MealPreferences 
          preferences={mealPreferences || {}} 
          onError={setLocalError}
        />
      </div>
    </div>
  );
};

export default MealPreferencesSection;