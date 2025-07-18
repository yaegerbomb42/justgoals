import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const ProductivityHeatmap = ({ data = [] }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  // Group data by week and day
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { weeks: [], maxValue: 0 };
    // Sort by date ascending
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const maxValue = Math.max(...sorted.map(d => d.value || 0));
    // Group into weeks (Sun-Sat)
    const weeks = [];
    let week = Array(7).fill(null);
    sorted.forEach((d) => {
      const dateObj = new Date(d.date);
      const dayOfWeek = dateObj.getDay();
      week[dayOfWeek] = { ...d, date: dateObj };
      if (dayOfWeek === 6) {
        weeks.push(week);
        week = Array(7).fill(null);
      }
    });
    if (week.some(day => day !== null)) weeks.push(week);
    return { weeks, maxValue };
  }, [data]);

  const getColor = (value, max) => {
    if (!value || max === 0) return 'bg-surface-600';
    const pct = value / max;
    if (pct < 0.2) return 'bg-success/20';
    if (pct < 0.4) return 'bg-success/40';
    if (pct < 0.6) return 'bg-success/60';
    if (pct < 0.8) return 'bg-success/80';
    return 'bg-success';
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Day labels */}
          <div className="flex mb-2">
            <div className="w-8"></div>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="w-8 text-center text-xs text-text-secondary">
                {day}
              </div>
            ))}
          </div>
          {/* Heatmap */}
          <div className="space-y-1">
            {processedData.weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex">
                <div className="w-8 text-xs text-text-secondary flex items-center justify-end pr-2">
                  {week.find(d => d)?.date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || ''}
                </div>
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`w-8 h-8 rounded-sm border border-surface-600 cursor-pointer transition-all hover:scale-110 ${
                      day ? getColor(day.value, processedData.maxValue) : 'bg-surface-600'
                    } ${selectedDay?.date?.toDateString() === day?.date?.toDateString() ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => day ? setSelectedDay(day) : null}
                    title={day ? `${day.date.toLocaleDateString()}: ${day.value} points` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-surface-700 rounded-lg border border-border flex items-center space-x-4">
          <Icon name="Calendar" size={20} className="text-primary" />
          <div>
            <div className="text-sm text-text-primary font-body-medium">
              {selectedDay.date.toLocaleDateString()} - {selectedDay.value} points
            </div>
            {/* Add more details if available */}
          </div>
          <button className="ml-auto text-xs text-text-secondary hover:text-error" onClick={() => setSelectedDay(null)}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductivityHeatmap; 