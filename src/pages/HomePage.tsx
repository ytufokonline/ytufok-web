import React, { useState, useEffect } from 'react';
import { Camera, Calendar, ArrowRight, MapPin, Eye, Droplets, Compass } from 'lucide-react';
import { Announcement, Equipment, Trip } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateRangeTr } from '../utils/tripUtils';

interface HomePageProps {
  onNavigate: (tab: 'equipment' | 'reserve' | 'status' | 'admin' | 'darkroom') => void;
  onSelectEquipmentToReserve: (equipmentId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectEquipmentToReserve }) => {
  const initialSync = React.useMemo(() => api.getInitialSyncState(), []);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialSync.announcements);
  const [activeTrips, setActiveTrips] = useState<Trip[]>(initialSync.activeTrips);
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>(initialSync.equipmentList.slice(0, 3));

  useEffect(() => {
    const loadData = async () => {
      try {
        const bundle = await api.getDashboardBundle();
        setAnnouncements(bundle.announcements);
        setFeaturedEquipment(bundle.equipmentList.slice(0, 3));
        setActiveTrips(bundle.activeTrips);
      } catch {
        // silent fallback
      }
    };
    loadData();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 15000);
    window.addEventListener('focus', loadData);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', loadData);
    };
  }, []);

  return (
    <div className="space-y-20 sm:space-y-28 pb-24 text-[#dce4ef]">
      
      {/* 1. HERO SECTION (Apple Editorial Minimalist) */}
      <section className="pt-16 sm:pt-24 lg:pt-32 pb-16 border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/40">
            Yıldız Teknik Üniversitesi Fotoğraf Kulübü
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white font-club leading-[1.05]">
            YTÜFOK Ekipman Havuzu
          </h1>

          <p className="text-base sm:text-lg text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
            Kulüp üyeleri için geliştirilmiş demirbaş takip ve rezervasyon sistemi. Gövde, lens ve analog ekipmanlar için öğrenci numaranızla doğrudan talep oluşturun.
          </p>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('reserve')}
              className="px-6 py-3 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-lg active:scale-[0.98]"
            >
              Rezervasyon Yap
            </button>

            <button
              onClick={() => onNavigate('equipment')}
              className="px-6 py-3 rounded-xl border border-white/10 text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.04] font-medium text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-[0.98]"
            >
              Ekipmanları İncele
            </button>

            <button
              onClick={() => onNavigate('darkroom')}
              className="px-5 py-3 rounded-xl border border-white/10 text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.04] font-medium text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Droplets className="w-3.5 h-3.5 text-white/60" />
              <span>Karanlık Oda (1,5 Saat)</span>
            </button>
          </div>

          {/* Key Facts Strip */}
          <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-left border-t border-white/[0.08]">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block">Teslimat & İade</span>
              <strong className="text-sm text-white font-medium block">Kulüpler Vadisi</strong>
              <span className="text-xs text-white/50 font-light">Davutpaşa Kampüsü tek teslimat noktasıdır.</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block">Kullanım Kuralı</span>
              <strong className="text-sm text-white font-medium block">Maksimum 2 Gün</strong>
              <span className="text-xs text-white/50 font-light">Standart bireysel çekim süresidir.</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block">Yönetim Süreci</span>
              <strong className="text-sm text-white font-medium block">24 Saat İçinde Onay</strong>
              <span className="text-xs text-white/50 font-light">Talepler yönetim kurulunca incelenir.</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. EQUIPMENT CATALOG CARDS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">Katalog</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight mt-1">
              Öne Çıkan Ekipmanlar
            </h2>
            <p className="text-xs sm:text-sm text-white/50 font-light mt-1">
              Kulüp demirbaşındaki gövde ve profesyonel lensler
            </p>
          </div>
          <button
            onClick={() => onNavigate('equipment')}
            className="text-xs font-mono text-white/60 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Tüm Ekipmanlar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEquipment.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden flex flex-col group cursor-pointer"
              onClick={() => {
                onSelectEquipmentToReserve(item.id);
                onNavigate('reserve');
              }}
            >
              {/* Image Frame */}
              <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={item.status} type="equipment" size="sm" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10">
                    {item.serial_number}
                  </span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    {item.brand} • {item.category === 'camera' ? 'DSLR Gövde' : item.category === 'lens' ? 'Objektif' : 'Ekipman'}
                  </div>
                  <h3 className="text-base font-semibold text-white font-club mt-1 tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-white/60 font-light mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-white/40 text-[11px] font-mono">
                    Kondisyon: <strong className="text-white font-normal">{item.current_condition || 'Standart'}</strong>
                  </span>
                  <span className="text-white/80 group-hover:text-white font-mono text-xs flex items-center gap-1 transition-colors">
                    <span>Rezerve Et</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. AKTİF KULÜP GEZİLERİ */}
      {activeTrips.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">Etkinlikler</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight mt-1">
                Aktif Kulüp Gezileri
              </h2>
              <p className="text-xs sm:text-sm text-white/50 font-light mt-1">
                Etkinlik tarihine göre ekipman rezervasyonu yapabilirsiniz
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Aktif Gezi
                    </span>
                    <span className="text-xs font-mono text-white/50">
                      {formatDateRangeTr(trip.start_date, trip.end_date)}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white font-club tracking-tight">
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-white/50 font-mono">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{trip.destination}</span>
                  </div>

                  {trip.description && (
                    <p className="text-xs text-white/60 font-light leading-relaxed pt-1">
                      {trip.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => onNavigate('reserve')}
                    className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-white text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-white/50" />
                    <span>Gezi İçin Ekipman Rezerve Et</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DUYURULAR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">Haberler</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight mt-1">
            Kulüp Bildirimleri
          </h2>
          <p className="text-xs sm:text-sm text-white/50 font-light mt-1">
            Ekipman kuralları, atölye ve teslimat duyuruları
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((ann) => (
            <div 
              key={ann.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 text-white/60">
                  {ann.category}
                </span>
                <span className="text-xs font-mono text-white/40">
                  {new Date(ann.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <p className="text-sm text-white/90 font-light leading-relaxed">
                {ann.content || ann.title}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
