import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Üçgensel İz (Triangle Trail):
 *    - İmlecin hareket yönüne göre arkasından uzayan, dinamik konik/üçgensel iz formu.
 * 2. Akışkanlık (After Effects Easy Ease):
 *    - İmleç hızlandıkça arkasından organik bir yay/süzülme ivmelenmesiyle (spring-damper easing)
 *      esneyerek uzayan ve imleç durduğunda zarifçe toparlanan kuyruk fiziği.
 * 3. Yoğun CRT Glitch Paraziti:
 *    - Koyu bordodan (#1c020d) elektrik mavisi, neon cyan, parlak fuşya/magenta tonlarına
 *      uzanan ağır yatay CRT raster bantları, RGB kromatografik ayrışması (split) ve dijital parazit.
 * 4. Yumuşak Kenarlar (Feathered Edges):
 *    - İz sınırları ve uç kısımları asla geometrik kesiklik içermez; #1c020d zemin içine
 *      kenarlardan ve kuyruktan yumuşak gradyanlarla eriyerek karışır.
 */

const GLITCH_COLORS = {
  cyan: 'rgba(0, 240, 255, ',         // Neon Cyan (#00f0ff)
  cyanLight: 'rgba(56, 189, 248, ',   // Sky Cyan (#38bdf8)
  electricBlue: 'rgba(46, 91, 255, ', // Elektrik Mavisi (#2e5bff)
  deepBlue: 'rgba(0, 102, 255, ',     // Saf Mavi (#0066ff)
  slateBlue: 'rgba(86, 138, 165, ',   // Arduvaz Mavisi (#568aa5)
  magenta: 'rgba(255, 0, 127, ',      // Neon Magenta / Fuşya (#ff007f)
  fuchsia: 'rgba(224, 38, 148, ',     // Parlak Fuşya (#e02694)
  violet: 'rgba(176, 38, 255, ',      // Elektrik Mor (#b026ff)
  bordoGlow: 'rgba(120, 15, 65, ',    // Parlayan Bordo (#780f41)
  bordoDeep: 'rgba(60, 5, 30, ',      // Derin Bordo (#3c051e)
  white: 'rgba(255, 255, 255, ',      // CRT Fosfor Beyazı
};

const COLOR_KEYS = Object.keys(GLITCH_COLORS) as (keyof typeof GLITCH_COLORS)[];

interface TrailGlitchBand {
  t: number;          // Position along trail axis (0 at head, 1 at tail)
  lateralOffset: number; // Offset from trail central axis
  widthFactor: number;   // Width factor relative to cone width at t
  height: number;        // Band height in pixels (1px to 12px)
  colorKey: keyof typeof GLITCH_COLORS;
  chromaticColorKey?: keyof typeof GLITCH_COLORS;
  chromaticOffset: number;
  alpha: number;
  decay: number;
  jitterSpeed: number;
}

interface TrailNoisePixel {
  t: number;
  relX: number;
  size: number;
  colorKey: keyof typeof GLITCH_COLORS;
  alpha: number;
  decay: number;
}

export const AtmosphericBackground: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animId: number;
    let hasInitialized = false;

    // Head (Cursor Apex)
    let headX = window.innerWidth / 2;
    let headY = window.innerHeight * 0.4;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.4;

    // Tail (Easy Ease Chaser)
    let tailX = headX;
    let tailY = headY + 120; // Default gentle downward orientation
    let tailVelX = 0;
    let tailVelY = 0;

    // Glitch entities
    const bands: TrailGlitchBand[] = [];
    const pixels: TrailNoisePixel[] = [];

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

      if (!hasInitialized) {
        headX = targetX;
        headY = targetY;
        tailX = targetX;
        tailY = targetY + 120;
        hasInitialized = true;
      }

      setIsVisible(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;

        if (!hasInitialized) {
          headX = targetX;
          headY = targetY;
          tailX = targetX;
          tailY = targetY + 120;
          hasInitialized = true;
        }

        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Main Animation Loop
    const render = () => {
      // 1. Head follows target with responsive smooth lerp
      headX += (targetX - headX) * 0.18;
      headY += (targetY - headY) * 0.18;

      // 2. Tail follows head with organic After Effects "Easy Ease" physics (Spring + Damping)
      // When cursor moves, the tail accelerates gently; when stopping, it cushions into place.
      const springK = 0.075;
      const damping = 0.72;

      // Desired idle offset when stationary (subtle downward drift of 85px)
      const moveDistToTarget = Math.hypot(targetX - headX, targetY - headY);
      const idleOffsetY = moveDistToTarget < 2 ? 85 : 0;

      const pullTargetX = headX;
      const pullTargetY = headY + idleOffsetY;

      tailVelX = (tailVelX + (pullTargetX - tailX) * springK) * damping;
      tailVelY = (tailVelY + (pullTargetY - tailY) * springK) * damping;

      tailX += tailVelX;
      tailY += tailVelY;

      // Update apex spotlight
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${headX}px, ${headY}px, 0) translate(-50%, -50%)`;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isVisible) {
        // Calculate dynamic trail geometry
        const trailDx = tailX - headX;
        const trailDy = tailY - headY;
        const trailLength = Math.hypot(trailDx, trailDy);

        // Normalized trail direction & perpendicular vector
        const dirX = trailLength > 0.001 ? trailDx / trailLength : 0;
        const dirY = trailLength > 0.001 ? trailDy / trailLength : 1;
        const perpX = -dirY;
        const perpY = dirX;

        // Base width of the cone expands with trail stretch (from 80px up to 380px)
        const coneBaseWidth = Math.min(Math.max(trailLength * 0.85 + 60, 90), 380);

        // 3. Spawn Heavy CRT Glitch Bands inside the Directional Trail
        // Glitch intensity scales with movement speed and trail elongation
        const spawnCount = Math.floor(Math.random() * 5) + 3;
        for (let s = 0; s < spawnCount; s++) {
          const t = Math.pow(Math.random(), 0.75); // Biased toward mid and upper trail
          const isHeavy = Math.random() < 0.45;
          const height = isHeavy ? Math.floor(Math.random() * 8) + 3 : (Math.random() < 0.7 ? 1 : 2);

          const isChromatic = Math.random() < 0.65;
          const primaryColor = isChromatic
            ? (Math.random() < 0.5 ? 'cyan' : 'magenta')
            : COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
          const chromaticColor = primaryColor === 'cyan' ? 'magenta' : 'electricBlue';

          bands.push({
            t,
            lateralOffset: (Math.random() - 0.5) * 35,
            widthFactor: 0.4 + Math.random() * 0.6,
            height,
            colorKey: primaryColor,
            chromaticColorKey: isChromatic ? chromaticColor : undefined,
            chromaticOffset: (Math.random() - 0.5) * 8,
            alpha: 0.35 + Math.random() * 0.45,
            decay: 0.07 + Math.random() * 0.12,
            jitterSpeed: (Math.random() - 0.5) * 10,
          });
        }

        // Spawn noise grain pixels inside the trail
        const noiseCount = Math.floor(Math.random() * 10) + 5;
        for (let n = 0; n < noiseCount; n++) {
          const t = Math.random();
          const maxW = t * coneBaseWidth * 0.5 + 20;
          pixels.push({
            t,
            relX: (Math.random() - 0.5) * 2 * maxW * 0.9,
            size: Math.random() < 0.8 ? 1.5 : 2.5,
            colorKey: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
            alpha: 0.25 + Math.random() * 0.45,
            decay: 0.06 + Math.random() * 0.09,
          });
        }

        // 4. Soft Ambient Trail Beam (Feathered Directional Triangle Cone)
        // Soft underglow that physically defines the easy-ease triangle trail
        if (trailLength > 10) {
          const conePath = new Path2D();
          conePath.moveTo(headX, headY);
          const leftBaseX = tailX + perpX * (coneBaseWidth / 2);
          const leftBaseY = tailY + perpY * (coneBaseWidth / 2);
          const rightBaseX = tailX - perpX * (coneBaseWidth / 2);
          const rightBaseY = tailY - perpY * (coneBaseWidth / 2);
          conePath.lineTo(leftBaseX, leftBaseY);
          conePath.lineTo(rightBaseX, rightBaseY);
          conePath.closePath();

          const trailBeamGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
          trailBeamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
          trailBeamGrad.addColorStop(0.35, 'rgba(224, 38, 148, 0.08)');
          trailBeamGrad.addColorStop(0.75, 'rgba(46, 91, 255, 0.04)');
          trailBeamGrad.addColorStop(1, 'rgba(28, 2, 13, 0)'); // Soft fade into #1c020d

          ctx.save();
          ctx.fillStyle = trailBeamGrad;
          ctx.filter = 'blur(18px)';
          ctx.fill(conePath);
          ctx.restore();
        }

        // 5. Render Heavy CRT Glitch Bands (Confined & Feathered inside the Triangle Trail)
        for (let i = bands.length - 1; i >= 0; i--) {
          const b = bands[i];
          b.lateralOffset += b.jitterSpeed;
          b.alpha -= b.decay;

          if (b.alpha <= 0) {
            bands.splice(i, 1);
            continue;
          }

          // Center coordinate along the trail axis
          const axisCenterX = headX + (tailX - headX) * b.t;
          const axisCenterY = headY + (tailY - headY) * b.t;

          // Cone half-width at t (expands from head to tail)
          const halfWidthAtT = (b.t * coneBaseWidth * 0.5 + 25) * b.widthFactor;
          const bandWidth = halfWidthAtT * 2;

          // Band position (horizontal CRT raster slice)
          const sliceY = axisCenterY;
          const sliceCenterX = axisCenterX + b.lateralOffset;
          const leftX = sliceCenterX - bandWidth / 2;
          const rightX = sliceCenterX + bandWidth / 2;

          // Soft Feathering:
          // Head fade-in (t=0 to 0.12), Tail fade-out (t=0.7 to 1.0)
          const headFade = Math.min(1, Math.max(0, b.t / 0.12));
          const tailFade = Math.max(0, Math.min(1, (1 - b.t) / 0.3));
          const effectiveAlpha = b.alpha * headFade * tailFade;

          if (effectiveAlpha <= 0.01) continue;

          // Primary Heavy Glitch Band with feathered horizontal linear gradient
          const primaryGrad = ctx.createLinearGradient(leftX, sliceY, rightX, sliceY);
          const colorPrefix = GLITCH_COLORS[b.colorKey];
          primaryGrad.addColorStop(0, `${colorPrefix}0)`);
          primaryGrad.addColorStop(0.2, `${colorPrefix}${effectiveAlpha * 0.75})`);
          primaryGrad.addColorStop(0.5, `${colorPrefix}${effectiveAlpha})`);
          primaryGrad.addColorStop(0.8, `${colorPrefix}${effectiveAlpha * 0.75})`);
          primaryGrad.addColorStop(1, `${colorPrefix}0)`);

          ctx.fillStyle = primaryGrad;
          ctx.fillRect(leftX, sliceY, bandWidth, b.height);

          // Chromatic Aberration RGB split slice (displaced along X)
          if (b.chromaticColorKey && effectiveAlpha > 0.1) {
            const chromLeftX = leftX + b.chromaticOffset;
            const chromRightX = rightX + b.chromaticOffset;
            const chromGrad = ctx.createLinearGradient(chromLeftX, sliceY, chromRightX, sliceY);
            const chromColorPrefix = GLITCH_COLORS[b.chromaticColorKey];
            const chromAlpha = effectiveAlpha * 0.85;

            chromGrad.addColorStop(0, `${chromColorPrefix}0)`);
            chromGrad.addColorStop(0.25, `${chromColorPrefix}${chromAlpha * 0.7})`);
            chromGrad.addColorStop(0.5, `${chromColorPrefix}${chromAlpha})`);
            chromGrad.addColorStop(0.75, `${chromColorPrefix}${chromAlpha * 0.7})`);
            chromGrad.addColorStop(1, `${chromColorPrefix}0)`);

            ctx.fillStyle = chromGrad;
            ctx.fillRect(chromLeftX, sliceY + (b.height > 3 ? 1 : 0), bandWidth, Math.max(1, b.height - 1));
          }
        }

        // 6. Render Glitch Noise Pixels
        for (let i = pixels.length - 1; i >= 0; i--) {
          const p = pixels[i];
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            pixels.splice(i, 1);
            continue;
          }

          const axisCenterX = headX + (tailX - headX) * p.t;
          const axisCenterY = headY + (tailY - headY) * p.t;

          const maxHalfW = p.t * coneBaseWidth * 0.5 + 25;
          const lateralRatio = Math.abs(p.relX) / maxHalfW;
          if (lateralRatio > 1.0) continue;

          const fadeLateral = Math.max(0, 1 - Math.pow(lateralRatio, 2.2));
          const fadeAxis = Math.min(1, p.t / 0.12) * Math.max(0, (1 - p.t) / 0.28);
          const effAlpha = p.alpha * fadeLateral * fadeAxis;

          if (effAlpha <= 0.01) continue;

          const pixelX = axisCenterX + p.relX;
          const pixelY = axisCenterY;

          const colorPrefix = GLITCH_COLORS[p.colorKey];
          ctx.fillStyle = `${colorPrefix}${effAlpha})`;
          ctx.fillRect(pixelX, pixelY, p.size, p.size);
        }
      }

      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animId);
    };
  }, [isVisible]);

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
      {/* 1. Underlying Soft Ambient Halo at Cursor Apex */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 pointer-events-none will-change-transform"
        style={{
          width: '520px',
          height: '520px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        <div
          className="w-full h-full rounded-full cursor-spotlight-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.24) 0%, rgba(224, 38, 148, 0.16) 28%, rgba(86, 138, 165, 0.08) 48%, rgba(28, 2, 13, 0) 70%)',
            filter: 'blur(45px)',
          }}
        />
      </div>

      {/* 2. Heavy CRT Glitch & Directional Triangle Trail Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          width: '100vw',
          height: '100vh',
        }}
      />

      {/* 3. Subtle Micro-Grain Texture preventing 8-bit banding on Retina/OLED */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
