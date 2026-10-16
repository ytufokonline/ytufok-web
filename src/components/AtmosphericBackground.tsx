import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Apple Liquid Motion (Sıvı & Morphing Akışkan Fizik):
 *    - İmleç arkasında yapay çizgiler veya sert halkalar yerine, Apple'ın akışkan
 *      sıvı (liquid blob / morphing fluid) motoru gibi uzayan ve süzülen narin bir sıvı izi akar.
 * 2. Boyut ve Şeffaflık Orantısı (Fade & Scale):
 *    - Sıvı halkalar dışa doğru genişledikçe hızla şeffaflaşır (kuadratik sönümlenme)
 *      ve sınırları bordo zeminle tamamen eriyerek yok olur; asla sert, opak leke kalmaz.
 * 3. Easy Ease İvme Eğrisi (Smooth Viscous Damping):
 *    - Akışkan damlalar imleci After Effects Easy Ease yaylanmasıyla takip eder;
 *      hızlandıkça elastik bir sıvı gibi uzar, dururken yumuşakça toplanır.
 * 4. Statik Durumda Tamamen Gizli:
 *    - İmleç durduğu an tüm sıvı izleri hızla solarak kaybolur; zemin %100 saf ve lekesiz kalır.
 * 5. Sadece Masaüstü (Desktop-Only):
 *    - Mobil cihazlarda sıfır CPU/GPU tüketimi için tamamen devre dışıdır.
 */

interface LiquidNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LiquidHalo {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  maxAlpha: number;
  decay: number;
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

    const initialX = window.innerWidth / 2;
    const initialY = window.innerHeight / 2;

    let targetX = initialX;
    let targetY = initialY;
    let lastMoveTime = 0;

    // Apple Liquid Spring Chain (Elastic Fluid Nodes)
    const CHAIN_LENGTH = 5;
    const nodes: LiquidNode[] = Array.from({ length: CHAIN_LENGTH }, () => ({
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
    }));

    // Liquid Halos (Expanding, Feathered Fade & Scale Halos)
    const halos: LiquidHalo[] = [];
    let lastSpawnX = initialX;
    let lastSpawnY = initialY;
    let blobAlpha = 0;

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

