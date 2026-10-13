import React, { useState } from 'react';
import { Camera, Calendar, Search, ShieldCheck, Menu, X, Sparkles, Droplets, ChevronRight } from 'lucide-react';
import { TabType, TAB_PATHS } from '../lib/routes';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Ana Sayfa', path: TAB_PATHS.home },
    { id: 'equipment' as const, label: 'Ekipmanlar', path: TAB_PATHS.equipment },
    { id: 'reserve' as const, label: 'Rezervasyon', path: TAB_PATHS.reserve },
    { id: 'darkroom' as const, label: 'Karanlık Oda', path: TAB_PATHS.darkroom },
    { id: 'status' as const, label: 'Talep Takibi', path: TAB_PATHS.status },
  ];

  const handleNavClick = (tab: TabType, e?: React.MouseEvent) => {
    if (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#12080f]/90 backdrop-blur-md border-b border-white/[0.08] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand - Apple style minimal brand mark */}
          <a 
            href={TAB_PATHS.home}
            onClick={(e) => handleNavClick('home', e)}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <img 
              src="/logo.png" 
              alt="YTÜFOK" 
              className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-sm font-semibold text-white tracking-tight font-club">
              YTÜFOK
            </span>
          </a>

          {/* Desktop Nav - Apple.com minimalist text links */}
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => handleNavClick(item.id, e)}
                  className={`text-[13px] tracking-tight transition-colors duration-150 relative py-1 ${
                    isActive
                      ? 'text-white font-medium after:absolute after:bottom-0 after:inset-x-0 after:h-[1.5px] after:bg-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop Admin CTA - Refined minimal button */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-[#12080f]'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/90 hover:text-white border border-white/[0.1]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8193b2]" />
              <span>Yönetim</span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded text-[10px] font-bold bg-[#657796] text-white">
                  {pendingCount}
                </span>
              )}
            </a>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className="p-2 rounded-lg bg-white/[0.05] text-white/80 border border-white/[0.08]"
              aria-label="Admin Paneli"
            >
              <ShieldCheck className="w-4 h-4 text-[#8193b2]" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white/70 hover:text-white focus:outline-none"
              aria-label="Menüyü Aç/Kapat"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#160a13] px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => handleNavClick(item.id, e)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </a>
            );
          })}

          <div className="pt-2 border-t border-white/[0.06]">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-[#12080f] border-white'
                  : 'bg-white/[0.05] text-white/80 border-white/[0.08]'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8193b2]" />
                Yönetici Portalı
              </span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#657796] text-white">
                  {pendingCount} Talep
                </span>
              )}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
