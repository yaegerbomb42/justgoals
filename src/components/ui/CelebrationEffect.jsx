import React from 'react';
import { motion } from 'framer-motion';

const CelebrationEffect = ({ show, onComplete }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
    >
      {/* Confetti particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: `hsl(${Math.random() * 360}, 70%, 60%)`,
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            scale: [0, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.1,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: [0, 1.2, 1], rotate: 0 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="w-16 h-16 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center shadow-lg"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-8 h-8 text-success-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>

      {/* Ripple effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute w-16 h-16 border-4 border-success rounded-full"
      />
    </motion.div>
  );
};

export default CelebrationEffect;