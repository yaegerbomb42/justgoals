import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const defaultHabits = [
  { id: '1', name: 'Drink Water', streak: 0, maxStreak: 0, lastCompleted: null, perDay: 8, checks: [] },
  { id: '2', name: 'Read 10 min', streak: 0, maxStreak: 0, lastCompleted: null, perDay: 1, checks: [] },
];

const getToday = () => new Date().toISOString().split('T')[0];
const getPastDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

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
  const [newPerDay, setNewPerDay] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const daysToShow = 14;
  const days = getPastDays(daysToShow);

  useEffect(() => {
    localStorage.setItem('user_habits', JSON.stringify(habits));
  }, [habits]);

  const markHabitCheck = (habitId, day, checkIdx) => {
    setHabits(habits => habits.map(habit => {
      if (habit.id !== habitId) return habit;
      const checks = habit.checks || [];
      const dayChecks = checks.find(c => c.day === day) || { day, done: Array(habit.perDay).fill(false) };
      const newDone = [...dayChecks.done];
      newDone[checkIdx] = !newDone[checkIdx];
      const updatedChecks = checks.filter(c => c.day !== day).concat({ day, done: newDone });
      // Update streak if today is fully done
      let streak = habit.streak;
      let maxStreak = habit.maxStreak || 0;
      let lastCompleted = habit.lastCompleted;
      if (day === getToday() && newDone.every(Boolean)) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = habit.lastCompleted === yesterday.toISOString().split('T')[0];
        streak = wasYesterday ? habit.streak + 1 : 1;
        maxStreak = Math.max(maxStreak, streak);
        lastCompleted = day;
      } else if (day === getToday() && !newDone.every(Boolean)) {
        // If unchecked today, reset streak if it was previously completed
        streak = habit.streak;
        lastCompleted = habit.lastCompleted;
      }
      return { ...habit, checks: updatedChecks, streak, maxStreak, lastCompleted };
    }));
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setHabits([...habits, { id: Date.now().toString(), name: newHabit.trim(), streak: 0, maxStreak: 0, lastCompleted: null, perDay: newPerDay, checks: [] }]);
    setNewHabit('');
    setNewPerDay(1);
  };

  const removeHabit = (habitId) => {
    setHabits(habits => habits.filter(h => h.id !== habitId));
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading-bold text-primary">Habits</h1>
        <Button iconName="Settings" variant="outline" onClick={() => setShowSettings(v => !v)}>
          Settings
        </Button>
      </div>
      {showSettings && (
        <div className="mb-6 p-4 bg-surface-700 rounded-lg border border-border">
          <h2 className="text-lg font-heading-medium mb-2">Add New Habit</h2>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              placeholder="Habit name..."
              className="flex-1 px-4 py-2 rounded border border-border bg-surface-800 text-text-primary"
            />
            <input
              type="number"
              min={1}
              max={24}
              value={newPerDay}
              onChange={e => setNewPerDay(Number(e.target.value))}
              className="w-20 px-2 py-2 rounded border border-border bg-surface-800 text-text-primary"
              placeholder="Per day"
            />
            <Button onClick={addHabit} variant="primary" iconName="Plus">Add</Button>
          </div>
          <div className="text-xs text-text-secondary mt-2">E.g., Water: 8, Reading: 1, Exercise: 2</div>
        </div>
      )}
      {habits.length === 0 && (
        <div className="text-center text-text-secondary mb-6">No habits yet. Add one above!</div>
      )}
      <div className="space-y-8">
        {habits.map(habit => (
          <div key={habit.id} className="bg-surface-700 rounded-xl p-6 flex flex-col gap-4 shadow-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg font-body-medium text-text-primary">{habit.name}</span>
                <span className="ml-2 text-warning font-bold">{habit.streak}🔥</span>
                <span className="ml-2 text-xs text-text-secondary">Max: {habit.maxStreak}</span>
                <Button iconName="Trash2" variant="ghost" size="sm" onClick={() => removeHabit(habit.id)} className="ml-2 text-error" />
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Repeat" size={18} className="text-accent" />
                <span className="text-xs text-text-secondary">{habit.perDay}x/day</span>
              </div>
            </div>
            {/* Streak Chain Calendar */}
            <div className="overflow-x-auto">
              <div className="flex gap-2">
                {days.map(day => {
                  const dayChecks = (habit.checks || []).find(c => c.day === day) || { day, done: Array(habit.perDay).fill(false) };
                  const allDone = dayChecks.done.every(Boolean);
                  return (
                    <div key={day} className={`flex flex-col items-center w-8 ${day === getToday() ? 'font-bold' : ''}`} title={day}>
                      <span className={`text-xs mb-1 ${allDone ? 'text-success' : 'text-text-secondary'}`}>{day.slice(5)}</span>
                      <div className="flex flex-col gap-1">
                        {dayChecks.done.map((checked, idx) => (
                          <button
                            key={idx}
                            onClick={() => markHabitCheck(habit.id, day, idx)}
                            className={`w-5 h-5 rounded-full border-2 ${checked ? 'bg-success border-success' : 'bg-surface-600 border-border hover:border-success'} transition`}
                            style={{ outline: day === getToday() && idx === 0 ? '2px solid #6366F1' : undefined }}
                          >
                            {checked && <Icon name="Check" size={12} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitTracking; 