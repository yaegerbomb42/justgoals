import React from 'react';

const ProductivityTrends = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="mb-4 p-2 bg-warning/10 border border-warning/20 rounded text-warning">No trends data available.</div>;
  }

  const maxValue = Math.max(...data.productivity.map(d => d.value));
  const minValue = Math.min(...data.productivity.map(d => d.value));

  const getBarHeight = (value) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  const getBarColor = (value) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    if (percentage > 80) return 'bg-success';
    if (percentage > 60) return 'bg-primary';
    if (percentage > 40) return 'bg-warning';
    return 'bg-accent';
  };

  return (
    <div className="space-y-6">
      {/* Productivity Chart */}
      <div>
        <h4 className="text-sm font-body-medium text-text-primary mb-3">Productivity Score</h4>
        <div className="flex items-end space-x-1 h-32">
          {data.productivity.slice(-14).map((entry, index) => (
            <div key={entry.date} className="flex-1 flex flex-col items-center">
              <div
                className={`
                  w-full rounded-t-sm transition-all duration-300 hover:opacity-80
                  ${getBarColor(entry.value)}
                `}
                style={{ height: `${getBarHeight(entry.value)}%` }}
                title={`${new Date(entry.date).toLocaleDateString()}: ${entry.value.toFixed(1)}`}
              />
              {index % 3 === 0 && (
                <span className="text-xs text-text-secondary mt-1">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-700 rounded-lg p-4">
          <h5 className="text-sm font-body-medium text-text-primary mb-2">Focus Time</h5>
          <div className="space-y-2">
            {data.focusTime.slice(-7).map((entry) => (
              <div key={entry.date} className="flex justify-between text-xs">
                <span className="text-text-secondary">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-text-primary">{entry.value.toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-700 rounded-lg p-4">
          <h5 className="text-sm font-body-medium text-text-primary mb-2">Milestones</h5>
          <div className="space-y-2">
            {data.milestones.slice(-7).map((entry) => (
              <div key={entry.date} className="flex justify-between text-xs">
                <span className="text-text-secondary">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-700 rounded-lg p-4">
          <h5 className="text-sm font-body-medium text-text-primary mb-2">Goal Updates</h5>
          <div className="space-y-2">
            {data.goals.slice(-7).map((entry) => (
              <div key={entry.date} className="flex justify-between text-xs">
                <span className="text-text-secondary">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-heading-bold text-primary">
            {maxValue.toFixed(1)}
          </div>
          <div className="text-xs text-text-secondary">Peak Productivity</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-heading-bold text-accent">
            {(data.productivity.reduce((sum, d) => sum + d.value, 0) / data.productivity.length).toFixed(1)}
          </div>
          <div className="text-xs text-text-secondary">Average Daily</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-heading-bold text-success">
            {data.productivity.filter(d => d.value > 0).length}
          </div>
          <div className="text-xs text-text-secondary">Active Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-heading-bold text-warning">
            {((data.productivity.filter(d => d.value > 0).length / data.productivity.length) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-text-secondary">Consistency</div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityTrends; 