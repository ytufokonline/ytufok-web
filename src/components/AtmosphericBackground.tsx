import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Masaüstü Odaklı (Desktop-Only):
 *    - Mobil ve dokunmatik cihazlarda (telefon/tablet) efekt tamamen devre dışı bırakılır.
 *    - Sıfır CPU/GPU tüketimi ile mobil performansı ve pürüzsüz kaydırma korunur.
 * 2. Nokta Nokta (Dot Matrix / Halftone Grain) İz:
 *    - İmlecin arkasından yönelimli üçgensel bir koni şeklinde süzülen nokta parçacıkları.
 * 3. Harekete Duyarlılık (Statik Durumda Tamamen Gizli):
 *    - Fare durduğunda ekranda hiçbir nokta veya iz kalmaz; zemin %100 saf #1c020d bordo olur.
 */

// Koyu Bordo -> Mor/Alacakaranlık -> Elektrik Mavisi -> Cyan Renk Paleti
const DOT_PALETTE = [
  'rgba(0, 225, 255, ',     // Neon Cyan
  'rgba(56, 189, 248, ',    // Sky Cyan
  'rgba(46, 91, 255, ',     // Elektrik Mavisi
  'rgba(0, 102, 255, ',     // Derin Elektrik Mavisi
  'rgba(86, 138, 165, ',    // Arduvaz Mavisi (#568aa5)
  'rgba(120, 45, 140, ',    // Elektrik Mor
  'rgba(85, 55, 125, ',     // Alacakaranlık Çivit
  'rgba(145, 25, 95, ',     // Fuşya Bordo
  'rgba(100, 12, 50, ',     // Parlayan Bordo
  'rgba(60, 5, 30, ',       // Derin Bordo
  'rgba(255, 255, 255, ',   // Saf Beyaz Vurgu
];

interface DotParticle {
  x: number;
  y: number;
  radius: number;
  colorPrefix: string;
  alpha: number;
  decay: number;
  vx: number;
  vy: number;
}

export const AtmosphericBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mobil / Dokunmatik tespit mekanizması (yalnızca hassas imleç ve masaüstü genişlik)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return hasFinePointer && window.innerWidth >= 768;
  });

  useEffect(() => {
    const checkDevice = () => {
      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const isWide = window.innerWidth >= 768;
      setIsDesktop(hasFinePointer && isWide);
    };

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    // Mobil veya dokunmatik ekranlarda animasyon döngüsünü ve dinleyicileri hiç başlatma
    if (!isDesktop) return;

    let animId: number;

    // Head (Cursor Apex)
    let headX = window.innerWidth / 2;
    let headY = window.innerHeight / 2;
    let targetX = headX;
    let targetY = headY;

    // Movement tracking
    let prevTargetX = targetX;
    let prevTargetY = targetY;
    let lastMoveTime = 0;

    // Tail for triangle trail
    let tailX = headX;
    let tailY = headY;
    let tailVelX = 0;
    let tailVelY = 0;

    // Dot matrix particles array
    const particles: DotParticle[] = [];

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

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      lastMoveTime = performance.now();
    };

    // Main 60/120 FPS Loop
    const render = () => {
      const now = performance.now();
      const isMoving = now - lastMoveTime < 180; // Active movement window

      // 1. Head follows target smoothly
      headX += (targetX - headX) * 0.22;
      headY += (targetY - headY) * 0.22;

      // Calculate instantaneous movement vector
      const moveDx = targetX - prevTargetX;
      const moveDy = targetY - prevTargetY;
      const moveSpeed = Math.hypot(moveDx, moveDy);
      prevTargetX = targetX;
      prevTargetY = targetY;

      // 2. Tail follows with organic Easy Ease spring physics
      const springK = isMoving ? 0.08 : 0.25;
      const damping = isMoving ? 0.72 : 0.60;

      tailVelX = (tailVelX + (headX - tailX) * springK) * damping;
      tailVelY = (tailVelY + (headY - tailY) * springK) * damping;

      tailX += tailVelX;
      tailY += tailVelY;

      // Trail geometry
      const trailDx = tailX - headX;
      const trailDy = tailY - headY;
      const trailDist = Math.hypot(trailDx, trailDy);

      // 3. Spawn Dot Matrix particles ONLY when actively moving
      if (isMoving && moveSpeed > 0.8 && trailDist > 4) {
        const baseConeWidth = Math.min(Math.max(trailDist * 0.8 + 35, 45), 280);

        const dirX = trailDx / trailDist;
        const dirY = trailDy / trailDist;
        const perpX = -dirY;
        const perpY = dirX;

        const dotCount = Math.min(Math.floor(moveSpeed * 1.4) + 8, 45);

        for (let i = 0; i < dotCount; i++) {
          const t = Math.pow(Math.random(), 0.75);
          const maxHalfW = t * (baseConeWidth * 0.5) + 8;
          const lateralRatio = (Math.random() - 0.5) * 2;
          const lateralOffset = lateralRatio * maxHalfW;

          // Feathering calculation
          const edgeFeather = Math.max(0, 1 - Math.pow(Math.abs(lateralRatio), 2.4));
          const axisFeather = Math.min(1, t / 0.12) * Math.max(0, (1 - t) / 0.25);
          const combinedFade = edgeFeather * axisFeather;

          if (combinedFade <= 0.02) continue;

          const px = headX + dirX * (t * trailDist) + perpX * lateralOffset;
          const py = headY + dirY * (t * trailDist) + perpY * lateralOffset;
          const radius = (Math.random() < 0.7 ? 1.5 : 2.5) * (0.6 + 0.6 * edgeFeather);
          const colorPrefix = DOT_PALETTE[Math.floor(Math.random() * DOT_PALETTE.length)];

          particles.push({
            x: px,
            y: py,
            radius,
            colorPrefix,
            alpha: (0.35 + Math.random() * 0.45) * combinedFade,
            decay: 0.04 + Math.random() * 0.05,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
          });
        }
      }

      // 4. Render and Update Dot Matrix Particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Fast clean fade out when stopping
        p.alpha -= isMoving ? p.decay : p.decay * 2.2;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${Math.max(p.alpha, 0)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [isDesktop]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#1c020d]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1c020d',
      }}
      aria-hidden="true"
    >
      {/* Sadece masaüstünde render edilir; mobil cihazlarda DOM ve GPU yükü 0'dır */}
      {isDesktop && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none will-change-transform"
          style={{
            width: '100vw',
            height: '100vh',
          }}
        />
      )}
    </div>
  );
};
