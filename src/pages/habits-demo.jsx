import React from 'react';
import HabitTracking from './analytics-dashboard/components/HabitTracking';

// Demo page for testing habits without authentication
const HabitsDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      <HabitTracking />
    </div>
  );
};

export default HabitsDemo;