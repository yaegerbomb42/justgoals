import React from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const SearchFilter = ({ 
  searchQuery, 
  onSearchChange, 
  selectedMood, 
  onMoodChange, 
  selectedGoal, 
  onGoalChange, 
  goals 
}) => {
  const moodOptions = [
    { value: 'all', label: 'All Moods', emoji: '🎭' },
    { value: 'excellent', label: 'Excellent', emoji: '🤩' },
    { value: 'good', label: 'Good', emoji: '😊' },
    { value: 'okay', label: 'Okay', emoji: '😐' },
    { value: 'bad', label: 'Bad', emoji: '😞' },
    { value: 'terrible', label: 'Terrible', emoji: '😢' }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" 
            />
            <Input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Mood Filter */}
        <div className="md:w-48">
          <select
            value={selectedMood}
            onChange={(e) => onMoodChange(e.target.value)}
            className="w-full px-4 py-2 bg-surface-700 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {moodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Goal Filter */}
        <div className="md:w-48">
          <select
            value={selectedGoal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="w-full px-4 py-2 bg-surface-700 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">🎯 All Goals</option>
            {goals.map(goal => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;