import React, { useState, useEffect } from 'react';
import { Camera, Calendar, ArrowRight, MapPin, Droplets, Compass, History, Sparkles, BookOpen } from 'lucide-react';
import { Announcement, Equipment, Trip } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateRangeTr } from '../utils/tripUtils';

interface HomePageProps {
  onNavigate: (tab: 'home' | 'equipment' | 'reserve' | 'status' | 'admin' | 'darkroom' | 'guide' | 'tips') => void;
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
    <div className="text-[#eed1d1] selection:bg-white/20 selection:text-white pb-28">
      
      {/* 1. HERO ALANI (Apple Left-Aligned Editorial) */}
      <section className="pt-8 sm:pt-14 lg:pt-16 border-b border-white/[0.08] pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-left space-y-10 sm:space-y-12">
          
          {/* YTÜFOK Official Logo (Left-Aligned, Crisp Scale) */}
          <div className="w-56 sm:w-72 md:w-80 lg:w-96">
            <img
              src="/ytufok-hero-logo.png?v=2"
              alt="YTÜFOK - Yıldız Teknik Üniversitesi Fotoğraf Kulübü"
              className="w-full h-auto object-contain mix-blend-screen select-none"
            />
          </div>

          {/* Hero Headline (Apple Monumental Typography) */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white font-club leading-[1.05]">
              1994'ten beri kampüsün en aktif topluluğu.
            </h1>
            <p className="text-lg sm:text-2xl text-white/50 font-light max-w-2xl leading-relaxed pt-2">
              Yıldız Teknik Üniversitesi Fotoğraf Kulübü. Analogdan dijitale üretmeye, 
              hafta sonu gezilerine, karanlık oda nöbetlerine ve fotoğrafı paylaşmaya devam ediyoruz.
            </p>
          </div>

          {/* Apple-Style Action Bar (Clean White Pill + Text Link) */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <button
              onClick={() => onNavigate('equipment')}
              className="px-7 py-3 rounded-full bg-white text-black hover:bg-white/90 text-xs font-mono uppercase tracking-wider font-semibold shadow-xl transition-all duration-150 cursor-pointer active:scale-95"
            >
              Ekipman Havuzunu İncele
            </button>

            <button
              onClick={() => onNavigate('reserve')}
              className="text-white/80 hover:text-white text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer group py-2"
            >
              <span>Rezervasyon Yap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('darkroom')}
              className="text-white/50 hover:text-white text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer group py-2"
            >
              <Droplets className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
              <span>Karanlık Oda Randevusu</span>
            </button>
          </div>

          {/* Apple Minimalist Metrics Strip (Left Aligned, Clean Hairline) */}
          <div className="pt-10 sm:pt-14 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 border-t border-white/[0.08]">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight font-club block">1994</span>
              <span className="text-xs text-white/40 font-light block leading-snug">Kuruluş Yılı</span>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight font-club block">Öncü</span>
              <span className="text-xs text-white/40 font-light block leading-snug">Üniversiteler Arası İlk Kulüp</span>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight font-club block">2.</span>
              <span className="text-xs text-white/40 font-light block leading-snug">YTÜ'nün En Köklü Kulübü</span>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight font-club block">30+</span>
              <span className="text-xs text-white/40 font-light block leading-snug">Yıllık Kesintisiz Üretim</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. KÖKLER VE MİRAS (Fluid Editorial Text, No Template Boxes) */}
      <section className="border-b border-white/[0.08] py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-left space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">
            01 / Kökler ve Öncülük
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white font-club tracking-tight leading-[1.1]">
            Türkiye üniversite fotoğrafçılığının ilk kıvılcımı.
          </h2>
          <p className="text-base sm:text-xl text-white/50 font-light leading-relaxed pt-1">
            YTÜFOK, 1994'te Yıldız Teknik Üniversitesi'nde kurulduğu günden bu yana yalnızca kampüsün değil, 
            ülkenin gençlik fotoğraf ortamının kurucu hafızası oldu.
          </p>
        </div>

