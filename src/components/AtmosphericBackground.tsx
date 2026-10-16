import React, { useEffect, useRef, useState } from 'react';

/**
 * AtmosphericBackground
 * 
 * 1. Renk ve Arka Plan:
 *    - Sabit zemin: Kesinlikle #1c020d (koyu bordo / obsidyen zemin).
 *    - Glitch paleti: Koyu bordodan elektrik mavisine, neon cyan ve magenta/fuşya tonlarına geçiş.
 * 2. Yoğunluk:
 *    - Ağır, yatay bantlar halinde kırılan analog/CRT glitch ve RGB kromatografik ayrışması (maksimum yoğunluk).
 *    - Yatay raster çizgileri, kalın CRT glitch blokları ve mikro parazit patlamaları.
 * 3. Üçgensel Yayılım (Cone / Triangle Spread):
 *    - İmleç (fare) konumundan (apex) başlayıp aşağıya doğru genişleyen konik projeksiyon alanı.
 * 4. Yumuşak Sınırlar (Soft Fade Edges):
 *    - Kenarlar ve uç kısımlar #1c020d bordo zemin içine yumuşakça erir (feathered alpha gradient).
 *    - Kesinlikle sert veya geometrik bir kesiklik görünmez.
 */

// Koyu Bordo -> Magenta -> Elektrik Mavisi -> Neon Cyan renk paleti
const GLITCH_COLORS = {
  cyan: 'rgba(0, 240, 255, ',       // Neon Cyan (#00f0ff)
  cyanLight: 'rgba(56, 189, 248, ', // Sky Cyan (#38bdf8)
  electricBlue: 'rgba(46, 91, 255, ', // Elektrik Mavisi (#2e5bff)
  deepBlue: 'rgba(0, 102, 255, ',   // Saf Mavi (#0066ff)
  slateBlue: 'rgba(86, 138, 165, ', // Arduvaz Mavisi (#568aa5)
  magenta: 'rgba(255, 0, 127, ',    // Neon Magenta / Fuşya (#ff007f)
  fuchsia: 'rgba(224, 38, 148, ',   // Parlak Fuşya (#e02694)
  violet: 'rgba(176, 38, 255, ',    // Elektrik Mor (#b026ff)
  bordoGlow: 'rgba(120, 15, 65, ',  // Parlayan Bordo (#780f41)
  bordoDeep: 'rgba(60, 5, 30, ',    // Derin Bordo (#3c051e)
  white: 'rgba(255, 255, 255, ',    // CRT Fosfor Beyazı
};

const COLOR_KEYS = Object.keys(GLITCH_COLORS) as (keyof typeof GLITCH_COLORS)[];

interface CRTGlitchBand {
  relY: number;      // Distance down from apex (0 to coneDepth)
  height: number;    // Band height (1px to 14px)
  relXOffset: number; // Offset from cone center line
  widthRatio: number; // Width relative to cone max width at this Y (0.3 to 1.1)
  colorKey: keyof typeof GLITCH_COLORS;
  chromaticColorKey?: keyof typeof GLITCH_COLORS;
  chromaticOffset: number; // Horizontal pixel shift for RGB split
  alpha: number;
  decay: number;
  jitterSpeed: number;
}

interface GlitchNoisePixel {
  relY: number;
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

    // Smooth cursor interpolation
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight * 0.35;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.35;

