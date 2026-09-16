'use client';

import { useEffect, useRef } from 'react';

interface CinematicHeroBackgroundProps {
  videoSrc?: string;
}

export function CinematicHeroBackground({ videoSrc }: CinematicHeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoSrc) return; // If video supplied, skip canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes for data flow simulation
    const particleCount = Math.min(Math.floor(width / 25), 55);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.35 + 0.15,
      });
    }

    let time = 0;
    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle undulating data stream curves in midground
      ctx.lineWidth = 1;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        const yOffset = height * (0.35 + j * 0.15);
        ctx.strokeStyle = j === 0 ? 'rgba(99, 102, 241, 0.12)' : 'rgba(139, 92, 246, 0.08)';
        ctx.moveTo(0, yOffset);

        for (let x = 0; x < width; x += 30) {
          const y = yOffset + Math.sin(x * 0.003 + time + j) * 45 + Math.cos(x * 0.0015 + time) * 20;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw particle connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(165, 180, 252, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let k = i + 1; k < particles.length; k++) {
          const p2 = particles[k];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 140) * 0.15})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoSrc]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-60" />
      )}

      {/* Cinematic dark vignette overlays ensuring extreme text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080b] via-transparent to-[#08080b]/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080b] via-transparent to-[#08080b]/60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#08080b_85%)] opacity-80" />
    </div>
  );
}
