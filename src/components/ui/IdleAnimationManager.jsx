import React, { useState, useEffect, useCallback } from 'react';

const IDLE_TIMEOUT = 30000; // 30 seconds of inactivity
const IDLE_ANIMATION_CLASS = 'system-idle-animations-active';

const IdleAnimationManager = () => {
  const [isIdle, setIsIdle] = useState(false);
  let idleTimer = null;

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    document.body.classList.remove(IDLE_ANIMATION_CLASS);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      setIsIdle(true);
      document.body.classList.add(IDLE_ANIMATION_CLASS);
    }, IDLE_TIMEOUT);
  }, [idleTimer]); // Include idleTimer in dependencies if it's being cleared/set from outside

  useEffect(() => {
    // Initial setup
    resetIdleTimer();

    // Event listeners for user activity
    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Cleanup
    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      document.body.classList.remove(IDLE_ANIMATION_CLASS); // Ensure cleanup on unmount
    };
  }, [resetIdleTimer]); // resetIdleTimer is stable due to useCallback without external deps changing often

  // Optionally, render something or just manage side effects
  return null;
};

export default IdleAnimationManager;