        {/* Narrative Flow (Two Columns, Pure Typographic Contrast) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 pt-8 border-t border-white/[0.08]">
          
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-white/40 block">
              1994'ten Beri
            </span>
            <h3 className="text-xl sm:text-2xl font-medium text-white font-club tracking-tight">
              YTÜ'nün 2. En Köklü Kulübü,<br />
              Türkiye'nin İlk Fotoğraf Kulübü
            </h3>
            <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed pt-1">
              1994 yılında YTÜ çatısı altında kurulan kulübümüz, Türkiye'deki tüm üniversiteler arasında kurulan ilk fotoğraf kulübü olma unvanını taşır. Aynı zamanda Yıldız Teknik Üniversitesi'nin en köklü ikinci topluluğudur.
            </p>
            <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
              Fotoğrafı yalnızca teknik bir donanım meselesi olarak değil; düşünsel bir üretim, sosyolojik bir tanıklık ve kolektif bir dayanışma alanı olarak yaşatıyoruz.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-white/40 block">
              Festival Öncülüğü
            </span>
            <h3 className="text-xl sm:text-2xl font-medium text-white font-club tracking-tight">
              Türkiye'deki İlk Üniversite<br />
              Fotoğraf Festivalinin Mimarı
            </h3>
            <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed pt-1">
              YTÜFOK, üniversite sınırlarını aşan vizyonuyla Türkiye'de üniversiteler düzeyinde düzenlenen ilk fotoğraf festivalini hayata geçirdi. 
            </p>
            <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
              Ülkenin usta fotoğrafçılarını, akademisyenlerini ve genç yeteneklerini aynı atölyelerde buluşturan bu festival, üniversite fotoğrafçılığında kalıcı bir ekol yarattı.
            </p>
          </div>

        </div>
        </div>

      </section>

      {/* 3. YAŞAYAN KAMPÜS (Apple Feature-List Editorial Rows, No Box Cards) */}
      <section className="border-b border-white/[0.08] py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-left space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">
            02 / Yaşayan Kültür
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white font-club tracking-tight leading-[1.1]">
            Sadece bir ekipman havuzu değil.<br />
            Kampüsün en aktif topluluğu.
          </h2>
        </div>

        {/* Apple Editorial Feature Rows (Divided by Hairlines, Pure Typography) */}
        <div className="border-t border-white/[0.08] divide-y divide-white/[0.08]">
          
          {/* Row 1: Geziler */}
          <div className="py-8 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">
            <div className="md:col-span-4 text-xs font-mono text-white/40 uppercase tracking-wider">
              01 / Her Hafta Sonu Sahada
            </div>
            <div className="md:col-span-8 space-y-2">
              <h3 className="text-xl sm:text-2xl font-medium text-white font-club tracking-tight">
                İstanbul'un sokaklarından Anadolu'nun saklı rotalarına.
              </h3>
              <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
                Kampüsün en aktif topluluklarından biri olarak, her hafta sonu tematik çekim gezileri düzenliyoruz. Teoriyi doğrudan vizör başında pratiğe döküyor; birlikte geziyor, birlikte üretiyoruz.
              </p>
            </div>
          </div>

          {/* Row 2: Analog & Karanlık Oda */}
          <div className="py-8 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">
            <div className="md:col-span-4 text-xs font-mono text-white/40 uppercase tracking-wider">
              02 / Karanlık Oda Geleneği
            </div>
            <div className="md:col-span-8 space-y-2">
              <h3 className="text-xl sm:text-2xl font-medium text-white font-club tracking-tight">
                Kırmızı ışık altında filmini kendin yıka, kartına kendin bas.
              </h3>
              <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
                Davutpaşa Kulüpler Vadisi'ndeki karanlık odamızda 35mm filmlerimizi kendimiz yıkıyor, agrandisör başında siyah-beyaz kart baskılarımızı alıyoruz. Yeni başlayan herkese analog eğitimi veriyoruz.
              </p>
            </div>
          </div>

          {/* Row 3: Dayanışma & Ekipman */}
          <div className="py-8 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">
            <div className="md:col-span-4 text-xs font-mono text-white/40 uppercase tracking-wider">
              03 / Ortak Ekipman Havuzu
            </div>
            <div className="md:col-span-8 space-y-2">
              <h3 className="text-xl sm:text-2xl font-medium text-white font-club tracking-tight">
                Pahalı donanımlar üretmene engel olmasın.
              </h3>
              <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
                Kulüp demirbaşındaki gövde, prime lens ve aksesuarları tüm üyelerimize karşılıklı güven ilkesiyle ücretsiz zimmetliyoruz. Öğrenci numaranla başvur, çekimini yap, teslim et.
              </p>
            </div>
          </div>