    // Glitch bands & noise clusters
    const bands: CRTGlitchBand[] = [];
    const pixels: GlitchNoisePixel[] = [];

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
        currentX = targetX;
        currentY = targetY;
        hasInitialized = true;
      }

      setIsVisible(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;

        if (!hasInitialized) {
          currentX = targetX;
          currentY = targetY;
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

    // Helper: calculate cone parameters
    const CONE_ANGLE = 0.72; // tan(half-angle) -> ~36 deg spread
    const CONE_MAX_DEPTH = 620; // Maximum downward cone reach

    // Animation Render Loop
    const render = () => {
      // 1. Lerp cursor movement
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        currentX += dx * 0.15;
        currentY += dy * 0.15;
      }

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isVisible) {
        const apexX = currentX;
        const apexY = currentY;

        // 2. Heavy CRT glitch band spawner (Maximum density)
        // Spawn 3 to 7 heavy horizontal CRT glitch slices per frame
        const spawnCount = Math.floor(Math.random() * 5) + 3;
        for (let s = 0; s < spawnCount; s++) {
          const relY = Math.pow(Math.random(), 0.85) * CONE_MAX_DEPTH; // Distribution biased towards upper & mid cone
          const isHeavyBlock = Math.random() < 0.45; // 45% are chunky analog horizontal blocks
          const height = isHeavyBlock ? Math.floor(Math.random() * 8) + 3 : (Math.random() < 0.7 ? 1 : 2);
          
          // Randomize color pairings for chromatic aberration
          const isChromatic = Math.random() < 0.65;
          const primaryColor = isChromatic
            ? (Math.random() < 0.5 ? 'cyan' : 'magenta')
            : COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
          const chromaticColor = primaryColor === 'cyan' ? 'magenta' : 'electricBlue';

          bands.push({
            relY,
            height,
            relXOffset: (Math.random() - 0.5) * 45,
            widthRatio: 0.35 + Math.random() * 0.65,
            colorKey: primaryColor,
            chromaticColorKey: isChromatic ? chromaticColor : undefined,
            chromaticOffset: (Math.random() - 0.5) * 8, // RGB slice offset
            alpha: 0.35 + Math.random() * 0.45,        // Strong CRT punch
            decay: 0.08 + Math.random() * 0.12,        // Rapid analog flicker (2-4 frames)
            jitterSpeed: (Math.random() - 0.5) * 12,
          });
        }

        // Spawn raster noise pixels in the cone
        const noiseCount = Math.floor(Math.random() * 12) + 6;
        for (let n = 0; n < noiseCount; n++) {
          const relY = Math.random() * CONE_MAX_DEPTH;
          const maxHalfW = relY * CONE_ANGLE + 25;
          const relX = (Math.random() - 0.5) * 2 * maxHalfW * 0.9;
          pixels.push({
            relY,
            relX,
            size: Math.random() < 0.8 ? 1.5 : 2.5,
            colorKey: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
            alpha: 0.25 + Math.random() * 0.45,
            decay: 0.06 + Math.random() * 0.08,
          });
        }

        // 3. Render and Update Heavy CRT Glitch Bands with Soft Feathered Edges
        for (let i = bands.length - 1; i >= 0; i--) {
          const b = bands[i];
          b.relXOffset += b.jitterSpeed;
          b.alpha -= b.decay;

          if (b.alpha <= 0 || b.relY > CONE_MAX_DEPTH) {
            bands.splice(i, 1);
            continue;
          }

          const bandY = apexY + b.relY;
          // Prevent drawing above apex
          if (bandY < apexY - 5) continue;

          // Cone half-width at this depth
          const maxHalfW = b.relY * CONE_ANGLE + 30;
          const bandWidth = maxHalfW * 2 * b.widthRatio;
          const centerX = apexX + b.relXOffset;
          const leftX = centerX - bandWidth / 2;
          const rightX = centerX + bandWidth / 2;

          // Calculate feathering factor based on depth and lateral spread
          // Soft Top: 0 at apex, fades to 1 over 35px
          const fadeTop = Math.min(1, Math.max(0, b.relY / 35));
          // Soft Bottom: fades to 0 over the last 150px of the cone
          const fadeBottom = Math.max(0, Math.min(1, (CONE_MAX_DEPTH - b.relY) / 150));
          // Soft Lateral: center is 1, edges dissolve smoothly
          const effectiveAlpha = b.alpha * fadeTop * fadeBottom;

          if (effectiveAlpha <= 0.01) continue;

          // Primary Heavy Band with soft feathered linear horizontal gradient
          const primaryGrad = ctx.createLinearGradient(leftX, bandY, rightX, bandY);
          const colorPrefix = GLITCH_COLORS[b.colorKey];
          primaryGrad.addColorStop(0, `${colorPrefix}0)`);
          primaryGrad.addColorStop(0.2, `${colorPrefix}${effectiveAlpha * 0.75})`);
          primaryGrad.addColorStop(0.5, `${colorPrefix}${effectiveAlpha})`);
          primaryGrad.addColorStop(0.8, `${colorPrefix}${effectiveAlpha * 0.75})`);
          primaryGrad.addColorStop(1, `${colorPrefix}0)`);

          ctx.fillStyle = primaryGrad;
          ctx.fillRect(leftX, bandY, bandWidth, b.height);

          // Chromatic Aberration RGB split slice (displaced left/right for CRT feel)
          if (b.chromaticColorKey && effectiveAlpha > 0.1) {
            const chromLeftX = leftX + b.chromaticOffset;
            const chromRightX = rightX + b.chromaticOffset;
            const chromGrad = ctx.createLinearGradient(chromLeftX, bandY, chromRightX, bandY);
            const chromColorPrefix = GLITCH_COLORS[b.chromaticColorKey];
            const chromAlpha = effectiveAlpha * 0.85;

            chromGrad.addColorStop(0, `${chromColorPrefix}0)`);
            chromGrad.addColorStop(0.25, `${chromColorPrefix}${chromAlpha * 0.7})`);
            chromGrad.addColorStop(0.5, `${chromColorPrefix}${chromAlpha})`);
            chromGrad.addColorStop(0.75, `${chromColorPrefix}${chromAlpha * 0.7})`);
            chromGrad.addColorStop(1, `${chromColorPrefix}0)`);

            ctx.fillStyle = chromGrad;
            ctx.fillRect(chromLeftX, bandY + (b.height > 3 ? 1 : 0), bandWidth, Math.max(1, b.height - 1));
          }
        }

        // 4. Render and Update Glitch Noise Pixels
        for (let i = pixels.length - 1; i >= 0; i--) {
          const p = pixels[i];
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            pixels.splice(i, 1);
            continue;
          }

          const pixelY = apexY + p.relY;
          const pixelX = apexX + p.relX;

          // Feather checks
          const maxHalfW = p.relY * CONE_ANGLE + 30;
          const lateralRatio = Math.abs(p.relX) / maxHalfW;
          if (lateralRatio > 1.0) continue; // Outside cone

          const fadeLateral = Math.max(0, 1 - Math.pow(lateralRatio, 2.2));
          const fadeTop = Math.min(1, Math.max(0, p.relY / 30));
          const fadeBottom = Math.max(0, Math.min(1, (CONE_MAX_DEPTH - p.relY) / 140));
          const effAlpha = p.alpha * fadeLateral * fadeTop * fadeBottom;

          if (effAlpha <= 0.01) continue;

          const colorPrefix = GLITCH_COLORS[p.colorKey];
          ctx.fillStyle = `${colorPrefix}${effAlpha})`;
          ctx.fillRect(pixelX, pixelY, p.size, p.size);
        }

        // 5. Soft Cone Projection Ambient Light (Feathered Triangle Beam Gradient)
        // Provides the rich analog CRT luminescence that ties the glitch bands together
        const coneGrad = ctx.createRadialGradient(
          apexX, apexY + 120, 10,
          apexX, apexY + 280, CONE_MAX_DEPTH * 0.75
        );
        coneGrad.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
        coneGrad.addColorStop(0.35, 'rgba(224, 38, 148, 0.06)');
        coneGrad.addColorStop(0.7, 'rgba(46, 91, 255, 0.03)');
        coneGrad.addColorStop(1, 'rgba(28, 2, 13, 0)');

        // Draw soft feathered triangle path
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(apexX, apexY);
        const baseHalfW = CONE_MAX_DEPTH * CONE_ANGLE;
        ctx.lineTo(apexX + baseHalfW, apexY + CONE_MAX_DEPTH);
        ctx.lineTo(apexX - baseHalfW, apexY + CONE_MAX_DEPTH);
        ctx.closePath();
        ctx.fillStyle = coneGrad;
        ctx.fill();
        ctx.restore();
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
      {/* 1. Underlying Soft Ambient Halo (#568aa5 / Cyan / Magenta apex glow) */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 pointer-events-none will-change-transform"
        style={{
          width: '580px',
          height: '580px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* Soft Core Glow at Cursor Apex */}
        <div
          className="w-full h-full rounded-full cursor-spotlight-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.22) 0%, rgba(224, 38, 148, 0.16) 28%, rgba(86, 138, 165, 0.08) 48%, rgba(28, 2, 13, 0) 70%)',
            filter: 'blur(45px)',
          }}
        />
      </div>

      {/* 2. Heavy CRT Glitch & Cone Projection Canvas */}
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