    // Main 60/120 FPS Apple Liquid Motion Loop
    const render = () => {
      const now = performance.now();
      const isMoving = now - lastMoveTime < 130;

      // 1. Easy Ease Liquid Chain Physics (Elastic Viscous Spring Simulation)
      // Node 0: Apex follows mouse with smooth Easy Ease damping
      const head = nodes[0];
      const headDx = targetX - head.x;
      const headDy = targetY - head.y;
      const headDist = Math.hypot(headDx, headDy);

      const headSpring = isMoving ? Math.min(0.22, 0.08 + Math.pow(headDist / 200, 1.2) * 0.12) : 0.26;
      const headDamp = isMoving ? 0.78 : 0.65;

      head.vx = (head.vx + headDx * headSpring) * headDamp;
      head.vy = (head.vy + headDy * headSpring) * headDamp;
      head.x += head.vx;
      head.y += head.vy;

      // Trailing nodes follow with cascading delay (Morphing Liquid Tail)
      for (let i = 1; i < CHAIN_LENGTH; i++) {
        const prev = nodes[i - 1];
        const curr = nodes[i];
        const spring = 0.28 - i * 0.035;
        const damping = 0.66;

        curr.vx = (curr.vx + (prev.x - curr.x) * spring) * damping;
        curr.vy = (curr.vy + (prev.y - curr.y) * spring) * damping;
        curr.x += curr.vx;
        curr.y += curr.vy;
      }

      const moveSpeed = Math.hypot(head.vx, head.vy);

      // 2. Liquid Blob Alpha Envelope
      if (isMoving && moveSpeed > 0.5) {
        const targetAlpha = Math.min(0.22, 0.06 + moveSpeed * 0.024);
        blobAlpha += (targetAlpha - blobAlpha) * 0.25;
      } else {
        blobAlpha *= 0.82; // Rapid smooth collapse when stopped
        if (blobAlpha < 0.002) blobAlpha = 0;
      }

      // 3. Spawn Feathered Fade & Scale Halos (Yumuşak Sıvı Daireler)
      const spawnDx = head.x - lastSpawnX;
      const spawnDy = head.y - lastSpawnY;
      const spawnDist = Math.hypot(spawnDx, spawnDy);

      if (isMoving && spawnDist > 22 && moveSpeed > 0.8) {
        lastSpawnX = head.x;
        lastSpawnY = head.y;

        const angle = Math.atan2(head.vy, head.vx);
        // Boyut ve şeffaflık orantısı: Hıza göre zarif ölçek, asla kaba değil
        const maxRadius = Math.min(45 + moveSpeed * 4.2, 125);
        const maxAlpha = Math.min(0.18, 0.06 + moveSpeed * 0.018);

        halos.push({
          x: head.x,
          y: head.y,
          radius: 8,
          maxRadius,
          speed: 1.4 + Math.min(moveSpeed * 0.10, 2.2),
          alpha: maxAlpha,
          maxAlpha,
          decay: 0.012 + Math.random() * 0.005,
          aspectRatio: Math.min(1.0 + moveSpeed * 0.02, 1.35),
          angle,
        });
      }

      // 4. Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 5. Render Expanding Fade & Scale Liquid Halos (Asla sert çizgi yok, tamamen eriyen gradyanlar)
      for (let i = halos.length - 1; i >= 0; i--) {
        const h = halos[i];
        h.radius += h.speed;
        h.speed *= 0.985; // Sıvı direnci

        const progress = h.radius / h.maxRadius;
        // Kuadratik sönümlenme: Büyüdükçe hızla şeffaflaşır ve kenarları bordo içinde erir
        const currentOpacity = h.maxAlpha * Math.pow(Math.max(0, 1 - progress), 2.2);

        if (progress >= 1 || currentOpacity <= 0.002) {
          halos.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.angle);
        ctx.scale(h.aspectRatio, 1);

        // Tamamen yumuşatılmış, kenarları eriyen radial gradyan (0 Hard Borders)
        const grad = ctx.createRadialGradient(0, 0, h.radius * 0.35, 0, 0, h.radius);
        grad.addColorStop(0, 'rgba(28, 2, 13, 0)');
        // Dış sıvı ışıltısı (Bebe mavisi stüdyo yansıması)
        grad.addColorStop(0.55, `rgba(175, 225, 255, ${(currentOpacity * 0.45).toFixed(3)})`);
        // Derin vişneçürüğü sıvı gövdesi
        grad.addColorStop(0.80, `rgba(55, 6, 28, ${(currentOpacity * 0.22).toFixed(3)})`);
        // Sınır %100 şeffaf - Zeminle kusursuzca erir
        grad.addColorStop(1, 'rgba(28, 2, 13, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 6. Render Apple Liquid Morphing Trail (Akışkan Sıvı Gövdesi)
      if (blobAlpha > 0.003) {
        for (let i = nodes.length - 1; i >= 0; i--) {
          const node = nodes[i];
          const nodeProgress = i / (CHAIN_LENGTH - 1);
          const nodeRadius = (20 - i * 2.8) * (0.8 + Math.min(moveSpeed * 0.05, 0.6));
          const nodeOpacity = blobAlpha * (1 - nodeProgress * 0.45);

          if (nodeRadius <= 1 || nodeOpacity <= 0.002) continue;

          const blobGrad = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, nodeRadius
          );
          // Sıvı kristal çekirdek (Bebe mavisi parıltı)
          blobGrad.addColorStop(0, `rgba(195, 235, 255, ${(nodeOpacity * 0.60).toFixed(3)})`);
          // Ara yumuşak gövde (Asil vişne tonu)
          blobGrad.addColorStop(0.45, `rgba(75, 12, 38, ${(nodeOpacity * 0.30).toFixed(3)})`);
          // Kenar erimesi (Saf arka plan bordosu)
          blobGrad.addColorStop(1, 'rgba(28, 2, 13, 0)');

          ctx.fillStyle = blobGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
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
