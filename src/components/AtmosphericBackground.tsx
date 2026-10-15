import React from 'react';

/**
 * AtmosphericBackground
 * 
 * Apple-inspired ambient background featuring:
 * 1. Deep #1f0814 root backdrop with seamless #568aa5 color gradient transitions.
 * 2. Aurora glow pools: GPU-composited, soft-diffused light meshes.
 * 3. Floating atmospheric bubbles: Semi-transparent, softly blurred glowing spheres
 *    derived from #568aa5 (luminous slate) and soft plum-violet tones.
 * 4. Micro-grain film texture preventing 8-bit banding on Retina/OLED displays.
 * 
 * Fully non-blocking (pointer-events-none, fixed -z-10, GPU-composited 60/120 FPS).
 */
export const AtmosphericBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#1f0814]"
      aria-hidden="true"
    >
      {/* 1. Global Gradient Foundation: #1f0814 base blending smoothly with #568aa5 */}
      <div 
        className="absolute inset-0 bg-canvas-aurora opacity-95 transition-opacity duration-1000"
      />

      {/* 2. Major Ambient Aurora Glow Pools */}
      {/* Aurora 1: Top Hero Slate Glow (#568aa5 core) */}
      <div 
        className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[720px] sm:w-[960px] h-[480px] sm:h-[620px] rounded-full ambient-aurora-top"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(86, 138, 165, 0.26) 0%, rgba(86, 138, 165, 0.10) 45%, rgba(31, 8, 20, 0) 75%)',
          filter: 'blur(90px)',
          transform: 'translate3d(-50%, 0, 0)',
        }}
      />

      {/* Aurora 2: Right Mid Slate-Cyan Mist */}
      <div 
        className="absolute top-[28%] -right-[12%] w-[580px] sm:w-[750px] h-[580px] sm:h-[750px] rounded-full ambient-aurora-right"
        style={{
          background: 'radial-gradient(circle at center, rgba(110, 165, 196, 0.20) 0%, rgba(86, 138, 165, 0.08) 50%, rgba(31, 8, 20, 0) 75%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Aurora 3: Left Mid Plum-Violet Deep Ambient Core */}
      <div 
        className="absolute top-[52%] -left-[14%] w-[640px] sm:w-[820px] h-[640px] sm:h-[820px] rounded-full ambient-aurora-left"
        style={{
          background: 'radial-gradient(circle at center, rgba(94, 28, 66, 0.32) 0%, rgba(52, 17, 36, 0.14) 50%, rgba(31, 8, 20, 0) 75%)',
          filter: 'blur(95px)',
        }}
      />

      {/* Aurora 4: Bottom Floating Slate Tone */}
      <div 
        className="absolute -bottom-[12%] right-[10%] w-[680px] sm:w-[850px] h-[460px] sm:h-[600px] rounded-full ambient-aurora-bottom"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(86, 138, 165, 0.18) 0%, rgba(86, 138, 165, 0.05) 50%, rgba(31, 8, 20, 0) 75%)',
          filter: 'blur(110px)',
        }}
      />

      {/* 3. Floating Atmospheric Bubbles (Süzülen Işık Baloncukları) */}
      {/* Bubble 1: Upper-left slate luminous orb */}
      <div 
        className="absolute top-[18%] left-[12%] w-44 h-44 sm:w-56 sm:h-56 rounded-full atmospheric-bubble-1"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(142, 195, 220, 0.35) 0%, rgba(86, 138, 165, 0.20) 40%, rgba(86, 138, 165, 0.03) 70%, transparent 100%)',
          filter: 'blur(30px)',
          boxShadow: 'inset 0 0 25px rgba(238, 209, 209, 0.08), 0 0 45px rgba(86, 138, 165, 0.25)',
        }}
      />

      {/* Bubble 2: Right-side radiant cyan-slate orb */}
      <div 
        className="absolute top-[34%] right-[16%] w-36 h-36 sm:w-48 sm:h-48 rounded-full atmospheric-bubble-2"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(160, 205, 226, 0.38) 0%, rgba(86, 138, 165, 0.18) 45%, rgba(86, 138, 165, 0.02) 75%, transparent 100%)',
          filter: 'blur(26px)',
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.09), 0 0 40px rgba(110, 165, 196, 0.22)',
        }}
      />

      {/* Bubble 3: Center-left soft plum-violet floating orb */}
      <div 
        className="absolute top-[48%] left-[22%] w-52 h-52 sm:w-64 sm:h-64 rounded-full atmospheric-bubble-3"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(135, 42, 94, 0.30) 0%, rgba(77, 24, 54, 0.16) 45%, rgba(31, 8, 20, 0.02) 75%, transparent 100%)',
          filter: 'blur(35px)',
          boxShadow: 'inset 0 0 30px rgba(238, 209, 209, 0.06), 0 0 50px rgba(115, 36, 80, 0.20)',
        }}
      />

      {/* Bubble 4: Delicate small cyan dewdrop orb */}
      <div 
        className="absolute top-[65%] right-[28%] w-24 h-24 sm:w-32 sm:h-32 rounded-full atmospheric-bubble-4"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(175, 218, 238, 0.42) 0%, rgba(86, 138, 165, 0.22) 40%, transparent 80%)',
          filter: 'blur(18px)',
          boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.12), 0 0 35px rgba(142, 195, 220, 0.28)',
        }}
      />

      {/* Bubble 5: Lower-left slate-twilight bubble */}
      <div 
        className="absolute top-[78%] left-[8%] w-40 h-40 sm:w-52 sm:h-52 rounded-full atmospheric-bubble-5"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(110, 165, 196, 0.32) 0%, rgba(86, 138, 165, 0.16) 45%, transparent 75%)',
          filter: 'blur(32px)',
          boxShadow: 'inset 0 0 25px rgba(255, 255, 255, 0.07), 0 0 45px rgba(86, 138, 165, 0.20)',
        }}
      />

      {/* Bubble 6: Lower-right gentle plum-glow bubble */}
      <div 
        className="absolute top-[86%] right-[10%] w-48 h-48 sm:w-60 sm:h-60 rounded-full atmospheric-bubble-6"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(118, 36, 82, 0.28) 0%, rgba(70, 20, 50, 0.14) 50%, transparent 80%)',
          filter: 'blur(36px)',
          boxShadow: 'inset 0 0 25px rgba(238, 209, 209, 0.05), 0 0 40px rgba(95, 28, 66, 0.18)',
        }}
      />

      {/* 4. Film Grain / Subtle Noise Overlay to prevent gradient banding on OLED/Retina */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 5. Apple Vignette: Subtle edge feathering */}
      <div 
        className="absolute inset-0 bg-radial-vignette opacity-50"
      />
    </div>
  );
};
