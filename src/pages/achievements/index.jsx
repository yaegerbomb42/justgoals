import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import AchievementBadge from '../../components/ui/AchievementBadge';
import Page from '../../components/ui/Page';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import TabBar from '../../components/ui/TabBar';
import EmptyState from '../../components/ui/EmptyState';
import Card from '../../components/ui/Card';

const AchievementsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    achievements,
    userPoints,
    getAchievementsByState,
    getProgressSummary,
    getAchievementsByCategory,
    showAllAchievementsModal
  } = useAchievements();

  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page>
        <PageHeader icon="Trophy" title="Achievements" />
        <EmptyState
          icon="Lock"
          title="Sign in to view your achievements"
          description="Track your progress and unlock rewards as you reach milestones."
          size="lg"
        />
      </Page>
    );
  }

  const achievementsByState = getAchievementsByState();
  const progressSummary = getProgressSummary();

  const tabs = [
    { id: 'all', label: 'All', icon: 'Trophy', count: progressSummary.total },
    { id: 'completed', label: 'Completed', icon: 'CheckCircle', count: progressSummary.completed },
    { id: 'inProgress', label: 'In Progress', icon: 'Clock', count: progressSummary.inProgress },
    { id: 'notStarted', label: 'Not Started', icon: 'Lock', count: progressSummary.notStarted },
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: 'Grid' },
    { id: 'goals', label: 'Goals', icon: 'Target' },
    { id: 'focus', label: 'Focus', icon: 'Timer' },
    { id: 'streaks', label: 'Streaks', icon: 'Flame' },
    { id: 'milestones', label: 'Milestones', icon: 'CheckSquare' },
    { id: 'special', label: 'Special', icon: 'Star' },
  ];

  const getAchievementsToShow = () => {
    let filteredAchievements = [];

    switch (activeTab) {
      case 'completed':
        filteredAchievements = achievementsByState.completed;
        break;
      case 'inProgress':
        filteredAchievements = achievementsByState.inProgress;
        break;
      case 'notStarted':
        filteredAchievements = achievementsByState.notStarted;
        break;
      default:
        filteredAchievements = [
          ...achievementsByState.completed,
          ...achievementsByState.inProgress,
          ...achievementsByState.notStarted,
        ];
    }

    if (activeCategory !== 'all') {
      filteredAchievements = filteredAchievements.filter(a => a.category === activeCategory);
    }

    return filteredAchievements;
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'completed':
        return 'text-success border-success/20 bg-success/10';
      case 'in-progress':
        return 'text-warning border-warning/20 bg-warning/10';
      case 'not-started':
        return 'text-text-muted border-border bg-surface-700';
      default:
        return 'text-text-secondary border-border bg-surface';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'goals':
        return 'text-primary border-primary/20 bg-primary/10';
      case 'focus':
        return 'text-accent border-accent/20 bg-accent/10';
      case 'streaks':
        return 'text-warning border-warning/20 bg-warning/10';
      case 'milestones':
        return 'text-success border-success/20 bg-success/10';
      case 'special':
        return 'text-secondary border-secondary/20 bg-secondary/10';
      default:
        return 'text-text-secondary border-border bg-surface';
    }
  };

  return (
    <Page>
      <PageHeader
        icon="Trophy"
        title="Achievements"
        subtitle="Track milestones, build streaks, and earn rewards"
        actions={(
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl">
            <Icon name="Trophy" size={16} className="text-primary" />
            <span className="text-sm font-medium text-text-primary">{userPoints} Points</span>
          </div>
        )}
      />

      {/* Progress Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon="Trophy" label="Total" value={progressSummary.total} tone="primary" />
        <StatCard icon="CheckCircle" label="Completed" value={progressSummary.completed} tone="success" />
        <StatCard icon="Clock" label="In Progress" value={progressSummary.inProgress} tone="warning" />
        <StatCard icon="Percent" label="Completion" value={`${progressSummary.completionRate}%`} tone="accent" />
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              activeCategory === category.id
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-surface text-text-secondary border-border hover:text-text-primary hover:border-border-strong'
            }`}
          >
            <Icon name={category.icon} size={14} />
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      {getAchievementsToShow().length === 0 ? (
        <EmptyState
          icon="Trophy"
          title={
            activeTab === 'completed' ? 'No completed achievements yet' :
              activeTab === 'inProgress' ? 'No achievements in progress' :
                activeTab === 'notStarted' ? 'All achievements started!' :
                  'No achievements found'
          }
          description={
            activeTab === 'completed' ? 'Keep working on your goals to unlock achievements.' :
              activeTab === 'inProgress' ? 'Start working on your goals to see progress here.' :
                activeTab === 'notStarted' ? "Great job! You've started working on all available achievements." :
                  'Start using the app to unlock achievements.'
          }
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {getAchievementsToShow().map((achievement) => (
            <Card
              key={achievement.id}
              variant="elevated"
              padding="lg"
              className={`${achievement.earned ? 'border-success/30' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <AchievementBadge
                  achievement={achievement}
                  size="large"
                  showProgress
                />
                <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getStateColor(achievement.state)}`}>
                  {achievement.state === 'completed' ? 'Completed' :
                    achievement.state === 'in-progress' ? 'In Progress' : 'Not Started'}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-heading-semibold text-text-primary mb-1">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {achievement.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(achievement.category)}`}>
                    {achievement.category}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    +{achievement.points} points
                  </div>
                </div>

                {achievement.earned && achievement.earnedAt && (
                  <div className="text-xs text-success">
                    Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                  </div>
                )}

                {!achievement.earned && achievement.progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.total}</span>
                    </div>
                    <div className="w-full bg-surface-700/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                        style={{ width: `${achievement.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
};

export default AchievementsPage;
