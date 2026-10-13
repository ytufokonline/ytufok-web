import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { EquipmentPage } from './pages/EquipmentPage';
import { ReservationPage } from './pages/ReservationPage';
import { DarkroomPage } from './pages/DarkroomPage';
import { ReservationStatusPage } from './pages/ReservationStatusPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { api } from './lib/api';
import { TabType, parseCurrentLocation, getUrlForTab, TAB_TITLES } from './lib/routes';

export function App() {
  const initialRoute = parseCurrentLocation();
  const [activeTab, setActiveTab] = useState<TabType>(initialRoute.tab);
  const [preselectedEquipmentId, setPreselectedEquipmentId] = useState<string | undefined>(initialRoute.equipmentId);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Synchronize document title with active tab
  useEffect(() => {
    document.title = TAB_TITLES[activeTab] || 'YTÜFOK | Fotoğraf Kulübü Rezervasyon & Ekipman Sistemi';
  }, [activeTab]);

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

  // Poll pending count for the admin badge (lightweight query without joining 600 members)
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
    <div className="min-h-screen flex flex-col bg-[#12080f] text-[#f4f5f8] selection:bg-[#657796] selection:text-white font-sans">
      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        pendingCount={pendingCount}
      />

      {/* Main Dynamic View */}
      <main className="flex-1">
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

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
