import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Masaüstü Odaklı (Desktop-Only):
 *    - Mobil ve dokunmatik cihazlarda (telefon/tablet) efekt tamamen devre dışı bırakılır.
 *    - Sıfır CPU/GPU tüketimi ile mobil performansı ve pürüzsüz kaydırma korunur.
 * 2. Cam Tanecikleri Dokusu (Glass Bead Dot Matrix):
 *    - Arkadaki içerikleri bulanıklaştıran "frosted glass" (cam arkası blur) tamamen kaldırılmıştır.
 *    - Noktaların KENDİSİ pırıl pırıl, yarı saydam ve ışığı yansıtan minik cam taneleri (glass beads)
 *      şeklinde render edilir: Yarı saydam gövde, optik çeper ve noktasal beyaz ışık parıltısı (specular glint).
 * 3. Renk Paleti (Koyu Bordodan Bebe Mavisine):
 *    - Koyu bordo (#1c020d) zemin tonundan başlayıp leylak ve lavanta ara tonlarıyla
 *      yumuşak pastel bebe mavisine (#bae6fd / #e0f2fe) uzanan asil renk skalası.
 * 4. Harekete Duyarlılık (Statik Durumda Tamamen Gizli):
 *    - İmleç durduğunda parçacıklar derhal solarak tamamen kaybolur; zemin %100 saf #1c020d kalır.
 * 5. Akışkan Hareket (Easy Ease):
 *    - İz, imlecin peşinden organik bir yaylanma ve momentumla (After Effects Easy Ease) akar.
 */

// Koyu Bordo -> Şarap -> Lavanta/Mürdüm -> Toz Mavi -> Pastel Bebe Mavisi Renk Spektrumu
const HEAD_BABY_BLUE_COLORS = [
  'rgba(248, 250, 252, ',  // Prizmatik kristal beyaz / buz parıltısı (#f8fafc)
  'rgba(224, 242, 254, ',  // Çok açık pastel bebe mavisi (#e0f2fe)
  'rgba(186, 230, 253, ',  // Klasik tatlı bebe mavisi (#bae6fd)
  'rgba(147, 197, 253, ',  // Yumuşak gök mavisi (#93c5fd)
  'rgba(165, 203, 235, ',  // Toz mavi (#a5cbeb)
];

const MID_TRANSITION_COLORS = [
  'rgba(186, 230, 253, ',  // Pastel bebe mavisi (#bae6fd)
  'rgba(165, 203, 235, ',  // Toz mavi (#a5cbeb)
  'rgba(162, 155, 212, ',  // Pastel leylak (#a29bd4)
  'rgba(135, 115, 175, ',  // Yumuşak mürdüm moru (#8773af)
  'rgba(115, 75, 130, ',   // Koyu lavanta erik (#734b82)
];

const TAIL_BORDO_COLORS = [
  'rgba(115, 75, 130, ',   // Koyu lavanta erik (#734b82)
  'rgba(86, 13, 47, ',     // Asil bordo (#560d2f)
  'rgba(56, 5, 30, ',      // Koyu şarap (#38051e)
  'rgba(28, 2, 13, ',      // Saf arka plan bordosu (#1c020d)
];

interface GlassParticle {
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

    // Glass bead particles array
    const particles: GlassParticle[] = [];

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

    const handleMouseLeave = () => {
      lastMoveTime = 0;
    };

    // Main 60/120 FPS Loop
    const render = () => {
      const now = performance.now();
      const isMoving = now - lastMoveTime < 140; // Active movement window

      // 1. Head follows target smoothly
      headX += (targetX - headX) * 0.24;
      headY += (targetY - headY) * 0.24;

      // Calculate instantaneous movement vector
      const moveDx = targetX - prevTargetX;
      const moveDy = targetY - prevTargetY;
      const moveSpeed = Math.hypot(moveDx, moveDy);
      prevTargetX = targetX;
      prevTargetY = targetY;

      // 2. Tail follows with organic Easy Ease spring physics
      const springK = isMoving ? 0.085 : 0.26;
      const damping = isMoving ? 0.72 : 0.60;

      tailVelX = (tailVelX + (headX - tailX) * springK) * damping;
      tailVelY = (tailVelY + (headY - tailY) * springK) * damping;

      tailX += tailVelX;
      tailY += tailVelY;

      // Trail geometry
      const trailDx = tailX - headX;
      const trailDy = tailY - headY;
      const trailDist = Math.hypot(trailDx, trailDy);

      // 3. Spawn Glass Bead particles (Bordodan Bebe Mavisine) ONLY when moving
      if (isMoving && moveSpeed > 0.8 && trailDist > 4) {
        const baseConeWidth = Math.min(Math.max(trailDist * 0.82 + 35, 45), 280);

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

          // Feathering calculation for soft blended edges
          const edgeFeather = Math.max(0, 1 - Math.pow(Math.abs(lateralRatio), 2.4));
          const axisFeather = Math.min(1, t / 0.12) * Math.max(0, (1 - t) / 0.25);
          const combinedFade = edgeFeather * axisFeather;

          if (combinedFade <= 0.02) continue;

          const px = headX + dirX * (t * trailDist) + perpX * lateralOffset;
          const py = headY + dirY * (t * trailDist) + perpY * lateralOffset;
          // Cam taneciği boyutu (1.2px - 3.2px arası organik tanecikler)
          const radius = (Math.random() < 0.65 ? 1.5 : 2.7) * (0.65 + 0.55 * edgeFeather);

          // Renk Spektrumu Seçimi:
          // t = 0 (Apex / Cursor): Bebe Mavisi & Buz Işıltısı
          // t = 0.5 (Mid): Leylak & Lavanta Mürdüm
          // t = 1.0 (Tail): Koyu Şarap & Zemin Bordosu
          let colorPrefix: string;
          if (t < 0.28) {
            colorPrefix = HEAD_BABY_BLUE_COLORS[Math.floor(Math.random() * HEAD_BABY_BLUE_COLORS.length)];
          } else if (t < 0.68) {
            colorPrefix = MID_TRANSITION_COLORS[Math.floor(Math.random() * MID_TRANSITION_COLORS.length)];
          } else {
            colorPrefix = TAIL_BORDO_COLORS[Math.floor(Math.random() * TAIL_BORDO_COLORS.length)];
          }

          particles.push({
            x: px,
            y: py,
            radius,
            colorPrefix,
            alpha: (0.45 + Math.random() * 0.45) * combinedFade,
            decay: 0.038 + Math.random() * 0.048,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
          });
        }
      }

      // 4. Render and Update Glass Bead Particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Fast clean fade out when stopping
        p.alpha -= isMoving ? p.decay : p.decay * 3.0;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const effectiveAlpha = Math.max(0, p.alpha);

        // a. Dış Işık Kırılması / Cam Halosu (Soft Refraction Glow)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${(effectiveAlpha * 0.18).toFixed(3)})`;
        ctx.fill();

        // b. Yarı Saydam Renkli Cam Gövde (Translucent Glass Core)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${(effectiveAlpha * 0.65).toFixed(3)})`;
        ctx.fill();

        // c. İnce Parlak Cam Çeperi (Fresnel Rim)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${p.colorPrefix}${(effectiveAlpha * 0.85).toFixed(3)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // d. Noktasal Işık Yansıması / Pırıltı (Specular Glint - "Pırıl Pırıl Minik Cam Taneleri")
        if (p.radius >= 1.0) {
          const glintDist = p.radius * 0.34;
          const glintRadius = Math.max(0.4, p.radius * 0.32);
          ctx.beginPath();
          ctx.arc(p.x - glintDist, p.y - glintDist, glintRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, effectiveAlpha * 1.35).toFixed(3)})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isDesktop]);

  return (
    <>
      {/* 1. Base Static Background: Pure #1c020d (Always at root / -z-10) */}
      <div
        className="fixed inset-0 pointer-events-none select-none -z-10 bg-[#1c020d]"
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
      />

      {/* 2. Desktop-Only Interactive Glass Bead / Dot-Matrix Canvas Layer */}
      {isDesktop && (
        <div
          className="fixed inset-0 pointer-events-none select-none z-20 overflow-hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
          aria-hidden="true"
        >
          {/* Halftone Glass Bead / Dot Matrix Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none will-change-transform"
            style={{
              width: '100vw',
              height: '100vh',
            }}
          />
        </div>
      )}
    </>
  );
};
