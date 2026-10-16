import React, { useEffect, useRef } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Nokta Nokta (Dot Matrix / Halftone Grain) İz Yapısı:
 *    - Yatay şeritler tamamen kaldırıldı.
 *    - İmlecin arkasından gelen iz, dağınık ve organik nokta parazitlerinden (dot-matrix / halftone grain) oluşur.
 * 2. Üçgen Form ve Yumuşak Kenarlar:
 *    - Noktalar imleçten geriye doğru açılan üçgensel (konik) bir form izler.
 *    - Kenarları ve kuyruk ucu #1c020d bordo zemin içine yumuşakça eriyerek karışır (feathered falloff).
 * 3. Renk Skalası:
 *    - Koyu bordodan elektrik mavisine ve cyan tonlarına uzanan geçiş paleti.
 * 4. Harekete Duyarlılık (Statik Durumda Tamamen Gizli):
 *    - Fare hareketsiz durduğunda ekranda hiçbir efekt veya iz görünmez; zemin %100 saf #1c020d kalır.
 *    - Efekt sadece imleç hareket ettiğinde canlanır, durduğu anda hızla sönümlenir.
 */

// Koyu Bordo -> Mor/Alacakaranlık -> Elektrik Mavisi -> Cyan Renk Paleti
const DOT_PALETTE = [
  // Elektrik Mavisi & Cyan
  'rgba(0, 225, 255, ',     // Neon Cyan
  'rgba(56, 189, 248, ',    // Sky Cyan
  'rgba(46, 91, 255, ',     // Elektrik Mavisi
  'rgba(0, 102, 255, ',     // Derin Elektrik Mavisi
  'rgba(86, 138, 165, ',    // Arduvaz Mavisi (#568aa5)
  // Ara Geçiş Mor & Alacakaranlık
  'rgba(120, 45, 140, ',    // Elektrik Mor
  'rgba(85, 55, 125, ',     // Alacakaranlık Çivit
  'rgba(145, 25, 95, ',     // Fuşya Bordo
  // Koyu Bordo & Şarap
  'rgba(100, 12, 50, ',     // Parlayan Bordo
  'rgba(60, 5, 30, ',       // Derin Bordo
  // Beyaz CRT Fosfor Noktaları
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

  useEffect(() => {
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

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
        lastMoveTime = performance.now();
      }
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
      // When moving fast, tail stretches backwards; when stopping, it quickly snaps to head.
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
        // Base width of the triangle cone expands as trail stretches
        const baseConeWidth = Math.min(Math.max(trailDist * 0.8 + 35, 45), 280);

        // Normalized direction & perpendicular vectors
        const dirX = trailDx / trailDist;
        const dirY = trailDy / trailDist;
        const perpX = -dirY;
        const perpY = dirX;

        // Number of dots scales with speed
        const dotCount = Math.min(Math.floor(moveSpeed * 1.4) + 8, 45);

        for (let i = 0; i < dotCount; i++) {
          // Parametric position along cone axis: 0 (at cursor head) to 1 (at tail)
          // Power curve biases distribution nicely along the trail
          const t = Math.pow(Math.random(), 0.75);

          // Cone half-width at position t
          const maxHalfW = t * (baseConeWidth * 0.5) + 8;

          // Lateral offset inside cone with Gaussian-like clustering
          const lateralRatio = (Math.random() - 0.5) * 2;
          const lateralOffset = lateralRatio * maxHalfW;

          // Feathering calculation:
          // Edge feather: smooth falloff toward lateral boundaries (0 at boundary, 1 at center)
          const edgeFeather = Math.max(0, 1 - Math.pow(Math.abs(lateralRatio), 2.4));
          // Axis feather: soft start at cursor apex, soft fade at trailing tail
          const axisFeather = Math.min(1, t / 0.12) * Math.max(0, (1 - t) / 0.25);

          const combinedFade = edgeFeather * axisFeather;
          if (combinedFade <= 0.02) continue;

          // Position of this dot
          const px = headX + dirX * (t * trailDist) + perpX * lateralOffset;
          const py = headY + dirY * (t * trailDist) + perpY * lateralOffset;

          // Halftone sizing: dots are larger in the central core, smaller at feathered edges
          const radius = (Math.random() < 0.7 ? 1.5 : 2.5) * (0.6 + 0.6 * edgeFeather);

          const colorPrefix = DOT_PALETTE[Math.floor(Math.random() * DOT_PALETTE.length)];

          particles.push({
            x: px,
            y: py,
            radius,
            colorPrefix,
            alpha: (0.35 + Math.random() * 0.45) * combinedFade,
            decay: 0.04 + Math.random() * 0.05, // Fast smooth dissipation
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
          });
        }
      }

      // 4. Render and Update Dot Matrix Particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Particle micro drift
        p.x += p.vx;
        p.y += p.vy;

        // Accelerated decay when stationary so screen is 100% clean immediately
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
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animId);
    };
  }, []);

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
      {/* Interactive Dot Matrix / Particle Grain Trail Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          width: '100vw',
          height: '100vh',
        }}
      />
    </div>
  );
};
