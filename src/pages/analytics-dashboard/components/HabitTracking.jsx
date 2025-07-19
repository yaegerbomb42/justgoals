import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const defaultHabits = [
  { id: '1', name: 'Drink Water', streak: 0, maxStreak: 0, lastCompleted: null },
  { id: '2', name: 'Read 10 min', streak: 0, maxStreak: 0, lastCompleted: null },
];

const getToday = () => new Date().toISOString().split('T')[0];

const HabitTracking = () => {
  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem('user_habits');
      return saved ? JSON.parse(saved) : defaultHabits;
    } catch {
      return defaultHabits;
    }
  });
  const [newHabit, setNewHabit] = useState('');

  useEffect(() => {
    localStorage.setItem('user_habits', JSON.stringify(habits));
  }, [habits]);

  const markHabitDone = (habitId) => {
    setHabits(habits => habits.map(habit => {
      if (habit.id !== habitId) return habit;
      const today = getToday();
      if (habit.lastCompleted === today) return habit; // Already done today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = habit.lastCompleted === yesterday.toISOString().split('T')[0];
      const newStreak = wasYesterday ? habit.streak + 1 : 1;
      return {
        ...habit,
        streak: newStreak,
        maxStreak: Math.max(habit.maxStreak || 0, newStreak),
        lastCompleted: today
      };
    }));
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setHabits([...habits, { id: Date.now().toString(), name: newHabit.trim(), streak: 0, maxStreak: 0, lastCompleted: null }]);
    setNewHabit('');
  };

  const removeHabit = (habitId) => {
    setHabits(habits => habits.filter(h => h.id !== habitId));
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-heading-bold text-primary text-center mb-6">Habits</h1>
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
        <input
          type="text"
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          placeholder="Add a new habit..."
          className="flex-1 px-4 py-2 rounded border border-border bg-surface-700 text-text-primary"
        />
        <button
          onClick={addHabit}
          className="px-4 py-2 bg-primary text-white rounded font-bold hover:bg-primary/80 transition"
        >
          Add
        </button>
      </div>
      {habits.length === 0 && (
        <div className="text-center text-text-secondary mb-6">No habits yet. Add one above!</div>
      )}
      <div className="space-y-6">
        {habits.map(habit => (
          <div key={habit.id} className="bg-surface-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => markHabitDone(habit.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 ${habit.lastCompleted === getToday() ? 'bg-success text-white border-success' : 'bg-surface-600 text-success border-border hover:border-success'}`}
                title={habit.lastCompleted === getToday() ? 'Done for today!' : 'Mark as done'}
              >
                {habit.lastCompleted === getToday() ? <Icon name="Check" size={20} /> : <Icon name="Circle" size={20} />}
              </button>
              <span className="text-lg font-body-medium text-text-primary">{habit.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Streak chain */}
              <div className="flex items-center gap-1">
                {[...Array(Math.max(1, habit.streak))].map((_, i) => (
                  <span key={i} className="w-4 h-4 bg-warning rounded-full inline-block" title="Streak" />
                ))}
              </div>
              <span className="ml-2 text-warning font-bold">{habit.streak}🔥</span>
              <span className="ml-2 text-xs text-text-secondary">Max: {habit.maxStreak}</span>
              <button
                onClick={() => removeHabit(habit.id)}
                className="ml-4 text-error hover:text-error/80 text-xs"
                title="Remove habit"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitTracking; 