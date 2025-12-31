import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import firestoreService from '../../../services/firestoreService';

const getTotalTime = () => {
  const stored = localStorage.getItem('totalTimeLoggedSeconds');
  return stored ? parseInt(stored, 10) : 0;
};

const WelcomeHero = ({ userName, userId, overallProgress, totalGoals, completedGoals, streakDays }) => {
  const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [totalTime, setTotalTime] = useState(getTotalTime());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchTotalTime() {
      if (userId) {
        try {
          const firestoreTotal = await firestoreService.getTotalTimeLogged(userId);
          const localTotal = getTotalTime();
          let mergedTotal = Math.max(firestoreTotal, localTotal);
          if (localTotal > firestoreTotal) {
            try {
              await firestoreService.saveTotalTimeLogged(userId, localTotal);
            } catch (e) {
              mergedTotal = firestoreTotal;
            }
          }
          localStorage.setItem('totalTimeLoggedSeconds', mergedTotal);
          if (isMounted) setTotalTime(mergedTotal);
        } catch (e) {}
      }
    }
    fetchTotalTime();
    return () => { isMounted = false; };
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setTotalTime(prev => {
        const updated = prev + 5;
        localStorage.setItem('totalTimeLoggedSeconds', updated);
        if (userId) {
          firestoreService.saveTotalTimeLogged(userId, updated).catch(() => {});
        }
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTotalTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatLiveTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const motivationalQuotes = [
    "Every step counts towards your dreams.",
    "Progress, not perfection.",
    "Your future self will thank you.",
    "Small daily improvements lead to stunning results.",
    "Stay focused, stay dedicated."
  ];

  const quote = motivationalQuotes[Math.floor(currentTime.getMinutes() / 12) % motivationalQuotes.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden"
    >
      {/* Main Hero Card */}
      <div className="relative glass-card p-6 lg:p-8">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/15 via-primary/10 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          {/* Top Bar - Time & Date */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-surface-700/50 backdrop-blur-sm rounded-xl px-3 py-2">
                <Icon name="Calendar" size={14} className="text-primary" />
                <span className="text-sm font-medium text-text-primary">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2 bg-surface-700/50 backdrop-blur-sm rounded-xl px-3 py-2">
                <Icon name="Clock" size={14} className="text-secondary" />
                <span className="text-sm font-mono text-text-primary">{formatLiveTime(currentTime)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-surface-700/50 backdrop-blur-sm rounded-xl px-3 py-2">
              <Icon name="Activity" size={14} className="text-accent" />
              <span className="text-sm text-text-secondary">{formatTotalTime(totalTime)} logged</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left - Welcome */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-text-secondary text-sm mb-1">{greeting},</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">
                  {userName || 'Champion'} 
                  <motion.span
                    animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                    className="inline-block ml-2"
                  >
                    👋
                  </motion.span>
                </h1>
                <p className="text-text-secondary max-w-md italic">"{quote}"</p>
              </motion.div>
            </div>

            {/* Right - Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6"
            >
              {/* Progress Ring */}
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: strokeDashoffset }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="50%" stopColor="var(--color-secondary)" />
                      <stop offset="100%" stopColor="var(--color-accent)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: 'spring' }}
                    className="text-2xl font-bold gradient-text"
                  >
                    {Math.round(progressPercentage)}%
                  </motion.span>
                  <span className="text-[10px] text-text-muted">Complete</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-3">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="card-stat flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="Target" size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-text-primary">{totalGoals}</div>
                    <div className="text-xs text-text-muted">Active Goals</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="card-stat flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-warning/20 to-warning/10 rounded-lg flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Icon name="Flame" size={18} className="text-warning" />
                    </motion.div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-text-primary">{streakDays}</div>
                    <div className="text-xs text-text-muted">Day Streak</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeHero;
