import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const ProductivityHeatmap = ({ data = [] }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('productivity');

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { weeks: [], maxValues: {}, stats: {} };
    
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const stats = {
      totalDays: sorted.length,
      activeDays: sorted.filter(d => (d.goals || 0) + (d.focus || 0) + (d.habits || 0) > 0).length,
      avgGoals: sorted.reduce((sum, d) => sum + (d.goals || 0), 0) / sorted.length,
      avgFocus: sorted.reduce((sum, d) => sum + (d.focus || 0), 0) / sorted.length,
      avgHabits: sorted.reduce((sum, d) => sum + (d.habits || 0), 0) / sorted.length,
    };
    
    const maxValues = {
      productivity: Math.max(1, ...sorted.map(d => (d.goals || 0) + (d.focus || 0) + (d.habits || 0))),
      goals: Math.max(1, ...sorted.map(d => d.goals || 0)),
      focus: Math.max(1, ...sorted.map(d => Math.round((d.focus || 0) * 60))),
      habits: Math.max(1, ...sorted.map(d => d.habits || 0)),
    };
    
    const weeks = [];
    let week = Array(7).fill(null);
    
    sorted.forEach((d) => {
      const dateObj = new Date(d.date);
      const dayOfWeek = dateObj.getDay();
      week[dayOfWeek] = { 
        ...d, 
        date: dateObj,
        totalActivity: (d.goals || 0) + (d.focus || 0) + (d.habits || 0)
      };
      
      if (dayOfWeek === 6) {
        weeks.push(week);
        week = Array(7).fill(null);
      }
    });
    
    if (week.some(day => day !== null)) weeks.push(week);
    
    return { weeks: weeks.slice(-12), maxValues, stats };
  }, [data]);

  const getColorIntensity = (value, max) => {
    if (!value || max === 0) return 0;
    return Math.min(Math.sqrt(value / max), 1);
  };

  const getCellColor = (day, intensity) => {
    if (!day || intensity === 0) {
      return 'bg-slate-800 border-slate-700';
    }
    
    const colorMaps = {
      productivity: [
        'bg-blue-900/30 border-blue-800/50',
        'bg-blue-800/40 border-blue-700/60', 
        'bg-blue-700/50 border-blue-600/70',
        'bg-blue-600/60 border-blue-500/80',
        'bg-blue-500/70 border-blue-400/90',
        'bg-blue-400/80 border-blue-300',
        'bg-blue-300/90 border-blue-200',
      ],
      goals: [
        'bg-green-900/30 border-green-800/50',
        'bg-green-800/40 border-green-700/60',
        'bg-green-700/50 border-green-600/70', 
        'bg-green-600/60 border-green-500/80',
        'bg-green-500/70 border-green-400/90',
        'bg-green-400/80 border-green-300',
        'bg-green-300/90 border-green-200',
      ],
      habits: [
        'bg-purple-900/30 border-purple-800/50',
        'bg-purple-800/40 border-purple-700/60',
        'bg-purple-700/50 border-purple-600/70',
        'bg-purple-600/60 border-purple-500/80', 
        'bg-purple-500/70 border-purple-400/90',
        'bg-purple-400/80 border-purple-300',
        'bg-purple-300/90 border-purple-200',
      ],
      focus: [
        'bg-orange-900/30 border-orange-800/50',
        'bg-orange-800/40 border-orange-700/60',
        'bg-orange-700/50 border-orange-600/70',
        'bg-orange-600/60 border-orange-500/80',
        'bg-orange-500/70 border-orange-400/90', 
        'bg-orange-400/80 border-orange-300',
        'bg-orange-300/90 border-orange-200',
      ]
    };
    
    const colorArray = colorMaps[viewMode] || colorMaps.productivity;
    const colorIndex = Math.floor(intensity * (colorArray.length - 1));
    return colorArray[colorIndex];
  };

  const getValue = (day) => {
    if (!day) return 0;
    switch (viewMode) {
      case 'goals': return day.goals || 0;
      case 'habits': return day.habits || 0;
      case 'focus': return Math.round((day.focus || 0) * 60);
      default: return day.totalActivity || 0;
    }
  };

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Activity Heatmap</h3>
        <div className="flex items-center gap-2">
          {[
            { key: 'productivity', label: 'All' },
            { key: 'goals', label: 'Goals' },
            { key: 'habits', label: 'Habits' },
            { key: 'focus', label: 'Focus' }
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode.key
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-surface-300 text-text-secondary hover:bg-surface-400'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-4 bg-surface-300 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-text-primary">
            {processedData.stats.activeDays || 0}
          </div>
          <div className="text-xs text-text-secondary">Active Days</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-500">
            {Math.round(processedData.stats.avgGoals || 0)}
          </div>
          <div className="text-xs text-text-secondary">Avg Goals</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-500">
            {Math.round(processedData.stats.avgHabits || 0)}
          </div>
          <div className="text-xs text-text-secondary">Avg Habits</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-500">
            {Math.round((processedData.stats.avgFocus || 0) * 60)}m
          </div>
          <div className="text-xs text-text-secondary">Avg Focus</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map((day, i) => (
            <div key={i} className="text-xs text-text-secondary text-center font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {processedData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const value = getValue(day);
                const maxValue = processedData.maxValues[viewMode] || 1;
                const intensity = getColorIntensity(value, maxValue);
                const colorClass = getCellColor(day, intensity);
                
                return (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`relative h-8 w-full rounded border cursor-pointer transition-all duration-200 ${colorClass} hover:scale-110 hover:z-10 hover:shadow-lg`}
                    onClick={() => setSelectedDay(day)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {day && value > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {value > 99 ? '99+' : value}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded border ${getCellColor({ [viewMode]: i + 1 }, i / 6)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-surface-300 rounded-lg border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-text-primary">
              {selectedDay.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-text-secondary hover:text-text-primary"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-700">{selectedDay.goals || 0}</div>
              <div className="text-xs text-green-600">Goals</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-700">{selectedDay.habits || 0}</div>
              <div className="text-xs text-purple-600">Habits</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-700">
                {Math.round((selectedDay.focus || 0) * 60)}m
              </div>
              <div className="text-xs text-orange-600">Focus Time</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-700">{selectedDay.milestones || 0}</div>
              <div className="text-xs text-blue-600">Milestones</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductivityHeatmap;
