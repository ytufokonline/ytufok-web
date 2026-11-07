import React, { useState } from 'react';
import { ShieldAlert, Instagram, Lock } from 'lucide-react';
import { AtmosphericBackground } from '../components/AtmosphericBackground';
import { AppleReveal } from '../components/AppleReveal';

interface MaintenancePageProps {
  onAdminBypass?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onAdminBypass }) => {
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    const next = clickCount + 1;
    if (next >= 5 && onAdminBypass) {
      onAdminBypass();
    } else {
      setClickCount(next);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 py-8 sm:py-12 relative text-[#ded0d9] selection:bg-[#568aa5]/40 selection:text-white font-sans overflow-hidden">
      {/* Signature Atmospheric Background with fluid cursor spotlight */}
      <AtmosphericBackground />

      {/* Top spacer */}
      <div className="w-full flex justify-end items-center max-w-5xl z-10 opacity-0 pointer-events-none">
        <span className="text-xs">YTÜFOK</span>
      </div>

      {/* Center Content */}
      <div className="w-full max-w-3xl mx-auto my-auto py-10 z-10 text-center space-y-8">
        
        {/* YTÜFOK Official Logo */}
        <AppleReveal delay={0} variant="scale" className="w-56 sm:w-72 md:w-80 mx-auto">
          <img
            src="/ytufok-hero-logo.png?v=3"
            alt="YTÜFOK - Yıldız Teknik Üniversitesi Fotoğraf Kulübü"
            className="w-full h-auto object-contain mix-blend-screen select-none mx-auto cursor-pointer transition-transform active:scale-95"
            onClick={handleLogoClick}
            title="YTÜFOK"
          />
        </AppleReveal>

        {/* Status Pill Badge */}
        <AppleReveal delay={80}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 text-xs font-mono uppercase tracking-widest shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Sistem Bakımı & Güvenlik Güncellemesi</span>
          </div>
        </AppleReveal>

        {/* Monumental Headline */}
        <AppleReveal delay={160} className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white font-club leading-[1.08]">
            Sitemiz şu anda bakımdadır.
          </h1>
          <p className="text-base sm:text-xl text-white/60 font-light max-w-xl mx-auto leading-relaxed pt-2">
            Daha güvenli ve kesintisiz bir deneyim sunmak amacıyla sistemlerimizde kapsamlı güvenlik ve altyapı iyileştirmesi gerçekleştirilmektedir.
          </p>
        </AppleReveal>

        {/* Notice Card */}
        <AppleReveal delay={240}>
          <div className="p-5 sm:p-6 rounded-2xl glass-card max-w-md mx-auto space-y-3 text-left border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Geçici Olarak Kapalı</span>
            </div>
            
            <p className="text-xs text-white/70 leading-relaxed font-light">
              Acil kulüp işleri, ekipman ve karanlık oda talepleriniz için Instagram üzerinden Yönetim Kurulumuza doğrudan ulaşabilirsiniz.
            </p>

            <div className="pt-3 flex items-center justify-between border-t border-white/[0.08]">
              <a
                href="https://instagram.com/ytufok"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono text-amber-300 hover:text-amber-200 transition-colors group cursor-pointer"
              >
                <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>@ytufok</span>
              </a>
              <span className="text-[11px] font-mono text-white/40">Yıldız Teknik Üniversitesi</span>
            </div>
          </div>
        </AppleReveal>

      </div>

      {/* Footer */}
      <footer className="w-full text-center space-y-1.5 text-white/30 text-xs font-mono z-10 pt-6">
        <div>YTÜFOK © 1994 - 2026 • Tüm Hakları Saklıdır</div>
        <div className="text-[11px] text-white/20">Yıldız Teknik Üniversitesi Fotoğraf Kulübü</div>
        
        {/* Subtle Admin Entrance */}
        {onAdminBypass && (
          <div className="pt-2">
            <button
              onClick={onAdminBypass}
              className="text-white/15 hover:text-white/40 transition-colors p-1 rounded cursor-pointer inline-flex items-center gap-1 text-[10px]"
              title="Yönetici Girişi"
            >
              <Lock className="w-3 h-3" />
              <span>Yönetici</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
