import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] text-[#ded0d9]/60 text-xs mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="YTÜFOK" className="h-8 w-auto object-contain opacity-90 select-none pointer-events-none" draggable={false} />
            <span className="text-sm font-semibold text-[#ded0d9] font-satoshi tracking-tight">
              YTÜFOK <span className="text-[#ded0d9]/60 font-normal">Ekipman Havuzu</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 text-xs text-[#ded0d9]/70">
            <div>
              &copy; {new Date().getFullYear()} Yıldız Teknik Üniversitesi Fotoğraf Kulübü (YTÜFOK).
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#ded0d9]/60">
              <span>Geliştiren:</span>
              <a
                href="https://instagram.com/ysbahadir"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#ded0d9] hover:text-white transition-colors hover:underline cursor-pointer"
              >
                @ysbahadir
              </a>
              <a
                href="https://instagram.com/s4rm41"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#ded0d9] hover:text-white transition-colors hover:underline cursor-pointer"
              >
                @s4rm41
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
