import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Gerçek Akışkan Sıvı / Su Dağılımı (Fluid Blob & Ripple Surface):
 *    - Noktalar, partiküller ve halkalar tamamen kaldırılmıştır.
 *    - İmleç suyun yüzeyinde gezinirken yumuşak geçişli, kenarları bordo zeminle
 *      kusursuzca bütünleşen organik sıvı lekeleri (fluid blobs) oluşturur.
 * 2. Esneme ve Yanal Dağılma (Squash & Stretch Morfolojisi):
 *    - Sıvı lekeleri imlecin hareket vektörüne göre elastik bir su kütlesi gibi uzar
 *      ve dışa doğru dalgalanarak genişler.
 * 3. Fade & Scale (Genişledikçe Erime):
 *    - Sıvı kütlesi genişledikçe opasitesi kuadratik olarak sönümlenir ve %100 şeffaflıkla
 *      koyu bordo (#1c020d) zemin içinde iz bırakmadan kaybolur.
 * 4. Easy Ease & Statik Kuralı:
 *    - Hareket yumuşak bir Easy Ease yaylanmasıyla süzülür; imleç durduğu an
 *      tüm sıvı izleri anında çözünerek ekranı tertemiz saf bordo bırakır.
 * 5. Sadece Masaüstü (Desktop-Only):
 *    - Dokunmatik ve mobil cihazlarda tamamen devre dışıdır.
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

    // 1. Easy Ease Sıvı Çekirdeği (Viscous Lead Fluid Pool)
    const CHAIN_LENGTH = 5;
    const poolNodes = Array.from({ length: CHAIN_LENGTH }, () => ({
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
    }));

    // 2. Akışkan Sıvı Lekeleri (Organic Fluid Blobs / Water Dispersion)
    interface FluidBlob {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      maxRadius: number;
      expandSpeed: number;
      alpha: number;
      maxAlpha: number;
      angle: number;
      stretch: number;
      life: number;
      decay: number;
    }

    const blobs: FluidBlob[] = [];
    let lastSpawnX = initialX;
    let lastSpawnY = initialY;
    let poolAlpha = 0;

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

    // Gerçek Su / Sıvı Dağılımı Döngüsü (60 / 120 FPS)
    const render = () => {
      const now = performance.now();
      const isMoving = now - lastMoveTime < 90;

      // 1. Easy Ease Yaylanması & Momentum
      const head = poolNodes[0];
      const dx = targetX - head.x;
      const dy = targetY - head.y;

      const easeFactor = isMoving ? 0.22 : 0.28;
      const dampingFactor = isMoving ? 0.74 : 0.64;

      head.vx = (head.vx + dx * easeFactor) * dampingFactor;
      head.vy = (head.vy + dy * easeFactor) * dampingFactor;
      head.x += head.vx;
      head.y += head.vy;

      // Takip eden akışkan düğümler (Organik gecikmeyle uzayan su gövdesi)
      for (let i = 1; i < CHAIN_LENGTH; i++) {
        const prev = poolNodes[i - 1];
        const curr = poolNodes[i];
        const linkEase = 0.32 - i * 0.045;
        const linkDamping = 0.68;

        curr.vx = (curr.vx + (prev.x - curr.x) * linkEase) * linkDamping;
        curr.vy = (curr.vy + (prev.y - curr.y) * linkEase) * linkDamping;
        curr.x += curr.vx;
        curr.y += curr.vy;
      }

      const moveSpeed = Math.hypot(head.vx, head.vy);

      // 2. Akışkan Sıvı Çekirdeği Opasitesi (Hareket ettikçe belirir, durulduğunda anında erir)
      if (isMoving && moveSpeed > 0.8) {
        const targetPoolAlpha = Math.min(0.20, 0.06 + moveSpeed * 0.018);
        poolAlpha += (targetPoolAlpha - poolAlpha) * 0.24;
      } else {
        // Durulduğunda akışkan gövde anında solar
        poolAlpha *= 0.74;
        if (poolAlpha < 0.001) poolAlpha = 0;
      }

      // 3. Akışkan Sıvı Lekesi Oluşumu (İnce Başlangıç & Pürüzsüz Dağılma)
      const spawnDx = head.x - lastSpawnX;
      const spawnDy = head.y - lastSpawnY;
      const spawnDist = Math.hypot(spawnDx, spawnDy);

      if (isMoving && spawnDist > 18 && moveSpeed > 0.8) {
        lastSpawnX = head.x;
        lastSpawnY = head.y;

        const angle = Math.atan2(head.vy, head.vx);
        // Hıza göre narin esneme (Squash & stretch su morfolojisi)
        const stretch = Math.min(1.15 + moveSpeed * 0.04, 1.75);

        // Başlangıç boyutu zarif ve ince (18px - 32px arası narin su lekesi)
        const startRadius = 18 + Math.min(moveSpeed * 1.5, 14);
        // Sonda genişleyerek yumuşakça yayılacağı maksimum yarıçap
        const maxRadius = startRadius * (2.8 + Math.min(moveSpeed * 0.10, 1.8));
        const maxAlpha = Math.min(0.18, 0.06 + moveSpeed * 0.015);

        blobs.push({
          x: head.x,
          y: head.y,
          vx: head.vx * 0.10,
          vy: head.vy * 0.10,
          radius: startRadius,
          maxRadius,
          expandSpeed: 0.8 + Math.min(moveSpeed * 0.08, 1.6),
          alpha: maxAlpha,
          maxAlpha,
          angle,
          stretch,
          life: 0,
          decay: 0.010 + Math.random() * 0.005,
        });
      }

      // 4. Tuvali Temizle
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 5. Akışkan Sıvı Lekelerini Çiz (Yayılan, Genişledikçe Ultra-Smooth Eriyen Formlar)
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];

        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.94;
        b.vy *= 0.94;

        // Dışa doğru akışkan yayılma
        b.radius += b.expandSpeed;
        b.expandSpeed *= 0.94;

        // Yaşam süresi ilerlemesi: Durulduğunda çözünme yumuşakça hızlanır
        b.life += isMoving ? b.decay : b.decay * 2.5;

        // Sonda biraz daha smooth yok olsun: Güçlü sönümleme eğrisi (power 2.8)
        const fadeFactor = Math.pow(Math.max(0, 1 - b.life), 2.8);
        const currentAlpha = b.maxAlpha * fadeFactor;

        if (b.life >= 1 || currentAlpha <= 0.001) {
          blobs.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.scale(b.stretch, 1 / Math.sqrt(b.stretch)); // Hacim koruyan su esnemesi

        // İnce başlayan ve kenarları arka plan bordosuyla kusursuz eriyen çok katmanlı gradyan
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, b.radius);

        // Merkez: Işıltılı narin bebe mavisi su yansıması
        grad.addColorStop(0, `rgba(180, 225, 255, ${(currentAlpha * 0.52).toFixed(3)})`);
        // Çekirdek yayılma: Berrak su difüzyonu
        grad.addColorStop(0.25, `rgba(135, 195, 235, ${(currentAlpha * 0.28).toFixed(3)})`);
        // Sıvı gövdesi: Asil koyu vişne su kütlesi
        grad.addColorStop(0.55, `rgba(62, 7, 32, ${(currentAlpha * 0.14).toFixed(3)})`);
        // Ultra-smooth kadife geçiş basamağı: Zemin bordosuna kademeli geçiş
        grad.addColorStop(0.80, `rgba(35, 3, 18, ${(currentAlpha * 0.04).toFixed(3)})`);
        // Sınır: %100 şeffaf - Koyu bordo zeminle kusursuzca erir
        grad.addColorStop(1, 'rgba(28, 2, 13, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 6. Akışkan Sıvı İzi (İmleç Altında İnce & Zarif Başlayan Sıvı Çekirdeği)
      if (poolAlpha > 0.002) {
        for (let i = poolNodes.length - 1; i >= 0; i--) {
          const node = poolNodes[i];
          const nodeProgress = i / (CHAIN_LENGTH - 1);
          // İnce ve narin başlangıç (18px - 26px arası zarif su ucu)
          const nodeRadius = (20 - i * 2.8) * (0.85 + Math.min(moveSpeed * 0.03, 0.45));
          const nodeOpacity = poolAlpha * (1 - nodeProgress * 0.50);

          if (nodeRadius <= 0.5 || nodeOpacity <= 0.002) continue;

          const poolGrad = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, nodeRadius
          );
          // Sıvı parıltısı
          poolGrad.addColorStop(0, `rgba(185, 230, 255, ${(nodeOpacity * 0.55).toFixed(3)})`);
          // Ara yumuşak su kütlesi
          poolGrad.addColorStop(0.35, `rgba(130, 190, 230, ${(nodeOpacity * 0.26).toFixed(3)})`);
          // Kenar erimesi (Vişne tonundan şeffafa)
          poolGrad.addColorStop(0.70, `rgba(70, 9, 35, ${(nodeOpacity * 0.12).toFixed(3)})`);
          poolGrad.addColorStop(1, 'rgba(28, 2, 13, 0)');

          ctx.fillStyle = poolGrad;
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

      {/* 2. Desktop-Only Interactive Liquid Water Blobs & Ripple Surface */}
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
          {/* Akışkan Sıvı Yüzeyi - Doğal Su Dağılımı (Sıfır Nokta, Saf Sıvı Morfolojisi) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none will-change-transform"
            style={{
              width: '100vw',
              height: '100vh',
              filter: 'blur(14px)',
              WebkitFilter: 'blur(14px)',
            }}
          />
        </div>
      )}
    </>
  );
};
