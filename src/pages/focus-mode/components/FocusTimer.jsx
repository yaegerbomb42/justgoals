import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FocusTimer = ({ 
  onTimeUpdate, 
  isActive, 
  onToggle, 
  onReset,
  onStop 
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  // sessionStartTime is not strictly needed for stopwatch logic here but might be useful later
  // const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      // if (!sessionStartTime) {
      //   setSessionStartTime(Date.now() - elapsedTime * 1000); // Adjust if resuming
      // }
      interval = setInterval(() => {
        setElapsedTime(time => {
          const newTime = time + 1;
          onTimeUpdate(newTime); // Pass elapsed time
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, onTimeUpdate]); // Removed sessionStartTime from deps for now

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // const getProgressPercentage = () => { // Not relevant for stopwatch in the same way
  //   return ((duration - timeRemaining) / duration) * 100;
  // };

  const handleReset = () => {
    setElapsedTime(0);
    // setSessionStartTime(null);
    onReset(); // Call the parent's reset logic
  };

  const handleStop = () => {
    // setSessionStartTime(null);
    onStop(); // Call the parent's stop logic which should also set isActive to false
  };

  // Simple abstract UI: A pulsing dot when active
  const AbstractVisualizer = () => (
    <div className={`w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6`}>
      <div
        className={`w-8 h-8 rounded-full bg-primary transition-all duration-500 ${isActive ? 'animate-pulse scale-125' : 'scale-100'}`}
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Abstract Visualizer */}
      <AbstractVisualizer />

      {/* Time Display */}
      <div className="text-center">
        <div className="text-7xl md:text-8xl font-light font-data text-text-primary tracking-wider mb-1">
          {formatTime(elapsedTime)}
        </div>
        <div className="text-text-secondary text-base font-caption">
          {isActive ? 'Focusing...' : 'Paused / Ready'}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center space-x-3 pt-4">
        <Button
          variant={isActive ? "outline" : "primary"}
          size="xl"
          onClick={onToggle}
          iconName={isActive ? "Pause" : "Play"}
          className="px-10 py-4 rounded-full"
          aria-label={isActive ? "Pause session" : "Start session"}
        >
          {isActive ? 'Pause' : 'Start'}
        </Button>
        
        <Button
          variant="ghost"
          size="xl"
          onClick={handleStop}
          iconName="Square"
          className="px-10 py-4 rounded-full text-text-secondary hover:text-error disabled:opacity-50"
          disabled={!isActive && elapsedTime === 0}
          aria-label="Stop session"
        >
          Stop
        </Button>

        <Button
          variant="ghost"
          size="xl"
          onClick={handleReset}
          iconName="RotateCcw"
          className="px-10 py-4 rounded-full text-text-secondary hover:text-text-primary disabled:opacity-50"
          disabled={elapsedTime === 0 || isActive}
          aria-label="Reset timer"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default FocusTimer;