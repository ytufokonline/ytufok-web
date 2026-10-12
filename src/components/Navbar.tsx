import React, { useState } from 'react';
import { Camera, Calendar, Search, ShieldCheck, Menu, X, Sparkles, Droplets } from 'lucide-react';
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
    { id: 'equipment' as const, label: 'Kamera & Lens Havuzu', icon: Camera, path: TAB_PATHS.equipment },
    { id: 'reserve' as const, label: 'Rezervasyon Yap', icon: Calendar, path: TAB_PATHS.reserve },
    { id: 'darkroom' as const, label: 'Karanlık Oda', icon: Droplets, path: TAB_PATHS.darkroom },
    { id: 'status' as const, label: 'Talep Sorgula', icon: Search, path: TAB_PATHS.status },
  ];

  const handleNavClick = (tab: TabType, e?: React.MouseEvent) => {
    if (e) {
      // If user Cmd+Click, Ctrl+Click, Shift+Click, or middle click, let the browser open in new tab
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#12080f]/92 backdrop-blur-md border-b border-[#657796]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <a 
            href={TAB_PATHS.home}
            onClick={(e) => handleNavClick('home', e)}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            {/* 100% Transparent Official YTÜFOK Logo */}
            <div className="relative h-11 sm:h-12 flex items-center justify-center transition-transform group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="YTÜFOK Logo" 
                className="h-full w-auto object-contain"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#301322] text-[#dce4ef] border border-[#657796]/30">
                  REZERVASYON
                </span>
              </div>
              <p className="text-[11px] text-[#a9b9d3] font-normal hidden sm:block tracking-wide mt-0.5">
                Fotoğraf Kulübü Ekipman & Zimmet Sistemi
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => handleNavClick(item.id, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#657796] to-[#4e3b52] text-white shadow-md shadow-[#301322]/40 border border-[#8193b2]/30'
                      : 'text-[#dce4ef] hover:text-white hover:bg-[#301322]/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Admin CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'admin'
                  ? 'bg-white text-[#301322] border-white shadow-lg'
                  : 'bg-[#301322] hover:bg-[#421d31] text-white border-[#657796]/40 shadow-sm'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#8193b2]" />
              <span>Yönetim Paneli</span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold bg-[#657796] text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={TAB_PATHS.admin}
              onClick={(e) => handleNavClick('admin', e)}
              className="p-2 rounded-xl bg-[#301322] text-[#dce4ef] border border-[#657796]/30"
              aria-label="Admin Paneli"
            >
              <ShieldCheck className="w-4 h-4" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#a9b9d3] hover:text-white hover:bg-[#301322] focus:outline-none"
              aria-label="Menüyü Aç/Kapat"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1c0f18] border-b border-[#657796]/20 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                onClick={(e) => handleNavClick(item.id, e)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold ${
                  isActive
                    ? 'bg-gradient-to-r from-[#657796] to-[#4e3b52] text-white'
                    : 'text-[#dce4ef] hover:bg-[#301322] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </a>
            );
          })}
          <a
            href={TAB_PATHS.admin}
            onClick={(e) => handleNavClick('admin', e)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs font-bold border ${
              activeTab === 'admin'
                ? 'bg-white text-[#301322] border-white'
                : 'bg-[#301322] text-[#dce4ef] border-[#657796]/30'
            }`}
          >
            <span className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              Yönetim Paneli (Admin)
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#657796] text-white">
                {pendingCount} Bekleyen
              </span>
            )}
          </a>
        </div>
      )}
    </header>
  );
};
