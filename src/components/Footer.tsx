import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] text-[#a9b9d3] text-xs mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="YTÜFOK" className="h-8 w-auto object-contain opacity-90" />
            <span className="text-sm font-semibold text-white font-satoshi tracking-tight">
              YTÜFOK <span className="text-[#8193b2] font-normal">Ekipman Havuzu</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 text-xs text-[#a9b9d3]">
            <div>
              &copy; {new Date().getFullYear()} Yıldız Teknik Üniversitesi Fotoğraf Kulübü (YTÜFOK).
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8193b2]">
              <span>Geliştiren:</span>
              <span className="text-white/80 font-medium">Yavuz Selim Bahadır</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
