import React, { useState, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';

const GoalPerformanceMatrix = ({ data = {} }) => {
  const [selectedView, setSelectedView] = useState('difficulty');
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Process goal data for analysis
  const processedGoals = useMemo(() => {
    if (!data.goals || !Array.isArray(data.goals)) return [];

    return data.goals.map((goal, index) => ({
      id: goal.id || index,
      title: goal.title || `Goal ${index + 1}`,
      progress: goal.progress || 0,
      difficulty: goal.difficulty ?? null, // No random fallback
      timeSpent: goal.timeSpent ?? 0, // No random fallback
      completionRate: goal.completionRate ?? (goal.progress || 0),
      urgency: goal.urgency ?? null, // No random fallback
      impact: goal.impact ?? null, // No random fallback
      category: goal.category || 'General',
      daysActive: goal.daysActive ?? null, // No random fallback
      lastUpdate: goal.lastUpdate || new Date().toISOString(),
      tags: goal.tags || []
    }));
  }, [data]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (processedGoals.length === 0) return [];

    const categories = [...new Set(processedGoals.map(g => g.category))];
    
    return categories.map(category => {
      const categoryGoals = processedGoals.filter(g => g.category === category);
      const avgProgress = categoryGoals.reduce((sum, g) => sum + g.progress, 0) / categoryGoals.length;
      const avgDifficulty = categoryGoals.reduce((sum, g) => sum + g.difficulty, 0) / categoryGoals.length;
      const avgTimeSpent = categoryGoals.reduce((sum, g) => sum + g.timeSpent, 0) / categoryGoals.length;
      const efficiency = avgProgress / Math.max(avgTimeSpent, 1);

      return {
        category,
        progress: avgProgress,
        difficulty: avgDifficulty,
        timeSpent: avgTimeSpent,
        efficiency: efficiency * 10, // Scale for better visualization
        goalsCount: categoryGoals.length,
        impact: categoryGoals.reduce((sum, g) => sum + g.impact, 0) / categoryGoals.length,
        urgency: categoryGoals.reduce((sum, g) => sum + g.urgency, 0) / categoryGoals.length
      };
    });
  }, [processedGoals]);

  // Calculate difficulty vs completion scatter data
  const scatterData = useMemo(() => {
    return processedGoals.map(goal => ({
      ...goal,
      x: goal.difficulty,
      y: goal.completionRate,
      size: goal.timeSpent * 2,
      color: goal.progress > 80 ? '#22c55e' : goal.progress > 50 ? '#f59e0b' : '#ef4444'
    }));
  }, [processedGoals]);

  // Goal efficiency matrix
  const efficiencyMatrix = useMemo(() => {
    const matrix = [];
    for (let i = 0; i <= 100; i += 20) {
      for (let j = 0; j <= 100; j += 20) {
        const goalsInQuadrant = processedGoals.filter(g => 
          g.difficulty >= i && g.difficulty < i + 20 &&
          g.progress >= j && g.progress < j + 20
        );
        
        if (goalsInQuadrant.length > 0) {
          matrix.push({
            difficulty: i + 10,
            progress: j + 10,
            count: goalsInQuadrant.length,
            avgEfficiency: goalsInQuadrant.reduce((sum, g) => sum + (g.progress / Math.max(g.timeSpent, 1)), 0) / goalsInQuadrant.length,
            goals: goalsInQuadrant
          });
        }
      }
    }
    return matrix;
  }, [processedGoals]);

  const views = [
    { id: 'difficulty', label: 'Difficulty Analysis', icon: 'Target' },
    { id: 'performance', label: 'Performance Radar', icon: 'Radar' },
    { id: 'efficiency', label: 'Efficiency Matrix', icon: 'Grid' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      if (!data) return null;

      return (
        <div className="bg-surface rounded-lg p-3 border border-border shadow-lg">
          <p className="text-sm font-body-medium text-text-primary mb-2">
            {data.title || data.category || label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}`}
            </p>
          ))}
          {data.count && (
            <p className="text-xs text-text-secondary">
              Goals: {data.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderDifficultyAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-surface-700 rounded-lg p-6 border border-border">
        <h4 className="text-lg font-heading-semibold text-text-primary mb-4">Goal Difficulty vs Completion</h4>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Difficulty" 
              stroke="#9ca3af" 
              domain={[0, 100]}
              label={{ value: 'Difficulty', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Completion" 
              stroke="#9ca3af" 
              domain={[0, 100]}
              label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              data={scatterData} 
              fill="#3b82f6"
              onClick={(data) => setSelectedGoal(data)}
            >
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <h5 className="text-sm font-body-medium text-success">Easy Wins</h5>
          </div>
          <p className="text-xs text-text-secondary mb-2">Low difficulty, high completion</p>
          <div className="space-y-1">
            {processedGoals
              .filter(g => g.difficulty < 50 && g.progress > 70)
              .slice(0, 3)
              .map(goal => (
                <div key={goal.id} className="text-xs text-text-primary">{goal.title}</div>
              ))
            }
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="AlertTriangle" size={16} className="text-warning" />
            <h5 className="text-sm font-body-medium text-warning">Challenging</h5>
          </div>
          <p className="text-xs text-text-secondary mb-2">High difficulty, high completion</p>
          <div className="space-y-1">
            {processedGoals
              .filter(g => g.difficulty > 70 && g.progress > 70)
              .slice(0, 3)
              .map(goal => (
                <div key={goal.id} className="text-xs text-text-primary">{goal.title}</div>
              ))
            }
          </div>
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="Clock" size={16} className="text-accent" />
            <h5 className="text-sm font-body-medium text-accent">Need Attention</h5>
          </div>
          <p className="text-xs text-text-secondary mb-2">Low difficulty, low completion</p>
          <div className="space-y-1">
            {processedGoals
              .filter(g => g.difficulty < 50 && g.progress < 50)
              .slice(0, 3)
              .map(goal => (
                <div key={goal.id} className="text-xs text-text-primary">{goal.title}</div>
              ))
            }
          </div>
        </div>

        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="XCircle" size={16} className="text-error" />
            <h5 className="text-sm font-body-medium text-error">Struggling</h5>
          </div>
          <p className="text-xs text-text-secondary mb-2">High difficulty, low completion</p>
          <div className="space-y-1">
            {processedGoals
              .filter(g => g.difficulty > 70 && g.progress < 50)
              .slice(0, 3)
              .map(goal => (
                <div key={goal.id} className="text-xs text-text-primary">{goal.title}</div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceRadar = () => (
    <div className="bg-surface-700 rounded-lg p-6 border border-border">
      <h4 className="text-lg font-heading-semibold text-text-primary mb-4">Performance by Category</h4>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={performanceMetrics}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#9ca3af' }} />
          <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Radar
            name="Progress"
            dataKey="progress"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name="Efficiency"
            dataKey="efficiency"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name="Impact"
            dataKey="impact"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="w-4 h-4 bg-success rounded mx-auto mb-2"></div>
          <p className="text-xs text-text-secondary">Progress</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-primary rounded mx-auto mb-2"></div>
          <p className="text-xs text-text-secondary">Efficiency</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-warning rounded mx-auto mb-2"></div>
          <p className="text-xs text-text-secondary">Impact</p>
        </div>
      </div>
    </div>
  );

  const renderEfficiencyMatrix = () => (
    <div className="space-y-6">
      <div className="bg-surface-700 rounded-lg p-6 border border-border">
        <h4 className="text-lg font-heading-semibold text-text-primary mb-4">Goal Efficiency Heat Map</h4>
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 36 }, (_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const difficulty = col * 20;
            const progress = (5 - row) * 20;
            
            const cell = efficiencyMatrix.find(m => 
              Math.abs(m.difficulty - (difficulty + 10)) < 10 && 
              Math.abs(m.progress - (progress + 10)) < 10
            );
            
            const intensity = cell ? Math.min(cell.count / 3, 1) : 0;
            
            return (
              <div
                key={i}
                className="aspect-square rounded border border-border/50 flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                style={{
                  backgroundColor: cell ? `rgba(59, 130, 246, ${intensity})` : '#1f2937'
                }}
                title={cell ? `${cell.count} goals, Avg efficiency: ${cell.avgEfficiency.toFixed(1)}` : 'No goals'}
                onClick={() => cell && setSelectedGoal(cell)}
              >
                {cell ? cell.count : ''}
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between mt-4 text-xs text-text-secondary">
          <div>
            <div>Progress →</div>
            <div>0% to 100%</div>
          </div>
          <div className="text-right">
            <div>← Difficulty</div>
            <div>0% to 100%</div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: 'Target',
            label: 'Total Goals',
            value: processedGoals.length,
            color: 'text-primary'
          },
          {
            icon: 'TrendingUp',
            label: 'Avg Progress',
            value: `${(processedGoals.reduce((sum, g) => sum + g.progress, 0) / Math.max(processedGoals.length, 1)).toFixed(1)}%`,
            color: 'text-success'
          },
          {
            icon: 'Clock',
            label: 'Time Invested',
            value: `${processedGoals.reduce((sum, g) => sum + g.timeSpent, 0).toFixed(1)}h`,
            color: 'text-accent'
          },
          {
            icon: 'Zap',
            label: 'Efficiency Score',
            value: (processedGoals.reduce((sum, g) => sum + (g.progress / Math.max(g.timeSpent, 1)), 0) / Math.max(processedGoals.length, 1)).toFixed(1),
            color: 'text-warning'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-surface-700 rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color.split('-')[1]}/10 flex items-center justify-center`}>
                <Icon name={stat.icon} size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <p className={`text-xl font-heading-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!data || Object.keys(data).length === 0 || processedGoals.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Icon name="Target" size={48} className="mx-auto mb-4 opacity-50" />
        <p>No goal performance data available yet.</p>
        <p className="text-sm">Create and work on goals to see performance analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-body-medium transition-all
              ${selectedView === view.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-surface-700 text-text-secondary hover:text-text-primary hover:bg-surface-600'
              }
            `}
          >
            <Icon name={view.icon} size={16} />
            <span>{view.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedView === 'difficulty' && renderDifficultyAnalysis()}
      {selectedView === 'performance' && renderPerformanceRadar()}
      {selectedView === 'efficiency' && renderEfficiencyMatrix()}

      {/* Selected Goal Details */}
      {selectedGoal && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-body-medium text-primary">Selected Goal Details</h5>
            <button
              onClick={() => setSelectedGoal(null)}
              className="text-xs text-text-secondary hover:text-error"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-text-secondary">Title:</span>
              <div className="font-body-medium text-text-primary">{selectedGoal.title}</div>
            </div>
            <div>
              <span className="text-text-secondary">Progress:</span>
              <div className="font-body-medium text-success">{selectedGoal.progress?.toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-text-secondary">Difficulty:</span>
              <div className="font-body-medium text-warning">{selectedGoal.difficulty?.toFixed(1)}</div>
            </div>
            <div>
              <span className="text-text-secondary">Time Spent:</span>
              <div className="font-body-medium text-accent">{selectedGoal.timeSpent?.toFixed(1)}h</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalPerformanceMatrix;