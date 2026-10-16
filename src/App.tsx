import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { EquipmentPage } from './pages/EquipmentPage';
import { ReservationPage } from './pages/ReservationPage';
import { DarkroomPage } from './pages/DarkroomPage';
import { ReservationStatusPage } from './pages/ReservationStatusPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SwitchProfileModal } from './components/SwitchProfileModal';
import { EquipmentGuidePage } from './pages/EquipmentGuidePage';
import { UsefulInfoPage } from './pages/UsefulInfoPage';
import { AdminProfile } from './types';
import { api } from './lib/api';
import { TabType, parseCurrentLocation, getUrlForTab, TAB_TITLES } from './lib/routes';
import { BookOpen } from 'lucide-react';
import { initAppleScrollReveal } from './utils/scrollReveal';
import { AtmosphericBackground } from './components/AtmosphericBackground';

export function App() {
  const initialRoute = parseCurrentLocation();
  const [activeTab, setActiveTab] = useState<TabType>(initialRoute.tab);
  const [preselectedEquipmentId, setPreselectedEquipmentId] = useState<string | undefined>(initialRoute.equipmentId);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Global Auth State for Active Admin Profile
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(null);
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [showSwitchProfileModal, setShowSwitchProfileModal] = useState<boolean>(false);

  // Synchronize document title with active tab
  useEffect(() => {
    document.title = TAB_TITLES[activeTab] || 'YTÜFOK | Fotoğraf Kulübü Rezervasyon & Ekipman Sistemi';
  }, [activeTab]);

  // Initialize Apple signature scroll-reveal
  useEffect(() => {
    const cleanup = initAppleScrollReveal();
    return cleanup;
  }, [activeTab]);

  // Initial Auth Check & Global Auth State Listener
  useEffect(() => {
    let isMounted = true;

    // 1. Initial check
    api.getActiveAdmin().then((admin) => {
      if (isMounted) setActiveAdmin(admin);
    });

    api.getAdminProfiles().then((profiles) => {
      if (isMounted) setAdminProfiles(profiles);
    });

    // 2. Real-time auth state subscription
    const unsubscribe = api.onAuthChange((admin) => {
      if (isMounted) {
        setActiveAdmin(admin);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Global Sign Out Handler
  const handleSignOut = async () => {
    await api.signOut();
    setActiveAdmin(null);
  };

  // Navigate helper that pushes/replaces History state and updates tab
  const navigate = useCallback((tab: TabType, options?: { equipmentId?: string; searchCode?: string; replace?: boolean }) => {
    const targetUrl = getUrlForTab(tab, options?.equipmentId, options?.searchCode);
    const currentUrl = window.location.pathname + window.location.search;

    if (targetUrl !== currentUrl) {
      if (options?.replace) {
        window.history.replaceState({ tab, equipmentId: options?.equipmentId, searchCode: options?.searchCode }, '', targetUrl);
      } else {
        window.history.pushState({ tab, equipmentId: options?.equipmentId, searchCode: options?.searchCode }, '', targetUrl);
      }
    }

    setActiveTab(tab);
    if (options?.equipmentId !== undefined) {
      setPreselectedEquipmentId(options.equipmentId);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Listen to browser Back/Forward (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentLocation();
      setActiveTab(route.tab);
      if (route.equipmentId !== undefined) {
        setPreselectedEquipmentId(route.equipmentId);
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Normalize initial URL if loaded via alias or hash
  useEffect(() => {
    const route = parseCurrentLocation();
    const canonicalUrl = getUrlForTab(route.tab, route.equipmentId, route.searchCode);
    const currentUrl = window.location.pathname + window.location.search;
    if (canonicalUrl !== currentUrl && !window.location.hash) {
      window.history.replaceState({ tab: route.tab, equipmentId: route.equipmentId, searchCode: route.searchCode }, '', canonicalUrl);
    }
  }, []);

  // Poll pending count for the admin badge
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const pending = await api.getPendingCount();
        setPendingCount(pending);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPending();
  }, [activeTab]);

  const handleSelectEquipmentToReserve = (equipmentId: string) => {
    setPreselectedEquipmentId(equipmentId);
    navigate('reserve', { equipmentId });
  };

  const handleNavigate = (tab: TabType, extraParam?: string) => {
    if (tab === 'reserve' && extraParam) {
      navigate('reserve', { equipmentId: extraParam });
    } else if (tab === 'status' && extraParam) {
      navigate('status', { searchCode: extraParam });
    } else {
      navigate(tab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[#f1f5f9] selection:bg-[#568aa5]/40 selection:text-white font-sans relative">
      {/* Apple-style atmospheric cursor spotlight background */}
      <AtmosphericBackground />

      {/* Main Navigation Bar with Active Profile & Sign Out */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        pendingCount={pendingCount}
        activeAdmin={activeAdmin}
        onSignOut={handleSignOut}
        onSwitchProfile={() => setShowSwitchProfileModal(true)}
      />

      {/* Main Dynamic View (pt-14 sm:pt-16 ensures content starts under fixed navbar) */}
      <main className="flex-1 relative z-10 pt-14 sm:pt-16">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectEquipmentToReserve={handleSelectEquipmentToReserve}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentPage
            onNavigate={handleNavigate}
            onSelectEquipmentToReserve={handleSelectEquipmentToReserve}
            isAdmin={Boolean(activeAdmin)}
          />
        )}

        {activeTab === 'guide' && (
          <EquipmentGuidePage
            onNavigate={handleNavigate}
            onSelectEquipmentToReserve={handleSelectEquipmentToReserve}
          />
        )}

        {activeTab === 'tips' && (
          <UsefulInfoPage
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'reserve' && (
          <ReservationPage
            preselectedEquipmentId={preselectedEquipmentId}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'darkroom' && (
          <DarkroomPage
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'status' && (
          <ReservationStatusPage
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Profile Switcher Modal Accessible Across All Pages */}
      <SwitchProfileModal
        isOpen={showSwitchProfileModal}
        onClose={() => setShowSwitchProfileModal(false)}
        adminProfiles={adminProfiles}
        activeAdmin={activeAdmin}
        onSuccess={(newProfile) => {
          setActiveAdmin(newProfile);
        }}
        onSignOut={handleSignOut}
      />

      {/* Footer */}
      <Footer />

      {/* Floating Link to Guide Page (hidden when already on guide page) */}
      {activeTab !== 'guide' && (
        <button
          type="button"
          onClick={() => navigate('guide')}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full glass-button-primary hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl group cursor-pointer"
          aria-label="Çekim & Ekipman Rehberi"
          title="Çekim & Ekipman Rehberine Git"
        >
          <BookOpen className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
          <span className="text-xs font-mono tracking-wider text-white/95 group-hover:text-white">ÇEKİM REHBERİ</span>
        </button>
      )}
    </div>
  );
}

export default App;
