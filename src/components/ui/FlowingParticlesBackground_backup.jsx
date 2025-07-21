import React, { useRef, useEffect, useState } from 'react';

const FlowingParticlesBackground = () => {
    function connectParticles() {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) { // Max distance to connect
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5; // Thin lines
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }etEffect] = useState(() => {
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

  if (!['particles', 'creative', 'abstract', 'motivational'].includes(effect)) {
    return null;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId;
    let particles = [];
    const particleCount = 50; // Adjust for density

    // Helper to get theme-aware colors
    const getThemeColor = (variableName, fallbackColor) => {
      if (typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallbackColor;
      }
      return fallbackColor;
    };

    let particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.5)'); // slate-400 with opacity
    let lineColor = getThemeColor('--color-border-strong', 'rgba(148, 163, 184, 0.2)'); // slate-400 with stronger opacity

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-initialize particles on resize or just update their bounds
      // For simplicity, let's re-initialize. A more complex approach would update.
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

        // Boundary checks (wrap around)
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
        const size = Math.random() * 2 + 1; // Particle size between 1 and 3
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        // Slower, more calm movement
        const vx = (Math.random() - 0.5) * 0.3; // Reduced velocity
        const vy = (Math.random() - 0.5) * 0.3; // Reduced velocity
        particles.push(new Particle(x, y, vx, vy, size, particleColor));
      }
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) { // Max distance to connect
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5; // Thin lines
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      connectParticles();

      animationFrameId = requestAnimationFrame(animate);
    }

    // Initial setup
    resizeCanvas(); // Set initial size and init particles
    animate();

    // Theme change listener to update colors
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // class on <html> changed (likely dark/light mode)
          particleColor = getThemeColor('--color-text-secondary', 'rgba(148, 163, 184, 0.5)');
          lineColor = getThemeColor('--color-border-strong', 'rgba(148, 163, 184, 0.2)');
          particles.forEach(p => p.color = particleColor); // Update existing particle colors
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });


    window.addEventListener('resize', resizeCanvas);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // Behind all other content
        pointerEvents: 'none', // Make sure it doesn't interfere with interactions
      }}
    />
  );
};

export default FlowingParticlesBackground;
