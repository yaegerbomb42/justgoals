import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import analyticsService from '../../services/analyticsService';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import AchievementBadge from '../../components/ui/AchievementBadge';

// Analytics Components
import ProductivityHeatmap from './components/ProductivityHeatmap';
import ProductivityTrends from './components/ProductivityTrends';
import HabitTracking from './components/HabitTracking';
import PredictiveInsights from './components/PredictiveInsights';
import OptimalFocusTimes from './components/OptimalFocusTimes';
import GoalDependencyGraph from './components/GoalDependencyGraph';

const AnalyticsDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { userPoints, achievements, getRecentAchievements, getNextAchievements } = useAchievements();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    heatmap: [],
    trends: [],
    focusTimes: [],
    goalDependencies: {},
    habits: {},
    insights: [],
    permissionError: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      analyticsService.getUserAnalytics(user.id, timeRange)
        .then(fetchedData => {
          setAnalyticsData({
            heatmap: Array.isArray(fetchedData.heatmap) ? fetchedData.heatmap : [],
            trends: Array.isArray(fetchedData.trends) ? fetchedData.trends : [],
            focusTimes: Array.isArray(fetchedData.focusTimes) ? fetchedData.focusTimes : [],
            goalDependencies: typeof fetchedData.goalDependencies === 'object' && fetchedData.goalDependencies !== null ? fetchedData.goalDependencies : {},
            habits: typeof fetchedData.habits === 'object' && fetchedData.habits !== null ? fetchedData.habits : {},
            insights: Array.isArray(fetchedData.insights) ? fetchedData.insights : [],
            permissionError: !!fetchedData.permissionError
          });
          setIsLoading(false);
        })
        .catch(err => {
          console.warn('Analytics data loading failed, using default data:', err);
          setAnalyticsData({
            heatmap: [],
            trends: [],
            focusTimes: [],
            goalDependencies: {},
            habits: {},
            insights: [],
            permissionError: false
          });
          setIsLoading(false);
        });
    } else {
      setAnalyticsData({
        heatmap: [],
        trends: [],
        focusTimes: [],
        goalDependencies: {},
        habits: {},
        insights: [],
        permissionError: false
      });
      setIsLoading(false);
    }
  }, [isAuthenticated, user, timeRange]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-heading-bold text-text-primary mb-4">
                Analytics Dashboard
              </h1>
              <p className="text-text-secondary">
                Please log in to view your analytics and insights.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const safeAnalyticsData = {
    heatmap: Array.isArray(analyticsData.heatmap) ? analyticsData.heatmap : [],
    trends: Array.isArray(analyticsData.trends) ? analyticsData.trends : [],
    focusTimes: Array.isArray(analyticsData.focusTimes) ? analyticsData.focusTimes : [],
    goalDependencies: typeof analyticsData.goalDependencies === 'object' && analyticsData.goalDependencies !== null ? analyticsData.goalDependencies : {},
    habits: typeof analyticsData.habits === 'object' && analyticsData.habits !== null ? analyticsData.habits : {},
    insights: Array.isArray(analyticsData.insights) ? analyticsData.insights : [],
    permissionError: !!analyticsData.permissionError
  };
  const safeAchievements = Array.isArray(achievements) ? achievements : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart3' },
    { id: 'productivity', label: 'Productivity', icon: 'TrendingUp' },
    { id: 'goals', label: 'Goals', icon: 'Target' },
    { id: 'habits', label: 'Habits', icon: 'Repeat' },
    { id: 'predictions', label: 'Predictions', icon: 'Zap' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Points</p>
              <p className="text-2xl font-heading-bold text-primary">{userPoints || 0}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Trophy" size={20} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Achievements</p>
              <p className="text-2xl font-heading-bold text-success">
                {safeAchievements.filter(a => a.earned).length}/{safeAchievements.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Icon name="Award" size={20} className="text-success" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Focus Hours</p>
              <p className="text-2xl font-heading-bold text-accent">
                {Math.round(safeAnalyticsData.habits?.focusSessions?.totalTime || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-accent" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Current Streak</p>
              <p className="text-2xl font-heading-bold text-warning">
                {safeAnalyticsData.habits?.dailyCheckins?.currentStreak || 0} days
              </p>
            </div>
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Icon name="Flame" size={20} className="text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Show error if permission denied */}
      {safeAnalyticsData.permissionError && (
        <div className="bg-error/10 border border-error rounded-lg p-4 text-error text-center">
          You do not have permission to access your analytics data. Please log in again or contact support.
        </div>
      )}

      {/* Recent Achievements */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading-semibold text-text-primary">Recent Achievements</h3>
          <Button variant="outline" size="sm" iconName="Trophy">
            View All
          </Button>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {(getRecentAchievements() || []).slice(0, 5).length === 0 ? (
            <div className="text-text-secondary">No achievements yet. Start completing goals to earn achievements!</div>
          ) : (
            (getRecentAchievements() || []).slice(0, 5).map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="medium"
                className="flex-shrink-0"
              />
            ))
          )}
        </div>
      </div>

      {/* Productivity Heatmap */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Activity Heatmap</h3>
        <ProductivityHeatmap data={safeAnalyticsData.heatmap} />
        {(!safeAnalyticsData.heatmap || safeAnalyticsData.heatmap.length === 0) && (
          <div className="text-center text-text-secondary mt-4">No activity data yet. Start using the app to see your heatmap!</div>
        )}
      </div>

      {/* Next Achievements */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Next Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(getNextAchievements() || []).slice(0, 6).length === 0 ? (
            <div className="text-text-secondary col-span-3">No upcoming achievements. Keep progressing on your goals!</div>
          ) : (
            (getNextAchievements() || []).slice(0, 6).map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-surface-700 rounded-lg">
                <AchievementBadge achievement={achievement} size="small" showProgress />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body-medium text-text-primary truncate">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {achievement.progress}/{achievement.total} ({Math.round(achievement.percentage)}%)
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderProductivity = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Productivity Trends</h3>
        <ProductivityTrends data={safeAnalyticsData.trends} />
        {(!safeAnalyticsData.trends || safeAnalyticsData.trends.length === 0) && (
          <div className="text-center text-text-secondary mt-4">No productivity data yet. Start using the app to see your trends!</div>
        )}
      </div>
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Optimal Focus Times</h3>
        <OptimalFocusTimes data={safeAnalyticsData.focusTimes} />
        {(!safeAnalyticsData.focusTimes || safeAnalyticsData.focusTimes.length === 0) && (
          <div className="text-center text-text-secondary mt-4">No focus time data yet. Start using the app to see your optimal times!</div>
        )}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Goal Dependencies</h3>
        <GoalDependencyGraph data={safeAnalyticsData.goalDependencies} />
        {(!safeAnalyticsData.goalDependencies || Object.keys(safeAnalyticsData.goalDependencies).length === 0) && (
          <div className="text-center text-text-secondary mt-4">No goal dependency data yet. Create and complete goals to see dependencies!</div>
        )}
      </div>
    </div>
  );

  const renderHabits = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Habit Tracking</h3>
        <HabitTracking data={safeAnalyticsData.habits} />
        {(!safeAnalyticsData.habits || Object.keys(safeAnalyticsData.habits).length === 0) && (
          <div className="text-center text-text-secondary mt-4">No habit data yet. Start tracking habits to see your progress!</div>
        )}
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Predictive Insights</h3>
        <PredictiveInsights data={safeAnalyticsData.insights} />
        {(!safeAnalyticsData.insights || safeAnalyticsData.insights.length === 0) && (
          <div className="text-center text-text-secondary mt-4">No predictive insights yet. Use the app more to unlock AI-powered predictions!</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-heading-bold text-text-primary">Analytics Dashboard</h1>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-body-medium transition-colors
                  ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                  }
                `}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'productivity' && renderProductivity()}
                {activeTab === 'goals' && renderGoals()}
                {activeTab === 'habits' && renderHabits()}
                {activeTab === 'predictions' && renderPredictions()}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard; 