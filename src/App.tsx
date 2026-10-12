import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { EquipmentPage } from './pages/EquipmentPage';
import { ReservationPage } from './pages/ReservationPage';
import { DarkroomPage } from './pages/DarkroomPage';
import { ReservationStatusPage } from './pages/ReservationStatusPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { api } from './lib/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'equipment' | 'reserve' | 'darkroom' | 'status' | 'admin'>('home');
  const [preselectedEquipmentId, setPreselectedEquipmentId] = useState<string | undefined>();
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Automatically scroll to the top of the window on every page/tab change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Poll pending count for the admin badge
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const reservations = await api.getReservations();
        const pending = reservations.filter(r => r.status === 'pending').length;
        setPendingCount(pending);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPending();
  }, [activeTab]);

  const handleSelectEquipmentToReserve = (equipmentId: string) => {
    setPreselectedEquipmentId(equipmentId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#12080f] text-[#f4f5f8] selection:bg-[#657796] selection:text-white font-sans">
      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={setActiveTab}
            onSelectEquipmentToReserve={handleSelectEquipmentToReserve}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentPage
            onNavigate={setActiveTab}
            onSelectEquipmentToReserve={handleSelectEquipmentToReserve}
          />
        )}

        {activeTab === 'reserve' && (
          <ReservationPage
            preselectedEquipmentId={preselectedEquipmentId}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'darkroom' && (
          <DarkroomPage
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'status' && (
          <ReservationStatusPage
            onNavigate={setActiveTab}
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
