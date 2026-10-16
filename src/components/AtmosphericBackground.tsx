import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Masaüstü Odaklı (Desktop-Only):
 *    - Mobil ve dokunmatik cihazlarda (telefon/tablet) efekt tamamen devre dışı bırakılır.
 *    - Sıfır CPU/GPU tüketimi ile mobil performansı ve pürüzsüz kaydırma korunur.
 * 2. Saf Nokta Yapısı (Pure Crisp Dot-Matrix Grain):
 *    - Cam, buzlu cam (frosted glass), arka plan bulanıklığı veya parıltı/halo efektleri tamamen kaldırılmıştır.
 *    - İz parçacıkları %100 saf, net, keskin ve düz noktalardan (dot-matrix particles) oluşur.
 * 3. Renk Skalası (Bordodan Bebe Mavisine):
 *    - Koyu bordo (#1c020d) zemin tonundan başlayıp leylak ve lavanta ara tonlarıyla
 *      imleç çevresinde yumuşak pastel bebe mavisine (#bae6fd / #e0f2fe) uzanan asil renk paleti.
 * 4. Harekete Duyarlılık (Statik Durumda Tamamen Gizli):
 *    - İmleç durduğu an noktalar hızla solarak tamamen kaybolur; zemin %100 saf ve lekesiz #1c020d kalır.
 * 5. Akışkan Hareket (Easy Ease):
 *    - Noktalar, imlecin peşinden organik bir yaylanma ve momentumla (After Effects Easy Ease) akar.
 */

// Koyu Bordo -> Derin Vişneçürüğü -> Slate Mavi -> Parlak & Enerjik Bebe Mavisi Renk Spektrumu
const HEAD_BABY_BLUE_COLORS = [
  'rgba(240, 249, 255, ',  // Prizmatik kristal buz parıltısı (#f0f9ff)
  'rgba(195, 235, 255, ',  // Parlak elektrik bebe mavisi (#c3ebff)
  'rgba(165, 218, 252, ',  // Luminous pastel gök mavisi (#a5dafc)
  'rgba(138, 198, 248, ',  // Işıltılı canlı mavi (#8ac6f8)
  'rgba(180, 210, 255, ',  // Parlak yumuşak mavi (#b4d2ff)
];

const MID_TRANSITION_COLORS = [
  'rgba(175, 215, 250, ',  // Parlak bebe mavisi (#afd7fa)
  'rgba(130, 180, 220, ',  // Yumuşak çelik mavisi (#82b4dc)
  'rgba(86, 138, 165, ',   // Slate blue / kulüp çeliği (#568aa5)
  'rgba(65, 95, 125, ',    // Koyu dumanlı çelik (#415f7d)
  'rgba(72, 12, 34, ',     // Koyu asil vişneçürüğü geçiş (#480c22)
];

const TAIL_BORDO_COLORS = [
  'rgba(72, 12, 34, ',     // Koyu asil vişneçürüğü (#480c22)
  'rgba(58, 8, 28, ',      // Derin vişne tonu (#3a081c)
  'rgba(45, 5, 22, ',      // Zeminle kaynaşan koyu bordo (#2d0516)
  'rgba(35, 3, 17, ',      // Derin zemin bordosu (#230311)
  'rgba(28, 2, 13, ',      // Saf zemin bordosu (#1c020d)
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

    // Head (Cursor Apex) - Birebir imlece kilitli
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

    // Pure dot matrix particles array
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

    const handleMouseLeave = () => {
      lastMoveTime = 0;
    };

    // Main 60/120 FPS Loop
    const render = () => {
      const now = performance.now();
      const isMoving = now - lastMoveTime < 140; // Active movement window

      // 1. Head follows target directly (Birebir & Gecikmesiz imleç takibi)
      headX = targetX;
      headY = targetY;

      // Calculate instantaneous movement vector
      const moveDx = targetX - prevTargetX;
      const moveDy = targetY - prevTargetY;
      const moveSpeed = Math.hypot(moveDx, moveDy);
      prevTargetX = targetX;
      prevTargetY = targetY;

      // 2. Tail follows with organic Easy Ease spring physics
      const springK = isMoving ? 0.14 : 0.30;
      const damping = isMoving ? 0.76 : 0.62;

      tailVelX = (tailVelX + (headX - tailX) * springK) * damping;
      tailVelY = (tailVelY + (headY - tailY) * springK) * damping;

      tailX += tailVelX;
      tailY += tailVelY;

      // Trail geometry
      const trailDx = tailX - headX;
      const trailDy = tailY - headY;
      const trailDist = Math.hypot(trailDx, trailDy);

      // 3. Spawn Pure Dot Matrix particles (Bordodan Bebe Mavisine - Parlak ve Enerjik)
      if (isMoving && moveSpeed > 0.8 && trailDist > 4) {
        const baseConeWidth = Math.min(Math.max(trailDist * 0.80 + 35, 45), 260);

        const dirX = trailDx / trailDist;
        const dirY = trailDy / trailDist;
        const perpX = -dirY;
        const perpY = dirX;

        // Yoğunluk ve enerji artırıldı: belirgin, canlı ve parlak dot-matrix glitch izi
        const dotCount = Math.min(Math.floor(moveSpeed * 1.3) + 6, 36);

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
          // Parlak ve net nokta boyutu
          const radius = (Math.random() < 0.7 ? 1.4 : 2.4) * (0.7 + 0.5 * edgeFeather);

          // Renk Spektrumu Seçimi (Parlak ve Enerjik Bebe Mavisi -> Bordo):
          // t = 0 (Apex / Cursor): Parlak Elektrik Bebe Mavisi & Buz Işıltısı
          // t = 0.5 (Mid): Canlı Leylak, Lavanta & Mürdüm
          // t = 1.0 (Tail): Koyu Asil Şarap & Zemin Bordosu
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
            // Işık şiddeti artırıldı: belirgin, parlak ve enerjik opaklık (0.45 - 0.90)
            alpha: (0.45 + Math.random() * 0.45) * combinedFade,
            decay: 0.038 + Math.random() * 0.045,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
          });
        }
      }

      // 4. Render and Update Pure Dot Matrix Particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Fast clean fade out when stopping
        p.alpha -= isMoving ? p.decay : p.decay * 3.5;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const effectiveAlpha = Math.max(0, p.alpha);

        // Saf, net, düz nokta çizimi
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${effectiveAlpha.toFixed(3)})`;
        ctx.fill();
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
      {/* 1. Base Background: Deep Bordo Dominant with Delicate Ultra-Smooth Baby-Blue Ambient Breath */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
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
        {/* A. Deep foundational linear gradient (Tamamen asil ve derin koyu bordo baz) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(150deg, #150109 0%, #1c020d 30%, #220312 60%, #1a020e 85%, #15010a 100%)',
          }}
        />

        {/* B. Multi-layered ultra-smooth radial mesh (Çok hafif, zarif ve pürüzsüz bebe mavisi stüdyo ışıltısı) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(120% 80% at 82% 16%, rgba(145, 205, 245, 0.08) 0%, rgba(86, 138, 165, 0.03) 38%, transparent 70%),
              radial-gradient(100% 70% at 14% 78%, rgba(130, 190, 235, 0.06) 0%, rgba(70, 115, 145, 0.02) 35%, transparent 65%),
              radial-gradient(85% 55% at 50% -2%, rgba(165, 218, 252, 0.09) 0%, rgba(86, 138, 165, 0.03) 40%, transparent 68%),
              radial-gradient(110% 90% at 50% 50%, rgba(42, 5, 22, 0.45) 0%, rgba(28, 2, 13, 0.85) 75%, transparent 100%)
            `,
          }}
        />

        {/* C. Soft & Delicate Floating Ambient Studio Luminescence (Çok hafif, zarif süzülen bulutlar) */}
        <div className="absolute -top-[15%] right-[5%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-sky-300/[0.08] via-[#568aa5]/[0.04] to-transparent blur-[140px] pointer-events-none ambient-aurora-top" />
        <div className="absolute top-[35%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-sky-400/[0.06] via-[#416982]/[0.03] to-transparent blur-[150px] pointer-events-none ambient-aurora-bottom" />
        <div className="absolute bottom-[5%] right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-l from-sky-200/[0.05] via-[#2d071b]/[0.20] to-transparent blur-[130px] pointer-events-none ambient-aurora-right" />

        {/* D. Deep Corner Vignette to firmly anchor edges into noble #1c020d */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 135% 105% at 50% 50%, transparent 35%, rgba(28, 2, 13, 0.75) 80%, #1c020d 100%)',
          }}
        />
      </div>

      {/* 2. Desktop-Only Interactive Pure Dot-Matrix Canvas Layer */}
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
          {/* Pure Dot Matrix Canvas */}
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
