import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Icon from '../../../components/AppIcon';

const AdvancedProductivityChart = ({ data = [], timeRange = 'month' }) => {
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('productivity');

  // Process data for different visualizations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      productivity: item.goals * 10 + item.focus * 15, // Enhanced productivity calculation
      goals: item.goals || 0,
      focus: item.focus || 0,
      efficiency: ((item.goals || 0) + (item.focus || 0)) / 2,
      weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    }));
  }, [data]);

  // Calculate weekly patterns
  const weeklyPatterns = useMemo(() => {
    const patterns = {};
    processedData.forEach(item => {
      if (!patterns[item.weekday]) {
        patterns[item.weekday] = { total: 0, count: 0, weekday: item.weekday };
      }
      patterns[item.weekday].total += item.productivity;
      patterns[item.weekday].count += 1;
    });

    return Object.values(patterns).map(pattern => ({
      ...pattern,
      average: pattern.count > 0 ? pattern.total / pattern.count : 0
    })).sort((a, b) => {
      const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return order.indexOf(a.weekday) - order.indexOf(b.weekday);
    });
  }, [processedData]);

  // Calculate time allocation
  const timeAllocation = useMemo(() => {
    const total = processedData.reduce((sum, item) => sum + item.goals + item.focus, 0);
    if (total === 0) return [];

    const goalsTotal = processedData.reduce((sum, item) => sum + item.goals, 0);
    const focusTotal = processedData.reduce((sum, item) => sum + item.focus, 0);

    return [
      { name: 'Goal Work', value: goalsTotal, color: '#22c55e' },
      { name: 'Focus Time', value: focusTotal, color: '#3b82f6' },
      { name: 'Other', value: Math.max(0, total * 0.3), color: '#94a3b8' }
    ];
  }, [processedData]);

  const chartTypes = [
    { id: 'line', label: 'Trends', icon: 'TrendingUp' },
    { id: 'bar', label: 'Daily', icon: 'BarChart3' },
    { id: 'area', label: 'Areas', icon: 'Activity' },
    { id: 'pie', label: 'Allocation', icon: 'PieChart' }
  ];

  const metrics = [
    { id: 'productivity', label: 'Productivity', color: '#3b82f6' },
    { id: 'goals', label: 'Goals', color: '#22c55e' },
    { id: 'focus', label: 'Focus', color: '#f59e0b' },
    { id: 'efficiency', label: 'Efficiency', color: '#8b5cf6' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface rounded-lg p-3 border border-border shadow-lg">
          <p className="text-sm font-body-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(1)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={metrics.find(m => m.id === selectedMetric)?.color || '#3b82f6'} 
                strokeWidth={2}
                dot={{ fill: metrics.find(m => m.id === selectedMetric)?.color || '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="weekday" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="average" 
                fill={metrics.find(m => m.id === selectedMetric)?.color || '#3b82f6'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={metrics.find(m => m.id === selectedMetric)?.color || '#3b82f6'}
                fill={`${metrics.find(m => m.id === selectedMetric)?.color || '#3b82f6'}40`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={timeAllocation}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={12}
              >
                {timeAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Calculate insights
  const insights = useMemo(() => {
    if (processedData.length === 0) return [];

    const avgProductivity = processedData.reduce((sum, item) => sum + item.productivity, 0) / processedData.length;
    const bestDay = weeklyPatterns.reduce((best, day) => day.average > best.average ? day : best, weeklyPatterns[0] || { weekday: 'N/A', average: 0 });
    const trend = processedData.length > 1 ? 
      (processedData[processedData.length - 1].productivity - processedData[0].productivity) > 0 ? 'improving' : 'declining' : 'stable';

    return [
      {
        icon: 'TrendingUp',
        title: 'Average Productivity',
        value: avgProductivity.toFixed(1),
        color: 'text-primary'
      },
      {
        icon: 'Calendar',
        title: 'Best Day',
        value: bestDay.weekday,
        color: 'text-success'
      },
      {
        icon: trend === 'improving' ? 'ArrowUp' : trend === 'declining' ? 'ArrowDown' : 'Minus',
        title: 'Trend',
        value: trend.charAt(0).toUpperCase() + trend.slice(1),
        color: trend === 'improving' ? 'text-success' : trend === 'declining' ? 'text-error' : 'text-accent'
      }
    ];
  }, [processedData, weeklyPatterns]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-50" />
        <p>No productivity data available yet.</p>
        <p className="text-sm">Start using the app to see your productivity patterns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2">
        {chartTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setChartType(type.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-body-medium transition-all
              ${chartType === type.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-surface-700 text-text-secondary hover:text-text-primary hover:bg-surface-600'
              }
            `}
          >
            <Icon name={type.icon} size={16} />
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Metric Selector (for non-pie charts) */}
      {chartType !== 'pie' && (
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`
                px-3 py-1 rounded-full text-xs font-body-medium transition-all border
                ${selectedMetric === metric.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface-700 text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {metric.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="bg-surface-700 rounded-lg p-6 border border-border">
        {renderChart()}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-surface-700 rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg bg-${insight.color.split('-')[1]}/10 flex items-center justify-center`}>
                <Icon name={insight.icon} size={20} className={insight.color} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{insight.title}</p>
                <p className={`text-xl font-heading-bold ${insight.color}`}>{insight.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedProductivityChart;