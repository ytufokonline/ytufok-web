import React, { useState } from 'react';
import { Camera, Calendar, Search, ShieldCheck, Menu, X, Sparkles, Droplets } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'equipment' | 'reserve' | 'darkroom' | 'status' | 'admin';
  setActiveTab: (tab: 'home' | 'equipment' | 'reserve' | 'darkroom' | 'status' | 'admin') => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Ana Sayfa', icon: Sparkles },
    { id: 'equipment', label: 'Kamera & Lens Havuzu', icon: Camera },
    { id: 'reserve', label: 'Rezervasyon Yap', icon: Calendar },
    { id: 'darkroom', label: 'Karanlık Oda', icon: Droplets },
    { id: 'status', label: 'Talep Sorgula', icon: Search },
  ] as const;

  const handleNavClick = (tab: 'home' | 'equipment' | 'reserve' | 'darkroom' | 'status' | 'admin') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#12080f]/92 backdrop-blur-md border-b border-[#657796]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('home')}
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
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#657796] to-[#4e3b52] text-white shadow-md shadow-[#301322]/40 border border-[#8193b2]/30'
                      : 'text-[#dce4ef] hover:text-white hover:bg-[#301322]/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Admin CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => handleNavClick('admin')}
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
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => handleNavClick('admin')}
              className="p-2 rounded-xl bg-[#301322] text-[#dce4ef] border border-[#657796]/30"
              aria-label="Admin Paneli"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#a9b9d3] hover:text-white hover:bg-[#301322] focus:outline-none"
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
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold ${
                  isActive
                    ? 'bg-gradient-to-r from-[#657796] to-[#4e3b52] text-white'
                    : 'text-[#dce4ef] hover:bg-[#301322] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => handleNavClick('admin')}
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
          </button>
        </div>
      )}
    </header>
  );
};
