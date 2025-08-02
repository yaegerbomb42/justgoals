import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMeals } from '../../../context/MealsContext';
import Icon from '../../../components/ui/Icon';
import SimpleMacroSlider from '../../../components/ui/SimpleMacroSlider';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Calculate macro total for validation
  const macroTotal = Math.round((formData.macroTargets?.protein || 0) + 
                     (formData.macroTargets?.carbs || 0) + 
                     (formData.macroTargets?.fat || 0));

  // Track changes to enable save button
  useEffect(() => {
    if (preferences && typeof preferences === 'object') {
      const currentData = JSON.stringify(formData);
      const originalData = JSON.stringify(preferences);
      setHasUnsavedChanges(currentData !== originalData);
    }
  }, [formData, preferences]);

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



  const handleMacroChange = (macro, value) => {
    try {
      const numValue = Math.round(parseInt(value) || 0);
      const currentTargets = formData.macroTargets || { protein: 25, carbs: 45, fat: 30 };
      
      // Get the other two macros
      const otherMacros = ['protein', 'carbs', 'fat'].filter(m => m !== macro);
      const remaining = 100 - numValue;
      
      // Calculate proportional distribution of remaining percentage
      const currentOthersTotal = otherMacros.reduce((sum, m) => sum + (currentTargets[m] || 0), 0);
      
      let newMacroTargets = { ...currentTargets, [macro]: numValue };
      
      if (currentOthersTotal > 0) {
        // Proportionally distribute the remaining percentage
        otherMacros.forEach(otherMacro => {
          const proportion = (currentTargets[otherMacro] || 0) / currentOthersTotal;
          newMacroTargets[otherMacro] = Math.max(5, Math.round(remaining * proportion));
        });
      } else {
        // Default distribution if others are 0
        if (macro !== 'protein') newMacroTargets.protein = Math.round(remaining * 0.25);
        if (macro !== 'carbs') newMacroTargets.carbs = Math.round(remaining * 0.45);
        if (macro !== 'fat') newMacroTargets.fat = Math.round(remaining * 0.30);
      }
      
      // Ensure total equals exactly 100
      const total = Object.values(newMacroTargets).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        const diff = 100 - total;
        // Add the difference to the largest macro (excluding the one being changed)
        const largestMacro = otherMacros.reduce((a, b) => 
          (newMacroTargets[a] || 0) > (newMacroTargets[b] || 0) ? a : b
        );
        newMacroTargets[largestMacro] = Math.max(5, (newMacroTargets[largestMacro] || 0) + diff);
      }
      
      setFormData(prev => ({
        ...prev,
        macroTargets: newMacroTargets
      }));
      
      if (onError) {
        onError(null);
      }
    } catch (error) {
      console.error('Error updating macro targets:', error);
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
    
    // Macro targets validation with more lenient bounds
    const macros = formData.macroTargets || {};
    const protein = Math.round(parseInt(macros.protein) || 0);
    const carbs = Math.round(parseInt(macros.carbs) || 0);
    const fat = Math.round(parseInt(macros.fat) || 0);
    
    if (protein < 5 || protein > 80) {
      validationErrors.push('Protein percentage must be between 5-80% (nutritionally safe range)');
    }
    
    if (carbs < 5 || carbs > 85) {
      validationErrors.push('Carbs percentage must be between 5-85% (nutritionally safe range)');
    }
    
    if (fat < 5 || fat > 70) {
      validationErrors.push('Fat percentage must be between 5-70% (nutritionally safe range)');
    }
    
    // Check if macros add up close to 100% (allow ±5% tolerance)
    const totalMacros = protein + carbs + fat;
    if (Math.abs(totalMacros - 100) > 5) {
      validationErrors.push(`Macro percentages total ${totalMacros}% - should be close to 100% (±5% tolerance)`);
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
        macroTargets: {
          protein: parseInt(formData.macroTargets?.protein) || 25,
          carbs: parseInt(formData.macroTargets?.carbs) || 45,
          fat: parseInt(formData.macroTargets?.fat) || 30
        },
        dietaryRestrictions: Array.isArray(formData.dietaryRestrictions) ? formData.dietaryRestrictions : [],
        allergens: Array.isArray(formData.allergens) ? formData.allergens : [],
        preferredMealCount: parseInt(formData.preferredMealCount) || 3,
        cookingTime: formData.cookingTime || 'medium',
        updatedAt: new Date().toISOString()
      };
      
      if (updateMealPreferences) {
        await updateMealPreferences(sanitizedData);
        setHasUnsavedChanges(false);
        if (onError) onError(null); // Clear any previous errors
        // Show success feedback
        console.log('Meal preferences saved successfully!');
      } else {
        throw new Error('Meal preferences service is not available');
      }
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
        
        <div className="space-y-6">
          {/* Visual Macro Distribution */}
          <div className="grid grid-cols-3 gap-4">
            {/* Protein */}
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="font-semibold text-green-700 mb-2">Protein</div>
              <div className="text-2xl font-bold text-green-800 mb-1">
                {Math.round(formData.macroTargets?.protein || 25)}%
              </div>
              <div className="text-sm text-green-600">
                {Math.round((formData.dailyCalories * (formData.macroTargets?.protein || 25) / 100) / 4)}g
              </div>
            </div>
            
            {/* Carbs */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="font-semibold text-yellow-700 mb-2">Carbs</div>
              <div className="text-2xl font-bold text-yellow-800 mb-1">
                {Math.round(formData.macroTargets?.carbs || 45)}%
              </div>
              <div className="text-sm text-yellow-600">
                {Math.round((formData.dailyCalories * (formData.macroTargets?.carbs || 45) / 100) / 4)}g
              </div>
            </div>
            
            {/* Fat */}
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-semibold text-blue-700 mb-2">Fat</div>
              <div className="text-2xl font-bold text-blue-800 mb-1">
                {Math.round(formData.macroTargets?.fat || 30)}%
              </div>
              <div className="text-sm text-blue-600">
                {Math.round((formData.dailyCalories * (formData.macroTargets?.fat || 30) / 100) / 9)}g
              </div>
            </div>
          </div>

          {/* Simple Sliders */}
          <div className="space-y-4">
            {/* Protein Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-green-600">Protein</label>
                <span className="text-sm font-bold text-green-600">
                  {Math.round(formData.macroTargets?.protein || 25)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="1"
                value={Math.round(formData.macroTargets?.protein || 25)}
                onChange={(e) => handleMacroChange('protein', e.target.value)}
                className="w-full h-3 bg-surface-300 rounded-lg appearance-none cursor-pointer slider-green"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((formData.macroTargets?.protein || 25) - 10) / 50 * 100}%, #e5e7eb ${((formData.macroTargets?.protein || 25) - 10) / 50 * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Carbs Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-yellow-600">Carbs</label>
                <span className="text-sm font-bold text-yellow-600">
                  {Math.round(formData.macroTargets?.carbs || 45)}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="70"
                step="1"
                value={Math.round(formData.macroTargets?.carbs || 45)}
                onChange={(e) => handleMacroChange('carbs', e.target.value)}
                className="w-full h-3 bg-surface-300 rounded-lg appearance-none cursor-pointer slider-yellow"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((formData.macroTargets?.carbs || 45) - 20) / 50 * 100}%, #e5e7eb ${((formData.macroTargets?.carbs || 45) - 20) / 50 * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {/* Fat Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-blue-600">Fat</label>
                <span className="text-sm font-bold text-blue-600">
                  {Math.round(formData.macroTargets?.fat || 30)}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="50"
                step="1"
                value={Math.round(formData.macroTargets?.fat || 30)}
                onChange={(e) => handleMacroChange('fat', e.target.value)}
                className="w-full h-3 bg-surface-300 rounded-lg appearance-none cursor-pointer slider-blue"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((formData.macroTargets?.fat || 30) - 15) / 35 * 100}%, #e5e7eb ${((formData.macroTargets?.fat || 30) - 15) / 35 * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </div>

          {/* Total Display */}
          <div className={`p-3 rounded-lg border text-center ${
            Math.abs(macroTotal - 100) <= 1 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-700'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              {Math.abs(macroTotal - 100) <= 1 ? (
                <Icon name="CheckCircle" className="w-4 h-4" />
              ) : (
                <Icon name="AlertTriangle" className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                Total: {macroTotal}% {Math.abs(macroTotal - 100) <= 1 ? '(Perfect!)' : '(Auto-adjusting others)'}
              </span>
            </div>
          </div>
        </div>
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
      <div className="flex justify-end space-x-3">
        {hasUnsavedChanges && (
          <div className="flex items-center text-sm text-orange-600">
            <Icon name="AlertCircle" className="w-4 h-4 mr-1" />
            You have unsaved changes
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving || (Math.abs(macroTotal - 100) > 10)}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          title={Math.abs(macroTotal - 100) > 10 ? `Macro total is ${macroTotal}% - please adjust to be closer to 100%` : ''}
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