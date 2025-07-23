import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMeals } from '../../../context/MealsContext';
import Icon from '../../../components/ui/Icon';
import MacroSlider from '../../../components/ui/MacroSlider';

const MealPreferences = ({ preferences = {}, onError }) => {
  const [contextError, setContextError] = useState(null);
  
  // Safely get context with error handling
  let mealsContext = null;
  try {
    mealsContext = useMeals();
  } catch (error) {
    console.error('Error accessing MealsContext:', error);
    setContextError(error.message);
    if (onError) onError('Unable to access meal preferences service');
  }

  const updateMealPreferences = mealsContext?.updateMealPreferences;

  const [formData, setFormData] = useState(() => {
    try {
      return preferences && typeof preferences === 'object' ? { ...preferences } : {
        goal: 'maintain',
        dailyCalories: 2000,
        macroTargets: { protein: 25, carbs: 45, fat: 30 },
        dietaryRestrictions: [],
        allergens: [],
        preferredMealCount: 3,
        cookingTime: 'medium'
      };
    } catch (error) {
      console.error('Error initializing form data:', error);
      if (onError) onError('Error initializing meal preferences');
      return {
        goal: 'maintain',
        dailyCalories: 2000,
        macroTargets: { protein: 25, carbs: 45, fat: 30 },
        dietaryRestrictions: [],
        allergens: [],
        preferredMealCount: 3,
        cookingTime: 'medium'
      };
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      if (preferences && typeof preferences === 'object') {
        setFormData(prev => ({ ...prev, ...preferences }));
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      if (onError) onError('Error updating preferences');
    }
  }, [preferences, onError]);

  // Show error state if context is unavailable
  if (contextError) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Icon name="AlertTriangle" className="w-5 h-5 text-error" />
          <span className="text-error font-medium">Service Unavailable</span>
        </div>
        <p className="text-text-secondary text-sm mt-2">
          Unable to load meal preferences service. Please refresh the page and try again.
        </p>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    try {
      // Special validation for certain fields
      if (field === 'dailyCalories') {
        const numValue = parseInt(value) || 0;
        if (numValue < 0) {
          if (onError) onError('Daily calories cannot be negative');
          return;
        }
        if (numValue > 20000) {
          if (onError) onError('Daily calories seems too high (maximum 20,000)');
          return;
        }
        setFormData(prev => ({
          ...prev,
          [field]: numValue
        }));
      } else if (field === 'preferredMealCount') {
        const numValue = parseInt(value) || 3;
        if (numValue < 1 || numValue > 8) {
          if (onError) onError('Meal count must be between 1-8');
          return;
        }
        setFormData(prev => ({
          ...prev,
          [field]: numValue
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
      
      // Clear error if validation passes
      if (onError) onError(null);
    } catch (error) {
      console.error('Error updating form data:', error);
      if (onError) onError('Error updating ' + field + ': ' + error.message);
    }
  };

  // Wrapper function for MacroSlider compatibility
  const handleMacroSliderChange = (newMacroTargets) => {
    try {
      // Validate the entire macro object
      const protein = parseInt(newMacroTargets.protein) || 0;
      const carbs = parseInt(newMacroTargets.carbs) || 0;
      const fat = parseInt(newMacroTargets.fat) || 0;
      const total = protein + carbs + fat;
      
      if (total > 100) {
        if (onError) onError(`Macro total would be ${total}% (cannot exceed 100%)`);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        macroTargets: newMacroTargets
      }));
      
      // Clear error if validation passes
      if (onError && total <= 100) {
        onError(null);
      }
    } catch (error) {
      console.error('Error updating macro targets from slider:', error);
      if (onError) onError('Error updating macro targets: ' + error.message);
    }
  };

  const handleMacroChange = (macro, value) => {
    try {
      const numValue = parseInt(value) || 0;
      
      // Validate individual macro range
      if (numValue < 0 || numValue > 100) {
        if (onError) onError(`${macro} percentage must be between 0-100%`);
        return;
      }
      
      const newMacroTargets = {
        ...formData.macroTargets,
        [macro]: numValue
      };
      
      // Calculate total and warn if over 100%
      const total = (newMacroTargets.protein || 0) + (newMacroTargets.carbs || 0) + (newMacroTargets.fat || 0);
      if (total > 100) {
        if (onError) onError(`Macro total would be ${total}% (cannot exceed 100%)`);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        macroTargets: newMacroTargets
      }));
      
      // Clear any previous error if validation passes
      if (onError && total <= 100) {
        onError(null);
      }
    } catch (error) {
      console.error('Error updating macro targets:', error);
      if (onError) onError('Error updating macro targets: ' + error.message);
    }
  };

  const handleArrayChange = (field, value) => {
    try {
      if (!value || typeof value !== 'string') {
        setFormData(prev => ({
          ...prev,
          [field]: []
        }));
        return;
      }
      
      // Clean and validate array items
      const array = value
        .split(',')
        .map(item => item.trim())
        .filter(item => item && item.length > 0)
        .filter(item => item.length <= 50) // Prevent extremely long entries
        .slice(0, 20); // Limit to 20 items maximum
      
      setFormData(prev => ({
        ...prev,
        [field]: array
      }));
    } catch (error) {
      console.error('Error updating array field:', error);
      if (onError) onError('Error updating ' + field + ': ' + error.message);
    }
  };

  const handleSave = async () => {
    // Comprehensive validation with enhanced checks
    const validationErrors = [];
    
    // Daily calories validation
    if (!formData.dailyCalories || isNaN(formData.dailyCalories)) {
      validationErrors.push('Daily calories must be a valid number');
    } else if (formData.dailyCalories < 800 || formData.dailyCalories > 15000) {
      validationErrors.push('Daily calories must be between 800-15000 (safe range)');
    }
    
    // Macro targets validation
    const macros = formData.macroTargets || {};
    const protein = parseInt(macros.protein) || 0;
    const carbs = parseInt(macros.carbs) || 0;
    const fat = parseInt(macros.fat) || 0;
    
    if (protein < 5 || protein > 60) {
      validationErrors.push('Protein percentage must be between 5-60% (nutritionally safe range)');
    }
    
    if (carbs < 10 || carbs > 80) {
      validationErrors.push('Carbs percentage must be between 10-80% (nutritionally safe range)');
    }
    
    if (fat < 10 || fat > 60) {
      validationErrors.push('Fat percentage must be between 10-60% (nutritionally safe range)');
    }
    
    // Check if macros add up to 100%
    const totalMacros = protein + carbs + fat;
    if (Math.abs(totalMacros - 100) > 1) { // Allow 1% tolerance for rounding
      validationErrors.push(`Macro percentages must total 100% (currently ${totalMacros}%)`);
    }
    
    // Validate meal count
    if (formData.preferredMealCount && (formData.preferredMealCount < 1 || formData.preferredMealCount > 8)) {
      validationErrors.push('Preferred meal count must be between 1-8');
    }
    
    // Validate arrays are proper arrays
    if (formData.dietaryRestrictions && !Array.isArray(formData.dietaryRestrictions)) {
      validationErrors.push('Dietary restrictions data is corrupted');
    }
    
    if (formData.allergens && !Array.isArray(formData.allergens)) {
      validationErrors.push('Allergens data is corrupted');
    }
    
    // Goal validation
    const validGoals = ['lose', 'maintain', 'gain'];
    if (formData.goal && !validGoals.includes(formData.goal)) {
      validationErrors.push('Invalid goal selection');
    }
    
    if (validationErrors.length > 0) {
      if (onError) onError(validationErrors.join(' • '));
      return;
    }

    setIsSaving(true);
    try {
      // Ensure all data is properly formatted before saving
      const sanitizedData = {
        ...formData,
        dailyCalories: parseInt(formData.dailyCalories) || 2000,
        protein: parseInt(formData.protein) || 0,
        carbs: parseInt(formData.carbs) || 0,
        fat: parseInt(formData.fat) || 0,
        dietaryRestrictions: Array.isArray(formData.dietaryRestrictions) ? formData.dietaryRestrictions : [],
        allergies: Array.isArray(formData.allergies) ? formData.allergies : [],
        dislikedFoods: Array.isArray(formData.dislikedFoods) ? formData.dislikedFoods : [],
        cuisinePreferences: Array.isArray(formData.cuisinePreferences) ? formData.cuisinePreferences : [],
        updatedAt: new Date().toISOString()
      };
      
      await updateMealPreferences(sanitizedData);
      if (onSuccess) onSuccess('Meal preferences saved successfully!');
    } catch (error) {
      console.error('Error saving meal preferences:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      if (onError) onError(`Failed to save meal preferences: ${errorMessage}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Goals Section */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
          <Icon name="Target" className="w-5 h-5 text-primary" />
          <span>Goals & Targets</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Goal</label>
            <select
              value={formData.goal || 'maintain'}
              onChange={(e) => handleInputChange('goal', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Weight</option>
            </select>
          </div>

          {/* Daily Calories */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Daily Calories</label>
            <input
              type="number"
              value={formData.dailyCalories || 2000}
              onChange={(e) => handleInputChange('dailyCalories', parseInt(e.target.value) || 2000)}
              min="1000"
              max="5000"
              step="50"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Macro Targets */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
          <Icon name="PieChart" className="w-5 h-5 text-primary" />
          <span>Macro Distribution</span>
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Protein */}
            <div>
              <label className="block text-sm font-medium text-green-600 mb-2">
                Protein ({formData.macroTargets?.protein || 25}%)
              </label>
              <input
                type="range"
                min="10"
                max="60"
                value={formData.macroTargets?.protein || 25}
                onChange={(e) => handleMacroChange('protein', e.target.value)}
                className="w-full h-2 bg-surface-300 rounded-lg appearance-none cursor-pointer slider-green"
              />
              <div className="text-sm text-text-secondary mt-1">
                {Math.round((formData.dailyCalories * (formData.macroTargets?.protein || 25) / 100) / 4)}g
              </div>
            </div>

            {/* Carbs */}
            <div>
              <label className="block text-sm font-medium text-yellow-600 mb-2">
                Carbs ({formData.macroTargets?.carbs || 45}%)
              </label>
              <input
                type="range"
                min="20"
                max="70"
                value={formData.macroTargets?.carbs || 45}
                onChange={(e) => handleMacroChange('carbs', e.target.value)}
                className="w-full h-2 bg-surface-300 rounded-lg appearance-none cursor-pointer slider-yellow"
              />
              <div className="text-sm text-text-secondary mt-1">
                {Math.round((formData.dailyCalories * (formData.macroTargets?.carbs || 45) / 100) / 4)}g
              </div>
            </div>

            {/* Fat */}
            <div>
              <label className="block text-sm font-medium text-blue-600 mb-2">
                Fat ({formData.macroTargets?.fat || 30}%)
              </label>
              <input
                type="range"
                min="15"
                max="50"
                value={formData.macroTargets?.fat || 30}
                onChange={(e) => handleMacroChange('fat', e.target.value)}
                className="w-full h-2 bg-surface-300 rounded-lg appearance-none cursor-pointer slider-blue"
              />
              <div className="text-sm text-text-secondary mt-1">
                {Math.round((formData.dailyCalories * (formData.macroTargets?.fat || 30) / 100) / 9)}g
              </div>
            </div>
          </div>

          {/* Macro Total Warning */}
          {macroTotal !== 100 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertTriangle" className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Macro percentages total {macroTotal}%. They should add up to 100%.
                </span>
              </div>
            </div>
          )}
        </div>
        <MacroSlider
          macroTargets={formData.macroTargets || { protein: 25, carbs: 45, fat: 30 }}
          dailyCalories={formData.dailyCalories || 2000}
          onChange={handleMacroSliderChange}
        />
      </div>

      {/* Dietary Preferences */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
          <Icon name="Apple" className="w-5 h-5 text-primary" />
          <span>Dietary Preferences</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Dietary Restrictions
            </label>
            <input
              type="text"
              value={formData.dietaryRestrictions?.join(', ') || ''}
              onChange={(e) => handleArrayChange('dietaryRestrictions', e.target.value)}
              placeholder="e.g., vegetarian, vegan, keto"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-text-secondary mt-1">Separate multiple items with commas</p>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Allergens to Avoid
            </label>
            <input
              type="text"
              value={formData.allergens?.join(', ') || ''}
              onChange={(e) => handleArrayChange('allergens', e.target.value)}
              placeholder="e.g., nuts, dairy, gluten"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-text-secondary mt-1">Separate multiple items with commas</p>
          </div>
        </div>
      </div>

      {/* Meal Planning Preferences */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
          <Icon name="Clock" className="w-5 h-5 text-primary" />
          <span>Meal Planning</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meals per Day */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Meals per Day ({formData.preferredMealCount || 3})
            </label>
            <input
              type="range"
              min="2"
              max="6"
              value={formData.preferredMealCount || 3}
              onChange={(e) => handleInputChange('preferredMealCount', parseInt(e.target.value))}
              className="w-full h-2 bg-surface-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>2</span>
              <span>6</span>
            </div>
          </div>

          {/* Cooking Time */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Cooking Time Preference</label>
            <select
              value={formData.cookingTime || 'medium'}
              onChange={(e) => handleInputChange('cookingTime', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="quick">Quick (15-30 mins)</option>
              <option value="medium">Medium (30-60 mins)</option>
              <option value="elaborate">Elaborate (60+ mins)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || macroTotal !== 100}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Icon name="Save" className="w-4 h-4" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MealPreferences;