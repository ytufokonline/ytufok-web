import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#12080f] border-t border-[#657796]/20 text-[#a9b9d3] text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="YTÜFOK" className="h-10 w-auto object-contain" />
            <span className="text-base sm:text-lg font-bold text-white font-club tracking-tight">
              YTÜFOK <span className="text-[#8193b2]">Ekipman Havuzu</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 text-xs text-[#a9b9d3]">
            <div>
              &copy; {new Date().getFullYear()} Yıldız Teknik Üniversitesi Fotoğraf Kulübü (YTÜFOK).
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8193b2]">
              <span>Geliştiren:</span>
              <span className="text-[#dce4ef] font-medium tracking-wide">Yavuz Selim Bahadır</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
