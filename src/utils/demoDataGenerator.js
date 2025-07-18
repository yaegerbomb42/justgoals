// Demo data generator for analytics dashboard
export const generateDemoAnalyticsData = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Generate demo heatmap data
  const heatmapData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    heatmapData.push({
      date: date.toISOString().split('T')[0],
      goals: Math.floor(Math.random() * 8) + 1,
      focus: Math.floor(Math.random() * 6) + 1,
      value: Math.floor(Math.random() * 10) + 1
    });
  }

  // Generate demo trends data
  const trendsData = {
    productivity: heatmapData.map(day => ({
      date: day.date,
      value: (day.goals * 1.5 + day.focus * 2) / 2
    })),
    focusTime: heatmapData.map(day => ({
      date: day.date,
      value: day.focus * 0.8 + Math.random() * 1.2
    })),
    milestones: heatmapData.map(day => ({
      date: day.date,
      value: Math.floor(Math.random() * 3)
    })),
    goals: heatmapData.map(day => ({
      date: day.date,
      value: day.goals
    }))
  };

  // Generate demo focus times
  const focusTimesData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    productivity: Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 80 + 20 + Math.random() * 20),
    sessions: Math.floor(Math.random() * 10) + 1,
    avgDuration: Math.random() * 3 + 0.5
  }));

  // Generate demo goal dependencies
  const goalDependenciesData = {
    goals: [
      {
        id: 1,
        title: "Complete React Course",
        progress: 75,
        difficulty: 60,
        timeSpent: 25,
        completionRate: 75,
        urgency: 80,
        impact: 90,
        category: "Learning",
        daysActive: 14,
        lastUpdate: new Date().toISOString(),
        tags: ["react", "frontend"]
      },
      {
        id: 2,
        title: "Launch Personal Website",
        progress: 45,
        difficulty: 85,
        timeSpent: 18,
        completionRate: 45,
        urgency: 95,
        impact: 85,
        category: "Professional",
        daysActive: 8,
        lastUpdate: new Date().toISOString(),
        tags: ["portfolio", "career"]
      },
      {
        id: 3,
        title: "Read 12 Books This Year",
        progress: 60,
        difficulty: 40,
        timeSpent: 30,
        completionRate: 60,
        urgency: 50,
        impact: 70,
        category: "Personal",
        daysActive: 22,
        lastUpdate: new Date().toISOString(),
        tags: ["reading", "growth"]
      },
      {
        id: 4,
        title: "Exercise 4x Per Week",
        progress: 80,
        difficulty: 70,
        timeSpent: 40,
        completionRate: 80,
        urgency: 60,
        impact: 95,
        category: "Health",
        daysActive: 25,
        lastUpdate: new Date().toISOString(),
        tags: ["fitness", "health"]
      },
      {
        id: 5,
        title: "Learn Spanish",
        progress: 35,
        difficulty: 75,
        timeSpent: 15,
        completionRate: 35,
        urgency: 40,
        impact: 65,
        category: "Learning",
        daysActive: 12,
        lastUpdate: new Date().toISOString(),
        tags: ["language", "culture"]
      }
    ]
  };

  // Generate demo habits data
  const habitsData = {
    dailyCheckins: {
      currentStreak: 12,
      maxStreak: 18,
      totalActiveDays: 25,
      streakHistory: heatmapData.map(day => ({
        date: day.date,
        active: Math.random() > 0.2
      }))
    },
    focusSessions: {
      totalSessions: 45,
      totalTime: 67.5,
      averageDuration: 1.5,
      goalFocusPercentage: 78,
      currentStreak: 8,
      maxStreak: 15,
      hourlyPatterns: focusTimesData,
      streakHistory: heatmapData.map(day => ({
        date: day.date,
        sessions: Math.floor(Math.random() * 4)
      }))
    },
    goalUpdates: {
      activeGoals: 5,
      completedGoals: 3,
      averageProgress: 59,
      currentStreak: 6,
      maxStreak: 12,
      streakHistory: heatmapData.map(day => ({
        date: day.date,
        updates: Math.floor(Math.random() * 3)
      }))
    },
    moodTracking: {
      moodByActivity: [
        { activity: "Deep Work", avgMood: 4.2, count: 25 },
        { activity: "Exercise", avgMood: 4.8, count: 20 },
        { activity: "Learning", avgMood: 3.9, count: 30 },
        { activity: "Planning", avgMood: 3.5, count: 15 }
      ],
      moodByTime: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        avgMood: 3 + Math.sin((hour - 6) * Math.PI / 12) * 1.5 + Math.random() * 0.5,
        count: Math.floor(Math.random() * 10) + 1
      }))
    },
    milestoneCompletions: {
      completionRate: 72,
      averageCompletionTime: 5 * 24 * 60 * 60 * 1000 // 5 days in milliseconds
    }
  };

  // Generate demo insights
  const insightsData = {
    estimatedGoalCompletion: goalDependenciesData.goals.map(goal => ({
      goalId: goal.id,
      goalTitle: goal.title,
      currentProgress: goal.progress,
      estimatedDaysToComplete: Math.floor((100 - goal.progress) / 2) + Math.random() * 10,
      estimatedCompletionDate: new Date(Date.now() + (100 - goal.progress) * 24 * 60 * 60 * 1000 * 2).toISOString(),
      riskLevel: goal.progress > 70 ? 'low' : goal.progress > 40 ? 'medium' : 'high',
      onTrack: goal.progress > 50,
      daysToDeadline: goal.urgency > 80 ? 14 : goal.urgency > 60 ? 30 : 60
    })),
    productivityForecast: {
      trend: 'improving',
      confidence: 78,
      forecast: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        predictedValue: 6.5 + Math.sin(i) * 1.5 + Math.random() * 0.5,
        trend: i % 2 === 0 ? 'increasing' : 'stable'
      }))
    },
    riskAssessment: goalDependenciesData.goals
      .filter(goal => goal.progress < 50)
      .map(goal => ({
        goalId: goal.id,
        goalTitle: goal.title,
        riskLevel: 'high',
        riskFactors: [
          'Low recent activity',
          'Approaching deadline',
          'Complex requirements'
        ]
      }))
  };

  return {
    heatmap: heatmapData,
    trends: trendsData,
    focusTimes: focusTimesData,
    goalDependencies: goalDependenciesData,
    habits: habitsData,
    insights: insightsData,
    permissionError: false
  };
};

export default generateDemoAnalyticsData;