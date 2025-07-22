import React, { useRef, useEffect, useState } from 'react';

const FlowingParticlesBackground = () => {
  const [effect, setEffect] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.body.getAttribute('data-bg-effect') || 'none';
    }
    return 'none';
  });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const observer = new MutationObserver(() => {
      setEffect(document.body.getAttribute('data-bg-effect') || 'none');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-bg-effect'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!['particles', 'creative', 'abstract', 'motivational'].includes(effect)) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get effect-specific configurations
    const getEffectConfig = (effectType) => {
      switch (effectType) {
        case 'particles':
          return {
            particleCount: 50,
            speed: 0.3,
            connectionDistance: 120,
            opacity: 0.8,
            size: { min: 1, max: 3 }
          };
        case 'creative':
          return {
            particleCount: 75,
            speed: 0.5,
            connectionDistance: 100,
            opacity: 0.9,
            size: { min: 2, max: 4 }
          };
        case 'abstract':
          return {
            particleCount: 30,
            speed: 0.2,
            connectionDistance: 150,
            opacity: 0.7,
            size: { min: 1, max: 2 }
          };
        case 'motivational':
          return {
            particleCount: 100,
            speed: 0.4,
            connectionDistance: 80,
            opacity: 1.0,
            size: { min: 1.5, max: 3.5 }
          };
        default:
          return {
            particleCount: 50,
            speed: 0.3,
            connectionDistance: 120,
            opacity: 0.8,
            size: { min: 1, max: 3 }
          };
      }
    };

    const config = getEffectConfig(effect);
    let animationFrameId;
    let particles = [];
    const particleCount = config.particleCount;
    const speed = config.speed; // Add this line to use the config speed

    // Helper to get theme-aware colors with effect-specific variations
    const getThemeColor = (variableName, fallbackColor) => {
      if (typeof window !== 'undefined') {
        const color = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallbackColor;
        
        // Apply effect-specific color modifications
        switch (effect) {
          case 'creative':
            return color.replace('0.5)', '0.8)').replace('0.2)', '0.6)');
          case 'motivational':
            return color.replace('rgba(148, 163, 184', 'rgba(59, 130, 246'); // Blue theme
          case 'abstract':
            return color.replace('rgba(148, 163, 184', 'rgba(168, 85, 247'); // Purple theme
          default:
            return color;
        }
      }
      return fallbackColor;
    };

    let particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.8)');
    let lineColor = getThemeColor('--color-border-strong', 'rgba(148, 163, 184, 0.4)');

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      constructor(x, y, vx, vy, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
      }

      draw() {
        if (!ctx) return;
        
        // Add glow effect for enhanced visibility
        if (effect !== 'particles') {
          ctx.shadowColor = this.color;
          ctx.shadowBlur = effect === 'abstract' ? 15 : effect === 'motivational' ? 10 : 8;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }

      update() {
        if (!canvas) return;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }
    }

    function initParticles() {
      if (!canvas) return;
      particles = [];
      
      // Reinitialize colors in case theme changed
      particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.8)');
      lineColor = getThemeColor('--color-border-strong', 'rgba(148, 163, 184, 0.4)');

      for (let i = 0; i < particleCount; i++) {
        // Add particle size and glow variations for different effects
        let particleSize = Math.random() * 2 + 1;
        
        switch (effect) {
          case 'creative':
            particleSize = Math.random() * 2.5 + 1.5;
            break;
          case 'motivational':
            particleSize = Math.random() * 3 + 2;
            break;
          case 'abstract':
            particleSize = Math.random() * 4 + 2.5;
            break;
          default:
            particleSize = Math.random() * 2 + 1;
            break;
        }
        
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const vx = (Math.random() - 0.5) * speed;
        const vy = (Math.random() - 0.5) * speed;
        particles.push(new Particle(x, y, vx, vy, particleSize, particleColor));
      }
    }

    function connectParticles() {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Adjust connection distance based on effect
          const maxDistance = effect === 'abstract' ? 150 : effect === 'creative' ? 130 : 120;
          
          if (distance < maxDistance) {
            const opacity = 1 - (distance / maxDistance);
            const adjustedLineColor = lineColor.replace(/[\d.]+\)$/, `${opacity * 0.6})`);
            
            ctx.beginPath();
            ctx.strokeStyle = adjustedLineColor;
            ctx.lineWidth = effect === 'abstract' ? 1 : 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      connectParticles();
      animationFrameId = requestAnimationFrame(animate);
    }

    resizeCanvas();
    animate();

    const themeObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.5)');
          lineColor = getThemeColor('--color-border-strong', 'rgba(148, 163, 184, 0.2)');
          particles.forEach(p => p.color = particleColor);
        }
      }
    });

    if (typeof document !== 'undefined') {
      themeObserver.observe(document.documentElement, { attributes: true });
      window.addEventListener('resize', resizeCanvas);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeCanvas);
      }
      themeObserver.disconnect();
    };
  }, [effect]);

  if (!['particles', 'creative', 'abstract', 'motivational'].includes(effect)) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        pointerEvents: 'none',
        opacity: 0.7,
      }}
    />
  );
};

export default FlowingParticlesBackground;
