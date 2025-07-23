import React, { useRef, useEffect, useState } from 'react';

const FlowingParticlesBackground = ({ effect: propEffect }) => {
  const [effect, setEffect] = useState(() => {
    try {
      if (propEffect) return propEffect;
      if (typeof document !== 'undefined') {
        return document.body.getAttribute('data-bg-effect') || 'none';
      }
      return 'none';
    } catch (error) {
      console.warn('Error initializing FlowingParticlesBackground:', error);
      return 'none';
    }
  });
  const canvasRef = useRef(null);

  useEffect(() => {
    try {
      if (propEffect) {
        setEffect(propEffect);
        return;
      }
      
      if (typeof document === 'undefined') return;
      
      const observer = new MutationObserver(() => {
        try {
          setEffect(document.body.getAttribute('data-bg-effect') || 'none');
        } catch (error) {
          console.warn('Error updating background effect:', error);
        }
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-bg-effect'] });
      return () => observer.disconnect();
    } catch (error) {
      console.warn('Error setting up background effect observer:', error);
    }
  }, [propEffect]);

  useEffect(() => {
    if (!['particles', 'creative', 'abstract', 'motivational'].includes(effect)) {
      return;
    }

    try {
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
        
        // Apply effect-specific color modifications for more distinct looks
        switch (effect) {
          case 'creative':
            // Vibrant rainbow-like colors for creativity
            return 'rgba(255, 107, 107, 0.8)'; // Coral red
          case 'motivational':
            // Energetic blue colors for motivation
            return 'rgba(59, 130, 246, 0.9)'; // Bright blue
          case 'abstract':
            // Purple/violet for abstract thinking
            return 'rgba(168, 85, 247, 0.8)'; // Purple
          default:
            return color;
        }
      }
      return fallbackColor;
    };

    const getLineColor = (variableName, fallbackColor) => {
      if (typeof window !== 'undefined') {
        const color = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallbackColor;
        
        // Apply effect-specific line color modifications
        switch (effect) {
          case 'creative':
            return 'rgba(255, 159, 67, 0.4)'; // Orange connections
          case 'motivational':
            return 'rgba(34, 197, 94, 0.5)'; // Green connections
          case 'abstract':
            return 'rgba(139, 92, 246, 0.4)'; // Violet connections
          default:
            return color;
        }
      }
      return fallbackColor;
    };

    let particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.8)');
    let lineColor = getLineColor('--color-border-strong', 'rgba(148, 163, 184, 0.4)');

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
        
        // Apply effect-specific visual styles
        switch (effect) {
          case 'creative':
            // Rainbow rotating colors for creativity
            const time = Date.now() * 0.001;
            const hue = (time * 30 + this.x * 0.01) % 360;
            this.color = `hsla(${hue}, 70%, 60%, 0.8)`;
            
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
            
            // Draw as rotating triangle for creative effect
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(time + this.x * 0.01);
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(-this.size * 0.866, this.size * 0.5);
            ctx.lineTo(this.size * 0.866, this.size * 0.5);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
            break;
            
          case 'motivational':
            // Pulsing bright blue squares for energy
            const pulse = Math.sin(Date.now() * 0.005 + this.x * 0.01) * 0.3 + 0.7;
            this.color = `rgba(59, 130, 246, ${pulse})`;
            
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            
            // Draw as pulsing squares
            const size = this.size * pulse;
            ctx.beginPath();
            ctx.rect(this.x - size/2, this.y - size/2, size, size);
            ctx.fillStyle = this.color;
            ctx.fill();
            break;
            
          case 'abstract':
            // Flowing purple/violet shapes with trails
            const opacity = Math.sin(Date.now() * 0.003 + this.y * 0.01) * 0.4 + 0.6;
            this.color = `rgba(168, 85, 247, ${opacity})`;
            
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            
            // Draw as flowing diamond shapes
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.rect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
            break;
            
          default:
            // Standard circular particles
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            break;
        }
        
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
      lineColor = getLineColor('--color-border-strong', 'rgba(148, 163, 184, 0.4)');

      for (let i = 0; i < particleCount; i++) {
        // Add particle size and movement variations for different effects
        let particleSize, vx, vy;
        
        switch (effect) {
          case 'creative':
            // Larger, more dynamic particles with varied movement
            particleSize = Math.random() * (config.size.max - config.size.min) + config.size.min;
            vx = (Math.random() - 0.5) * speed * (1 + Math.random());
            vy = (Math.random() - 0.5) * speed * (1 + Math.random());
            break;
          case 'motivational':
            // Fast-moving, energetic particles
            particleSize = Math.random() * (config.size.max - config.size.min) + config.size.min;
            vx = (Math.random() - 0.5) * speed * 1.5;
            vy = (Math.random() - 0.5) * speed * 1.5;
            break;
          case 'abstract':
            // Slower, floating particles with subtle movement
            particleSize = Math.random() * (config.size.max - config.size.min) + config.size.min;
            vx = (Math.random() - 0.5) * speed * 0.7;
            vy = (Math.random() - 0.5) * speed * 0.7;
            break;
          default:
            // Standard particles
            particleSize = Math.random() * (config.size.max - config.size.min) + config.size.min;
            vx = (Math.random() - 0.5) * speed;
            vy = (Math.random() - 0.5) * speed;
            break;
        }
        
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
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

          // Adjust connection distance and style based on effect
          let maxDistance, lineWidth, glowEffect;
          
          switch (effect) {
            case 'abstract':
              maxDistance = 150;
              lineWidth = 1.5;
              glowEffect = true;
              break;
            case 'creative':
              maxDistance = 130;
              lineWidth = 1;
              glowEffect = true;
              break;
            case 'motivational':
              maxDistance = 100;
              lineWidth = 0.8;
              glowEffect = false;
              break;
            default:
              maxDistance = 120;
              lineWidth = 0.5;
              glowEffect = false;
              break;
          }
          
          if (distance < maxDistance) {
            const opacity = 1 - (distance / maxDistance);
            const adjustedLineColor = lineColor.replace(/[\d.]+\)$/, `${opacity * 0.6})`);
            
            if (glowEffect) {
              ctx.shadowColor = adjustedLineColor;
              ctx.shadowBlur = 3;
            }
            
            ctx.beginPath();
            ctx.strokeStyle = adjustedLineColor;
            ctx.lineWidth = lineWidth;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            
            if (glowEffect) {
              ctx.shadowBlur = 0;
            }
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
          lineColor = getLineColor('--color-border-strong', 'rgba(148, 163, 184, 0.2)');
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
    } catch (error) {
      console.warn('Error initializing background effect:', error);
      return () => {}; // Empty cleanup function
    }
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
