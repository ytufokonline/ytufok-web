import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] text-[#ded0d9]/70 text-xs mt-24 pb-28 sm:pb-12 pt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left Side: Brand Logo & Developer Signatures right next to it */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="YTÜFOK" 
                className="h-8 w-auto object-contain opacity-90 select-none pointer-events-none" 
                draggable={false} 
              />
              <span className="text-sm font-semibold text-[#ded0d9] font-satoshi tracking-tight">
                YTÜFOK <span className="text-[#ded0d9]/60 font-normal">Ekipman Havuzu</span>
              </span>
            </div>

            {/* Separator on desktop */}
            <span className="hidden sm:inline-block w-px h-4 bg-white/20" />

            {/* Developer Signatures right next to the logo */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#ded0d9]/50">
                Geliştiren:
              </span>
              <a
                href="https://instagram.com/ysbahadir"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 hover:border-white/40 text-[#ded0d9] hover:text-white font-mono font-medium text-[11px] transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title="Instagram: @ysbahadir"
              >
                <span>@ysbahadir</span>
              </a>
              <a
                href="https://instagram.com/s4rm41"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 hover:border-white/40 text-[#ded0d9] hover:text-white font-mono font-medium text-[11px] transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title="Instagram: @s4rm41"
              >
                <span>@s4rm41</span>
              </a>
            </div>
          </div>

          {/* Right Side: Copyright */}
          <div className="text-xs text-[#ded0d9]/60 text-center sm:text-right">
            &copy; {new Date().getFullYear()} Yıldız Teknik Üniversitesi Fotoğraf Kulübü (YTÜFOK).
          </div>
        </div>
      </div>
    </footer>
  );
};
