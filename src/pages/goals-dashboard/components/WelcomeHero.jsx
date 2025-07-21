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

  // Live clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  // Total time logged state (in seconds)
  const [totalTime, setTotalTime] = useState(getTotalTime());

  // On mount, load total time from Firestore if userId is present
  useEffect(() => {
    let isMounted = true;
    async function fetchTotalTime() {
      if (userId) {
        try {
          const firestoreTotal = await firestoreService.getTotalTimeLogged(userId);
          const localTotal = getTotalTime();
          let mergedTotal = Math.max(firestoreTotal, localTotal);
          // If local is higher, update Firestore
          if (localTotal > firestoreTotal) {
            try {
              await firestoreService.saveTotalTimeLogged(userId, localTotal);
            } catch (e) {
              // If save fails, fallback to Firestore value
              mergedTotal = firestoreTotal;
            }
          }
          localStorage.setItem('totalTimeLoggedSeconds', mergedTotal);
          if (isMounted) setTotalTime(mergedTotal);
        } catch (e) {
          // Ignore Firestore errors, fallback to localStorage
        }
      }
    }
    fetchTotalTime();
    return () => { isMounted = false; };
  }, [userId]);

  // Update total time logged every 5 seconds, save to Firestore if userId
  useEffect(() => {
    const interval = setInterval(async () => {
      setTotalTime(prev => {
        const updated = prev + 5;
        // Save to Firestore first, then update localStorage
        if (userId) {
          firestoreService.saveTotalTimeLogged(userId, updated)
            .then(() => {
              localStorage.setItem('totalTimeLoggedSeconds', updated);
            })
            .catch(() => {
              // If save fails, do not update localStorage
            });
        } else {
          localStorage.setItem('totalTimeLoggedSeconds', updated);
        }
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Update live clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Format total time nicely
  const formatTotalTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Format live time nicely
  const formatLiveTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 mb-8 border border-border relative overflow-hidden"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="w-full h-full bg-gradient-to-br from-primary via-secondary to-accent"
          style={{
            backgroundSize: '200% 200%',
          }}
        />
      </div>

      {/* Live Clock and Total Time */}
      <div className="absolute top-4 right-6 flex flex-col items-end z-10">
        <div className="flex items-center space-x-2 text-2xl font-mono text-primary drop-shadow-sm">
          <Icon name="Clock" size={20} className="mr-1" />
          <span>{formatLiveTime(currentTime)}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-text-secondary mt-1 bg-surface-700 px-2 py-1 rounded-full shadow">
          <Icon name="Activity" size={14} />
          <span>Total time logged: {formatTotalTime(totalTime)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Yaeger's Goals Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-4"
        >
          <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            GOALS
          </h1>
          <motion.div
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
          {/* Welcome Message */}
          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl lg:text-3xl font-heading-semibold text-text-primary mb-2"
            >
              Welcome back, {userName}!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-text-secondary font-body mb-4"
            >
              Ready to crush your goals today? You're making incredible progress.
            </motion.p>
            
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-surface/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary/20"
              >
                <Icon name="Target" size={16} color="var(--color-accent)" />
                <span className="text-sm font-caption text-text-secondary">
                  {totalGoals} Active Goals
                </span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-surface/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-warning/20"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  <Icon name="Flame" size={16} color="var(--color-warning)" />
                </motion.div>
                <span className="text-sm font-caption text-text-secondary">
                  {streakDays} Day Streak
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Progress Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center space-x-6"
          >
            {/* Progress Ring */}
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="6"
                  fill="none"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="var(--color-primary)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeDashoffset }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="text-lg font-data-medium text-text-primary"
                >
                  {Math.round(progressPercentage)}%
                </motion.span>
              </div>
            </div>

            {/* Progress Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center lg:text-left"
            >
              <div className="text-2xl font-heading-semibold text-text-primary mb-1">
                {completedGoals}/{totalGoals}
              </div>
              <div className="text-sm text-text-secondary font-caption">
                Goals Completed
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeHero;