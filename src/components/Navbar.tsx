import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, X, ChevronRight, ChevronDown, LogOut, ArrowRightLeft, UserCheck, BookOpen } from 'lucide-react';
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileProfileDropdownOpen, setMobileProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileLinkRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({ left: 0, width: 0, opacity: 0 });

  // Update sliding indicator position on activeTab change and resize
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = linkRefs.current[activeTab];
      const navEl = navRef.current;
      if (activeEl && navEl) {
        const navRect = navEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - navRect.left,
          width: activeRect.width,
          opacity: 1,
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    // Allow slight delay for font rendering if needed
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

  // Center active tab in mobile horizontal scroll view
  useEffect(() => {
    const activeMobileEl = mobileLinkRefs.current[activeTab];
    if (activeMobileEl && mobileNavRef.current) {
      activeMobileEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeTab]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setMobileProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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
    setProfileDropdownOpen(false);
    setMobileProfileDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-[24px] backdrop-saturate-[115%] bg-[rgba(28,2,13,0.82)] bg-gradient-to-r from-[rgba(145,205,240,0.08)] via-[rgba(38,6,22,0.40)] to-[rgba(86,138,165,0.05)] border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand & Desktop Nav Group */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {/* Brand - Apple style minimal brand mark */}
            <a 
              href={TAB_PATHS.home}
              onClick={(e) => handleNavClick('home', e)}
              className="flex items-center cursor-pointer group select-none py-1"
              aria-label="YTÜFOK Ana Sayfa"
            >
              <img 
                src="/logo.png" 
                alt="YTÜFOK" 
                className="h-7 sm:h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </a>

            {/* Desktop Nav - Minimalist text links with sliding underline */}
            <nav ref={navRef} className="hidden md:flex items-center gap-5 lg:gap-7 relative py-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    ref={(el) => { linkRefs.current[item.id] = el; }}
                    href={item.path}
                    onClick={(e) => handleNavClick(item.id, e)}
                    className={`text-[13px] tracking-tight transition-colors duration-150 relative py-1 ${
                      isActive
                        ? 'text-white font-medium'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}

              {/* Dynamic Sliding Underline Indicator */}
              <span
                className="absolute bottom-0 left-0 h-[1.5px] bg-gradient-to-r from-sky-200 to-white rounded-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{
                  transform: `translateX(${indicatorStyle.left}px)`,
                  width: `${indicatorStyle.width}px`,
                  opacity: indicatorStyle.opacity,
                }}
                aria-hidden="true"
              />
            </nav>
          </div>

          {/* Desktop Admin / User Profile Area */}
          <div className="hidden md:flex items-center gap-3">
            {activeAdmin ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    activeTab === 'admin'
                      ? 'bg-black/35 border-[#568aa5] ring-1 ring-[#568aa5]/40 text-white'
                      : 'bg-[#1a0611] hover:bg-[#250d1b] border-[#568aa5]/30 text-white'
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
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded text-[10px] font-bold bg-[#568aa5] text-white">
                      {pendingCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel border border-white/20 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Aktif Yönetici Oturumu</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1 truncate">
                        {activeAdmin.full_name}
                      </div>
                      <div className="text-[11px] text-white/60">
                        {activeAdmin.title}
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleNavClick('admin', e)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          activeTab === 'admin'
                            ? 'bg-black/35 text-white font-semibold'
                            : 'text-white hover:text-white hover:bg-black/35'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-white/60" />
                          Yönetim Paneli
                        </span>
                        {pendingCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#568aa5] text-white">
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
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white hover:text-white hover:bg-black/35 transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-4 h-4 text-white/60" />
                          <span>Başka Profile Geçiş Yap</span>
                        </button>
                      )}

                      <div className="pt-1 mt-1 border-t border-white/10">
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
                    ? 'bg-white text-[#1c020d]'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/90 hover:text-white border border-white/[0.1]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white/60" />
                <span>Yönetim</span>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded text-[10px] font-bold bg-[#568aa5] text-white">
                    {pendingCount}
                  </span>
                )}
              </a>
            )}
          </div>

          {/* Mobile Header: All tabs placed horizontally, fixed & sticky at top */}
          <div className="flex md:hidden items-center justify-between h-14 gap-2 w-full select-none no-tap-highlight">
            {/* Mobile Logo */}
            <a 
              href={TAB_PATHS.home}
              onClick={(e) => handleNavClick('home', e)}
              className="shrink-0 flex items-center select-none py-1 cursor-pointer active:opacity-75 transition-opacity"
              aria-label="YTÜFOK Ana Sayfa"
              draggable={false}
            >
              <img 
                src="/logo.png" 
                alt="YTÜFOK" 
                draggable={false}
                className="h-7 w-auto object-contain opacity-95 select-none pointer-events-none"
              />
            </a>

            {/* Mobile Horizontal Navigation Strip (All tabs horizontally in top bar) */}
            <nav 
              ref={mobileNavRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 min-w-0 flex-1 select-none overscroll-x-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    ref={(el) => { mobileLinkRefs.current[item.id] = el; }}
                    href={item.path}
                    onClick={(e) => handleNavClick(item.id, e)}
                    draggable={false}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] font-medium tracking-tight transition-all duration-150 select-none whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white/[0.14] text-[#ded0d9] border border-white/25 shadow-[0_1px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]'
                        : 'text-[#ded0d9]/65 hover:text-[#ded0d9] active:text-[#ded0d9] border border-transparent'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Mobile Admin Profile / Quick Action */}
            <div className="shrink-0 relative" ref={mobileDropdownRef}>
              {activeAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMobileProfileDropdownOpen(!mobileProfileDropdownOpen)}
                    className="p-1 rounded-full border border-[#568aa5]/40 bg-[#1c020d]/80 cursor-pointer select-none active:scale-95 transition-transform"
                    title={activeAdmin.full_name}
                    aria-label="Yönetici Menüsü"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#241120] flex items-center justify-center text-[#ded0d9] text-[10px] font-mono font-medium border border-white/15">
                      {activeAdmin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  </button>

                  {mobileProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel border border-white/20 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3.5 py-2 border-b border-white/10 bg-white/5">
                        <div className="text-xs font-bold text-[#ded0d9] truncate">
                          {activeAdmin.full_name}
                        </div>
                        <div className="text-[10px] text-[#ded0d9]/60">
                          {activeAdmin.title}
                        </div>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            setMobileProfileDropdownOpen(false);
                            handleNavClick('admin', e);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#ded0d9] hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#ded0d9]/70" />
                            Yönetim Paneli
                          </span>
                          {pendingCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#568aa5] text-white">
                              {pendingCount}
                            </span>
                          )}
                        </button>
                        {onSwitchProfile && (
                          <button
                            type="button"
                            onClick={() => {
                              setMobileProfileDropdownOpen(false);
                              onSwitchProfile();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#ded0d9] hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <ArrowRightLeft className="w-4 h-4 text-[#ded0d9]/70" />
                            <span>Profil Değiştir</span>
                          </button>
                        )}
                        <div className="pt-1 mt-1 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              setMobileProfileDropdownOpen(false);
                              if (onSignOut) onSignOut();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 text-rose-400" />
                            <span>Çıkış Yap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <a
                  href={TAB_PATHS.admin}
                  onClick={(e) => handleNavClick('admin', e)}
                  className={`relative p-1.5 rounded-full border transition-all flex items-center justify-center cursor-pointer select-none active:scale-95 ${
                    activeTab === 'admin'
                      ? 'bg-white/[0.15] border-white/30 text-[#ded0d9]'
                      : 'bg-white/[0.06] hover:bg-white/[0.10] border-white/15 text-[#ded0d9]/80 hover:text-[#ded0d9]'
                  }`}
                  aria-label="Admin Paneli"
                  draggable={false}
                >
                  <ShieldCheck className="w-4 h-4 text-[#ded0d9]/70" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#568aa5] text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
