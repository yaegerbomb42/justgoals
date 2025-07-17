import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../AppIcon';
import Button from './Button';

const FocusModeOverlay = ({ isOpen, onClose, goalContext = null }) => {
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const [sessionCount, setSessionCount] = useState(0);

  const timerModes = {
    focus: { duration: 25 * 60, label: 'Focus Session', color: 'primary' },
    shortBreak: { duration: 5 * 60, label: 'Short Break', color: 'accent' },
    longBreak: { duration: 15 * 60, label: 'Long Break', color: 'secondary' }
  };

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    
    if (timerMode === 'focus') {
      setSessionCount(prev => prev + 1);
      // Trigger celebration animation
      const celebration = document.querySelector('.timer-display');
      if (celebration) {
        celebration.classList.add('micro-celebration');
        setTimeout(() => celebration.classList.remove('micro-celebration'), 800);
      }
    }
    
    // Auto-switch to appropriate break mode
    if (timerMode === 'focus') {
      const nextMode = (sessionCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      switchTimerMode(nextMode);
    } else {
      switchTimerMode('focus');
    }
  };

  const switchTimerMode = (mode) => {
    setTimerMode(mode);
    setTimeRemaining(timerModes[mode].duration);
    setIsTimerActive(false);
  };

  const toggleTimer = () => {
    setIsTimerActive(!isTimerActive);
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setTimeRemaining(timerModes[timerMode].duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalDuration = timerModes[timerMode].duration;
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  };

  const getCurrentModeColor = () => {
    const colorMap = {
      primary: '#6366F1',
      accent: '#10B981',
      secondary: '#8B5CF6'
    };
    return colorMap[timerModes[timerMode].color];
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-1000 bg-background flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-700 transition-all duration-normal"
      >
        <Icon name="X" size={24} />
      </button>

      {/* Main Content */}
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Goal Context */}
        {goalContext && (
          <div className="bg-surface rounded-lg p-4 border border-border">
            <p className="text-sm text-text-secondary mb-1">Working on</p>
            <p className="text-text-primary font-body-medium">{goalContext}</p>
          </div>
        )}

        {/* Timer Mode Selector */}
        <div className="flex justify-center space-x-2">
          {Object.entries(timerModes).map(([mode, config]) => (
            <button
              key={mode}
              onClick={() => switchTimerMode(mode)}
              className={`
                px-4 py-2 rounded-lg text-sm font-body-medium transition-all duration-normal
                ${timerMode === mode
                  ? `bg-${config.color} text-${config.color}-foreground shadow-elevation`
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                }
              `}
              style={{
                backgroundColor: timerMode === mode ? getCurrentModeColor() : undefined,
                color: timerMode === mode ? '#FFFFFF' : undefined
              }}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="timer-display space-y-6">
          {/* Progress Ring */}
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="2"
                fill="none"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={getCurrentModeColor()}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                className="transition-all duration-normal"
              />
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-data-medium text-text-primary mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-text-secondary font-caption">
                  {timerModes[timerMode].label}
                </div>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={toggleTimer}
              iconName={isTimerActive ? "Pause" : "Play"}
              iconPosition="left"
            >
              {isTimerActive ? 'Pause' : 'Start'}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={resetTimer}
              iconName="RotateCcw"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Session Counter */}
        <div className="flex items-center justify-center space-x-2 text-text-secondary">
          <Icon name="Target" size={16} />
          <span className="text-sm font-caption">
            Sessions completed: {sessionCount}
          </span>
        </div>

        {/* Focus Tips */}
        <div className="bg-surface-800 rounded-lg p-4 text-left">
          <h3 className="text-sm font-heading-medium text-text-primary mb-2">Focus Tips</h3>
          <ul className="text-xs text-text-secondary space-y-1 font-caption">
            <li>• Eliminate distractions before starting</li>
            <li>• Take breaks to maintain productivity</li>
            <li>• Stay hydrated and maintain good posture</li>
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FocusModeOverlay;