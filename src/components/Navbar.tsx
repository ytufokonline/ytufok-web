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
    { id: 'home' as const, label: 'Ana Sayfa', icon: Sparkles, path: TAB_PATHS.home },
    { id: 'equipment' as const, label: 'Ekipman Havuzu', icon: Camera, path: TAB_PATHS.equipment },
    { id: 'reserve' as const, label: 'Rezervasyon Yap', icon: Calendar, path: TAB_PATHS.reserve },
    { id: 'darkroom' as const, label: 'Karanlık Oda', icon: Droplets, path: TAB_PATHS.darkroom },
    { id: 'status' as const, label: 'Talep Sorgula', icon: Search, path: TAB_PATHS.status },
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
    <header className="sticky top-0 z-40 bg-[#12080f]/85 backdrop-blur-2xl border-b border-white/[0.07] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <a 
            href={TAB_PATHS.home}
            onClick={(e) => handleNavClick('home', e)}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative h-10 sm:h-11 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="YTÜFOK" 
                className="h-full w-auto object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-white font-club tracking-tight group-hover:text-[#dce4ef] transition-colors leading-none">
                YTÜFOK <span className="text-[#8193b2] font-normal">Online</span>
              </span>
              <span className="text-[10px] uppercase font-medium tracking-[0.16em] text-[#a9b9d3]/80 mt-1 hidden sm:block">
                Ekipman & Rezervasyon
              </span>
            </div>
          </a>

          {/* Desktop Navigation - Apple Segmented Pill */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => handleNavClick(item.id, e)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-white/[0.12] text-white shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] border border-white/[0.12]'
                      : 'text-[#a9b9d3] hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#8193b2]' : 'text-[#a9b9d3]'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Desktop Admin Portal Trigger */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                activeTab === 'admin'
                  ? 'bg-white text-[#12080f] border-white shadow-md'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-[#dce4ef] hover:text-white border-white/[0.09] hover:border-white/[0.16]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8193b2]" />
              <span>Yönetim</span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-bold bg-[#657796] text-white">
                  {pendingCount}
                </span>
              )}
            </a>
          </div>

          {/* Mobile Actions: Admin Shortcut & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className="p-2 rounded-full bg-white/[0.04] text-[#dce4ef] border border-white/[0.08]"
              aria-label="Admin Paneli"
            >
              <ShieldCheck className="w-4 h-4 text-[#8193b2]" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-white/[0.04] text-[#a9b9d3] hover:text-white border border-white/[0.08] focus:outline-none transition-colors"
              aria-label="Menüyü Aç/Kapat"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown with Frosted Backdrop */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#160a13]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => handleNavClick(item.id, e)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.1] text-white border border-white/[0.1]'
                    : 'text-[#dce4ef] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#8193b2]' : 'text-[#a9b9d3]'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </a>
            );
          })}

          <div className="pt-2 border-t border-white/[0.06]">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium border transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-[#12080f] border-white'
                  : 'bg-white/[0.04] text-[#dce4ef] border-white/[0.08]'
              }`}
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#8193b2]" />
                Yönetici Portalı
              </span>
              {pendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#657796] text-white">
                  {pendingCount} Talep
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-white/30" />
              )}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
