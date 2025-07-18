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

  // Color helpers for goals (green) and focus (blue)
  const getGoalColor = (value, max) => {
    if (!value || max === 0) return '#14532d'; // dark muted green
    const pct = value / max;
    if (pct < 0.2) return '#22c55e';
    if (pct < 0.4) return '#16a34a';
    if (pct < 0.6) return '#15803d';
    if (pct < 0.8) return '#166534';
    return '#052e16'; // darkest green
  };
  const getFocusColor = (value, max) => {
    if (!value || max === 0) return '#1e293b'; // dark muted blue
    const pct = value / max;
    if (pct < 0.2) return '#60a5fa';
    if (pct < 0.4) return '#2563eb';
    if (pct < 0.6) return '#1d4ed8';
    if (pct < 0.8) return '#1e40af';
    return '#0c1336'; // darkest blue
  };

  // Find max for each metric
  const maxGoals = Math.max(1, ...data.map(d => d.goals || 0));
  const maxFocus = Math.max(1, ...data.map(d => d.focus || 0));

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
                    className={`w-8 h-8 rounded-sm border border-surface-600 cursor-pointer transition-all hover:scale-110 relative ${
                      day ? '' : 'bg-surface-600'
                    } ${selectedDay?.date?.toDateString() === day?.date?.toDateString() ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => day ? setSelectedDay(day) : null}
                    title={day ? `${day.date.toLocaleDateString()}: Goals: ${day.goals}, Focus: ${day.focus}` : ''}
                  >
                    {day && (
                      <>
                        {/* Left: goals, Right: focus */}
                        <div style={{position:'absolute',left:0,top:0,bottom:0,width:'50%',background:getGoalColor(day.goals,maxGoals),borderTopLeftRadius:4,borderBottomLeftRadius:4}}></div>
                        <div style={{position:'absolute',right:0,top:0,bottom:0,width:'50%',background:getFocusColor(day.focus,maxFocus),borderTopRightRadius:4,borderBottomRightRadius:4}}></div>
                      </>
                    )}
                  </div>
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
              {selectedDay.date.toLocaleDateString()} - Goals: {selectedDay.goals}, Focus: {selectedDay.focus}
            </div>
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