import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const MacroSlider = ({ macroTargets, dailyCalories = 2000, onChange }) => {
  const [isDragging, setIsDragging] = useState(null);
  const [localValues, setLocalValues] = useState(macroTargets);
  const sliderRef = useRef(null);

  useEffect(() => {
    setLocalValues(macroTargets);
  }, [macroTargets]);

  const handleMouseDown = (macro) => (e) => {
    setIsDragging(macro);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));

    if (isDragging === 'protein') {
      const protein = Math.round(Math.min(percentage, 80)); // Max 80% protein
      const remaining = 100 - protein;
      const carbsFatRatio = localValues.carbs / (localValues.carbs + localValues.fat) || 0.6;
      
      const newValues = {
        protein,
        carbs: Math.round(Math.max(5, remaining * carbsFatRatio)),
        fat: Math.round(Math.max(5, remaining * (1 - carbsFatRatio)))
      };
      
      // Ensure total is exactly 100
      const total = newValues.protein + newValues.carbs + newValues.fat;
      if (total !== 100) {
        const diff = 100 - total;
        if (newValues.carbs >= newValues.fat) {
          newValues.carbs += diff;
        } else {
          newValues.fat += diff;
        }
      }
      
      setLocalValues(newValues);
    } else if (isDragging === 'fat') {
      const proteinWidth = (localValues.protein / 100) * rect.width;
      const fatStart = proteinWidth;
      const fatWidth = x - fatStart;
      const maxFatWidth = rect.width - proteinWidth;
      const fatPercentage = Math.round(Math.max(5, Math.min(70, (fatWidth / rect.width) * 100)));
      
      const newValues = {
        protein: localValues.protein,
        fat: fatPercentage,
        carbs: Math.round(Math.max(5, 100 - localValues.protein - fatPercentage))
      };
      
      // Ensure total is exactly 100
      const total = newValues.protein + newValues.carbs + newValues.fat;
      if (total !== 100) {
        const diff = 100 - total;
        newValues.carbs += diff;
        newValues.carbs = Math.max(5, newValues.carbs);
      }
      
      setLocalValues(newValues);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onChange(localValues);
      setIsDragging(null);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, localValues]);

  const getGramsFromPercentage = (percentage, totalCalories = 2000) => {
    const caloriesPerGram = {
      protein: 4,
      carbs: 4,
      fat: 9
    };
    
    return Object.fromEntries(
      Object.entries(percentage).map(([macro, percent]) => [
        macro,
        Math.round((totalCalories * (percent / 100)) / caloriesPerGram[macro])
      ])
    );
  };

  const grams = getGramsFromPercentage(localValues, dailyCalories);

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-text-primary mb-2">
        Macro Distribution (Protein / Carbs / Fat)
      </div>
      
      {/* Interactive Slider Bar */}
      <div 
        ref={sliderRef}
        className="relative h-12 bg-surface-200 rounded-lg overflow-hidden cursor-pointer"
        style={{ userSelect: 'none' }}
      >
        {/* Protein Section */}
        <motion.div
          layout
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm"
          style={{ width: `${localValues.protein}%` }}
          animate={{ width: `${localValues.protein}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <span className="text-xs font-bold">P: {localValues.protein}%</span>
        </motion.div>

        {/* Carbs Section */}
        <motion.div
          layout
          className="absolute top-0 h-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white font-semibold text-sm"
          style={{ 
            left: `${localValues.protein}%`, 
            width: `${localValues.carbs}%` 
          }}
          animate={{ 
            left: `${localValues.protein}%`, 
            width: `${localValues.carbs}%` 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <span className="text-xs font-bold">C: {localValues.carbs}%</span>
        </motion.div>

        {/* Fat Section */}
        <motion.div
          layout
          className="absolute top-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm"
          style={{ 
            left: `${localValues.protein + localValues.carbs}%`, 
            width: `${localValues.fat}%` 
          }}
          animate={{ 
            left: `${localValues.protein + localValues.carbs}%`, 
            width: `${localValues.fat}%` 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <span className="text-xs font-bold">F: {localValues.fat}%</span>
        </motion.div>

        {/* Draggable Dividers */}
        <div
          className="absolute top-0 w-1 h-full bg-white shadow-lg cursor-ew-resize z-10 hover:bg-blue-200 transition-colors"
          style={{ left: `${localValues.protein}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown('protein')}
        />
        
        <div
          className="absolute top-0 w-1 h-full bg-white shadow-lg cursor-ew-resize z-10 hover:bg-green-200 transition-colors"
          style={{ left: `${localValues.protein + localValues.carbs}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown('fat')}
        />
      </div>

      {/* Grams Display */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="font-semibold text-blue-700">Protein</div>
          <div className="text-lg font-bold text-blue-800">{grams.protein}g</div>
          <div className="text-xs text-blue-600">{localValues.protein}%</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="font-semibold text-green-700">Carbs</div>
          <div className="text-lg font-bold text-green-800">{grams.carbs}g</div>
          <div className="text-xs text-green-600">{localValues.carbs}%</div>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="font-semibold text-orange-700">Fat</div>
          <div className="text-lg font-bold text-orange-800">{grams.fat}g</div>
          <div className="text-xs text-orange-600">{localValues.fat}%</div>
        </div>
      </div>

      <div className="text-xs text-text-muted text-center">
        Drag the white dividers to adjust macro distribution • Based on {dailyCalories} calories
      </div>
    </div>
  );
};

export default MacroSlider;
