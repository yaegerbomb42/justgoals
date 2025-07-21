import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMeals } from '../../../context/MealsContext';
import Icon from '../../../components/ui/Icon';
import DayMealCard from './DayMealCard';

const MealPlanView = ({ currentWeekPlan, mealPreferences }) => {
  const { markMealCompleted } = useMeals();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [weekDays, setWeekDays] = useState([]);

  useEffect(() => {
    generateWeekDays();
  }, []);

  const generateWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }
    setWeekDays(days);
  };

  const handleMealCompletion = async (mealId, date, completed) => {
    try {
      await markMealCompleted(mealId, date, completed);
    } catch (error) {
      console.error('Error marking meal completion:', error);
    }
  };

  const getSelectedDayData = () => {
    if (!currentWeekPlan || !weekDays[selectedDay]) return null;
    
    const selectedDate = weekDays[selectedDay].date.toISOString().split('T')[0];
    return currentWeekPlan.days?.find(day => day.date === selectedDate) || {
      date: selectedDate,
      meals: []
    };
  };

  const selectedDayData = getSelectedDayData();

  if (!currentWeekPlan) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <Icon name="Calendar" className="w-16 h-16 mx-auto text-text-secondary mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Meal Plan This Week</h3>
        <p className="text-text-secondary mb-6">
          You don't have a meal plan for this week yet. Let our AI assistant create one for you!
        </p>
        <button
          onClick={() => setActiveTab?.('ai')}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Create Meal Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Week of {weekDays[0]?.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </h3>
          <div className="flex items-center space-x-2 text-text-secondary">
            <Icon name="Calendar" className="w-4 h-4" />
            <span className="text-sm">Click a day to see meals</span>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`p-3 rounded-lg transition-all duration-200 ${
                selectedDay === index
                  ? 'bg-primary text-white shadow-lg scale-105'
                  : day.isToday
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
              }`}
            >
              <div className="text-xs font-medium mb-1">{day.dayName}</div>
              <div className="text-lg font-bold">{day.dayNumber}</div>
              {day.isToday && (
                <div className="text-xs mt-1 opacity-75">Today</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Meals */}
      {selectedDayData && (
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-text-primary">
              {weekDays[selectedDay]?.dayName} Meals
            </h3>
            <div className="text-sm text-text-secondary">
              {selectedDayData.meals?.length || 0} meals planned
            </div>
          </div>

          {selectedDayData.meals?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDayData.meals.map((meal, index) => (
                <DayMealCard
                  key={`${meal.id}-${selectedDay}`}
                  meal={meal}
                  date={selectedDayData.date}
                  onMarkCompleted={handleMealCompletion}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <Icon name="UtensilsCrossed" className="w-12 h-12 mx-auto text-text-secondary mb-3" />
              <h4 className="text-lg font-medium text-text-primary mb-2">No Meals Planned</h4>
              <p className="text-text-secondary mb-4">
                No meals are planned for {weekDays[selectedDay]?.dayName}
              </p>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
                Add Meal
              </button>
            </div>
          )}

          {/* Daily Progress */}
          {selectedDayData.meals?.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h4 className="text-lg font-medium text-text-primary mb-4">Daily Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">
                    {selectedDayData.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)}
                  </div>
                  <div className="text-sm text-text-secondary">Calories</div>
                  <div className="text-xs text-text-secondary">
                    / {mealPreferences.dailyCalories} goal
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {selectedDayData.meals.reduce((sum, meal) => sum + (meal.macros?.protein || 0), 0)}g
                  </div>
                  <div className="text-sm text-text-secondary">Protein</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {selectedDayData.meals.reduce((sum, meal) => sum + (meal.macros?.carbs || 0), 0)}g
                  </div>
                  <div className="text-sm text-text-secondary">Carbs</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {selectedDayData.meals.reduce((sum, meal) => sum + (meal.macros?.fat || 0), 0)}g
                  </div>
                  <div className="text-sm text-text-secondary">Fat</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default MealPlanView;