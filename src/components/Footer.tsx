import React from 'react';
import { Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-20 border-t border-white/10 bg-[rgba(20,2,9,0.75)] backdrop-blur-xl text-[#ded0d9] text-xs mt-6 sm:mt-10 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
          {/* Left Side: Brand Logo & Developer Signatures directly beside it */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="YTÜFOK" 
                className="h-7 sm:h-8 w-auto object-contain opacity-95 select-none pointer-events-none" 
                draggable={false} 
              />
              <span className="text-sm font-semibold text-[#ded0d9] font-satoshi tracking-tight">
                YTÜFOK <span className="text-[#ded0d9]/60 font-normal">Resmi Web Sitesi</span>
              </span>
            </div>

            {/* Separator on desktop */}
            <span className="hidden sm:inline-block w-px h-4 bg-white/25" />

            {/* Developer Signatures right next to the logo */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#ded0d9]/60">
                Geliştiren:
              </span>
              <a
                href="https://instagram.com/ysbahadir"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-mono font-medium text-[11px] transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title="Instagram: @ysbahadir"
              >
                <Instagram className="w-3 h-3 text-[#ded0d9]/80 group-hover:text-white transition-colors" />
                <span>@ysbahadir</span>
              </a>
              <a
                href="https://instagram.com/s4rm41"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-mono font-medium text-[11px] transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title="Instagram: @s4rm41"
              >
                <Instagram className="w-3 h-3 text-[#ded0d9]/80 group-hover:text-white transition-colors" />
                <span>@s4rm41</span>
              </a>
            </div>
          </div>

          {/* Right Side: Copyright */}
          <div className="text-[11px] text-[#ded0d9]/60 text-center sm:text-right font-light">
            &copy; {new Date().getFullYear()} Yıldız Teknik Üniversitesi Fotoğraf Kulübü (YTÜFOK).
          </div>
        </div>
      </div>
    </footer>
  );
};

