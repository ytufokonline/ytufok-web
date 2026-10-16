import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Sabit Arka Plan: Doğrudan ve sabit #23000e (başka hiçbir bordo tonu olmadan, düz zemin).
 * 2. Glitch & Noise Efekti: İmleç hareket ettikçe imleç etrafında oluşan hafif, modern dijital
 *    parazit, kamera sensör ISO greni ve mikro kromatik glitch sızıntıları.
 * 3. Renk Skalası: #23000e ile #568aa5 arasındaki spektrum ara tonları (şarap/erik, alacakaranlık,
 *    arduvaz mavisi, cyan ışıma).
 * 4. Apple Estetiği: Asil, kontrollü ve minimalist. İmleç durduğunda glitch kaybolur, ışık yumuşakça
 *    parlamaya devam eder.
 */

// #23000e (Koyu Bordo) <-> #568aa5 (Mavi/Gri) geçiş spektrumundan renkler
const SPECTRUM_PALETTE = [
  'rgba(86, 138, 165, ',   // Slate Blue (#568aa5)
  'rgba(112, 157, 181, ',  // Luminous Slate Cyan (#709db5)
  'rgba(74, 104, 125, ',   // Dusk Blue (#4a687d)
  'rgba(70, 70, 94, ',     // Twilight Slate Violet (#46465e)
  'rgba(91, 40, 61, ',     // Muted Wine Plum (#5b283d)
  'rgba(102, 40, 72, ',    // Luminous Plum (#662848)
  'rgba(130, 178, 202, ',  // Specular Highlight (#82b2ca)
];

interface GlitchParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface GlitchSlice {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alpha: number;
  decay: number;
}

export const AtmosphericBackground: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animId: number;
    let hasInitialized = false;

    // Coordinate trackers
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let prevTargetX = targetX;
    let prevTargetY = targetY;

    // Glitch entities
    const particles: GlitchParticle[] = [];
    const slices: GlitchSlice[] = [];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const setTransform = (x: number, y: number) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    setTransform(currentX, currentY);

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasInitialized) {
        currentX = targetX;
        currentY = targetY;
        hasInitialized = true;
      }

      setIsVisible(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;

        if (!hasInitialized) {
          currentX = targetX;
          currentY = targetY;
          hasInitialized = true;
        }

        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Main 60/120 FPS Animation Loop
    const render = () => {
      // 1. Smooth lerp for the ambient spotlight
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        currentX += dx * 0.15;
        currentY += dy * 0.15;
        setTransform(currentX, currentY);
      }

      // 2. Measure mouse speed / velocity
      const moveDx = targetX - prevTargetX;
      const moveDy = targetY - prevTargetY;
      const speed = Math.hypot(moveDx, moveDy);
      prevTargetX = targetX;
      prevTargetY = targetY;

      // 3. Spawn Glitch Noise when cursor is moving
      if (speed > 1.2 && isVisible) {
        // Spawn 2-5 micro digital noise pixels in cursor aura
        const particleCount = Math.min(Math.floor(speed * 0.4) + 1, 6);
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.pow(Math.random(), 0.7) * 220; // Concentrated around cursor
          const colorPrefix = SPECTRUM_PALETTE[Math.floor(Math.random() * SPECTRUM_PALETTE.length)];
          particles.push({
            x: currentX + Math.cos(angle) * dist,
            y: currentY + Math.sin(angle) * dist,
            size: Math.random() < 0.75 ? 1.5 : 2.5, // Crisp rectangular/pixel dot
            color: colorPrefix,
            alpha: 0.25 + Math.random() * 0.35,
            decay: 0.04 + Math.random() * 0.05,
          });
        }

        // Fast flickers: subtle horizontal digital scan slice
        if (speed > 4.0 && Math.random() < 0.45) {
          const sliceWidth = 25 + Math.random() * 65;
          const sliceHeight = Math.random() < 0.8 ? 1 : 2;
          const offsetX = (Math.random() - 0.5) * 160;
          const offsetY = (Math.random() - 0.5) * 90;
          const colorPrefix = SPECTRUM_PALETTE[Math.floor(Math.random() * SPECTRUM_PALETTE.length)];
          slices.push({
            x: currentX + offsetX - sliceWidth / 2,
            y: currentY + offsetY,
            w: sliceWidth,
            h: sliceHeight,
            color: colorPrefix,
            alpha: 0.20 + Math.random() * 0.28,
            decay: 0.12 + Math.random() * 0.08, // Quick disappear (1-3 frames)
          });
        }
      }

      // 4. Draw Glitch & Noise Layer on Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render horizontal chromatic micro-slices
      for (let i = slices.length - 1; i >= 0; i--) {
        const slice = slices[i];
        ctx.fillStyle = `${slice.color}${Math.max(slice.alpha, 0)})`;
        ctx.fillRect(slice.x, slice.y, slice.w, slice.h);

        slice.alpha -= slice.decay;
        if (slice.alpha <= 0) {
          slices.splice(i, 1);
        }
      }

      // Render micro digital grain particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = `${p.color}${Math.max(p.alpha, 0)})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);

        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animId);
    };
  }, [isVisible]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#23000e]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#23000e',
      }}
      aria-hidden="true"
    >
      {/* 1. Underlying Soft Ambient Halo (#568aa5 & Spectrum) */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 pointer-events-none will-change-transform"
        style={{
          width: '680px',
          height: '680px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.45s ease',
        }}
      >
        {/* Outer Broad Luminous Halo (#568aa5) */}
        <div
          className="w-full h-full rounded-full cursor-spotlight-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(86, 138, 165, 0.28) 0%, rgba(74, 104, 125, 0.16) 32%, rgba(35, 0, 14, 0.02) 60%, transparent 75%)',
            filter: 'blur(52px)',
          }}
        />

        {/* Inner Soft Accent Core for deep optical glow */}
        <div
          className="absolute inset-[24%] rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(130, 178, 202, 0.26) 0%, rgba(86, 138, 165, 0.12) 42%, transparent 70%)',
            filter: 'blur(32px)',
          }}
        />
      </div>

      {/* 2. Interactive Digital Glitch & Sensor Noise Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          width: '100vw',
          height: '100vh',
        }}
      />

      {/* 3. Subtle Film Grain Texture to prevent digital banding */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
