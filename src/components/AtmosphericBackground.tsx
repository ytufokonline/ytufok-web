import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * Apple-inspired cursor-following spotlight effect over a solid #1f0814 bordo canvas:
 * 1. Sabit Arka Plan: Pure solid #1f0814 (flat burgundy canvas, no background gradients or static patterns).
 * 2. İmleç Odaklı Efekt: Circular, softly diffused glowing spotlight (#568aa5) following the user's cursor.
 * 3. Birebir & Gecikmesiz Takip: 0ms lag-free, direct 1:1 cursor synchronization with exact center alignment.
 * 4. Etkileşim: İmleç durduğunda ışık imlecin etrafında yumuşakça parlamaya/nefes almaya devam eder.
 * 5. Metin Okunabilirliği: High-contrast ambient illumination (opacity ~0.30 core, soft blur), completely
 *    non-blocking (pointer-events-none, z-0).
 */
export const AtmosphericBackground: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial centering
    const initX = window.innerWidth / 2;
    const initY = window.innerHeight / 2;

    const setPosition = (x: number, y: number) => {
      if (spotlightRef.current) {
        // Direct hardware-accelerated transform with exact -50% centering on cursor coordinates
        spotlightRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    // Set initial position
    setPosition(initX, initY);

    const handleMouseMove = (e: MouseEvent) => {
      // 0ms lag-free, instantaneous direct 1:1 cursor tracking
      setPosition(e.clientX, e.clientY);
      setIsVisible(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setPosition(e.touches[0].clientX, e.touches[0].clientY);
        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
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
      {/* Cursor-Following Instant Spotlight (#568aa5 slate/blue luminous aura) */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 pointer-events-none will-change-transform"
        style={{
          width: '680px',
          height: '680px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* Outer Broad Luminous Halo (#568aa5) */}
        <div
          className="w-full h-full rounded-full cursor-spotlight-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(86, 138, 165, 0.32) 0%, rgba(86, 138, 165, 0.18) 32%, rgba(86, 138, 165, 0.05) 58%, transparent 75%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Inner Soft Accent Core for deep optical glow */}
        <div
          className="absolute inset-[25%] rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(142, 195, 220, 0.28) 0%, rgba(86, 138, 165, 0.12) 42%, transparent 70%)',
            filter: 'blur(30px)',
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
