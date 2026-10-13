import React, { useState, useEffect } from 'react';
import { Camera, Calendar, ArrowRight, CheckCircle, Bell, MapPin, Eye, Droplets, AlertTriangle, Compass } from 'lucide-react';
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
        // ignore
      }
    };
    loadData();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 12000);
    window.addEventListener('focus', loadData);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', loadData);
    };
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO SECTION WITH 2026 PLUM & STEEL GRADIENT */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-[#657796]/20 bg-gradient-to-b from-[#1c0f18] via-[#12080f] to-[#12080f]">
        {/* Subtle Plum and Steel Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#657796]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#301322]/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#301322] border border-[#657796]/40 text-[#dce4ef] text-xs font-semibold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#657796]"></span>
                <span className="font-club">YTÜ Fotoğraf Kulübü • 2026 Dönemi</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] font-club">
                YTÜFOK Ekipman Havuzu <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8193b2] via-[#a9b9d3] to-white">
                  & Rezervasyon
                </span>
              </h1>

              <p className="text-[#dce4ef] text-sm sm:text-base max-w-xl leading-relaxed">
                Yıldız Teknik Üniversitesi Fotoğraf Kulübü üyeleri için geliştirilmiş demirbaş ve ekipman talep sistemi. Gövde, lens ve analog ekipmanlar için öğrenci numaranızla kolayca rezervasyon oluşturun.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('reserve')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white font-bold text-xs tracking-wide shadow-lg shadow-[#301322]/50 border border-[#8193b2]/30 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-white" />
                  <span>Rezervasyon Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('equipment')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#301322]/80 hover:bg-[#301322] text-[#dce4ef] hover:text-white font-semibold text-xs border border-[#657796]/30 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#8193b2]" />
                  <span>Kamera & Lens Havuzu</span>
                </button>

                <button
                  onClick={() => onNavigate('darkroom')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-950/80 to-[#301322] hover:bg-[#3d192c] text-rose-200 hover:text-white font-semibold text-xs border border-rose-500/40 transition-all cursor-pointer shadow-md"
                >
                  <Droplets className="w-4 h-4 text-rose-400" />
                  <span>Karanlık Oda (1,5 Saat)</span>
                </button>
              </div>

              {/* Badges */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#657796]/20 text-xs text-[#a9b9d3]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                  <span className="text-white font-semibold">Hızlı Online Talep</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                  <span>Kulüpler Vadisi (Tek Nokta)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                  <span>Yönetim Onaylı</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card with Mascot Polaroid */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl bg-[#1c0f18] border border-[#657796]/30 overflow-hidden shadow-2xl p-5 space-y-4">
                {/* Transparent Logo in Hero Card */}
                <div className="flex items-center justify-between pb-2 border-b border-[#657796]/20">
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="YTÜFOK" className="h-10 w-auto object-contain" />
                    <div>
                      <span className="text-xs font-bold text-white font-club block">Kulüp Ekipmanı</span>
                      <span className="text-[10px] text-[#8193b2] font-mono">@ytufokonline</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#657796] text-white shadow">
                    ● Müsait
                  </span>
                </div>

                <div className="relative h-56 rounded-xl overflow-hidden bg-black border border-[#657796]/20">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Canon_EOS_6D_body.jpg" 
                    alt="Canon EOS 6D Gövde"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#12080f] via-[#12080f]/80 to-transparent">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8193b2]">Öne Çıkan Gövde</span>
                    <h3 className="text-base font-bold text-white font-club">Canon EOS 6D Full Frame</h3>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#dce4ef]">
                  <div className="flex justify-between py-1 border-b border-[#657796]/20">
                    <span className="text-[#a9b9d3]">Demirbaş Kodu:</span>
                    <span className="font-mono text-white font-semibold">YTU-EOS-6D</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#657796]/20">
                    <span className="text-[#a9b9d3]">SD Kart Durumu:</span>
                    <span className="text-[#dce4ef] font-semibold text-right">Dahil Değil (Kendi Kartınızı Getiriniz)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#657796]/20">
                    <span className="text-[#a9b9d3]">Kullanım Süresi:</span>
                    <span className="text-white">Maks. 4 Gün</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#657796]/20">
                    <span className="text-[#a9b9d3]">Teslim & İade Noktası:</span>
                    <span className="text-white font-semibold text-right">Kulüpler Vadisi, Davutpaşa</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#a9b9d3]">Onay Durumu:</span>
                    <span className="text-[#8193b2] font-semibold text-right">Yönetim Kurulu Onaylı</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectEquipmentToReserve('e-6d');
                    onNavigate('reserve');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Bu Kamerayı Seç & Rezerve Et</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS & INFO BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 text-center hover:border-[#657796]/50 transition-colors">
            <div className="text-3xl font-bold text-white font-club">12+</div>
            <div className="text-xs text-[#a9b9d3] mt-1">Profesyonel Gövde & Lens</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 text-center hover:border-[#657796]/50 transition-colors">
            <div className="text-2xl sm:text-3xl font-bold text-[#8193b2] font-club">Maks. 4 Gün</div>
            <div className="text-xs text-[#a9b9d3] mt-1">Standart Kullanım Süresi</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 text-center hover:border-[#657796]/50 transition-colors">
            <div className="text-3xl font-bold text-white font-club">24 Saat</div>
            <div className="text-xs text-[#a9b9d3] mt-1">Yönetim Onay Süresi</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 text-center hover:border-[#657796]/50 transition-colors">
            <div className="text-lg sm:text-xl font-bold text-[#8193b2] font-club truncate">Kulüpler Vadisi</div>
            <div className="text-xs text-[#a9b9d3] mt-1">Davutpaşa (Tek Teslim & İade)</div>
          </div>
        </div>
      </section>

      {/* 2.5. AKTİF KULÜP GEZİLERİ */}
      {activeTrips.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Yaklaşan Kulüp Etkinlikleri</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-club">
                Aktif Kulüp Gezileri
              </h2>
            </div>
            <button
              onClick={() => onNavigate('reserve')}
              className="flex items-center gap-1.5 text-xs text-[#8193b2] hover:text-white font-semibold cursor-pointer group"
            >
              <span>Gezi İçin Ekipman Rezerve Et</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-6 rounded-2xl bg-gradient-to-br from-[#1c0f18] via-[#24121f] to-[#12080f] border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-200 flex flex-col justify-between shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ● Aktif Gezi
                    </span>
                    <span className="text-[11px] text-[#a9b9d3] font-medium">
                      {formatDateRangeTr(trip.start_date, trip.end_date)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug font-club">
                    {trip.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#8193b2] font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{trip.destination}</span>
                  </div>
                  {trip.description && (
                    <p className="text-[#dce4ef] text-xs leading-relaxed">
                      {trip.description}
                    </p>
                  )}
                </div>
                <div className="pt-4 mt-4 border-t border-[#657796]/20">
                  <button
                    onClick={() => onNavigate('reserve')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Gezi İçin Ekipman Seç</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. DUYURULAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8193b2] mb-1">
              <Bell className="w-3.5 h-3.5" />
              <span>Kulüp Bildirimleri</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-club">
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
              className={`p-5 rounded-2xl bg-[#1c0f18] border transition-all duration-200 flex flex-col justify-between ${
                ann.is_pinned 
                  ? 'border-[#657796]/60 shadow-xl shadow-[#301322]/40' 
                  : 'border-[#657796]/20 hover:border-[#657796]/40'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full ${
                    ann.is_pinned 
                      ? 'bg-[#657796] text-white font-bold' 
                      : 'bg-[#301322] text-[#dce4ef]'
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

      {/* 4. ÖNE ÇIKAN KAMERALAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8193b2] mb-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Demirbaş Havuzu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-club">
              Kulüp Kameraları ve Lensler
            </h2>
          </div>
          <button
            onClick={() => onNavigate('equipment')}
            className="flex items-center gap-1.5 text-xs text-[#8193b2] hover:text-white font-semibold cursor-pointer group"
          >
            <span>Tüm Ekipmanları Görüntüle ({featuredEquipment.length}+)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEquipment.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#1c0f18] border border-[#657796]/20 overflow-hidden hover:border-[#657796]/50 transition-all flex flex-col group shadow-lg"
            >
              <div className="relative h-48 bg-black overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={item.status} type="equipment" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-0.5 rounded bg-[#12080f]/90 backdrop-blur-md text-[10px] font-mono text-[#dce4ef] border border-[#657796]/30">
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

                <div className="pt-3 border-t border-[#657796]/20 flex items-center justify-between gap-3">
                  <button
                    onClick={() => onNavigate('equipment')}
                    className="text-xs text-[#a9b9d3] hover:text-white font-medium flex items-center gap-1 cursor-pointer"
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      item.status === 'maintenance'
                        ? 'bg-[#301322] text-[#a9b9d3] cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white cursor-pointer shadow-md'
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
