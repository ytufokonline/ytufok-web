import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Su Yüzeyi Efekti (Water Ripple / Fluid Simulation):
 *    - İmleç hareket ettiğinde koyu bordo su yüzeyinde organik dalgalanmalar (water ripples)
 *      ve sıvı kırılmaları (fluid caustics) oluşturur.
 *    - Dalgalar dışa doğru genişlerken bebe mavisi ışıltılı tepe çizgisi (crest) ve
 *      derin vişneçürüğü dalga çukuru (trough) ile sıvı hacmi kazanır.
 * 2. Easy Ease İvmelenmesi (After Effects S-Curve):
 *    - Sıvı takibi ve dalga oluşumu yumuşak yaylanma ve momentumla (S-Curve) akar;
 *      hareketin başlangıcı ve sonu organik olarak süzülür.
 * 3. Statik Durumda Tamamen Gizli (100% Hidden When Stationary):
 *    - İmleç durduğu an mevcut dalgalar hızla sönümlenerek kaybolur; zemin %100 saf ve lekesiz koyu bordo kalır.
 * 4. Sadece Masaüstü (Desktop-Only):
 *    - Mobil ve dokunmatik cihazlarda efekt ve olay dinleyicileri tamamen devre dışıdır.
 */

interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  strength: number;
  currentStrength: number;
  decay: number;
  thickness: number;
  aspectRatio: number;
  angle: number;
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

    // Easy Ease Smooth Position & Physics
    let smoothX = window.innerWidth / 2;
    let smoothY = window.innerHeight / 2;
    let smoothVelX = 0;
    let smoothVelY = 0;

    let targetX = smoothX;
    let targetY = smoothY;

    // Spawn distance tracking
    let lastSpawnX = smoothX;
    let lastSpawnY = smoothY;
    let lastMoveTime = 0;

    // Water ripples collection
    const ripples: WaterRipple[] = [];

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

    // Main 60/120 FPS Fluid Simulation Loop
    const render = () => {
      const now = performance.now();
      const isMoving = now - lastMoveTime < 140;

      // 1. Easy Ease (After Effects S-Curve) spring & damping physics
      const targetDx = targetX - smoothX;
      const targetDy = targetY - smoothY;
      const dist = Math.hypot(targetDx, targetDy);

      // Adaptive spring factor for S-Curve acceleration
      const springK = isMoving ? Math.min(0.20, 0.08 + Math.pow(dist / 220, 1.2) * 0.12) : 0.25;
      const damping = isMoving ? 0.80 : 0.68;

      smoothVelX = (smoothVelX + targetDx * springK) * damping;
      smoothVelY = (smoothVelY + targetDy * springK) * damping;

      smoothX += smoothVelX;
      smoothY += smoothVelY;

      const moveSpeed = Math.hypot(smoothVelX, smoothVelY);

      // 2. Spawn Organic Water Ripples on movement
      const spawnDx = smoothX - lastSpawnX;
      const spawnDy = smoothY - lastSpawnY;
      const spawnDist = Math.hypot(spawnDx, spawnDy);

      if (isMoving && spawnDist > 14 && moveSpeed > 0.6) {
        lastSpawnX = smoothX;
        lastSpawnY = smoothY;

        const angle = Math.atan2(smoothVelY, smoothVelX);
        const maxRadius = Math.min(75 + moveSpeed * 5.2, 230);
        const initialSpeed = 1.6 + Math.min(moveSpeed * 0.12, 3.0);
        const strength = Math.min(0.35 + moveSpeed * 0.05, 0.90);
        const aspectRatio = Math.min(1.0 + moveSpeed * 0.025, 1.40);
        const thickness = 1.4 + Math.min(moveSpeed * 0.12, 3.0);

        ripples.push({
          x: smoothX,
          y: smoothY,
          radius: 4,
          maxRadius,
          speed: initialSpeed,
          strength,
          currentStrength: strength,
          decay: 0.015 + Math.random() * 0.006,
          thickness,
          aspectRatio,
          angle,
        });
      }

      // 3. Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 4. Render Fluid Wake Caustics at Cursor Apex during motion
      if (isMoving && moveSpeed > 0.6) {
        const wakeRadius = Math.min(22 + moveSpeed * 2.8, 70);
        const wakeAlpha = Math.min(0.22, moveSpeed * 0.028);
        const grad = ctx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, wakeRadius);
        grad.addColorStop(0, `rgba(185, 230, 255, ${wakeAlpha.toFixed(3)})`);
        grad.addColorStop(0.35, `rgba(86, 138, 165, ${(wakeAlpha * 0.45).toFixed(3)})`);
        grad.addColorStop(0.7, `rgba(45, 6, 25, ${(wakeAlpha * 0.3).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(28, 2, 13, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(smoothX, smoothY, wakeRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Propagate & Render Water Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.speed *= 0.985; // Viscous water drag
        r.currentStrength -= isMoving ? r.decay : r.decay * 2.2;

        if (r.currentStrength <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        const progress = r.radius / r.maxRadius;
        // Sinusoidal crest/trough wave profile
        const waveAlpha = Math.max(0, r.currentStrength * Math.sin((1 - progress) * Math.PI));

        if (waveAlpha > 0.003) {
          const rx = r.radius * r.aspectRatio;
          const ry = r.radius;

          ctx.save();
          ctx.translate(r.x, r.y);
          ctx.rotate(r.angle);

          // A. Water Wave Trough (İç derinlik vişneçürüğü gölgesi)
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(1, rx - r.thickness), Math.max(1, ry - r.thickness), 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(38, 4, 19, ${(waveAlpha * 0.55).toFixed(3)})`;
          ctx.lineWidth = r.thickness * 1.3;
          ctx.stroke();

          // B. Primary Water Wave Crest (Dış su yüzeyi ışıltısı - Bebe mavisi yansıma)
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(180, 228, 255, ${(waveAlpha * 0.75).toFixed(3)})`;
          ctx.lineWidth = r.thickness;
          ctx.stroke();

          // C. Secondary micro-ring for realistic water wave interference
          if (r.radius > 22 && progress < 0.75) {
            const innerProgress = (r.radius - 16) / r.maxRadius;
            const innerAlpha = waveAlpha * 0.45 * Math.sin((1 - innerProgress) * Math.PI);
            if (innerAlpha > 0.003) {
              ctx.beginPath();
              ctx.ellipse(0, 0, Math.max(1, rx - 16), Math.max(1, ry - 16), 0, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(145, 205, 245, ${innerAlpha.toFixed(3)})`;
              ctx.lineWidth = r.thickness * 0.75;
              ctx.stroke();
            }
          }

          ctx.restore();
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
      {/* 1. Base Background: Deep Bordo Dominant with Perfectly Symmetric Ultra-Smooth Baby-Blue Studio Balance */}
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
        {/* A. Deep foundational linear gradient (Kusursuz dikey simetri, saf koyu bordo) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #150109 0%, #1c020d 25%, #220313 50%, #1c020d 75%, #15010a 100%)',
          }}
        />

        {/* B. Multi-layered ultra-smooth radial mesh (Sol ve sağ tarafa eşit dağılmış simetrik stüdyo ışıltısı) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              /* Sol stüdyo ambiyans lobu (X: 15%, Y: 22%) */
              radial-gradient(95% 65% at 15% 22%, rgba(145, 205, 245, 0.08) 0%, rgba(86, 138, 165, 0.03) 40%, transparent 72%),
              /* Sağ stüdyo ambiyans lobu (X: 85%, Y: 22% - Birebir Simetrik) */
              radial-gradient(95% 65% at 85% 22%, rgba(145, 205, 245, 0.08) 0%, rgba(86, 138, 165, 0.03) 40%, transparent 72%),
              /* Alt-Sol yansıma (X: 18%, Y: 78%) */
              radial-gradient(90% 65% at 18% 78%, rgba(130, 190, 235, 0.06) 0%, rgba(70, 115, 145, 0.02) 35%, transparent 68%),
              /* Alt-Sağ yansıma (X: 82%, Y: 78% - Birebir Simetrik) */
              radial-gradient(90% 65% at 82% 78%, rgba(130, 190, 235, 0.06) 0%, rgba(70, 115, 145, 0.02) 35%, transparent 68%),
              /* Tepe merkez taç ışığı (X: 50%, Y: 0%) */
              radial-gradient(85% 50% at 50% 0%, rgba(165, 218, 252, 0.08) 0%, rgba(86, 138, 165, 0.03) 42%, transparent 70%),
              /* Merkez vişneçürüğü derinlik çekirdeği */
              radial-gradient(110% 90% at 50% 50%, rgba(36, 4, 18, 0.45) 0%, rgba(28, 2, 13, 0.85) 75%, transparent 100%)
            `,
          }}
        />

        {/* C. Soft & Delicate Symmetric Floating Ambient Clouds (Sol ve sağ dengeli) */}
        {/* Üst-Sol Bulut */}
        <div className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-sky-300/[0.07] via-[#568aa5]/[0.03] to-transparent blur-[140px] pointer-events-none" />
        {/* Üst-Sağ Bulut (Simetrik Karşılık) */}
        <div className="absolute -top-[15%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-sky-300/[0.07] via-[#568aa5]/[0.03] to-transparent blur-[140px] pointer-events-none" />
        {/* Alt-Sol Bulut */}
        <div className="absolute top-[45%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-sky-400/[0.05] via-[#416982]/[0.02] to-transparent blur-[150px] pointer-events-none" />
        {/* Alt-Sağ Bulut (Simetrik Karşılık) */}
        <div className="absolute top-[45%] -right-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tl from-sky-400/[0.05] via-[#416982]/[0.02] to-transparent blur-[150px] pointer-events-none" />
        {/* Tepe Merkez Yumuşak Işıma */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[60vw] h-[40vw] rounded-full bg-gradient-to-b from-sky-200/[0.06] via-[#2d071b]/[0.15] to-transparent blur-[120px] pointer-events-none" />

        {/* D. Deep Corner Vignette to firmly anchor edges symmetrically into noble #1c020d */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 130% 100% at 50% 50%, transparent 35%, rgba(28, 2, 13, 0.75) 80%, #1c020d 100%)',
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
