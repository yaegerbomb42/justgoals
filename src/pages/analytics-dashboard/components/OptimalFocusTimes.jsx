import React from 'react';
import Icon from '../../../components/AppIcon';

const OptimalFocusTimes = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="Clock" size={48} className="text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">No focus time data available</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.productivity - a.productivity);
  const topTimes = sortedData.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topTimes.map((timeSlot, index) => (
          <div
            key={timeSlot.hour}
            className="bg-surface-700 rounded-lg p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-body-medium text-primary">
                    {index + 1}
                  </span>
                </div>
                <span className="text-lg font-heading-semibold text-text-primary">
                  {timeSlot.hour}:00
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-body-medium text-success">
                  {timeSlot.productivity}%
                </div>
                <div className="text-xs text-text-secondary">
                  {timeSlot.sessions} sessions
                </div>
              </div>
            </div>
            <div className="w-full bg-surface-600 rounded-full h-2">
              <div
                className="bg-success h-2 rounded-full transition-all duration-300"
                style={{ width: `${timeSlot.productivity}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-surface-700 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-body-medium text-text-primary mb-2">Recommendation</h4>
        <p className="text-sm text-text-secondary">
          Your most productive hours are {topTimes[0]?.hour}:00 with {topTimes[0]?.productivity}% productivity. 
          Try to schedule your most important tasks during these peak hours.
        </p>
      </div>
    </div>
  );
};

export default OptimalFocusTimes; 