import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const ProductivityHeatmap = ({ data = [] }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('productivity'); // productivity, mood, focus

  // Calculate color intensity based on value
  const getColorIntensity = (value, maxValue) => {
    if (value === 0) return 'bg-surface-600';
    const intensity = Math.min(value / maxValue, 1);
    if (intensity < 0.2) return 'bg-success/20';
    if (intensity < 0.4) return 'bg-success/40';
    if (intensity < 0.6) return 'bg-success/60';
    if (intensity < 0.8) return 'bg-success/80';
    return 'bg-success';
  };

  // Get mood color based on mood value (1-5 scale)
  const getMoodColor = (mood) => {
    if (!mood) return 'bg-surface-600';
    if (mood <= 1) return 'bg-error';
    if (mood <= 2) return 'bg-warning';
    if (mood <= 3) return 'bg-accent';
    if (mood <= 4) return 'bg-success';
    return 'bg-primary';
  };

  // Get focus color based on focus hours
  const getFocusColor = (hours, maxHours) => {
    if (hours === 0) return 'bg-surface-600';
    const intensity = Math.min(hours / maxHours, 1);
    if (intensity < 0.2) return 'bg-primary/20';
    if (intensity < 0.4) return 'bg-primary/40';
    if (intensity < 0.6) return 'bg-primary/60';
    if (intensity < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { weeks: [], maxValue: 0, maxHours: 0 };

    const maxValue = Math.max(...data.map(d => d.value));
    const maxHours = Math.max(...data.map(d => d.focusTime));
    const maxMood = 5; // Assuming 1-5 scale

    // Group data by weeks
    const weeks = [];
    let currentWeek = [];
    let currentWeekStart = null;

    data.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 || currentWeekStart === null) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [];
        currentWeekStart = date;
      }

      currentWeek.push({
        ...day,
        date: date,
        dayOfWeek: dayOfWeek,
        productivityColor: getColorIntensity(day.value, maxValue),
        moodColor: getMoodColor(day.mood),
        focusColor: getFocusColor(day.focusTime, maxHours)
      });
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxValue, maxHours, maxMood };
  }, [data]);

  const selectedDayData = selectedDate ? data.find(d => d.date === selectedDate) : null;

  if (!data || data.length === 0) {
    return <div className="mb-4 p-2 bg-warning/10 border border-warning/20 rounded text-warning">No heatmap data available.</div>;
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 bg-surface-700 rounded-lg p-1">
          {[
            { id: 'productivity', label: 'Productivity', icon: 'TrendingUp' },
            { id: 'mood', label: 'Mood', icon: 'Heart' },
            { id: 'focus', label: 'Focus Time', icon: 'Clock' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-body-medium transition-colors ${
                viewMode === mode.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name={mode.icon} size={14} />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex space-x-1">
              {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                <div
                  key={intensity}
                  className={`w-3 h-3 rounded ${
                    viewMode === 'productivity' ? getColorIntensity(intensity * processedData.maxValue, processedData.maxValue) :
                    viewMode === 'mood' ? getMoodColor(intensity * 5) :
                    getFocusColor(intensity * processedData.maxHours, processedData.maxHours)
                  }`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
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
            {processedData.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex">
                {/* Week label */}
                <div className="w-8 text-xs text-text-secondary flex items-center justify-end pr-2">
                  {week[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                
                {/* Days */}
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayData = week.find(d => d.dayOfWeek === dayIndex);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-8 h-8 rounded-sm border border-surface-600 cursor-pointer transition-all hover:scale-110 ${
                        dayData ? 
                          viewMode === 'productivity' ? dayData.productivityColor :
                          viewMode === 'mood' ? dayData.moodColor :
                          dayData.focusColor
                        : 'bg-surface-600'
                      } ${selectedDate === dayData?.date ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      onClick={() => setSelectedDate(dayData?.date || null)}
                      title={dayData ? `${dayData.date.toLocaleDateString()}: ${dayData.value} points` : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayData && (
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-body-medium text-text-primary mb-3">
            {selectedDayData.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-heading-bold text-success">
                {selectedDayData.value}
              </div>
              <div className="text-xs text-text-secondary">Productivity Points</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-heading-bold text-primary">
                {selectedDayData.focusTime.toFixed(1)}h
              </div>
              <div className="text-xs text-text-secondary">Focus Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-heading-bold text-accent">
                {selectedDayData.milestones}
              </div>
              <div className="text-xs text-text-secondary">Milestones</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-heading-bold text-warning">
                {selectedDayData.activities}
              </div>
              <div className="text-xs text-text-secondary">Activities</div>
            </div>
          </div>

          {selectedDayData.mood && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Mood Rating</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Icon
                      key={rating}
                      name="Star"
                      size={16}
                      className={rating <= selectedDayData.mood ? 'text-warning fill-current' : 'text-surface-500'}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
        <h4 className="text-sm font-body-medium text-primary mb-2">Insights</h4>
        <div className="space-y-1 text-xs text-text-secondary">
          {processedData.maxValue > 0 && (
            <p>🔥 Your most productive day had {processedData.maxValue} points</p>
          )}
          {processedData.maxHours > 0 && (
            <p>⏰ You focused for up to {processedData.maxHours.toFixed(1)} hours in a day</p>
          )}
          <p>💡 Darker colors indicate higher activity levels</p>
          <p>📊 Click on any day to see detailed statistics</p>
        </div>
      </div>
    </div>
  );
};

export default ProductivityHeatmap; 