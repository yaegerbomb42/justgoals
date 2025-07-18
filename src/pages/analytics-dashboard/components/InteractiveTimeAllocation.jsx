import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Treemap } from 'recharts';
import Icon from '../../../components/AppIcon';

const InteractiveTimeAllocation = ({ data = {} }) => {
  const [selectedView, setSelectedView] = useState('pie');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [timeFrame, setTimeFrame] = useState('week');

  // Process time allocation data
  const timeData = useMemo(() => {
    const safeData = data && typeof data === 'object' ? data : {};
    
    // Mock time allocation data if not available
    const categories = [
      { 
        name: 'Deep Work', 
        value: safeData.deepWork || 25, 
        color: '#3b82f6',
        subcategories: [
          { name: 'Focus Sessions', value: 15, color: '#60a5fa' },
          { name: 'Problem Solving', value: 10, color: '#1d4ed8' }
        ]
      },
      { 
        name: 'Goal Planning', 
        value: safeData.goalPlanning || 20, 
        color: '#22c55e',
        subcategories: [
          { name: 'Goal Setting', value: 8, color: '#4ade80' },
          { name: 'Progress Review', value: 7, color: '#16a34a' },
          { name: 'Strategy', value: 5, color: '#15803d' }
        ]
      },
      { 
        name: 'Learning', 
        value: safeData.learning || 18, 
        color: '#f59e0b',
        subcategories: [
          { name: 'Skill Development', value: 12, color: '#fbbf24' },
          { name: 'Research', value: 6, color: '#d97706' }
        ]
      },
      { 
        name: 'Communication', 
        value: safeData.communication || 15, 
        color: '#8b5cf6',
        subcategories: [
          { name: 'Meetings', value: 10, color: '#a78bfa' },
          { name: 'Email', value: 5, color: '#7c3aed' }
        ]
      },
      { 
        name: 'Administrative', 
        value: safeData.administrative || 12, 
        color: '#ef4444',
        subcategories: [
          { name: 'Documentation', value: 7, color: '#f87171' },
          { name: 'Organization', value: 5, color: '#dc2626' }
        ]
      },
      { 
        name: 'Break Time', 
        value: safeData.breakTime || 10, 
        color: '#06b6d4',
        subcategories: [
          { name: 'Rest', value: 6, color: '#22d3ee' },
          { name: 'Exercise', value: 4, color: '#0891b2' }
        ]
      }
    ];

    return categories;
  }, [data]);

  // Calculate hourly distribution
  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const activityLevel = Math.sin((i - 6) * Math.PI / 12) * 0.5 + 0.5; // Peak around midday
      
      return {
        hour: hour,
        displayHour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
        productivity: Math.max(0, activityLevel * 100),
        focusTime: Math.max(0, (activityLevel - 0.2) * 80),
        breakTime: Math.max(0, (0.8 - activityLevel) * 60)
      };
    });

    return hours;
  }, []);

  // Calculate efficiency metrics
  const efficiencyMetrics = useMemo(() => {
    const totalTime = timeData.reduce((sum, cat) => sum + cat.value, 0);
    const productiveTime = timeData
      .filter(cat => !['Break Time', 'Administrative'].includes(cat.name))
      .reduce((sum, cat) => sum + cat.value, 0);
    
    const focusTime = timeData.find(cat => cat.name === 'Deep Work')?.value || 0;
    const planningTime = timeData.find(cat => cat.name === 'Goal Planning')?.value || 0;
    
    return {
      productivityRate: totalTime > 0 ? (productiveTime / totalTime) * 100 : 0,
      focusRatio: totalTime > 0 ? (focusTime / totalTime) * 100 : 0,
      planningRatio: totalTime > 0 ? (planningTime / totalTime) * 100 : 0,
      totalHours: totalTime,
      averageSessionLength: 1.5, // Mock average session length
      contextSwitches: 12 // Mock context switches per day
    };
  }, [timeData]);

  // Transform data for treemap
  const treemapData = useMemo(() => {
    if (!selectedCategory) return timeData;
    
    const category = timeData.find(cat => cat.name === selectedCategory);
    return category?.subcategories || [];
  }, [timeData, selectedCategory]);

  const views = [
    { id: 'pie', label: 'Overview', icon: 'PieChart' },
    { id: 'hourly', label: 'Hourly', icon: 'Clock' },
    { id: 'treemap', label: 'Breakdown', icon: 'Grid' },
    { id: 'efficiency', label: 'Efficiency', icon: 'Zap' }
  ];

  const timeFrames = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface rounded-lg p-3 border border-border shadow-lg">
          <p className="text-sm font-body-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.unit || ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderPieChart = () => (
    <div className="space-y-6">
      <div className="bg-surface-700 rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-heading-semibold text-text-primary">Time Allocation</h4>
          <div className="text-sm text-text-secondary">
            Total: {efficiencyMetrics.totalHours.toFixed(1)} hours
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={timeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomPieLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                onClick={(entry) => setSelectedCategory(entry.name)}
              >
                {timeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={selectedCategory === entry.name ? '#ffffff' : 'none'}
                    strokeWidth={selectedCategory === entry.name ? 3 : 0}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {timeData.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedCategory === item.name 
                    ? 'bg-primary/20 border border-primary/40' 
                    : 'bg-surface-600 hover:bg-surface-500'
                }`}
                onClick={() => setSelectedCategory(selectedCategory === item.name ? null : item.name)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-body-medium text-text-primary">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-body-medium text-text-primary">{item.value}h</div>
                  <div className="text-xs text-text-secondary">
                    {((item.value / efficiencyMetrics.totalHours) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCategory && (
        <div className="bg-surface-700 rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-heading-semibold text-text-primary">
              {selectedCategory} Breakdown
            </h5>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-text-secondary hover:text-error transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeData.find(cat => cat.name === selectedCategory)?.subcategories?.map((sub, index) => (
              <div key={index} className="bg-surface-600 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span className="text-sm font-body-medium text-text-primary">{sub.name}</span>
                </div>
                <div className="text-xl font-heading-bold text-text-primary">{sub.value}h</div>
              </div>
            )) || <div className="text-text-secondary">No breakdown available</div>}
          </div>
        </div>
      )}
    </div>
  );

  const renderHourlyChart = () => (
    <div className="bg-surface-700 rounded-lg p-6 border border-border">
      <h4 className="text-lg font-heading-semibold text-text-primary mb-4">Hourly Activity Distribution</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={hourlyDistribution}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="displayHour" stroke="#9ca3af" fontSize={10} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="productivity" fill="#3b82f6" name="Productivity" />
          <Bar dataKey="focusTime" fill="#22c55e" name="Focus Time" />
          <Bar dataKey="breakTime" fill="#06b6d4" name="Break Time" />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="w-4 h-4 bg-primary rounded mx-auto mb-1"></div>
          <p className="text-xs text-text-secondary">Productivity</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-success rounded mx-auto mb-1"></div>
          <p className="text-xs text-text-secondary">Focus Time</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-cyan-500 rounded mx-auto mb-1"></div>
          <p className="text-xs text-text-secondary">Break Time</p>
        </div>
      </div>
    </div>
  );

  const renderTreemap = () => (
    <div className="bg-surface-700 rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-heading-semibold text-text-primary">
          {selectedCategory ? `${selectedCategory} Breakdown` : 'Time Allocation Map'}
        </h4>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-text-secondary hover:text-primary transition-colors"
          >
            Back to Overview
          </button>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <Treemap
          data={treemapData}
          dataKey="value"
          ratio={4/3}
          stroke="#374151"
          strokeWidth={2}
          content={({ root, depth, x, y, width, height, index, payload, colors }) => {
            if (depth === 1) {
              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                      fill: payload.color,
                      fillOpacity: 0.8,
                      stroke: '#374151',
                      strokeWidth: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => !selectedCategory && setSelectedCategory(payload.name)}
                  />
                  {width > 60 && height > 30 && (
                    <>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 - 10}
                        textAnchor="middle"
                        fill="white"
                        fontSize={12}
                        fontWeight="bold"
                      >
                        {payload.name}
                      </text>
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize={10}
                      >
                        {payload.value}h
                      </text>
                    </>
                  )}
                </g>
              );
            }
            return null;
          }}
        />
      </ResponsiveContainer>
    </div>
  );

  const renderEfficiencyMetrics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: 'TrendingUp',
            label: 'Productivity Rate',
            value: `${efficiencyMetrics.productivityRate.toFixed(1)}%`,
            color: 'text-success',
            description: 'Time spent on productive activities'
          },
          {
            icon: 'Target',
            label: 'Focus Ratio',
            value: `${efficiencyMetrics.focusRatio.toFixed(1)}%`,
            color: 'text-primary',
            description: 'Deep work vs total time'
          },
          {
            icon: 'Clock',
            label: 'Avg Session',
            value: `${efficiencyMetrics.averageSessionLength}h`,
            color: 'text-accent',
            description: 'Average work session length'
          },
          {
            icon: 'Shuffle',
            label: 'Context Switches',
            value: efficiencyMetrics.contextSwitches,
            color: 'text-warning',
            description: 'Task switches per day'
          }
        ].map((metric, index) => (
          <div key={index} className="bg-surface-700 rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${metric.color.split('-')[1]}/10 flex items-center justify-center`}>
                <Icon name={metric.icon} size={20} className={metric.color} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-body-medium text-text-primary">{metric.label}</p>
                <p className="text-xs text-text-secondary">{metric.description}</p>
              </div>
            </div>
            <div className={`text-2xl font-heading-bold ${metric.color}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface-700 rounded-lg p-6 border border-border">
        <h5 className="text-lg font-heading-semibold text-text-primary mb-4">Efficiency Recommendations</h5>
        <div className="space-y-3">
          {efficiencyMetrics.focusRatio < 30 && (
            <div className="flex items-start space-x-3 p-3 bg-primary/10 rounded-lg">
              <Icon name="Target" size={16} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-body-medium text-primary">Increase Deep Work</p>
                <p className="text-xs text-text-secondary">Try to allocate more time to focused, uninterrupted work sessions.</p>
              </div>
            </div>
          )}
          
          {efficiencyMetrics.contextSwitches > 15 && (
            <div className="flex items-start space-x-3 p-3 bg-warning/10 rounded-lg">
              <Icon name="AlertTriangle" size={16} className="text-warning mt-0.5" />
              <div>
                <p className="text-sm font-body-medium text-warning">Reduce Context Switching</p>
                <p className="text-xs text-text-secondary">Consider batching similar tasks to minimize cognitive overhead.</p>
              </div>
            </div>
          )}
          
          {efficiencyMetrics.productivityRate > 80 && (
            <div className="flex items-start space-x-3 p-3 bg-success/10 rounded-lg">
              <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
              <div>
                <p className="text-sm font-body-medium text-success">Excellent Productivity</p>
                <p className="text-xs text-text-secondary">You're maintaining great focus! Keep up the good work.</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-3 p-3 bg-accent/10 rounded-lg">
            <Icon name="Lightbulb" size={16} className="text-accent mt-0.5" />
            <div>
              <p className="text-sm font-body-medium text-accent">Optimize Schedule</p>
              <p className="text-xs text-text-secondary">Schedule your most important work during peak productivity hours.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Icon name="Clock" size={48} className="mx-auto mb-4 opacity-50" />
        <p>No time allocation data available yet.</p>
        <p className="text-sm">Start tracking your activities to see time analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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

        <div className="flex gap-2">
          {timeFrames.map((frame) => (
            <button
              key={frame.id}
              onClick={() => setTimeFrame(frame.id)}
              className={`
                px-3 py-1 rounded-full text-xs font-body-medium transition-all
                ${timeFrame === frame.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-700 text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {frame.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {selectedView === 'pie' && renderPieChart()}
      {selectedView === 'hourly' && renderHourlyChart()}
      {selectedView === 'treemap' && renderTreemap()}
      {selectedView === 'efficiency' && renderEfficiencyMetrics()}
    </div>
  );
};

export default InteractiveTimeAllocation;