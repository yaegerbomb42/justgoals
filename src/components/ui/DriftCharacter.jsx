import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

const DriftCharacter = ({ onOpenChat, isChatOpen = false, mood = 'happy' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const animationRef = useRef(null);
  const tooltipRef = useRef(null);

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
    setLastInteraction(Date.now());
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
          message: "Your AI assistant. Click me anytime for help with goals, habits, or just to chat!"
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
    idle: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      transition: { 
        duration: 0.4,
        rotate: { repeat: Infinity, duration: 1 }
      }
    },
    excited: {
      scale: [1, 1.2, 1],
      rotate: [0, -10, 10, 0],
      transition: { 
        duration: 0.6,
        scale: { repeat: 2, duration: 0.3 }
      }
    },
    blink: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.2, repeat: 1, repeatDelay: 2 }
    },
    lookAround: {
      rotate: [0, -15, 15, 0],
      transition: { duration: 1, repeat: 1, repeatDelay: 3 }
    },
    bounce: {
      y: [0, -10, 0],
      transition: { duration: 0.5, repeat: 1, repeatDelay: 2 }
    },
    wiggle: {
      rotate: [0, -8, 8, -8, 8, 0],
      transition: { duration: 0.8, repeat: 1, repeatDelay: 2 }
    },
    sparkle: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.4, repeat: 2, repeatDelay: 1 }
    },
    ponder: {
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 1.2, repeat: 1, repeatDelay: 3 }
    },
    nod: {
      rotate: [0, -3, 3, 0],
      transition: { duration: 0.6, repeat: 2, repeatDelay: 1 }
    },
    wave: {
      rotate: [0, -10, 10, 0],
      transition: { duration: 0.8, repeat: 1, repeatDelay: 2 }
    },
    point: {
      scale: [1, 1.05, 1],
      rotate: [0, -2, 2, 0],
      transition: { duration: 0.5, repeat: 1, repeatDelay: 2 }
    }
  };

  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <>
      {/* Main Character */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        variants={characterVariants}
        animate={currentAnimation}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulse effect when thinking */}
        {isThinking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            variants={pulseVariants}
            animate="pulse"
          />
        )}

        {/* Main character body */}
        <div className={`
          relative w-16 h-16 rounded-full 
          ${mood === 'excited' ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500' :
            mood === 'thinking' ? 'bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600' :
            mood === 'helpful' ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600' :
            'bg-gradient-to-br from-primary via-primary-600 to-secondary'}
          shadow-2xl border-2 border-white/20
          flex items-center justify-center
          ${isHovered ? 'shadow-primary/50' : 'shadow-lg'}
          transition-all duration-300
        `}>
          
          {/* Eyes */}
          <div className="flex space-x-1">
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={isThinking ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={isThinking ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0, delay: 0.1 }}
            />
          </div>

          {/* Mouth */}
          <motion.div
            className="absolute bottom-3 w-3 h-1 bg-white rounded-full"
            animate={isThinking ? { scaleX: [1, 1.5, 1] } : {}}
            transition={{ duration: 0.3, repeat: isThinking ? Infinity : 0 }}
          />

          {/* Sparkle effect */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Icon name="Sparkles" className="w-3 h-3 text-yellow-300" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification dot */}
          {!isChatOpen && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            />
          )}
        </div>

        {/* Floating particles */}
        <AnimatePresence>
          {isHovered && (
            <>
              <motion.div
                className="absolute -top-2 -left-2 w-2 h-2 bg-blue-400 rounded-full opacity-60"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: -20 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-60"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.6, y: 20 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className="absolute top-2 -right-2 w-1 h-1 bg-green-400 rounded-full opacity-60"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 0.6, x: -15 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            ref={tooltipRef}
            className="fixed bottom-24 right-6 z-50 max-w-xs"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="bg-surface-800 border border-border rounded-lg p-3 shadow-xl">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="Bot" className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary mb-1">
                    {getTooltipMessage().title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {getTooltipMessage().message}
                  </p>
                </div>
              </div>
              
              {/* Tooltip arrow */}
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thinking indicator */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            className="fixed bottom-24 right-6 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-surface-800 border border-border rounded-lg p-3 shadow-xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-sm text-text-secondary">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DriftCharacter; 