import React from 'react';

const OptimalFocusTimes = ({ data = {} }) => {
  if (!data || !data.hourlyData || data.hourlyData.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No focus session data yet. Start using the app to see your optimal times!</p>
      </div>
    );
  }

  const maxProductivity = Math.max(...data.hourlyData.map(d => d.avgProductivity));

  return (
    <div className="space-y-6">
      {/* Hourly Productivity Chart */}
      <div>
        <h4 className="text-sm font-body-medium text-text-primary mb-3">Hourly Productivity</h4>
        <div className="flex items-end space-x-1 h-32">
          {data.hourlyData.map((hourData, hour) => (
            <div key={hour} className="flex-1 flex flex-col items-center">
              <div
                className={`
                  w-full rounded-t-sm transition-all duration-300 hover:opacity-80
                  ${hourData.avgProductivity > 0 ? 'bg-primary' : 'bg-surface-700'}
                `}
                style={{ 
                  height: `${maxProductivity > 0 ? (hourData.avgProductivity / maxProductivity) * 100 : 0}%` 
                }}
                title={`${hour}:00 - ${hourData.sessions} sessions, ${hourData.avgProductivity.toFixed(1)} productivity`}
              />
              {hour % 3 === 0 && (
                <span className="text-xs text-text-secondary mt-1">{hour}:00</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Productive Hours */}
      {data.topHours && data.topHours.length > 0 && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Most Productive Hours</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.topHours.map((hourData, index) => (
              <div key={hourData.hour} className="bg-surface-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-heading-semibold text-primary">
                    {hourData.hour}:00
                  </span>
                  <span className="text-xs text-text-secondary">
                    #{index + 1}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Sessions:</span>
                    <span className="text-text-primary">{hourData.sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Avg Duration:</span>
                    <span className="text-text-primary">{hourData.avgDuration.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Productivity:</span>
                    <span className="text-text-primary">{hourData.avgProductivity.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
        <h4 className="text-sm font-body-medium text-primary mb-2">Recommendations</h4>
        <div className="space-y-2 text-sm text-text-secondary">
          {data.recommendedStartTime && data.recommendedEndTime && (
            <p>
              🎯 <strong>Optimal Focus Window:</strong> {data.recommendedStartTime}:00 - {data.recommendedEndTime}:00
            </p>
          )}
          {data.topHours && data.topHours.length > 0 && (
            <p>
              ⚡ <strong>Peak Hours:</strong> {data.topHours.map(h => `${h.hour}:00`).join(', ')}
            </p>
          )}
          <p>
            💡 <strong>Tip:</strong> Schedule your most important tasks during your peak productivity hours for better results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OptimalFocusTimes; 