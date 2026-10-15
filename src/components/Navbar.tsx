import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Menu, X, ChevronRight, ChevronDown, LogOut, ArrowRightLeft, UserCheck, BookOpen } from 'lucide-react';
import { TabType, TAB_PATHS } from '../lib/routes';
import { AdminProfile } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingCount?: number;
  activeAdmin?: AdminProfile | null;
  onSignOut?: () => void;
  onSwitchProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  activeAdmin = null,
  onSignOut,
  onSwitchProfile
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home' as const, label: 'Ana Sayfa', path: TAB_PATHS.home },
    { id: 'equipment' as const, label: 'Ekipmanlar', path: TAB_PATHS.equipment },
    { id: 'guide' as const, label: 'Çekim Rehberi', path: TAB_PATHS.guide },
    { id: 'tips' as const, label: 'Faydalı Bilgiler', path: TAB_PATHS.tips },
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
    setProfileDropdownOpen(false);
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
            <span className="text-sm font-semibold text-white tracking-tight font-satoshi">
              Rezervasyon Sitesi
            </span>
          </a>

          {/* Desktop Nav - Minimalist text links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
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

          {/* Desktop Admin / User Profile Area */}
          <div className="hidden md:flex items-center gap-3">
            {activeAdmin ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    activeTab === 'admin'
                      ? 'bg-[#301322] border-[#657796] ring-1 ring-[#657796]/40 text-white'
                      : 'bg-[#1c0f18] hover:bg-[#251520] border-[#657796]/30 text-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#241120] flex items-center justify-center text-white text-[11px] font-mono font-medium shadow-inner border border-white/15 shrink-0">
                    {activeAdmin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-left leading-tight hidden lg:block">
                    <div className="font-bold text-xs text-white truncate max-w-[120px]">
                      {activeAdmin.full_name}
                    </div>
                    <div className="text-[10px] text-[#a9b9d3]">
                      {activeAdmin.short_title}
                    </div>
                  </div>
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded text-[10px] font-bold bg-[#657796] text-white">
                      {pendingCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8193b2] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1c0f18] border border-[#657796]/40 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-[#657796]/20 bg-[#12080f]/50">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Aktif Yönetici Oturumu</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1 truncate">
                        {activeAdmin.full_name}
                      </div>
                      <div className="text-[11px] text-[#8193b2]">
                        {activeAdmin.title}
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleNavClick('admin', e)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          activeTab === 'admin'
                            ? 'bg-[#301322] text-white font-semibold'
                            : 'text-[#dce4ef] hover:text-white hover:bg-[#301322]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#8193b2]" />
                          Yönetim Paneli
                        </span>
                        {pendingCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#657796] text-white">
                            {pendingCount} Talep
                          </span>
                        )}
                      </button>

                      {onSwitchProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onSwitchProfile();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#dce4ef] hover:text-white hover:bg-[#301322] transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-4 h-4 text-[#8193b2]" />
                          <span>Başka Profile Geçiş Yap</span>
                        </button>
                      )}

                      <div className="pt-1 mt-1 border-t border-[#657796]/20">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            if (onSignOut) onSignOut();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Çıkış Yap (Sign Out)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-2">
            {activeAdmin ? (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-[#301322] border-[#657796]' : 'bg-[#1c0f18] border-[#657796]/30'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-[#241120] flex items-center justify-center text-white text-[10px] font-mono font-medium border border-white/15">
                  {activeAdmin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              </button>
            ) : (
              <a
                href={TAB_PATHS.admin}
                onClick={(e) => handleNavClick('admin', e)}
                className="p-2 rounded-lg bg-white/[0.05] text-white/80 border border-white/[0.08]"
                aria-label="Admin Paneli"
              >
                <ShieldCheck className="w-4 h-4 text-[#8193b2]" />
              </a>
            )}

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

          {/* Mobile Profile & Admin Block */}
          {activeAdmin ? (
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <div className="p-3 rounded-2xl bg-[#1c0f18] border border-[#657796]/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#241120] flex items-center justify-center text-white text-xs font-mono font-medium shadow-inner border border-white/15 shrink-0">
                    {activeAdmin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{activeAdmin.full_name}</div>
                    <div className="text-[10px] text-[#8193b2]">{activeAdmin.title}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleNavClick('admin', e)}
                  className="px-2.5 py-1 rounded-lg bg-[#301322] text-[#dce4ef] text-[11px] font-semibold border border-[#657796]/30"
                >
                  Panele Git
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {onSwitchProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSwitchProfile();
                    }}
                    className="px-3 py-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-xs font-semibold text-[#dce4ef] border border-[#657796]/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#8193b2]" />
                    <span>Profil Değiştir</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </header>
  );
};
