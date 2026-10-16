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

    // 1. Easy Ease Viscous Fluid Follower (Sıvı Çekirdeği)
    const CHAIN_LENGTH = 5;
    const trailNodes = Array.from({ length: CHAIN_LENGTH }, () => ({
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
    }));

    // 2. Doğal Organik Sıvı Damlacıkları (Organic Fluid Droplets)
    interface OrganicDroplet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      maxRadius: number;
      expandSpeed: number;
      alpha: number;
      maxAlpha: number;
      life: number; // 0 (yeni doğan) -> 1 (yok olan)
      decay: number;
    }

    const droplets: OrganicDroplet[] = [];
    let lastSpawnX = initialX;
    let lastSpawnY = initialY;
    let trailAlpha = 0;

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

    // Doğal Sıvı Hareketi & Damlacık Döngüsü (60 / 120 FPS)
    const render = () => {
      const now = performance.now();
      const isMoving = now - lastMoveTime < 90;

      // 1. Easy Ease İvmelenmesi & Momentum (Yaylanma ve Süzülme)
      const head = trailNodes[0];
      const dx = targetX - head.x;
      const dy = targetY - head.y;

      const easeFactor = isMoving ? 0.24 : 0.28;
      const dampingFactor = isMoving ? 0.74 : 0.64;

      head.vx = (head.vx + dx * easeFactor) * dampingFactor;
      head.vy = (head.vy + dy * easeFactor) * dampingFactor;
      head.x += head.vx;
      head.y += head.vy;

      // Takip eden akışkan düğümler (Organik gecikme ile uzayan sıvı kuyruğu)
      for (let i = 1; i < CHAIN_LENGTH; i++) {
        const prev = trailNodes[i - 1];
        const curr = trailNodes[i];
        const linkEase = 0.32 - i * 0.04;
        const linkDamping = 0.68;

        curr.vx = (curr.vx + (prev.x - curr.x) * linkEase) * linkDamping;
        curr.vy = (curr.vy + (prev.y - curr.y) * linkEase) * linkDamping;
        curr.x += curr.vx;
        curr.y += curr.vy;
      }

      const moveSpeed = Math.hypot(head.vx, head.vy);

      // 2. Takip Eden Akışkan Gövde Opasitesi (Hareket ettikçe belirir, durunca hızla kaybolur)
      if (isMoving && moveSpeed > 0.6) {
        const targetTrailAlpha = Math.min(0.18, 0.05 + moveSpeed * 0.015);
        trailAlpha += (targetTrailAlpha - trailAlpha) * 0.22;
      } else {
        // Durulduğunda akışkan gövde anında solar
        trailAlpha *= 0.76;
        if (trailAlpha < 0.001) trailAlpha = 0;
      }

      // 3. Doğal Sıvı Damlacıkları Üretimi (Hıza ve Mesafeye Duyarlı Organik Saçılma)
      const spawnDx = head.x - lastSpawnX;
      const spawnDy = head.y - lastSpawnY;
      const spawnDist = Math.hypot(spawnDx, spawnDy);

      if (isMoving && spawnDist > 14 && moveSpeed > 0.8) {
        lastSpawnX = head.x;
        lastSpawnY = head.y;

        // Hareket yönü birim vektörü
        const dirX = head.vx / (moveSpeed || 1);
        const dirY = head.vy / (moveSpeed || 1);

        // Su yüzeyinde yanal dalgacık ve damla saçılma vektörü (Perpendicular dispersion)
        const count = moveSpeed > 8 ? 2 : 1;
        for (let c = 0; c < count; c++) {
          const side = (Math.random() - 0.5) * 2;
          const perpX = -dirY * side * (4 + Math.random() * 8);
          const perpY = dirX * side * (4 + Math.random() * 8);

          // Damlacık hızı: Hem imleç momentumundan hafifçe taşır hem de yana doğru süzülür
          const dropVx = head.vx * 0.12 + perpX * 0.08;
          const dropVy = head.vy * 0.12 + perpY * 0.08;

          const startRadius = 3.5 + Math.random() * 3.5;
          const maxRadius = startRadius * (2.2 + Math.min(moveSpeed * 0.08, 2.0));
          const maxAlpha = Math.min(0.20, 0.07 + moveSpeed * 0.016);

          droplets.push({
            x: head.x + perpX * 0.5,
            y: head.y + perpY * 0.5,
            vx: dropVx,
            vy: dropVy,
            radius: startRadius,
            maxRadius,
            expandSpeed: 0.6 + Math.min(moveSpeed * 0.06, 1.2),
            alpha: maxAlpha,
            maxAlpha,
            life: 0,
            decay: 0.018 + Math.random() * 0.010,
          });
        }
      }

      // 4. Tuvali Temizle
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 5. Doğal Organik Damlacıkları Çiz (Büyüdükçe Şeffaflaşan & Sönen Dolu Gradyanlar)
      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];

        // Konum ve momentum sönümlenmesi (Sıvı sürtünmesi)
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.94;
        d.vy *= 0.94;

        // Boyut kademeli olarak yumuşakça büyür
        d.radius += d.expandSpeed;
        d.expandSpeed *= 0.92;

        // Yaşam süresi ilerlemesi: Durulduğunda kaybolma kat kat hızlanır
        d.life += isMoving ? d.decay : d.decay * 3.5;

        // Büyüdükçe şeffaflaşma (Fade & Scale): Kuadratik sönümlenme
        const currentAlpha = d.maxAlpha * Math.pow(Math.max(0, 1 - d.life), 2.0);

        if (d.life >= 1 || currentAlpha <= 0.002) {
          droplets.splice(i, 1);
          continue;
        }

        // Dolu ve ultra-yumuşak organik su damlası (Halka değil, narin ışık saçan damlacık)
        const grad = ctx.createRadialGradient(
          d.x, d.y, 0,
          d.x, d.y, d.radius
        );

        // Merkez: Işıltılı narin bebe mavisi su yansıması
        grad.addColorStop(0, `rgba(185, 230, 255, ${(currentAlpha * 0.70).toFixed(3)})`);
        // Ara katman: Su berraklığı ve difüzyon
        grad.addColorStop(0.35, `rgba(135, 195, 235, ${(currentAlpha * 0.35).toFixed(3)})`);
        // Dış katman: Asil koyu vişne sıvı gövdesi
        grad.addColorStop(0.68, `rgba(65, 8, 35, ${(currentAlpha * 0.16).toFixed(3)})`);
        // Sınır: %100 şeffaf - Koyu bordo zeminle kusursuzca erir
        grad.addColorStop(1, 'rgba(28, 2, 13, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Akışkan Sıvı İzi (Sünek Su Gövdesi)
      if (trailAlpha > 0.002) {
        for (let i = trailNodes.length - 1; i >= 0; i--) {
          const node = trailNodes[i];
          const nodeProgress = i / (CHAIN_LENGTH - 1);
          const nodeRadius = (15 - i * 2.2) * (0.8 + Math.min(moveSpeed * 0.04, 0.5));
          const nodeOpacity = trailAlpha * (1 - nodeProgress * 0.55);

          if (nodeRadius <= 0.5 || nodeOpacity <= 0.002) continue;

          const blobGrad = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, nodeRadius
          );
          // Çekirdek ışığı
          blobGrad.addColorStop(0, `rgba(195, 235, 255, ${(nodeOpacity * 0.65).toFixed(3)})`);
          // Ara yumuşak su gövdesi
          blobGrad.addColorStop(0.40, `rgba(75, 12, 38, ${(nodeOpacity * 0.28).toFixed(3)})`);
          // Kenar erimesi
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
