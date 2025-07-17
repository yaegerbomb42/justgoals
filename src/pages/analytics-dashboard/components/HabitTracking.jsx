import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const HabitTracking = ({ data }) => {
  if (!data || typeof data !== 'object') {
    return <div className="mb-4 p-2 bg-error/10 border border-error/20 rounded text-error">Habit tracking data is missing or malformed.</div>;
  }
  const [selectedHabit, setSelectedHabit] = useState(null);

  const safeDailyCheckins = data.dailyCheckins || { currentStreak: 0, maxStreak: 0, totalActiveDays: 0 };
  const safeFocusSessions = data.focusSessions || { hourlyPatterns: [] };
  const safeMoodTracking = data.moodTracking || { moodByActivity: [], moodByTime: [] };

  const habitStrength = useMemo(() => {
    if (!safeDailyCheckins) return 0;
    
    const { currentStreak, maxStreak, totalActiveDays } = safeDailyCheckins;
    const consistency = totalActiveDays / Math.max(1, 30); // Assuming 30 days
    const streakFactor = maxStreak > 0 ? currentStreak / maxStreak : 0;
    
    return Math.round((consistency * 0.4 + streakFactor * 0.6) * 100);
  }, [safeDailyCheckins]);

  const optimalWorkTimes = useMemo(() => {
    if (!safeFocusSessions.hourlyPatterns) return [];
    
    return safeFocusSessions.hourlyPatterns
      .map((hour, index) => ({ hour: index, ...hour }))
      .filter(h => h.sessions > 0)
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 3);
  }, [safeFocusSessions]);

  const moodCorrelation = useMemo(() => {
    if (!safeMoodTracking) return null;
    
    const { moodByActivity, moodByTime } = safeMoodTracking;
    const bestMoodActivity = Array.isArray(moodByActivity) && moodByActivity.length > 0 ? moodByActivity.sort((a, b) => b.avgMood - a.avgMood)[0] : null;
    const bestMoodTime = Array.isArray(moodByTime) && moodByTime.length > 0 ? moodByTime.sort((a, b) => b.avgMood - a.avgMood)[0] : null;
    
    return { bestMoodActivity, bestMoodTime };
  }, [safeMoodTracking]);

  if (!safeDailyCheckins) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <Icon name="Repeat" size={48} className="mx-auto mb-4 opacity-50" />
        <p>No habit tracking data available.</p>
        <p className="text-sm">Start using the app daily to build productive habits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Habit Strength Overview */}
      <div>
        <h4 className="text-sm font-body-medium text-text-primary mb-3">Habit Strength Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon name="Flame" size={16} className="text-warning" />
                <span className="text-sm text-text-secondary">Current Streak</span>
              </div>
              <span className="text-lg font-heading-bold text-warning">
                {safeDailyCheckins.currentStreak} days
              </span>
            </div>
            <div className="w-full bg-surface-600 rounded-full h-2 mb-2">
              <div
                className="bg-warning h-2 rounded-full transition-all duration-500"
                style={{ width: `${(safeDailyCheckins.currentStreak / Math.max(1, safeDailyCheckins.maxStreak)) * 100}%` }}
              />
            </div>
            <div className="text-xs text-text-secondary">
              Best: {safeDailyCheckins.maxStreak} days
            </div>
          </div>
          
          <div className="bg-surface-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon name="Target" size={16} className="text-success" />
                <span className="text-sm text-text-secondary">Habit Strength</span>
              </div>
              <span className="text-lg font-heading-bold text-success">
                {habitStrength}%
              </span>
            </div>
            <div className="w-full bg-surface-600 rounded-full h-2 mb-2">
              <div
                className="bg-success h-2 rounded-full transition-all duration-500"
                style={{ width: `${habitStrength}%` }}
              />
            </div>
            <div className="text-xs text-text-secondary">
              {habitStrength >= 80 ? 'Excellent' : habitStrength >= 60 ? 'Good' : habitStrength >= 40 ? 'Fair' : 'Needs Work'}
            </div>
          </div>
          
          <div className="bg-surface-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon name="Calendar" size={16} className="text-accent" />
                <span className="text-sm text-text-secondary">Consistency</span>
              </div>
              <span className="text-lg font-heading-bold text-accent">
                {Math.round((safeDailyCheckins.totalActiveDays / Math.max(1, 30)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-surface-600 rounded-full h-2 mb-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(safeDailyCheckins.totalActiveDays / Math.max(1, 30)) * 100}%` }}
              />
            </div>
            <div className="text-xs text-text-secondary">
              {safeDailyCheckins.totalActiveDays}/30 days active
            </div>
          </div>
        </div>
      </div>

      {/* Optimal Work Times */}
      {optimalWorkTimes.length > 0 && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Optimal Work Times</h4>
          <div className="bg-surface-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Icon name="Clock" size={16} className="text-primary" />
              <span className="text-sm text-text-secondary">Your most productive hours</span>
            </div>
            <div className="space-y-3">
              {optimalWorkTimes.map((time, index) => (
                <div key={time.hour} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-body-medium ${
                      index === 0 ? 'bg-primary text-primary-foreground' :
                      index === 1 ? 'bg-accent text-accent-foreground' :
                      'bg-surface-600 text-text-primary'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-body-medium text-text-primary">
                        {time.hour === 0 ? '12 AM' : time.hour < 12 ? `${time.hour} AM` : time.hour === 12 ? '12 PM' : `${time.hour - 12} PM`}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {time.sessions} sessions, {time.avgDuration.toFixed(1)}h avg
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-body-medium text-success">
                      {time.productivity.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">productivity</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mood Correlation */}
      {moodCorrelation && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Mood & Productivity</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moodCorrelation.bestMoodActivity && (
              <div className="bg-surface-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon name="Heart" size={16} className="text-success" />
                  <span className="text-sm text-text-secondary">Best Mood Activity</span>
                </div>
                <div className="text-lg font-heading-bold text-success mb-1">
                  {moodCorrelation.bestMoodActivity.activity}
                </div>
                <div className="text-sm text-text-secondary">
                  Avg mood: {moodCorrelation.bestMoodActivity.avgMood.toFixed(1)}/5
                </div>
                <div className="text-xs text-text-secondary">
                  {moodCorrelation.bestMoodActivity.count} sessions
                </div>
              </div>
            )}
            
            {moodCorrelation.bestMoodTime && (
              <div className="bg-surface-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon name="Sun" size={16} className="text-warning" />
                  <span className="text-sm text-text-secondary">Best Mood Time</span>
                </div>
                <div className="text-lg font-heading-bold text-warning mb-1">
                  {moodCorrelation.bestMoodTime.hour === 0 ? '12 AM' : 
                   moodCorrelation.bestMoodTime.hour < 12 ? `${moodCorrelation.bestMoodTime.hour} AM` : 
                   moodCorrelation.bestMoodTime.hour === 12 ? '12 PM' : 
                   `${moodCorrelation.bestMoodTime.hour - 12} PM`}
                </div>
                <div className="text-sm text-text-secondary">
                  Avg mood: {moodCorrelation.bestMoodTime.avgMood.toFixed(1)}/5
                </div>
                <div className="text-xs text-text-secondary">
                  {moodCorrelation.bestMoodTime.count} sessions
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Focus Sessions */}
      {data.focusSessions && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Focus Sessions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading-bold text-primary">
                {data.focusSessions.totalSessions}
              </div>
              <div className="text-xs text-text-secondary">Total Sessions</div>
            </div>
            <div className="bg-surface-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading-bold text-accent">
                {data.focusSessions.totalTime.toFixed(1)}
              </div>
              <div className="text-xs text-text-secondary">Total Hours</div>
            </div>
            <div className="bg-surface-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading-bold text-success">
                {data.focusSessions.averageDuration.toFixed(1)}
              </div>
              <div className="text-xs text-text-secondary">Avg Duration (h)</div>
            </div>
            <div className="bg-surface-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading-bold text-warning">
                {data.focusSessions.goalFocusPercentage.toFixed(0)}%
              </div>
              <div className="text-xs text-text-secondary">Goal Focused</div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Patterns */}
      {data.milestoneCompletions && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Milestone Patterns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Completion Rate</span>
                <span className="text-lg font-heading-bold text-success">
                  {data.milestoneCompletions.completionRate.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-surface-600 rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data.milestoneCompletions.completionRate}%` }}
                />
              </div>
            </div>
            <div className="bg-surface-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Avg Completion Time</span>
                <span className="text-lg font-heading-bold text-accent">
                  {data.milestoneCompletions.averageCompletionTime > 0 
                    ? Math.round(data.milestoneCompletions.averageCompletionTime / (1000 * 60 * 60 * 24))
                    : 0
                  } days
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Update Patterns */}
      {data.goalUpdates && (
        <div>
          <h4 className="text-sm font-body-medium text-text-primary mb-3">Goal Activity</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading-bold text-primary">
                {data.goalUpdates.activeGoals}
              </div>
              <div className="text-xs text-text-secondary">Active Goals</div>
            </div>
            <div className="bg-surface-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading-bold text-success">
                {data.goalUpdates.completedGoals}
              </div>
              <div className="text-xs text-text-secondary">Completed Goals</div>
            </div>
            <div className="bg-surface-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-heading-bold text-accent">
                {data.goalUpdates.averageProgress.toFixed(0)}%
              </div>
              <div className="text-xs text-text-secondary">Avg Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracking; 