import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/ui/Icon';

const DayMealCard = ({ meal, date, onMarkCompleted }) => {
  const [isCompleted, setIsCompleted] = useState(meal.completed || false);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleCompleted = async () => {
    const newCompletedState = !isCompleted;
    setIsCompleted(newCompletedState);
    try {
      await onMarkCompleted(meal.id, date, newCompletedState);
    } catch (error) {
      console.error('Error updating meal completion:', error);
      setIsCompleted(!newCompletedState); // Revert on error
    }
  };

  const getMealTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'breakfast': return 'Sunrise';
      case 'lunch': return 'Sun';
      case 'dinner': return 'Moon';
      case 'snack': return 'Apple';
      default: return 'UtensilsCrossed';
    }
  };

  const getMealTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'breakfast': return 'text-yellow-500';
      case 'lunch': return 'text-orange-500';
      case 'dinner': return 'text-purple-500';
      case 'snack': return 'text-green-500';
      default: return 'text-text-secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-surface border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
        isCompleted ? 'bg-green-50 border-green-200' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon 
            name={getMealTypeIcon(meal.type)} 
            className={`w-5 h-5 ${getMealTypeColor(meal.type)}`} 
          />
          <div>
            <h4 className="font-semibold text-text-primary">{meal.title}</h4>
            <p className="text-sm text-text-secondary capitalize">{meal.type}</p>
          </div>
        </div>
        
        <button
          onClick={handleToggleCompleted}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-primary hover:text-primary'
          }`}
        >
          {isCompleted && <Icon name="Check" className="w-3 h-3" />}
        </button>
      </div>

      {/* Macros Summary */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Calories:</span>
          <span className="font-medium text-text-primary">{meal.calories || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Protein:</span>
          <span className="font-medium text-green-600">{meal.macros?.protein || 0}g</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Carbs:</span>
          <span className="font-medium text-yellow-600">{meal.macros?.carbs || 0}g</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Fat:</span>
          <span className="font-medium text-blue-600">{meal.macros?.fat || 0}g</span>
        </div>
      </div>

      {/* Prep Time */}
      {meal.prepTime && (
        <div className="flex items-center space-x-2 mb-3 text-sm text-text-secondary">
          <Icon name="Clock" className="w-4 h-4" />
          <span>{meal.prepTime} mins</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 px-3 py-2 text-sm bg-surface-700 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
        
        {meal.instructions && (
          <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-700 rounded-lg transition-colors">
            <Icon name="ExternalLink" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border"
        >
          {/* Ingredients */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-text-primary mb-2">Ingredients:</h5>
              <ul className="text-sm text-text-secondary space-y-1">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {meal.instructions && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-text-primary mb-2">Instructions:</h5>
              <div className="text-sm text-text-secondary">
                {typeof meal.instructions === 'string' ? (
                  <p>{meal.instructions}</p>
                ) : (
                  <ol className="list-decimal list-inside space-y-1">
                    {meal.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {meal.notes && (
            <div className="p-3 bg-surface-700 rounded-lg">
              <h5 className="text-sm font-medium text-text-primary mb-1">Notes:</h5>
              <p className="text-sm text-text-secondary">{meal.notes}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DayMealCard;