import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

const DriftCharacter = ({ onOpenChat, isChatOpen = false, mood = 'happy' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [showTooltip, setShowTooltip] = useState(false);
  const animationRef = useRef(null);

  // Random idle animations based on mood
  const getMoodAnimations = () => {
    switch (mood) {
      case 'excited':
        return ['idle', 'bounce', 'wiggle', 'sparkle'];
      case 'thinking':
        return ['idle', 'blink', 'lookAround', 'ponder'];
      case 'helpful':
        return ['idle', 'nod', 'wave', 'point'];
      default:
        return ['idle', 'blink', 'lookAround', 'bounce'];
    }
  };
  
  const idleAnimations = getMoodAnimations();
  
  useEffect(() => {
    // Start idle animation cycle
    const startIdleCycle = () => {
      const randomAnimation = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
      setCurrentAnimation(randomAnimation);
      
      // Schedule next animation
      const delay = Math.random() * 3000 + 2000; // 2-5 seconds
      animationRef.current = setTimeout(startIdleCycle, delay);
    };

    startIdleCycle();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Auto-hide tooltip after 3 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  // Show tooltip on first visit
  useEffect(() => {
    const hasSeenDrift = localStorage.getItem('drift-first-seen');
    if (!hasSeenDrift) {
      setTimeout(() => setShowTooltip(true), 2000);
      localStorage.setItem('drift-first-seen', 'true');
    }
  }, []);

  const handleClick = () => {
    setIsThinking(true);
    setCurrentAnimation('excited');
    
    // Simulate thinking
    setTimeout(() => {
      setIsThinking(false);
      onOpenChat();
    }, 800);
  };

  const getTooltipMessage = () => {
    switch (mood) {
      case 'excited':
        return {
          title: "I'm excited to help! 🎉",
          message: "Let's work on something amazing together!"
        };
      case 'thinking':
        return {
          title: "I'm thinking... 🤔",
          message: "Analyzing your progress and finding ways to help!"
        };
      case 'helpful':
        return {
          title: "Need help? I'm here! 💡",
          message: "Click me for tips, advice, or just to chat!"
        };
      default:
        return {
          title: "Hi! I'm Drift 🤖",
          message: "Your AI assistant. Click me anytime for help!"
        };
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setCurrentAnimation('hover');
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentAnimation('idle');
    setShowTooltip(false);
  };

  // Animation variants
  const characterVariants = {
    idle: { scale: 1, rotate: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.1, rotate: [0, -5, 5, 0], transition: { duration: 0.4, rotate: { repeat: Infinity, duration: 1 } } },
    excited: { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0], transition: { duration: 0.6, scale: { repeat: 2, duration: 0.3 } } },
    blink: { scale: [1, 1.05, 1], transition: { duration: 0.2, repeat: 1, repeatDelay: 2 } },
    lookAround: { rotate: [0, -15, 15, 0], transition: { duration: 1, repeat: 1, repeatDelay: 3 } },
    bounce: { y: [0, -10, 0], transition: { duration: 0.5, repeat: 1, repeatDelay: 2 } },
    wiggle: { rotate: [0, -8, 8, -8, 8, 0], transition: { duration: 0.8, repeat: 1, repeatDelay: 2 } },
    sparkle: { scale: [1, 1.1, 1], transition: { duration: 0.4, repeat: 2, repeatDelay: 1 } },
    ponder: { rotate: [0, -5, 5, -5, 0], transition: { duration: 1.2, repeat: 1, repeatDelay: 3 } },
    nod: { rotate: [0, -3, 3, 0], transition: { duration: 0.6, repeat: 2, repeatDelay: 1 } },
    wave: { rotate: [0, -10, 10, 0], transition: { duration: 0.8, repeat: 1, repeatDelay: 2 } },
    point: { scale: [1, 1.05, 1], rotate: [0, -2, 2, 0], transition: { duration: 0.5, repeat: 1, repeatDelay: 2 } }
  };

  const tooltipVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        variants={characterVariants}
        animate={currentAnimation}
        whileTap={{ scale: 0.9 }}
      >
        {/* Pulse effect */}
        {isThinking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Character Body */}
        <div className={`
          relative w-14 h-14 md:w-16 md:h-16 rounded-full 
          bg-gradient-to-br from-primary-500 to-secondary-600
          shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white/20
          flex items-center justify-center
          backdrop-blur-xl
        `}>
          {/* Eyes */}
          <div className="flex space-x-1.5">
            <motion.div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full shadow-glow" />
            <motion.div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full shadow-glow" />
          </div>

          {/* Mouth - contextual */}
          <motion.div 
            className="absolute bottom-3 md:bottom-4 w-3 md:w-4 h-1 md:h-1.5 bg-white/80 rounded-full"
            animate={isThinking ? { width: [10, 16, 10] } : { width: 12 }}
          />

          {/* Notification Dot */}
          {!isChatOpen && (
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border border-white/20 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            />
          )}
        </div>
      </motion.div>

      {/* Glass Tooltip */}
      <AnimatePresence>
        {(showTooltip || isThinking) && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 max-w-[200px]"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <Icon name="Sparkles" className="w-4 h-4 text-primary-300" />
                <p className="text-xs font-medium text-white">
                  {isThinking ? "Thinking..." : getTooltipMessage().title}
                </p>
              </div>
              {!isThinking && (
                <p className="text-[10px] text-text-secondary mt-1 ml-6 leading-tight">
                  {getTooltipMessage().message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DriftCharacter;