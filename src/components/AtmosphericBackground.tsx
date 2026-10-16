import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * Apple-inspired cursor-following spotlight effect over a solid #1f0814 bordo canvas:
 * 1. Sabit Arka Plan: Pure solid #1f0814 (flat burgundy canvas, no background gradients or static patterns).
 * 2. İmleç Odaklı Efekt: Circular, softly diffused glowing spotlight (#568aa5) following the user's cursor.
 * 3. Etkileşim: Buttery-smooth gliding physics via requestAnimationFrame + LERP (linear interpolation).
 *    When cursor stops, the spotlight gently glows and breathes in place.
 * 4. Metin Okunabilirliği: High-contrast ambient illumination (opacity 0.28 core, soft blur), completely
 *    non-blocking (pointer-events-none, z-0, hardware accelerated 60/120 FPS).
 */
export const AtmosphericBackground: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let animId: number;
    // Current interpolated position
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    // Target pointer position
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let hasMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        setIsVisible(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
        if (!hasMoved) {
          hasMoved = true;
          setIsVisible(true);
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // 60/120 FPS silky gliding physics using LERP
    const updateMotion = () => {
      // 0.085 interpolation factor gives that heavy-air, cushioned, elegant Apple gliding response
      currentX += (targetX - currentX) * 0.085;
      currentY += (targetY - currentY) * 0.085;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      animId = requestAnimationFrame(updateMotion);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    animId = requestAnimationFrame(updateMotion);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#1f0814]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1f0814',
      }}
      aria-hidden="true"
    >
      {/* Cursor-Following Fluid Spotlight (#568aa5 slate/blue luminous aura) */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform"
        style={{
          width: '720px',
          height: '720px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Outer Broad Luminous Halo (#568aa5) */}
        <div
          className="w-full h-full rounded-full cursor-spotlight-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(86, 138, 165, 0.30) 0%, rgba(86, 138, 165, 0.16) 35%, rgba(86, 138, 165, 0.04) 62%, transparent 75%)',
            filter: 'blur(55px)',
          }}
        />

        {/* Inner Soft Accent Core for deep optical glow */}
        <div
          className="absolute inset-[24%] rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(142, 195, 220, 0.24) 0%, rgba(86, 138, 165, 0.10) 45%, transparent 70%)',
            filter: 'blur(35px)',
          }}
        />
      </div>

      {/* Subtle Micro-Grain Texture preventing OLED/Retina display color quantization */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
