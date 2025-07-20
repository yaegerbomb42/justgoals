import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import AchievementBadge from '../../components/ui/AchievementBadge';

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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-20 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-heading-bold text-text-primary mb-4">
                Achievements
              </h1>
              <p className="text-text-secondary">
                Please log in to view your achievements.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const achievementsByState = getAchievementsByState();
  const progressSummary = getProgressSummary();
  const achievementsByCategory = getAchievementsByCategory();

  const tabs = [
    { id: 'all', label: 'All', icon: 'Trophy', count: progressSummary.total },
    { id: 'completed', label: 'Completed', icon: 'CheckCircle', count: progressSummary.completed },
    { id: 'inProgress', label: 'In Progress', icon: 'Clock', count: progressSummary.inProgress },
    { id: 'notStarted', label: 'Not Started', icon: 'Lock', count: progressSummary.notStarted }
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: 'Grid' },
    { id: 'goals', label: 'Goals', icon: 'Target' },
    { id: 'focus', label: 'Focus', icon: 'Timer' },
    { id: 'streaks', label: 'Streaks', icon: 'Flame' },
    { id: 'milestones', label: 'Milestones', icon: 'CheckSquare' },
    { id: 'special', label: 'Special', icon: 'Star' }
  ];

  const getAchievementsToShow = () => {
    let filteredAchievements = [];
    
    // Filter by state
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
          ...achievementsByState.notStarted
        ];
    }

    // Filter by category
    if (activeCategory !== 'all') {
      filteredAchievements = filteredAchievements.filter(achievement => 
        achievement.category === activeCategory
      );
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
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-heading-bold text-text-primary">Achievements</h1>
              <div className="flex items-center space-x-2 px-3 py-2 bg-surface-700 rounded-lg">
                <Icon name="Trophy" size={16} className="text-primary" />
                <span className="text-sm font-body-medium text-text-primary">{userPoints} Points</span>
              </div>
            </div>
            
            {/* Progress Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="text-center">
                  <p className="text-2xl font-heading-bold text-primary">{progressSummary.total}</p>
                  <p className="text-sm text-text-secondary">Total</p>
                </div>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="text-center">
                  <p className="text-2xl font-heading-bold text-success">{progressSummary.completed}</p>
                  <p className="text-sm text-text-secondary">Completed</p>
                </div>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="text-center">
                  <p className="text-2xl font-heading-bold text-warning">{progressSummary.inProgress}</p>
                  <p className="text-sm text-text-secondary">In Progress</p>
                </div>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="text-center">
                  <p className="text-2xl font-heading-bold text-text-muted">{progressSummary.completionRate}%</p>
                  <p className="text-sm text-text-secondary">Completion</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
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
                  <span className="bg-white/20 px-2 py-1 rounded text-xs">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-body-medium transition-colors
                    ${activeCategory === category.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                    }
                  `}
                >
                  <Icon name={category.icon} size={14} />
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getAchievementsToShow().length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Icon name="Trophy" size={64} className="text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-heading-medium text-text-primary mb-2">
                  {activeTab === 'completed' ? 'No completed achievements yet' :
                   activeTab === 'inProgress' ? 'No achievements in progress' :
                   activeTab === 'notStarted' ? 'All achievements started!' :
                   'No achievements found'}
                </h3>
                <p className="text-text-secondary mb-4">
                  {activeTab === 'completed' ? 'Keep working on your goals to unlock achievements!' :
                   activeTab === 'inProgress' ? 'Start working on your goals to see progress here' :
                   activeTab === 'notStarted' ? 'Great job! You\'ve started working on all available achievements' :
                   'Start using the app to unlock achievements'}
                </p>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            ) : (
              getAchievementsToShow().map((achievement) => (
                <div
                  key={achievement.id}
                  className={`
                    bg-surface rounded-lg p-6 border transition-all duration-200 hover:shadow-lg
                    ${achievement.earned ? 'border-success/20' : 'border-border'}
                  `}
                >
                  <div className="flex items-start justify-between mb-4">
                    <AchievementBadge
                      achievement={achievement}
                      size="large"
                      showProgress
                    />
                    <div className={`
                      px-2 py-1 rounded text-xs font-body-medium
                      ${getStateColor(achievement.state)}
                    `}>
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
                      <div className={`
                        px-2 py-1 rounded text-xs font-body-medium
                        ${getCategoryColor(achievement.category)}
                      `}>
                        {achievement.category}
                      </div>
                      <div className="text-sm font-body-medium text-primary">
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
                        <div className="w-full bg-surface-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${achievement.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AchievementsPage; 