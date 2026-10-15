import React, { useState, useEffect } from 'react';
import { Camera, Calendar, ArrowRight, MapPin, Droplets, Compass, History, Sparkles, Award, Layers, BookOpen, Clock, ShieldCheck } from 'lucide-react';
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
    <div className="text-[#f4f5f8] selection:bg-white/20 selection:text-white space-y-24 sm:space-y-36 pb-32">
      
      {/* 1. HERO ALANI VE MANİFESTO (Apple Editorial Minimalist) */}
      <section className="pt-20 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* YTÜFOK Official Logo */}
          <div className="flex justify-center">
            <img
              src="/ytufok-hero-logo.png"
              alt="YTÜFOK - Yıldız Teknik Üniversitesi Fotoğraf Kulübü"
              className="w-56 sm:w-72 md:w-80 lg:w-[22rem] h-auto object-contain mix-blend-screen select-none drop-shadow-2xl"
            />
          </div>

          {/* Hero Headline (Natural, Confident Student-Driven) */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white font-club leading-[1.2] max-w-3xl mx-auto">
            1994'ten beri kampüsün en aktif topluluğu.
          </h1>

          {/* Genuine Student-Crafted Intro Paragraph */}
          <p className="text-base sm:text-lg lg:text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
            Yıldız Teknik Üniversitesi Fotoğraf Kulübü olarak analogdan dijitale üretmeye, 
            hafta sonu gezilerine, karanlık oda banyolarına ve fotoğrafı paylaşmaya devam ediyoruz.
          </p>

          {/* Kritik Yönlendirme (Apple HIG Asil & Dikkat Çekmeyen Butonlar) */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('equipment')}
              className="px-6 sm:px-8 py-3.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-mono uppercase tracking-wider font-semibold shadow-2xl transition-all duration-200 cursor-pointer flex items-center gap-2 group active:scale-[0.98]"
            >
              <span>Ekipman Havuzunu İncele ve Rezervasyon Yap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('darkroom')}
              className="px-5 sm:px-6 py-3.5 rounded-full border border-white/15 hover:border-white/35 bg-[#140911] hover:bg-[#1f0e1a] text-white/90 hover:text-white text-xs font-mono uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Droplets className="w-3.5 h-3.5 text-white/60" />
              <span>Karanlık Oda Randevusu</span>
            </button>

            <button
              onClick={() => onNavigate('guide')}
              className="px-4 py-3.5 rounded-full text-white/60 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Çekim Rehberi</span>
            </button>
          </div>

          {/* Key Facts Strip (Apple Minimalist Metrics) */}
          <div className="pt-16 sm:pt-20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto text-left border-t border-white/[0.08]">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block">Kuruluş</span>
              <strong className="text-2xl sm:text-3xl text-white font-club font-bold block">1994</strong>
              <span className="text-xs text-white/50 font-light block leading-snug">30 yılı aşan kesintisiz kulüp hafızası</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block">Türkiye'de Bir İlk</span>
              <strong className="text-2xl sm:text-3xl text-white font-club font-bold block">1. Kulüp</strong>
              <span className="text-xs text-white/50 font-light block leading-snug">Üniversiteler arası ilk fotoğraf kulübü</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block">YTÜ Tarihi</span>
              <strong className="text-2xl sm:text-3xl text-white font-club font-bold block">2. En Köklü</strong>
              <span className="text-xs text-white/50 font-light block leading-snug">Üniversitenin en köklü 2. topluluğu</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block">Festival Öncülüğü</span>
              <strong className="text-2xl sm:text-3xl text-white font-club font-bold block">İlk Festival</strong>
              <span className="text-xs text-white/50 font-light block leading-snug">Türkiye'deki ilk fotoğraf festivali</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. KÖKLER, MİRAS VE İLKLER (Tarihçe & Öncülük) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">
            01 / Kökler ve Öncülük
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white font-club tracking-tight leading-[1.1]">
            Türkiye üniversite fotoğrafçılığının<br />
            başladığı yer.
          </h2>
          <p className="text-base sm:text-lg text-white/60 font-light max-w-2xl leading-relaxed pt-1">
            YTÜFOK, 1994 yılından bu yana yalnızca Yıldız Teknik Üniversitesi'nin değil, 
            ülkemizin gençlik ve görsel sanat ortamının şekillenmesinde öncü rol üstlenmiştir.
          </p>
        </div>

        {/* Narrative Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-4 border-t border-white/[0.08]">
          
          {/* Sol Kolon: 1994 & Üniversite Kulüplerinin İlki */}
          <div className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
              <span>1994'ten Beri • Köklü Miras</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white font-club tracking-tight">
              YTÜ'nün 2. En Köklü Kulübü,<br />
              Türkiye'nin İlk Fotoğraf Kulübü
            </h3>
            <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
              1994 yılında Yıldız Teknik Üniversitesi çatısı altında kurulan YTÜFOK, 
              Türkiye'deki tüm üniversiteler arasında kurulan <strong className="text-white font-medium">ilk fotoğraf kulübü</strong> olma unvanını taşır. 
              Aynı zamanda YTÜ bünyesindeki <strong className="text-white font-medium">en köklü ikinci öğrenci kulübüdür</strong>.
            </p>
            <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
              Kuruluşundan itibaren fotoğrafı yalnızca teknik bir görüntüleme aracı değil; 
              düşünsel bir tavır, sosyolojik bir tanıklık ve kolektif bir üretim alanı olarak konumlandırdı.
            </p>
          </div>

          {/* Sağ Kolon: Türkiye'de İlk Fotoğraf Festivali */}
          <div className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
              <span>Vizyon • Öncü Girişim</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white font-club tracking-tight">
              Türkiye'deki İlk Üniversite<br />
              Fotoğraf Festivalinin Mimarı
            </h3>
            <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
              YTÜFOK, üniversite sınırlarını aşan vizyonuyla Türkiye'de üniversiteler düzeyinde 
              gerçekleştirilen <strong className="text-white font-medium">ilk fotoğraf festivaline</strong> imza atmıştır. 
              Ülkenin usta fotoğrafçılarını, akademisyenlerini ve genç yeteneklerini aynı masada buluşturan bu girişim, 
              üniversite gençliğinin görsel kültüründeki kilometre taşlarından biridir.
            </p>
            <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
              Bu öncü gelenek; paneller, sergiler ve atölyelerle otuz yıl boyunca kuşaktan kuşağa aktarılarak 
              günümüzün yaşayan atölye kültürünü doğurdu.
            </p>
          </div>

        </div>

        {/* Hairline Milestone Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-2xl bg-[#140911] border border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Tarihsel Öncelik</span>
            <div className="text-lg font-semibold text-white font-club">İlk Üniversite Kulübü</div>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              1994'te Türkiye'deki üniversiteler arası ilk fotoğraf kulübü olarak kuruldu.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#140911] border border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Ulusal Boyut</span>
            <div className="text-lg font-semibold text-white font-club">İlk Fotoğraf Festivali</div>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Türkiye çapında üniversite düzeyindeki ilk fotoğraf festivali hayata geçirildi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#140911] border border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Kurumsal Aidiyet</span>
            <div className="text-lg font-semibold text-white font-club">YTÜ'nün 2. En Köklüsü</div>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Yıldız Teknik Üniversitesi tarihinin en köklü 2. öğrenci topluluğudur.
            </p>
          </div>
        </div>

      </section>

      {/* 3. YAŞAYAN KAMPÜS VE AKTİF KÜLTÜR */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">
            02 / Yaşayan Kampüs
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white font-club tracking-tight leading-[1.1]">
            Sadece bir ekipman havuzu değil.<br />
            Kampüsün en aktif yaşam alanı.
          </h2>
          <p className="text-base sm:text-lg text-white/60 font-light max-w-2xl leading-relaxed pt-1">
            YTÜFOK; her hafta sonu düzenlenen keşif gezileri, analog karanlık oda nöbetleri ve 
            otuz yılı aşkın mezun-öğrenci bağıyla kampüsün yaşayan hafızasıdır.
          </p>
        </div>

        {/* 4 Core Pillars (Clean Editorial Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/[0.08]">
          
          {/* Pillar 1: Hafta Sonu Gezileri & En Aktif Kulüp */}
          <div className="p-8 rounded-3xl bg-[#140911] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white font-club tracking-tight">
                Her Hafta Sonu Düzenlenen Geziler
              </h3>
              <p className="text-sm text-white/60 font-light leading-relaxed">
                Kampüsün <strong className="text-white font-medium">en aktif kulüplerinden biri</strong> olarak, 
                her hafta sonu İstanbul'un tarihi sokaklarından Anadolu'nun saklı coğrafyalarına uzanan tematik geziler düzenliyoruz. 
                Öğrencilerimiz teoriyi doğrudan sahada pratiğe dönüştürüyor; birlikte görüyor, birlikte üretiyor.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-white/40">
              Sokak, Belgesel & Doğa Çekimleri
            </div>
          </div>

          {/* Pillar 2: Analog & Karanlık Oda Geleneği */}
          <div className="p-8 rounded-3xl bg-[#140911] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white font-club tracking-tight">
                Analog Kültür & Karanlık Oda
              </h3>
              <p className="text-sm text-white/60 font-light leading-relaxed">
                Davutpaşa Kulüpler Vadisi'ndeki karanlık odamızda 35mm ve orta format filmlerimizi kendimiz yıkıyor, 
                agrandisör başında analog kart baskılarımızı alıyoruz. Hem analog disiplini koruyor hem de yeni başlayanlara karanlık oda eğitimi veriyoruz.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-white/40">
              1,5 Saatlik Nöbetçi Seansları • Banyo & Baskı
            </div>
          </div>

          {/* Pillar 3: Demokratik Ekipman Havuzu */}
          <div className="p-8 rounded-3xl bg-[#140911] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white font-club tracking-tight">
                Demokratik Ekipman Havuzu
              </h3>
              <p className="text-sm text-white/60 font-light leading-relaxed">
                Pahalı ekipmanlar hiçbir öğrencinin hikayesini anlatmasına engel olmasın diye kurulmuş bir dayanışma modeli. 
                Gövde, prime lensler ve analog makineler; kulüp üyelerine karşılıklı güven ve koruma sözleşmesiyle 
                ücretsiz olarak zimmetlenir.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-white/40">
              Maksimum 2 Gün Standart Kullanım • Davutpaşa Teslimat
            </div>
          </div>

          {/* Pillar 4: Kuşaklar Arası Bağ & Köklü Aidiyet */}
          <div className="p-8 rounded-3xl bg-[#140911] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white font-club tracking-tight">
                Kuşaklar Arası Köklü Aidiyet
              </h3>
              <p className="text-sm text-white/60 font-light leading-relaxed">
                1994'ten bu yana yolu kulübümüzden geçmiş yüzlerce mezunumuz, bugün sanat dünyasında, 
                medyada ve akademide öncüdür. Kulüp odasında demlenen çaylar, aktarılan ustalıklar ve 
                nesilleri bir araya getiren yıllık buluşmalarla daimi bir aileyiz.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-white/40">
              30+ Yıllık Mezun-Öğrenci Dayanışması
            </div>
          </div>

        </div>

      </section>

      {/* 4. EKİPMAN HAVUZUNA GEÇİŞ (Apple Product Showcase) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#140911] border border-white/15 space-y-8 relative overflow-hidden">
          
          <div className="max-w-2xl space-y-4">
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">
              03 / Demirbaş Envanteri
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-club tracking-tight">
              Üretmek için ihtiyacın olan her şey hazır.
            </h2>
            <p className="text-sm sm:text-base text-white/60 font-light leading-relaxed">
              DSLR ve aynasız gövdeler, prime ve zoom objektifler, analog makineler ve karanlık oda seansları. 
              Öğrenci numaranızla anında rezervasyon talebi oluşturun, Davutpaşa Kulüpler Vadisi'nden teslim alın.
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('equipment')}
              className="px-6 py-3 rounded-full bg-white text-black hover:bg-white/90 text-xs font-mono uppercase tracking-wider font-semibold shadow-lg transition-all duration-150 cursor-pointer flex items-center gap-2 group active:scale-[0.98]"
            >
              <span>Tüm Ekipmanları Keşfet</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('reserve')}
              className="px-6 py-3 rounded-full border border-white/15 hover:border-white/35 bg-[#180a14] hover:bg-[#200e1c] text-white/90 hover:text-white text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-[0.98]"
            >
              Doğrudan Rezervasyon Yap
            </button>

            <button
              onClick={() => onNavigate('darkroom')}
              className="px-5 py-3 rounded-full border border-white/15 hover:border-white/35 bg-[#180a14] hover:bg-[#200e1c] text-white/90 hover:text-white text-xs font-mono uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Droplets className="w-3.5 h-3.5 text-white/60" />
              <span>Karanlık Oda</span>
            </button>
          </div>

          {/* Featured 3 Equipment Preview Row */}
          <div className="pt-8 border-t border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white/40 uppercase tracking-wider">Öne Çıkan Demirbaşlar</span>
              <button
                onClick={() => onNavigate('equipment')}
                className="text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Tümünü Gör ({initialSync.equipmentList.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featuredEquipment.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectEquipmentToReserve(item.id);
                    onNavigate('reserve');
                  }}
                  className="p-4 rounded-2xl bg-[#12080f] border border-white/10 hover:border-white/25 transition-all cursor-pointer group space-y-3"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/60 relative">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={item.status} type="equipment" size="sm" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-white/40 block">
                      {item.brand} • {item.serial_number}
                    </span>
                    <h4 className="text-xs font-semibold text-white font-club truncate mt-0.5">
                      {item.name}
                    </h4>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-white/40">{item.current_condition || 'Standart'}</span>
                    <span className="text-white/80 group-hover:text-white flex items-center gap-1">
                      <span>Rezerve</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* 5. AKTİF KULÜP GEZİLERİ (Varsa) */}
      {activeTrips.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">Etkinlikler</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight mt-1">
                Aktif Kulüp Gezileri
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-2xl border border-white/10 bg-[#140911] p-6 flex flex-col justify-between space-y-4"
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

      {/* 6. DUYURULAR VE NOTLAR (Varsa) */}
      {announcements.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 block">Haberler</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight mt-1">
              Kulüp Bildirimleri
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div 
                key={ann.id}
                className="rounded-2xl border border-white/10 bg-[#140911] p-5 flex flex-col justify-between space-y-3"
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
      )}

      {/* 7. MANİFESTO İMZA KAPANIŞI (Apple Quiet Editorial Statement) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 text-center space-y-4 border-t border-white/[0.08]">
        <div className="text-[11px] font-mono tracking-[0.3em] uppercase text-white/30">
          YTÜFOK MANİFESTO
        </div>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white font-club tracking-tight leading-snug">
          "Bir kare çekeriz; bir asır kalır."
        </p>
        <span className="text-xs font-mono text-white/40 block tracking-wider pt-2">
          YILDIZ TEKNİK ÜNİVERSİTESİ FOTOĞRAF KULÜBÜ • DAVUTPAŞA KAMPÜSÜ
        </span>
      </section>

    </div>
  );
};
