import React from 'react';
import Icon from '../../../components/AppIcon';

const GoalDependencyGraph = ({ data = {} }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="Target" size={48} className="text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">No goal dependency data available</p>
      </div>
    );
  }

  const goals = Object.keys(data);
  const maxDependencies = Math.max(...goals.map(goal => data[goal]?.dependencies?.length || 0));

  return (
    <div className="space-y-6">
      {/* Dependency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="text-center">
            <div className="text-2xl font-heading-bold text-primary">{goals.length}</div>
            <div className="text-sm text-text-secondary">Total Goals</div>
          </div>
        </div>
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="text-center">
            <div className="text-2xl font-heading-bold text-accent">{maxDependencies}</div>
            <div className="text-sm text-text-secondary">Max Dependencies</div>
          </div>
        </div>
        <div className="bg-surface-700 rounded-lg p-4 border border-border">
          <div className="text-center">
            <div className="text-2xl font-heading-bold text-success">
              {goals.filter(goal => (data[goal]?.dependencies?.length || 0) === 0).length}
            </div>
            <div className="text-sm text-text-secondary">Independent Goals</div>
          </div>
        </div>
      </div>

      {/* Goal Dependency List */}
      <div className="space-y-4">
        <h4 className="text-lg font-heading-semibold text-text-primary">Goal Dependencies</h4>
        {goals.map(goal => {
          const goalData = data[goal];
          const dependencies = goalData?.dependencies || [];
          const isBlocked = dependencies.some(dep => !data[dep]?.completed);
          
          return (
            <div
              key={goal}
              className={`bg-surface-700 rounded-lg p-4 border transition-colors ${
                isBlocked ? 'border-warning/20' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    goalData?.completed ? 'bg-success' : 
                    isBlocked ? 'bg-warning' : 'bg-text-muted'
                  }`} />
                  <h5 className="font-body-medium text-text-primary">{goal}</h5>
                </div>
                <div className="text-sm text-text-secondary">
                  {dependencies.length} dependency{dependencies.length !== 1 ? 'ies' : 'y'}
                </div>
              </div>
              
              {dependencies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-text-secondary">Depends on:</div>
                  <div className="flex flex-wrap gap-2">
                    {dependencies.map(dep => (
                      <div
                        key={dep}
                        className={`px-2 py-1 rounded text-xs font-body-medium ${
                          data[dep]?.completed
                            ? 'bg-success/10 text-success border border-success/20'
                            : 'bg-warning/10 text-warning border border-warning/20'
                        }`}
                      >
                        {dep}
                        {data[dep]?.completed && (
                          <Icon name="Check" size={12} className="ml-1 inline" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isBlocked && (
                <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded text-xs text-warning">
                  ⚠️ This goal is blocked by incomplete dependencies
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
        <h4 className="text-sm font-body-medium text-primary mb-2">Recommendations</h4>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            🎯 <strong>Focus on independent goals first</strong> - These can be completed without waiting for others
          </p>
          <p>
            ⚡ <strong>Complete blocking goals</strong> - Finish goals that others depend on to unblock progress
          </p>
          <p>
            📊 <strong>Track dependencies</strong> - Keep an eye on goal relationships to optimize your workflow
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoalDependencyGraph; 