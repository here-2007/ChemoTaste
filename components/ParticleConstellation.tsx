// components/ParticleConstellation.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  origX: number;
  origY: number;
  origZ: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  pulsePhase: number;
  pulseSpeed: number;
  isAmbient: boolean;
}

const CHROMATIC_PALETTE = [
  '#8052ff', // Electric Iris
  '#ffb829', // Saffron Spark
  '#15846e', // Deep Verdant
  '#38bdf8', // Sky Blue
  '#ec4899', // Vivid Magenta
  '#ffffff', // Bone White
  '#a855f7', // Violet
  '#10b981', // Emerald
];

export const ParticleConstellation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth ?? 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight ?? 600);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate brain/sensory receptor dual-hemisphere constellation
    const particles: Particle[] = [];
    const NUM_BRAIN_PARTICLES = 420;
    const NUM_AMBIENT_PARTICLES = 60;

    // 1. Brain hemisphere particles
    for (let i = 0; i < NUM_BRAIN_PARTICLES; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 140;

      // Ellipsoidal distortion into brain hemispheres
      const hemisphere = Math.random() > 0.5 ? 1 : -1;
      const x = r * Math.sin(phi) * Math.cos(theta) * 1.1 + hemisphere * 28;
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.95 - 15;
      const z = r * Math.cos(phi) * 0.85;

      const color = CHROMATIC_PALETTE[Math.floor(Math.random() * CHROMATIC_PALETTE.length)];
      particles.push({
        x,
        y,
        z,
        origX: x,
        origY: y,
        origZ: z,
        size: Math.random() * 2.5 + 1.2,
        color,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        isAmbient: false,
      });
    }

    // 2. Ambient drifting particles across the void
    for (let i = 0; i < NUM_AMBIENT_PARTICLES; i++) {
      const x = (Math.random() - 0.5) * 600;
      const y = (Math.random() - 0.5) * 600;
      const z = (Math.random() - 0.5) * 400;
      const color = CHROMATIC_PALETTE[Math.floor(Math.random() * CHROMATIC_PALETTE.length)];
      particles.push({
        x,
        y,
        z,
        origX: x,
        origY: y,
        origZ: z,
        size: Math.random() * 2.0 + 1.0,
        color,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        isAmbient: true,
      });
    }

    let angleY = 0;
    let angleX = 0.15;

    // Interactive mouse parallax
    let targetAngleY = 0;
    let targetAngleX = 0.15;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / width - 0.5;
      const mouseY = (e.clientY - rect.top) / height - 0.5;
      targetAngleY = mouseX * 0.6;
      targetAngleX = 0.15 + mouseY * 0.4;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth camera interpolation
      angleY += (targetAngleY - angleY) * 0.04 + 0.003;
      angleX += (targetAngleX - angleX) * 0.04;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const fov = 340;
      const centerX = width / 2;
      const centerY = height / 2;

      // Sort particles by depth for correct 3D perspective
      const projected = particles.map(p => {
        p.rotation += p.rotSpeed;
        p.pulsePhase += p.pulseSpeed;

        // Rotate around Y and X
        const x1 = p.origX * cosY - p.origZ * sinY;
        const z1 = p.origZ * cosY + p.origX * sinY;

        const y2 = p.origY * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.origY * sinX;

        // Apply perspective
        const scale = fov / (fov + z2 + 300);
        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;

        const alpha = Math.max(0.15, Math.min(1.0, (scale - 0.3) * 1.4));
        const pulse = 1.0 + Math.sin(p.pulsePhase) * 0.2;

        return {
          screenX,
          screenY,
          scale,
          z2,
          alpha: p.isAmbient ? alpha * 0.4 : alpha,
          size: p.size * scale * pulse,
          color: p.color,
          rotation: p.rotation,
        };
      });

      projected.sort((a, b) => b.z2 - a.z2);

      // Draw triangular glyphs
      for (const p of projected) {
        if (p.screenX < -20 || p.screenX > width + 20 || p.screenY < -20 || p.screenY > height + 20) {
          continue;
        }

        ctx.save();
        ctx.translate(p.screenX, p.screenY);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;

        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.866, s * 0.5);
        ctx.lineTo(-s * 0.866, s * 0.5);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
    </div>
  );
};
