import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SimpleSlider = ({ value, min, max, onChange, label, color = '#3b82f6' }) => {
  const handleChange = (e) => {
    onChange(parseInt(e.target.value));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="text-sm font-bold text-text-primary">{value}%</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className="w-full h-3 bg-surface-300 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>
      <div className="text-xs text-text-secondary">
        {Math.round((value * 2000) / 100 / (label === 'Fat' ? 9 : 4))}g {label.toLowerCase()}
      </div>
    </div>
  );
};

const SimpleMacroSlider = ({ macroTargets, dailyCalories = 2000, onChange }) => {
  const [values, setValues] = useState({
    protein: 25,
    carbs: 45,
    fat: 30,
    ...macroTargets
  });

  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    setValues({
      protein: 25,
      carbs: 45,
      fat: 30,
      ...macroTargets
    });
  }, [macroTargets]);

  const adjustOthers = (changedMacro, newValue) => {
    setIsAdjusting(true);
    
    const others = ['protein', 'carbs', 'fat'].filter(m => m !== changedMacro);
    const remaining = 100 - newValue;
    const currentOthersTotal = others.reduce((sum, macro) => sum + values[macro], 0);
    
    if (currentOthersTotal === 0) {
      // Default distribution
      const newValues = { ...values, [changedMacro]: newValue };
      if (changedMacro !== 'protein') newValues.protein = Math.round(remaining * 0.25);
      if (changedMacro !== 'carbs') newValues.carbs = Math.round(remaining * 0.45);
      if (changedMacro !== 'fat') newValues.fat = Math.round(remaining * 0.30);
      
      // Ensure total is 100
      const total = newValues.protein + newValues.carbs + newValues.fat;
      if (total !== 100) {
        const diff = 100 - total;
        const largest = others.reduce((a, b) => newValues[a] > newValues[b] ? a : b);
        newValues[largest] += diff;
      }
      
      setValues(newValues);
      onChange(newValues);
    } else {
      // Proportionally adjust others
      const newValues = { ...values, [changedMacro]: newValue };
      others.forEach(macro => {
        const proportion = values[macro] / currentOthersTotal;
        newValues[macro] = Math.max(5, Math.round(remaining * proportion));
      });
      
      // Ensure total is 100
      const total = newValues.protein + newValues.carbs + newValues.fat;
      if (total !== 100) {
        const diff = 100 - total;
        const largest = others.reduce((a, b) => newValues[a] > newValues[b] ? a : b);
        newValues[largest] = Math.max(5, newValues[largest] + diff);
      }
      
      setValues(newValues);
      onChange(newValues);
    }
    
    setTimeout(() => setIsAdjusting(false), 100);
  };

  const total = values.protein + values.carbs + values.fat;

  return (
    <motion.div 
      className="space-y-6 p-6 bg-surface border border-border rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Macro Distribution</h3>
        <div className={`text-sm px-3 py-1 rounded-full ${
          Math.abs(total - 100) <= 1 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          Total: {total}%
        </div>
      </div>

      <div className="space-y-4">
        <SimpleSlider
          value={values.protein}
          min={10}
          max={50}
          onChange={(value) => adjustOthers('protein', value)}
          label="Protein"
          color="#10b981"
        />
        
        <SimpleSlider
          value={values.carbs}
          min={20}
          max={65}
          onChange={(value) => adjustOthers('carbs', value)}
          label="Carbs"
          color="#f59e0b"
        />
        
        <SimpleSlider
          value={values.fat}
          min={15}
          max={40}
          onChange={(value) => adjustOthers('fat', value)}
          label="Fat"
          color="#ef4444"
        />
      </div>

      {/* Visual representation */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="font-semibold text-green-700">Protein</div>
          <div className="text-lg font-bold text-green-800">
            {Math.round((values.protein * dailyCalories) / 100 / 4)}g
          </div>
          <div className="text-xs text-green-600">{values.protein}%</div>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="font-semibold text-yellow-700">Carbs</div>
          <div className="text-lg font-bold text-yellow-800">
            {Math.round((values.carbs * dailyCalories) / 100 / 4)}g
          </div>
          <div className="text-xs text-yellow-600">{values.carbs}%</div>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="font-semibold text-red-700">Fat</div>
          <div className="text-lg font-bold text-red-800">
            {Math.round((values.fat * dailyCalories) / 100 / 9)}g
          </div>
          <div className="text-xs text-red-600">{values.fat}%</div>
        </div>
      </div>

      <div className="text-xs text-text-muted text-center">
        Adjust sliders to change macro distribution • Based on {dailyCalories} calories
      </div>
    </motion.div>
  );
};

export default SimpleMacroSlider;
