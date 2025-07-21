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

    // Helper to get theme-aware colors
    const getThemeColor = (variableName, fallbackColor) => {
      if (typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallbackColor;
      }
      return fallbackColor;
    };

    let particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.5)');
    let lineColor = getThemeColor('--color-border-strong', 'rgba(148, 163, 184, 0.2)');

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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
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
      particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.5)');
      lineColor = getThemeColor('--color-border-strong', 'rgba(148, 163, 184, 0.2)');

      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const vx = (Math.random() - 0.5) * 0.3;
        const vy = (Math.random() - 0.5) * 0.3;
        particles.push(new Particle(x, y, vx, vy, size, particleColor));
      }
    }

    function connectParticles() {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5;
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
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.6,
      }}
    />
  );
};

export default FlowingParticlesBackground;
