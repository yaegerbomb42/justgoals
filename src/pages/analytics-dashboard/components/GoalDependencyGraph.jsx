import React from 'react';

const GoalDependencyGraph = ({ data = {} }) => {
  if (!data.categories || Object.keys(data.categories).length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No goal data available for dependency analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Distribution */}
      <div>
        <h4 className="text-sm font-body-medium text-text-primary mb-3">Goal Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.categoryDistribution?.map((category) => (
            <div key={category.category} className="bg-surface-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body-medium text-text-primary">{category.category}</span>
                <span className="text-sm text-text-secondary">
                  {category.completed}/{category.count}
                </span>
              </div>
              <div className="w-full bg-surface-600 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(category.completed / category.count) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>{category.count} total</span>
                <span>{Math.round((category.completed / category.count) * 100)}% complete</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      {data.dependencies && data.dependencies.length > 0 && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Goal Dependencies</h4>
          <div className="bg-surface-700 rounded-lg p-4">
            <div className="space-y-2">
              {data.dependencies.slice(0, 10).map((dep, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${dep.type === 'strong' ? 'bg-warning' : 'bg-accent'}`} />
                  <span className="text-text-secondary">Goal {dep.source.slice(0, 8)}...</span>
                  <span className="text-text-secondary">→</span>
                  <span className="text-text-secondary">Goal {dep.target.slice(0, 8)}...</span>
                  <span className="text-xs text-text-secondary">
                    ({Math.round(dep.strength * 100)}% similarity)
                  </span>
                </div>
              ))}
            </div>
            {data.dependencies.length > 10 && (
              <p className="text-xs text-text-secondary mt-2">
                ... and {data.dependencies.length - 10} more dependencies
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-heading-bold text-primary">
            {data.totalGoals || 0}
          </div>
          <div className="text-xs text-text-secondary">Total Goals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-heading-bold text-accent">
            {data.dependencies?.length || 0}
          </div>
          <div className="text-xs text-text-secondary">Dependencies</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-heading-bold text-success">
            {data.categoryDistribution?.length || 0}
          </div>
          <div className="text-xs text-text-secondary">Categories</div>
        </div>
      </div>
    </div>
  );
};

export default GoalDependencyGraph; 