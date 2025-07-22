import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMeals } from '../../../context/MealsContext';
import Icon from '../../../components/ui/Icon';

const MealPreferences = ({ preferences }) => {
  const { updateMealPreferences } = useMeals();
  const [formData, setFormData] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMacroChange = (macro, value) => {
    const numValue = parseInt(value) || 0;
    const otherMacros = Object.keys(formData.macroTargets).filter(key => key !== macro);
    const otherTotal = otherMacros.reduce((sum, key) => sum + formData.macroTargets[key], 0);
    
    if (numValue + otherTotal <= 100) {
      setFormData(prev => ({
        ...prev,
        macroTargets: {
          ...prev.macroTargets,
          [macro]: numValue
        }
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: array
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMealPreferences(formData);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const macroTotal = Object.values(formData.macroTargets || {}).reduce((sum, val) => sum + val, 0);

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
          <span>Macro Targets</span>
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