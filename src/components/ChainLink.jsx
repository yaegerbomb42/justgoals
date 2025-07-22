import React from 'react';
import { motion } from 'framer-motion';

const ChainLink = ({ 
  isConnected = true, 
  isNew = false, 
  size = 'normal', 
  color = 'emerald',
  index = 0 
}) => {
  const sizeClasses = {
    small: 'w-6 h-8',
    normal: 'w-8 h-10',
    large: 'w-10 h-12'
  };

  const colorClasses = {
    emerald: 'text-emerald-500',
    violet: 'text-violet-500',
    amber: 'text-amber-500',
    gray: 'text-text-secondary'
  };

  return (
    <motion.div
      className="relative flex items-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.5,
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      {/* Chain Link SVG */}
      <motion.svg
        viewBox="0 0 24 32"
        className={`${sizeClasses[size]} ${colorClasses[color]} drop-shadow-sm`}
        fill="currentColor"
        style={{
          filter: isNew ? `drop-shadow(0 0 8px currentColor)` : 'none'
        }}
        animate={isNew ? {
          filter: [
            'drop-shadow(0 0 8px currentColor)',
            'drop-shadow(0 0 12px currentColor)',
            'drop-shadow(0 0 8px currentColor)'
          ]
        } : {}}
        transition={{
          duration: 1,
          repeat: isNew ? 2 : 0,
          ease: "easeInOut"
        }}
      >
        {/* Outer oval */}
        <ellipse
          cx="12"
          cy="8"
          rx="8"
          ry="6"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Inner oval */}
        <ellipse
          cx="12"
          cy="24"
          rx="8"
          ry="6"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* Glow effect for new links */}
      {isNew && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 1, repeat: 2 }}
        >
          <div 
            className={`w-full h-full rounded-full blur-sm ${
              color === 'emerald' ? 'bg-success/30' :
              color === 'violet' ? 'bg-secondary/30' :
              color === 'amber' ? 'bg-warning/30' : 'bg-muted/30'
            }`}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

const ChainVisualization = ({ 
  chainLength, 
  maxVisible = 10, 
  hasNewLink = false, 
  color = 'emerald',
  size = 'normal',
  label = '',
  className = ''
}) => {
  const visibleLinks = Math.min(chainLength, maxVisible);
  const hiddenLinks = Math.max(0, chainLength - maxVisible);

  if (chainLength === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="flex items-center justify-center h-16">
          <span className="text-2xl text-text-secondary opacity-50">⛓️‍💥</span>
        </div>
        {label && (
          <span className="text-sm text-text-secondary">No chain yet</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Chain Links */}
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-xs">
        {[...Array(visibleLinks)].map((_, i) => (
          <ChainLink
            key={i}
            index={i}
            isNew={hasNewLink && i === visibleLinks - 1}
            color={color}
            size={size}
          />
        ))}
        
        {/* Show count for hidden links */}
        {hiddenLinks > 0 && (
          <motion.span
            className={`ml-2 text-lg font-heading-medium ${colorClasses[color]}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: visibleLinks * 0.1 + 0.2 }}
          >
            +{hiddenLinks} more
          </motion.span>
        )}
      </div>

      {/* Label */}
      {label && (
        <motion.span
          className="text-sm text-text-secondary text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
};

// Color mapping for the chain links
const colorClasses = {
  emerald: 'text-emerald-500',
  violet: 'text-violet-500',
  amber: 'text-amber-500',
  gray: 'text-text-secondary'
};

export default ChainVisualization;
export { ChainLink };