import React, { useState, useEffect } from 'react';
import { Camera, Calendar, ArrowRight, CheckCircle, Bell, MapPin, Eye, Droplets, Compass } from 'lucide-react';
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
    <div className="space-y-20 pb-16">
      
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-20 sm:pb-24 border-b border-white/[0.06] bg-gradient-to-b from-[#190c15] via-[#12080f] to-[#12080f]">
        {/* Soft Ambient Light Diffusions */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#657796]/8 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute -bottom-10 left-1/3 w-[450px] h-[450px] bg-[#301322]/30 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#a9b9d3] text-[11px] font-medium tracking-[0.14em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8193b2]"></span>
                <span>Yıldız Teknik Üniversitesi Fotoğraf Kulübü</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.08] font-club">
                YTÜFOK Ekipman Havuzu <br />
                <span className="text-[#8193b2] font-normal">
                  & Rezervasyon
                </span>
              </h1>

              <p className="text-[#dce4ef] text-sm sm:text-base max-w-xl leading-relaxed font-normal">
                Yıldız Teknik Üniversitesi Fotoğraf Kulübü üyeleri için geliştirilmiş demirbaş ve ekipman talep sistemi. Gövde, lens ve analog ekipmanlar için öğrenci numaranızla kolayca rezervasyon oluşturun.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('reserve')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#dce4ef] hover:bg-white text-[#12080f] font-semibold text-xs tracking-wide shadow-[0_4px_20px_rgba(220,228,239,0.15)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <Calendar className="w-4 h-4 text-[#12080f]" />
                  <span>Rezervasyon Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('equipment')}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#dce4ef] hover:text-white font-medium text-xs border border-white/[0.08] hover:border-white/[0.16] transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4 text-[#8193b2]" />
                  <span>Kamera & Lens Havuzu</span>
                </button>

                <button
                  onClick={() => onNavigate('darkroom')}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#301322]/70 hover:bg-[#301322] text-[#dce4ef] hover:text-white font-medium text-xs border border-[#657796]/25 hover:border-[#657796]/45 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <Droplets className="w-4 h-4 text-rose-300/80" />
                  <span>Karanlık Oda (1,5 Saat)</span>
                </button>
              </div>

              {/* Meta Feature Strip */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.06] text-xs text-[#a9b9d3]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                  <span className="text-white/90 font-medium">Hızlı Online Talep</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                  <span>Kulüpler Vadisi (Tek Nokta)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                  <span>Yönetim Kurulu Onaylı</span>
                </div>
              </div>
            </div>

            {/* Right Column: Exhibition Product Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="studio-card rounded-2xl overflow-hidden p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="YTÜFOK" className="h-8 w-auto object-contain" />
                    <div>
                      <span className="text-xs font-semibold text-white font-club block">Öne Çıkan Gövde</span>
                      <span className="text-[10px] text-[#8193b2] font-mono">Demirbaş Takip</span>
                    </div>
                  </div>
                  <StatusBadge status="available" type="equipment" size="sm" />
                </div>

                {/* Camera Frame */}
                <div className="relative h-56 rounded-xl overflow-hidden bg-black/40 border border-white/[0.06] group">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Canon_EOS_6D_body.jpg" 
                    alt="Canon EOS 6D Gövde"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#12080f] via-[#12080f]/80 to-transparent">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8193b2]">Full Frame DSLR</span>
                    <h3 className="text-base font-bold text-white font-club">Canon EOS 6D</h3>
                  </div>
                </div>

                {/* Specs Metadata */}
                <div className="space-y-2 text-xs text-[#dce4ef] pt-1">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-[#a9b9d3]">Demirbaş Kodu:</span>
                    <span className="font-mono text-white font-medium">YTU-EOS-6D</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-[#a9b9d3]">SD Kart Durumu:</span>
                    <span className="text-[#dce4ef] font-medium text-right">Dahil Değil (Üye Getirmeli)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.05]">
                    <span className="text-[#a9b9d3]">Kullanım Süresi:</span>
                    <span className="text-white font-medium">Maks. 2 Gün</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#a9b9d3]">Teslim & İade:</span>
                    <span className="text-white font-medium text-right">Kulüpler Vadisi, Davutpaşa</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectEquipmentToReserve('e-6d');
                    onNavigate('reserve');
                  }}
                  className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold transition-all duration-200 text-center flex items-center justify-center gap-2 cursor-pointer border border-white/[0.1] active:scale-[0.99]"
                >
                  <span>Bu Gövdeyi Seç & Rezerve Et</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ARCHITECTURAL STATS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl studio-card divide-y md:divide-y-0 md:divide-x divide-white/[0.06] overflow-hidden">
          <div className="p-6 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">12+</div>
            <div className="text-xs text-[#a9b9d3]">Profesyonel Gövde & Lens</div>
          </div>
          <div className="p-6 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-[#8193b2] font-club tracking-tight">Maks. 2 Gün</div>
            <div className="text-xs text-[#a9b9d3]">Standart Kullanım Süresi</div>
          </div>
          <div className="p-6 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">24 Saat</div>
            <div className="text-xs text-[#a9b9d3]">Yönetim Onay Süresi</div>
          </div>
          <div className="p-6 text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold text-[#8193b2] font-club tracking-tight truncate">Kulüpler Vadisi</div>
            <div className="text-xs text-[#a9b9d3]">Davutpaşa (Tek Teslim & İade)</div>
          </div>
        </div>
      </section>

      {/* 3. AKTİF KULÜP GEZİLERİ (CLUB TRIPS) */}
      {activeTrips.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8193b2] mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Yaklaşan Kulüp Etkinlikleri</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">
                Aktif Kulüp Gezileri
              </h2>
            </div>
            <button
              onClick={() => onNavigate('reserve')}
              className="flex items-center gap-1.5 text-xs text-[#8193b2] hover:text-white font-medium cursor-pointer transition-colors group"
            >
              <span>Gezi İçin Ekipman Rezerve Et</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-6 rounded-2xl studio-card-interactive flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-200 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Aktif Gezi
                    </span>
                    <span className="text-[11px] text-[#a9b9d3] font-medium">
                      {formatDateRangeTr(trip.start_date, trip.end_date)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-club leading-snug">
                    {trip.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#8193b2] font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{trip.destination}</span>
                  </div>
                  {trip.description && (
                    <p className="text-[#dce4ef] text-xs leading-relaxed pt-1">
                      {trip.description}
                    </p>
                  )}
                </div>

                <div className="pt-5 mt-5 border-t border-white/[0.06]">
                  <button
                    onClick={() => onNavigate('reserve')}
                    className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-white/[0.08]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#8193b2]" />
                    <span>Gezi İçin Ekipman Seç</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DUYURULAR (ANNOUNCEMENTS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8193b2] mb-1">
              <Bell className="w-3.5 h-3.5" />
              <span>Kulüp Bildirimleri</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">
              Duyurular & Hatırlatmalar
            </h2>
          </div>
          <span className="text-xs text-[#a9b9d3]">
            Ekipman kuralları ve atölye güncellemeleri
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((ann) => (
            <div 
              key={ann.id}
              className={`p-5 rounded-2xl studio-card-interactive flex flex-col justify-between ${
                ann.is_pinned ? 'border-[#657796]/40' : ''
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-medium tracking-wider px-2.5 py-0.5 rounded-full ${
                    ann.is_pinned 
                      ? 'bg-white/[0.1] text-white border border-white/[0.12]' 
                      : 'bg-white/[0.04] text-[#a9b9d3] border border-white/[0.06]'
                  }`}>
                    {ann.category}
                  </span>
                  <span className="text-[11px] text-[#a9b9d3]">
                    {new Date(ann.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="text-white text-xs sm:text-sm font-medium leading-relaxed">
                  {ann.content || ann.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ÖNE ÇIKAN KAMERALAR & LENSLER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8193b2] mb-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Demirbaş Havuzu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">
              Kulüp Kameraları ve Lensler
            </h2>
          </div>
          <button
            onClick={() => onNavigate('equipment')}
            className="flex items-center gap-1.5 text-xs text-[#8193b2] hover:text-white font-medium cursor-pointer transition-colors group"
          >
            <span>Tüm Ekipmanları Görüntüle ({featuredEquipment.length}+)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEquipment.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl studio-card-interactive overflow-hidden flex flex-col group"
            >
              <div className="relative h-48 bg-black/50 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={item.status} type="equipment" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-0.5 rounded-md bg-[#12080f]/80 backdrop-blur-md text-[10px] font-mono text-[#dce4ef] border border-white/[0.08]">
                    {item.serial_number}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[10px] text-[#8193b2] font-semibold uppercase tracking-wider mb-1">
                    {item.brand} • {item.category === 'camera' ? 'Gövde (DSLR)' : item.category === 'analog' ? 'Analog (35mm)' : item.category === 'lens' ? 'Lens' : 'Ekipman'}
                  </div>
                  <h3 className="text-sm font-bold text-white font-club">
                    {item.name}
                  </h3>
                  <p className="text-[#a9b9d3] text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                  <button
                    onClick={() => onNavigate('equipment')}
                    className="text-xs text-[#a9b9d3] hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Özellikler</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectEquipmentToReserve(item.id);
                      onNavigate('reserve');
                    }}
                    disabled={item.status === 'maintenance'}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-200 ${
                      item.status === 'maintenance'
                        ? 'bg-white/[0.04] text-[#a9b9d3]/40 cursor-not-allowed'
                        : 'bg-white/[0.1] hover:bg-white/[0.18] text-white border border-white/[0.12] cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <span>Rezerve Et</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
