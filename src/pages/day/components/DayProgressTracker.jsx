import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { useAuth } from '../../../context/AuthContext';

// Simple plan data normalization
function normalizePlanData(input) {
  if (!input) return [];
  
  let data = input;
  if (typeof input === 'string') {
    try { 
      data = JSON.parse(input); 
    } catch { 
      return []; 
    }
  }
  
  if (!Array.isArray(data)) {
    if (data && typeof data === 'object') {
      data = [data];
    } else {
      return [];
    }
  }
  
  // Deep flatten and validate
  function deepFlatten(arr) {
    return arr.reduce((acc, val) => {
      if (Array.isArray(val)) {
        return acc.concat(deepFlatten(val));
      } else if (val && typeof val === 'object') {
        return acc.concat(val);
      }
      return acc;
    }, []);
  }
  
  const flat = deepFlatten(data).filter(
    item => item && typeof item === 'object' && 
    typeof item.time === 'string' && 
    typeof item.title === 'string'
  );
  
  return flat;
}

const DayProgressTracker = () => {
  const { user } = useAuth();
  const [progressHistory, setProgressHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadProgressHistory();
    }
  }, [user?.id]);

  const loadProgressHistory = () => {
    if (!user?.id) return;
    const history = [];
    const today = new Date();
    const startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const planKey = `daily_plan_${user.id}_${dateStr}`;
      const savedPlan = localStorage.getItem(planKey);
      if (savedPlan) {
        try {
          const parsed = JSON.parse(savedPlan);
          const normalized = normalizePlanData(parsed);
          if (normalized) {
            console.log('DEBUG DayProgressTracker normalized before filter:', normalized, typeof normalized, Array.isArray(normalized));
            const safeNormalized = Array.isArray(normalized) ? normalized : [];
            const total = safeNormalized.length;
            const completed = safeNormalized.filter(activity => activity.completed).length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            history.push({
              date: dateStr,
              total,
              completed,
              percentage,
              plan: safeNormalized
            });
          } // else skip invalid plan
        } catch (error) {
          // skip invalid plan
        }
      }
    }
    setProgressHistory(history);
  };

  const getContributionColor = (percentage) => {
    if (percentage === 0) return 'bg-surface-700';
    if (percentage < 25) return 'bg-error/20';
    if (percentage < 50) return 'bg-error/40';
    if (percentage < 75) return 'bg-warning/60';
    if (percentage < 100) return 'bg-success/80';
    return 'bg-success';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDayClick = (dayData) => {
    setSelectedDate(dayData.date);
    setSelectedDayData(dayData);
  };

  const getStreakInfo = () => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = progressHistory.length - 1; i >= 0; i--) {
      const day = progressHistory[i];
      if (day.percentage > 0) {
        tempStreak++;
        if (i === progressHistory.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  };

  const streakInfo = getStreakInfo();

  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="mb-6">
        <h3 className="text-xl font-heading-medium text-text-primary mb-2">Progress History</h3>
        <p className="text-text-secondary">Your daily plan completion over the last 30 days</p>
      </div>

      {/* Streak Information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Flame" size={20} className="text-primary" />
            <span className="text-sm font-body-medium text-text-primary">Current Streak</span>
          </div>
          <span className="text-2xl font-heading-bold text-primary">{streakInfo.currentStreak} days</span>
        </div>
        
        <div className="bg-gradient-to-r from-warning/10 to-error/10 rounded-lg p-4 border border-warning/20">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Trophy" size={20} className="text-warning" />
            <span className="text-sm font-body-medium text-text-primary">Longest Streak</span>
          </div>
          <span className="text-2xl font-heading-bold text-warning">{streakInfo.longestStreak} days</span>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="mb-6">
        <h4 className="text-lg font-heading-medium text-text-primary mb-4">Completion Heatmap</h4>
        <div className="grid grid-cols-30 gap-1">
          {progressHistory.map((day, index) => (
            <motion.div
              key={day.date}
              whileHover={{ scale: 1.1 }}
              className={`w-3 h-3 rounded-sm cursor-pointer transition-colors ${getContributionColor(day.percentage)}`}
              onClick={() => handleDayClick(day)}
              title={`${formatDate(day.date)}: ${day.completed}/${day.total} activities completed (${day.percentage}%)`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-surface-700 rounded-sm"></div>
            <div className="w-3 h-3 bg-error/20 rounded-sm"></div>
            <div className="w-3 h-3 bg-error/40 rounded-sm"></div>
            <div className="w-3 h-3 bg-warning/60 rounded-sm"></div>
            <div className="w-3 h-3 bg-success/80 rounded-sm"></div>
            <div className="w-3 h-3 bg-success rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border pt-4"
        >
          <h4 className="text-lg font-heading-medium text-text-primary mb-3">
            {formatDate(selectedDayData.date)}
          </h4>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body-medium text-text-primary">Completion Rate</span>
              <span className="text-sm font-body-medium text-text-secondary">
                {selectedDayData.completed}/{selectedDayData.total} activities
              </span>
            </div>
            <div className="w-full bg-surface-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                style={{ width: `${selectedDayData.percentage}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-text-secondary">
              {selectedDayData.percentage}% complete
            </div>
          </div>

          {selectedDayData.plan.length > 0 && (
            <div>
              <h5 className="text-sm font-body-medium text-text-primary mb-2">Activities</h5>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedDayData.plan.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-2 text-sm">
                    <Icon 
                      name={activity.completed ? "Check" : "Circle"} 
                      size={12} 
                      className={activity.completed ? "text-success" : "text-text-muted"} 
                    />
                    <span className={`flex-1 ${activity.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {activity.title}
                    </span>
                    <span className="text-text-muted text-xs">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DayProgressTracker; 