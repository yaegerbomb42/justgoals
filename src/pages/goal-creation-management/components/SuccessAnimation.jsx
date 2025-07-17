import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';

const SuccessAnimation = ({ isVisible, onComplete, goalTitle = "Your Goal" }) => {
  const [animationPhase, setAnimationPhase] = useState('enter');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('enter');
      
      const timer1 = setTimeout(() => {
        setAnimationPhase('celebrate');
      }, 300);

      const timer2 = setTimeout(() => {
        setAnimationPhase('exit');
      }, 2500);

      const timer3 = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        className={`text-center transition-all duration-500 ${
          animationPhase === 'enter' ?'scale-50 opacity-0'
            : animationPhase === 'celebrate' ?'scale-100 opacity-100' :'scale-110 opacity-0'
        }`}
      >
        {/* Success Icon with Pulse Animation */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-success to-accent rounded-full flex items-center justify-center mx-auto shadow-elevation-2">
            <Icon name="Check" size={48} color="#FFFFFF" />
          </div>
          
          {/* Pulse Rings */}
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-success rounded-full opacity-20 animate-ping"></div>
            <div className="absolute inset-0 bg-success rounded-full opacity-10 animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-heading-semibold text-text-primary">
            Goal Created Successfully!
          </h2>
          <p className="text-lg text-text-secondary max-w-md mx-auto">
            <span className="text-primary font-body-medium">"{goalTitle}"</span> has been added to your goals dashboard
          </p>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full opacity-60"
              style={{
                left: `${20 + (i * 5)}%`,
                top: `${30 + (i % 3) * 20}%`,
                animation: `float-particle 2s ease-out ${i * 0.1}s forwards`
              }}
            />
          ))}
        </div>

        {/* Confetti Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-4 opacity-80"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][i % 5],
                animation: `confetti-fall 3s linear ${i * 0.1}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1);
            opacity: 0;
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default SuccessAnimation;