          {/* Row 4: Kuşaklar Arası Bağ */}
          <div className="py-8 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">
            <div className="md:col-span-4 text-xs font-mono text-white/40 uppercase tracking-wider">
              04 / Otuz Yıllık Aile
            </div>
            <div className="md:col-span-8 space-y-2">
              <h3 className="text-xl sm:text-2xl font-medium text-white font-club tracking-tight">
                Kuşaktan kuşağa aktarılan bir kulüp kültürü.
              </h3>
              <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
                1994'ten bu yana kulübümüzden geçen yüzlerce mezunumuz bugün görsel sanatların, medyanın ve akademinin öncüleridir. Mezunlarımız ve öğrencilerimiz her dönem aynı masada buluşur.
              </p>
            </div>
          </div>

        </div>
        </div>

      </section>

      {/* 4. EKİPMAN HAVUZUNA GEÇİŞ (Apple Product Showcase) */}
      <section className="border-b border-white/[0.08] py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-left space-y-10 sm:space-y-12">
        
        {/* Editorial Section Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">
            03 / Demirbaş Envanteri
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-white font-club tracking-tight leading-[1.08]">
            Üretmek için ihtiyacın olan her şey hazır.
          </h2>
          <p className="text-base sm:text-xl text-white/50 font-light leading-relaxed">
            DSLR ve aynasız gövdeler, prime ve zoom objektifler, analog makineler ve karanlık oda seansları. Öğrenci numaranla doğrudan rezerve et, Davutpaşa Kulüpler Vadisi'nden teslim al.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <button
              onClick={() => onNavigate('equipment')}
              className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-150 cursor-pointer active:scale-95 shadow-lg"
            >
              Tüm Ekipmanları Keşfet
            </button>
            <button
              onClick={() => onNavigate('reserve')}
              className="text-white/80 hover:text-white text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Doğrudan Rezervasyon Yap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Minimalist Equipment Preview Row (No Thick Boxes) */}
        <div className="pt-8 border-t border-white/[0.08] space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-white/40">
            <span className="uppercase tracking-wider">Öne Çıkan Demirbaşlar</span>
            <button
              onClick={() => onNavigate('equipment')}
              className="text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Tümünü Gör ({initialSync.equipmentList.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {featuredEquipment.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectEquipmentToReserve(item.id);
                  onNavigate('reserve');
                }}
                className="group cursor-pointer space-y-3"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/[0.02] border border-white/10 group-hover:border-white/30 transition-all relative">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={item.status} type="equipment" size="sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">
                    {item.brand} • {item.serial_number}
                  </span>
                  <h4 className="text-sm font-medium text-white group-hover:text-white transition-colors">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs font-mono pt-1 text-white/40">
                    <span>{item.current_condition || 'Standart'}</span>
                    <span className="text-white/70 group-hover:text-white flex items-center gap-1 transition-colors">
                      <span>Rezerve Et</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

      </section>

      {/* 5. AKTİF KULÜP GEZİLERİ (Varsa) */}
      {activeTrips.length > 0 && (
        <section className="border-b border-white/[0.08] py-14 sm:py-18">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-left space-y-8">
          <div className="border-b border-white/[0.08] pb-4">
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">Etkinlikler</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white font-club tracking-tight mt-1">
              Aktif Kulüp Gezileri
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="border-b border-white/10 pb-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Aktif Gezi
                  </span>
                  <span className="text-xs font-mono text-white/40">
                    {formatDateRangeTr(trip.start_date, trip.end_date)}
                  </span>
                </div>

                <h3 className="text-base font-medium text-white tracking-tight">
                  {trip.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{trip.destination}</span>
                </div>

                {trip.description && (
                  <p className="text-xs text-white/50 font-light leading-relaxed">
                    {trip.description}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('reserve')}
                    className="text-xs font-mono text-white/70 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-white/50" />
                    <span>Gezi İçin Ekipman Rezerve Et ›</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* 6. DUYURULAR VE NOTLAR (Varsa) */}
      {announcements.length > 0 && (
        <section className="py-14 sm:py-18">
          <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 text-left space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">Haberler</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white font-club tracking-tight mt-1">
              Kulüp Bildirimleri
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((ann) => (
              <div 
                key={ann.id}
                className="border-b border-white/10 pb-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-white/40">
                  <span className="uppercase">{ann.category}</span>
                  <span>{new Date(ann.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  {ann.content || ann.title}
                </p>
              </div>
            ))}
          </div>
          </div>
        </section>
      )}

    </div>
  );
};
