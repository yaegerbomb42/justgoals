import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const ProductivityHeatmap = ({ data = [] }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('productivity'); // productivity, goals, habits

  // Process data for meaningful activity tracking
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { weeks: [], maxValues: {} };
    
    // Sort by date ascending
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate max values for normalization
    const maxValues = {
      productivity: Math.max(1, ...sorted.map(d => (d.goals || 0) + (d.focus || 0) + (d.habits || 0))),
      goals: Math.max(1, ...sorted.map(d => d.goals || 0)),
      focus: Math.max(1, ...sorted.map(d => d.focus || 0)),
      habits: Math.max(1, ...sorted.map(d => d.habits || 0)),
      milestones: Math.max(1, ...sorted.map(d => d.milestones || 0))
    };
    
    // Group into weeks (Sun-Sat)
    const weeks = [];
    let week = Array(7).fill(null);
    
    sorted.forEach((d) => {
      const dateObj = new Date(d.date);
      const dayOfWeek = dateObj.getDay();
      week[dayOfWeek] = { 
        ...d, 
        date: dateObj,
        totalActivity: (d.goals || 0) + (d.focus || 0) + (d.habits || 0) + (d.milestones || 0)
      };
      
      if (dayOfWeek === 6) {
        weeks.push(week);
        week = Array(7).fill(null);
      }
    });
    
    if (week.some(day => day !== null)) weeks.push(week);
    
    return { weeks, maxValues };
  }, [data]);

  // Color intensity function
  const getColorIntensity = (value, max) => {
    if (!value || max === 0) return 0;
    return Math.min(value / max, 1);
  };

  // Get color based on view mode and intensity
  const getCellColor = (day, intensity) => {
    if (!day || intensity === 0) return 'rgb(15, 23, 42)'; // dark slate
    
    const colors = {
      productivity: {
        light: [59, 130, 246], // blue
        dark: [29, 78, 216]
      },
      goals: {
        light: [34, 197, 94], // green  
        dark: [21, 128, 61]
      },
      habits: {
        light: [168, 85, 247], // purple
        dark: [124, 58, 237]
      }
    };
    
    const colorSet = colors[viewMode] || colors.productivity;
    const [r, g, b] = colorSet.light;
    const [dr, dg, db] = colorSet.dark;
    
    // Interpolate between light and dark based on intensity
    const finalR = Math.round(r + (dr - r) * intensity);
    const finalG = Math.round(g + (dg - g) * intensity);
    const finalB = Math.round(b + (db - b) * intensity);
    
    return `rgb(${finalR}, ${finalG}, ${finalB})`;
  };

  // Get value for current view mode
  const getValue = (day) => {
    if (!day) return 0;
    switch (viewMode) {
      case 'goals': return day.goals || 0;
      case 'habits': return day.habits || 0;
      default: return day.totalActivity || 0;
    }
  };

  // Get tooltip text
  const getTooltip = (day) => {
    if (!day) return '';
    return `${day.date.toLocaleDateString()}\n` +
           `Goals: ${day.goals || 0} completed\n` +
           `Focus: ${day.focus || 0} hours\n` +
           `Habits: ${day.habits || 0} tracked\n` +
           `Milestones: ${day.milestones || 0} reached\n` +
           `Total Activity: ${day.totalActivity || 0}`;
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="Calendar" size={48} className="text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">No activity data available</p>
        <p className="text-text-secondary text-sm mt-2">
          Start completing goals, focus sessions, and tracking habits to see your activity pattern!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* View Mode Selector */}
      <div className="flex space-x-2 mb-4">
        {[
          { id: 'productivity', label: 'Overall', icon: 'TrendingUp', color: 'blue' },
          { id: 'goals', label: 'Goals', icon: 'Target', color: 'green' },
          { id: 'habits', label: 'Habits', icon: 'Repeat', color: 'purple' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === mode.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-700 text-text-secondary hover:bg-surface-600'
            }`}
          >
            <Icon name={mode.icon} size={16} />
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
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