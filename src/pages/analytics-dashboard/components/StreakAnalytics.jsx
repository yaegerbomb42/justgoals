import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from 'recharts';
import Icon from '../../../components/AppIcon';

const StreakAnalytics = ({ data = {} }) => {
  const [selectedMetric, setSelectedMetric] = useState('dailyCheckins');
  const [timeRange, setTimeRange] = useState('month');

  // Process streak data
  const streakData = useMemo(() => {
    const safeData = data && typeof data === 'object' ? data : {};
    const dailyCheckins = safeData.dailyCheckins || { currentStreak: 0, maxStreak: 0, streakHistory: [], totalActiveDays: 0 };
    const focusSessions = safeData.focusSessions || { streakHistory: [], currentStreak: 0, maxStreak: 0 };
    const goalUpdates = safeData.goalUpdates || { streakHistory: [], currentStreak: 0, maxStreak: 0 };

    return {
      dailyCheckins,
      focusSessions,
      goalUpdates
    };
  }, [data]);

  // Generate streak history for visualization
  const streakHistory = useMemo(() => {
    const days = 30; // Last 30 days
    const history = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Simulate streak data if not available
      const dayData = {
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dailyCheckins: Math.random() > 0.3 ? 1 : 0, // 70% activity rate
        focusSessions: Math.floor(Math.random() * 4), // 0-3 focus sessions
        goalUpdates: Math.floor(Math.random() * 3), // 0-2 goal updates
        totalActivity: 0
      };

      dayData.totalActivity = dayData.dailyCheckins + dayData.focusSessions + dayData.goalUpdates;
      history.push(dayData);
    }

    return history;
  }, []);

  // Calculate streak patterns
  const streakPatterns = useMemo(() => {
    const patterns = {
      weekdays: Array(7).fill(0).map((_, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        dailyCheckins: 0,
        focusSessions: 0,
        goalUpdates: 0,
        count: 0
      })),
      hourly: Array(24).fill(0).map((_, i) => ({
        hour: i,
        activity: Math.random() * 10, // Mock hourly activity
        focusSessions: Math.random() * 3
      }))
    };

    // Calculate weekday patterns
    streakHistory.forEach(day => {
      const dayOfWeek = new Date(day.date).getDay();
      patterns.weekdays[dayOfWeek].dailyCheckins += day.dailyCheckins;
      patterns.weekdays[dayOfWeek].focusSessions += day.focusSessions;
      patterns.weekdays[dayOfWeek].goalUpdates += day.goalUpdates;
      patterns.weekdays[dayOfWeek].count += 1;
    });

    // Average the patterns
    patterns.weekdays = patterns.weekdays.map(day => ({
      ...day,
      dailyCheckins: day.count > 0 ? day.dailyCheckins / day.count : 0,
      focusSessions: day.count > 0 ? day.focusSessions / day.count : 0,
      goalUpdates: day.count > 0 ? day.goalUpdates / day.count : 0
    }));

    return patterns;
  }, [streakHistory]);

  // Calculate streak insights
  const streakInsights = useMemo(() => {
    const currentStreaks = {
      dailyCheckins: streakData.dailyCheckins.currentStreak || 0,
      focusSessions: streakData.focusSessions.currentStreak || 0,
      goalUpdates: streakData.goalUpdates.currentStreak || 0
    };

    const maxStreaks = {
      dailyCheckins: streakData.dailyCheckins.maxStreak || 0,
      focusSessions: streakData.focusSessions.maxStreak || 0,
      goalUpdates: streakData.goalUpdates.maxStreak || 0
    };

    // Calculate streak momentum (how close to personal best)
    const momentum = Object.keys(currentStreaks).map(key => ({
      metric: key,
      current: currentStreaks[key],
      max: maxStreaks[key],
      percentage: maxStreaks[key] > 0 ? (currentStreaks[key] / maxStreaks[key]) * 100 : 0
    }));

    // Calculate consistency score
    const activeDays = streakHistory.filter(day => day.totalActivity > 0).length;
    const consistencyScore = (activeDays / streakHistory.length) * 100;

    // Predict streak potential
    const recentActivity = streakHistory.slice(-7); // Last 7 days
    const recentConsistency = recentActivity.filter(day => day.totalActivity > 0).length / 7;
    const streakPotential = recentConsistency > 0.7 ? 'High' : recentConsistency > 0.4 ? 'Medium' : 'Low';

    return {
      momentum,
      consistencyScore,
      streakPotential,
      activeDays,
      totalDays: streakHistory.length
    };
  }, [streakData, streakHistory]);

  const metrics = [
    { id: 'dailyCheckins', label: 'Daily Check-ins', color: '#22c55e', icon: 'CheckCircle' },
    { id: 'focusSessions', label: 'Focus Sessions', color: '#3b82f6', icon: 'Clock' },
    { id: 'goalUpdates', label: 'Goal Updates', color: '#f59e0b', icon: 'Target' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface rounded-lg p-3 border border-border shadow-lg">
          <p className="text-sm font-body-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderStreakChart = () => (
    <div className="bg-surface-700 rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-heading-semibold text-text-primary">30-Day Activity Streak</h4>
        <div className="flex space-x-2">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`
                flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-body-medium transition-all
                ${selectedMetric === metric.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-600 text-text-secondary hover:text-text-primary'
                }
              `}
            >
              <Icon name={metric.icon} size={12} />
              <span>{metric.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={streakHistory}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="displayDate" 
            stroke="#9ca3af" 
            fontSize={10}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#9ca3af" fontSize={10} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={selectedMetric}
            stroke={metrics.find(m => m.id === selectedMetric)?.color}
            fill={`${metrics.find(m => m.id === selectedMetric)?.color}40`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderStreakMomentum = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {streakInsights.momentum.map((item, index) => {
        const metric = metrics.find(m => m.id === item.metric);
        const isAtPeak = item.current === item.max && item.max > 0;
        const isGrowing = item.percentage > 80;
        
        return (
          <div key={item.metric} className="bg-surface-700 rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${metric?.color}20` }}
              >
                <Icon name={metric?.icon || 'Circle'} size={20} style={{ color: metric?.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-body-medium text-text-primary">{metric?.label}</p>
                <p className="text-xs text-text-secondary">Current momentum</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Current:</span>
                <span className="font-body-medium text-text-primary">{item.current} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Best:</span>
                <span className="font-body-medium text-text-primary">{item.max} days</span>
              </div>
              
              <div className="w-full bg-surface-600 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: metric?.color
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">{item.percentage.toFixed(0)}% of best</span>
                <span className={`font-body-medium ${
                  isAtPeak ? 'text-success' : isGrowing ? 'text-warning' : 'text-text-secondary'
                }`}>
                  {isAtPeak ? '🔥 Peak!' : isGrowing ? '📈 Growing' : '💪 Keep going'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeeklyPatterns = () => (
    <div className="bg-surface-700 rounded-lg p-6 border border-border">
      <h4 className="text-lg font-heading-semibold text-text-primary mb-4">Weekly Activity Patterns</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={streakPatterns.weekdays}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="dailyCheckins" stackId="a" fill="#22c55e" name="Check-ins" />
          <Bar dataKey="focusSessions" stackId="a" fill="#3b82f6" name="Focus" />
          <Bar dataKey="goalUpdates" stackId="a" fill="#f59e0b" name="Goals" />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="w-4 h-4 bg-success rounded mx-auto mb-1"></div>
          <p className="text-xs text-text-secondary">Check-ins</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-primary rounded mx-auto mb-1"></div>
          <p className="text-xs text-text-secondary">Focus Sessions</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-warning rounded mx-auto mb-1"></div>
          <p className="text-xs text-text-secondary">Goal Updates</p>
        </div>
      </div>
    </div>
  );

  const renderStreakInsights = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-surface-700 rounded-lg p-4 border border-border text-center">
        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Icon name="Award" size={24} className="text-success" />
        </div>
        <div className="text-2xl font-heading-bold text-success mb-1">
          {streakInsights.consistencyScore.toFixed(0)}%
        </div>
        <div className="text-xs text-text-secondary">Consistency Score</div>
      </div>

      <div className="bg-surface-700 rounded-lg p-4 border border-border text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Icon name="Calendar" size={24} className="text-primary" />
        </div>
        <div className="text-2xl font-heading-bold text-primary mb-1">
          {streakInsights.activeDays}/{streakInsights.totalDays}
        </div>
        <div className="text-xs text-text-secondary">Active Days</div>
      </div>

      <div className="bg-surface-700 rounded-lg p-4 border border-border text-center">
        <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Icon name="Zap" size={24} className="text-warning" />
        </div>
        <div className="text-2xl font-heading-bold text-warning mb-1">
          {streakInsights.streakPotential}
        </div>
        <div className="text-xs text-text-secondary">Streak Potential</div>
      </div>

      <div className="bg-surface-700 rounded-lg p-4 border border-border text-center">
        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Icon name="TrendingUp" size={24} className="text-accent" />
        </div>
        <div className="text-2xl font-heading-bold text-accent mb-1">
          {Math.max(...streakInsights.momentum.map(m => m.current))}
        </div>
        <div className="text-xs text-text-secondary">Best Current Streak</div>
      </div>
    </div>
  );

  const renderHourlyHeatmap = () => (
    <div className="bg-surface-700 rounded-lg p-6 border border-border">
      <h4 className="text-lg font-heading-semibold text-text-primary mb-4">Daily Activity Heatmap</h4>
      <div className="grid grid-cols-12 gap-1 mb-4">
        {streakPatterns.hourly.map((hour, index) => {
          const intensity = Math.min(hour.activity / 10, 1);
          return (
            <div
              key={index}
              className="aspect-square rounded border border-border/50 flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              style={{
                backgroundColor: `rgba(59, 130, 246, ${intensity})`
              }}
              title={`${hour.hour}:00 - Activity: ${hour.activity.toFixed(1)}`}
            >
              {hour.hour}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-text-secondary">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
    </div>
  );

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Icon name="Flame" size={48} className="mx-auto mb-4 opacity-50" />
        <p>No streak data available yet.</p>
        <p className="text-sm">Start building consistent habits to see your streak analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak Chart */}
      {renderStreakChart()}

      {/* Streak Momentum Cards */}
      {renderStreakMomentum()}

      {/* Insights Summary */}
      {renderStreakInsights()}

      {/* Weekly Patterns */}
      {renderWeeklyPatterns()}

      {/* Hourly Heatmap */}
      {renderHourlyHeatmap()}

      {/* Recommendations */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Icon name="Lightbulb" size={16} className="text-primary" />
          <h5 className="text-sm font-body-medium text-primary">Streak Building Tips</h5>
        </div>
        <div className="space-y-2 text-sm text-text-secondary">
          {streakInsights.consistencyScore < 50 && (
            <p>🎯 <strong>Focus on consistency:</strong> Try to maintain at least one activity per day to build your habit foundation.</p>
          )}
          {streakInsights.streakPotential === 'High' && (
            <p>🔥 <strong>You're on fire!</strong> Keep up the excellent consistency - you're building strong habits!</p>
          )}
          {streakInsights.streakPotential === 'Low' && (
            <p>💪 <strong>Start small:</strong> Begin with just one daily check-in to establish a routine.</p>
          )}
          <p>📊 <strong>Best performance:</strong> Focus your most important tasks during your peak activity hours.</p>
          <p>⚡ <strong>Streak strategy:</strong> Link new habits to existing routines for better consistency.</p>
        </div>
      </div>
    </div>
  );
};

export default StreakAnalytics;