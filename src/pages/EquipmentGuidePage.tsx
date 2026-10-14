import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Camera, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Plus,
  HelpCircle,
  Zap,
  Check
} from 'lucide-react';
import { Equipment } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { TabType } from '../lib/routes';
import { INITIAL_EQUIPMENT } from '../data/initialData';

export const EQUIPMENT_SERIAL_MAP: Record<string, string> = {
  'e-5d2': 'YTU-EOS-5D2',
  'e-6d': 'YTU-EOS-6D',
  'e-1000d': 'YTU-EOS-1000D',
  'e-nikon': 'YTU-NIK-D5000',
  'e-650': 'YTU-EOS-650-ANALOG',
  'e-clearshot-1': 'YTU-ANALOG-CS-01',
  'e-clearshot-2': 'YTU-ANALOG-CS-02',
  'e-clearshot-3': 'YTU-ANALOG-CS-03',
  'e-clearshot-4': 'YTU-ANALOG-CS-04',
  'e-clearshot-5': 'YTU-ANALOG-CS-05',
  'e-ef-50': 'YTU-LENS-50MM',
  'e-ef-85': 'YTU-LENS-85MM',
  'e-ef-100-macro': 'YTU-LENS-100-MACRO',
  'e-ef-70-200': 'YTU-LENS-70-200L',
  'e-ef-17-40': 'YTU-LENS-17-40L',
  'e-ef-24-105': 'YTU-LENS-24-105L',
  'e-sigma-10-20': 'YTU-LENS-SIGMA-10-20',
  'e-nikon-18-55-vr': 'YTU-LENS-NIK-18-55',
  'e-speedlite': 'YTU-FLASH-580EXII',
  'e-tianya-77': 'YTU-FLTR-TIANYA-77',
};

export interface EquipmentCombo {
  id: string;
  name: string;
  badge: string;
  bodyId: string;
  lensId?: string;
  accessoryId?: string;
  whyThisCombo: string;
}

export interface GuideScenario {
  id: string;
  title: string;
  icon: string;
  tag: string;
  shortDesc: string;
  combos: EquipmentCombo[];
  settingsTip: string;
  cardNote: string;
}

export const GUIDE_SCENARIOS: GuideScenario[] = [
  {
    id: 'street_travel',
    title: 'Sokak & Gezi',
    icon: '🚶',
    tag: 'Seyahat & Günlük',
    shortDesc: 'Gezilerde tek lensle hem geniş açı hem yakınlaştırma yakalamak veya dikkat çekmeden sokakta an yakalamak için.',
    combos: [
      {
        id: 'c-street-pro',
        name: 'Profesyonel Çok Yönlü Gezi Kiti',
        badge: 'En Popüler Gezi Kiti',
        bodyId: 'e-6d',
        lensId: 'e-ef-24-105',
        accessoryId: 'e-tianya-77',
        whyThisCombo: '24-105mm lens hem tarihi yapıları hem uzaktaki detayları çeker. IS sabitleme yürürken titremeyi sıfırlar. Dahili GPS konumları kaydeder.'
      },
      {
        id: 'c-street-compact',
        name: 'Kompakt Hafif Sokak Kiti',
        badge: 'Hafif & Loş Işık',
        bodyId: 'e-1000d',
        lensId: 'e-ef-50',
        whyThisCombo: 'Yalnızca 450 gr gövde. f/1.4 açık diyaframı sayesinde akşam sokak lambaları altında flaşsız net kareler üretir.'
      },
      {
        id: 'c-street-nikon',
        name: 'Döner Ekranlı Gizli Kadraj Kiti',
        badge: 'Hareketli Ekran',
        bodyId: 'e-nikon',
        lensId: 'e-nikon-18-55-vr',
        whyThisCombo: 'Döner LCD ekranı sayesinde makineyi göz hizasına kaldırmadan, bel hizasından fark ettirmeden doğal anları yakalayın.'
      },
      {
        id: 'c-street-analog',
        name: 'Analog Bas-Çek Sokak Kiti',
        badge: '35mm Film',
        bodyId: 'e-clearshot-1',
        whyThisCombo: 'Ayar derdi olmadan cebe atıp çıkmalık. Dahili flaşıyla 90’lar analog sokak estetiği.'
      }
    ],
    settingsTip: 'Av (Diyafram Öncelikli) • f/4 - f/5.6 • Lens IS anahtarı açık',
    cardNote: '6D, 1000D ve Nikon gövdeler için kendi SD kartınızı getirmelisiniz.'
  },
  {
    id: 'portrait',
    title: 'Portre & Bokeh',
    icon: '📸',
    tag: 'Model & İnsan',
    shortDesc: 'Modelin ön plana çıktığı, arka planın pürüzsüzce bulanıklaştığı profesyonel portreler.',
    combos: [
      {
        id: 'c-portrait-master',
        name: 'Sinematik 85mm Portre Kiti',
        badge: 'Maksimum Bokeh',
        bodyId: 'e-5d2',
        lensId: 'e-ef-85',
        accessoryId: 'e-tianya-77',
        whyThisCombo: '85mm yüz hatlarını bozmaz, f/1.8 diyafram arka planı eritir. 5D Mark II ile 32GB CF kart çantada hazır teslim edilir.'
      },
      {
        id: 'c-portrait-natural',
        name: 'Doğal Açı & Loş Işık Portre Kiti',
        badge: 'f/1.4 Diyafram',
        bodyId: 'e-6d',
        lensId: 'e-ef-50',
        whyThisCombo: '50mm insan gözü açısına en yakındır. f/1.4 ultra açık diyafram loş kafelerde ve akşam portrelerinde harikadır.'
      },
      {
        id: 'c-portrait-macro',
        name: 'Ultra Keskin Detay Portre Kiti',
        badge: 'Jilet Keskinlik',
        bodyId: 'e-5d2',
        lensId: 'e-ef-100-macro',
        whyThisCombo: 'Göz bebeği ve saç teli detaylarını en yüksek keskinlikte yakalamak isteyenler için 100mm f/2.8 lens.'
      }
    ],
    settingsTip: 'Av Modu • f/1.8 - f/2.2 • Tek Nokta AF (Modele en yakın göze netleyin)',
    cardNote: '5D Mark II gövde için 32GB CF kart ve kart okuyucu kulüp çantasında dahildir.'
  },
  {
    id: 'architecture',
    title: 'Mimarlık & Geniş Açı',
    icon: '🏛️',
    tag: 'Mekan & Yapı',
    shortDesc: 'Dar odalarda veya yüksek binaların önünde geri çekilmeden tüm mekanı tek kareye sığdırma.',
    combos: [
      {
        id: 'c-arch-fullframe',
        name: 'L Serisi Ultra Geniş Açı Kiti',
        badge: '104° Devasa Açı',
        bodyId: 'e-6d',
        lensId: 'e-ef-17-40',
        accessoryId: 'e-tianya-77',
        whyThisCombo: '17mm odak uzaklığı Full Frame sensörde 104° görüş açısı sunar. Duvara yaslanmadan tüm salonu ve binayı sığdırır.'
      },
      {
        id: 'c-arch-crop',
        name: 'Crop Sensör Geniş Açı Kiti',
        badge: 'f/3.5 Sabit Diyafram',
        bodyId: 'e-1000d',
        lensId: 'e-sigma-10-20',
        whyThisCombo: '1000D gövdede çarpan etkisini kırarak 10mm gerçek geniş açı sağlar. Sabit f/3.5 iç mekanlar için idealdir.'
      }
    ],
    settingsTip: 'Diyafram: f/8 veya f/11 (Maksimum köşe netliği) • ISO: 100-200 • Makineyi yere tam paralel tutun',
    cardNote: 'Canon 17-40mm Full Frame gövdelere, Sigma 10-20mm ise Crop gövdeye (1000D) takılmalıdır.'
  },
  {
    id: 'night_concert',
    title: 'Gece & Konser',
    icon: '🌙',
    tag: 'Düşük Işık & Sahne',
    shortDesc: 'Karanlık sahnelerde, loş mekanlarda ve gece etkinliklerinde flaşsız net fotoğraflar.',
    combos: [
      {
        id: 'c-night-lowlight',
        name: 'Flaşsız Loş Sahne Kiti',
        badge: 'Yüksek ISO + f/1.4',
        bodyId: 'e-6d',
        lensId: 'e-ef-50',
        whyThisCombo: 'Canon 6D yüksek ISO’da kumlanma yapmaz. 50mm f/1.4 lense maksimum ışık alarak karanlıkta perde hızını korur.'
      },
      {
        id: 'c-night-flash',
        name: 'Etkinlik & Parti Tepe Flaşlı Kiti',
        badge: 'Sektirme Flaş',
        bodyId: 'e-6d',
        lensId: 'e-ef-24-105',
        accessoryId: 'e-speedlite',
        whyThisCombo: 'Speedlite 580EX II flaşı tavana sektirerek stüdyo kalitesinde yumuşak ışık elde edin. Şarjlı piller dahildir.'
      }
    ],
    settingsTip: 'ISO: 3200-6400 • Diyafram: f/1.4 - f/2.0 • Enstantane: En az 1/125s (Bulanıklığı önlemek için)',
    cardNote: 'Konserlerde doğrudan sanatçıya flaş patlatmayınız. Flaş kullanılacaksa tavana sektiriniz.'
  },
  {
    id: 'stage_tele',
    title: 'Sahne & Telefoto',
    icon: '🔭',
    tag: 'Uzak Mesafe & Spor',
    shortDesc: 'Sahneden uzakta olduğunuzda müzisyenleri ve uzaktaki detayları yakına getirme.',
    combos: [
      {
        id: 'c-tele-pro',
        name: 'L Serisi Beyaz Telefoto Kiti',
        badge: '70-200mm L Optik',
        bodyId: 'e-5d2',
        lensId: 'e-ef-70-200',
        whyThisCombo: 'Florit optik camlı beyaz lens. 200mm’de bile kristal netlik sunar, arka planı büyüterek derinlik katar.'
      },
      {
        id: 'c-tele-superzoom',
        name: 'Süper Menzil Kiti (Crop 1.6x)',
        badge: '320mm Eşdeğer',
        bodyId: 'e-1000d',
        lensId: 'e-ef-70-200',
        whyThisCombo: '1000D crop sensörü lensi 112-320mm devasa bir menzile ulaştırır. Çok uzaktaki sahneler ve spor için idealdir.'
      }
    ],
    settingsTip: 'Enstantane: 200mm zoomda titremeyi önlemek için en az 1/250s veya 1/500s kullanın',
    cardNote: '5D Mark II gövde için 32GB CF kart çantada verilir. 1000D için kendi SD kartınızı getirmelisiniz.'
  },
  {
    id: 'macro',
    title: 'Makro & Detay',
    icon: '🔍',
    tag: 'Ürün, Takı & Doğa',
    shortDesc: '1 cm nesneyi sensöre 1 cm düşüren 1:1 gerçek boyutlu mikroskobik detay çekimi.',
    combos: [
      {
        id: 'c-macro-pro',
        name: '1:1 Life-Size Gerçek Makro Kiti',
        badge: '1:1 Büyütme',
        bodyId: 'e-5d2',
        lensId: 'e-ef-100-macro',
        whyThisCombo: '31 cm mesafeden madeni para yazıları, takı taşları veya çiçek damarlarını gerçek boyutunda odaklar.'
      }
    ],
    settingsTip: 'Diyafram: f/8 veya f/11 (Net alan derinliğini artırmak için) • Tripod veya sabit duruş önerilir',
    cardNote: '5D Mark II Full Frame gövde + 32GB CF kart ve okuyucu dahil teslim edilir.'
  },
  {
    id: 'analog_film',
    title: 'Analog 35mm',
    icon: '🎞️',
    tag: 'Film & Karanlık Oda',
    shortDesc: 'Dijital ekran yok, 36 poz disiplini; çektiğiniz filmi kulüp karanlık odamızda banyo edin.',
    combos: [
      {
        id: 'c-analog-slr',
        name: 'Otomatik Netlemeli 35mm SLR Kiti',
        badge: 'Modern EF Lens Uyumlu',
        bodyId: 'e-650',
        lensId: 'e-ef-50',
        whyThisCombo: 'Canon EOS 650, kulübümüzün dijital EF lensleriyle otomatik netleme ve diyafram uyumuyla çalışır.'
      },
      {
        id: 'c-analog-pointshoot',
        name: 'Kompakt Bas-Çek Analog Kiti (No: 1-5)',
        badge: 'Cebe Sığan Klasik',
        bodyId: 'e-clearshot-1',
        whyThisCombo: 'Dahili flaşı ve otomatik sarımıyla bas-çek analog keyfi. Kulüp havuzumuzda 5 adet Clear Shot M mevcuttur.'
      }
    ],
    settingsTip: 'Filminizin ISO (ASA) değerini makine kadranından doğru ayarlayın (örn: 200 veya 400 ISO)',
    cardNote: 'Çektiğiniz filmleri Davutpaşa Kulüpler Vadisi Karanlık Odamızda ücretsiz banyo edebilirsiniz.'
  },
  {
    id: 'beginner',
    title: 'Yeni Başlayanlar',
    icon: '🎓',
    tag: 'Temel Eğitim & Atölye',
    shortDesc: 'Ağır gövde karmaşası olmadan Diyafram, Enstantane ve ISO mantığını kolayca öğrenin.',
    combos: [
      {
        id: 'c-beginner-canon',
        name: 'Hafif & Sade Canon Eğitim Kiti',
        badge: 'İdeal Başlangıç',
        bodyId: 'e-1000d',
        lensId: 'e-ef-50',
        whyThisCombo: '450 gr hafif gövde, sade Türkçe menü ve f/1.4 lens ile diyaframın mantığını 1 günde kavrarsınız.'
      },
      {
        id: 'c-beginner-nikon',
        name: 'Titreşim Engellemeli Nikon Kiti',
        badge: 'VR Destekli',
        bodyId: 'e-nikon',
        lensId: 'e-nikon-18-55-vr',
        whyThisCombo: 'VR titreşim engelleme desteği ve döner ekranı acemilikte el titremesi bulanıklığını önler.'
      }
    ],
    settingsTip: 'Av (Diyafram Öncelikli) ve Tv (Enstantane Öncelikli) modlarında denemeler yaparak başlayın',
    cardNote: 'Çekime gelirken kendi SD hafıza kartınızı getirmeyi unutmayınız.'
  }
];

interface EquipmentGuidePageProps {
  onSelectEquipmentToReserve: (equipmentId: string) => void;
  onNavigate: (tab: TabType, extraParam?: string) => void;
}

export const EquipmentGuidePage: React.FC<EquipmentGuidePageProps> = ({
  onSelectEquipmentToReserve,
  onNavigate
}) => {
  const initialSync = React.useMemo(() => api.getInitialSyncState(), []);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(initialSync.equipmentList);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('street_travel');
  const [selectedComboIndex, setSelectedComboIndex] = useState<number>(0);
  const [showDictionary, setShowDictionary] = useState<boolean>(false);

  useEffect(() => {
    api.getEquipment().then((list) => {
      if (list && list.length > 0) setEquipmentList(list);
    }).catch(console.error);
  }, []);

  const activeScenario = GUIDE_SCENARIOS.find((sc) => sc.id === selectedScenarioId) || GUIDE_SCENARIOS[0];
  const safeComboIndex = Math.min(selectedComboIndex, activeScenario.combos.length - 1);
  const activeCombo = activeScenario.combos[safeComboIndex] || activeScenario.combos[0];

  const getEq = (key?: string): Equipment | undefined => {
    if (!key) return undefined;
    const targetSerial = EQUIPMENT_SERIAL_MAP[key] || key;

    // 1. Try finding in live equipmentList (by id or serial_number)
    const live = equipmentList.find(
      (e) => e.id === key || e.serial_number === key || e.serial_number === targetSerial || e.id === targetSerial
    );
    if (live) return live;

    // 2. Fallback to INITIAL_EQUIPMENT so it NEVER fails even during loading
    return INITIAL_EQUIPMENT.find(
      (e) => e.id === key || e.serial_number === key || e.serial_number === targetSerial || e.id === targetSerial
    );
  };

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setSelectedComboIndex(0);
  };

  const handleReserve = (equipmentId: string) => {
    onSelectEquipmentToReserve(equipmentId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold tracking-wide uppercase border border-purple-500/30">
              Kulüp Demirbaşı
            </span>
            <span className="text-xs text-white/50">• Fotoğrafçılık & Ekipman Rehberi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-club tracking-tight">
            Çekim & Ekipman Rehberi
          </h1>
          <p className="text-xs sm:text-sm text-[#a9b9d3] max-w-2xl leading-relaxed">
            Hangi çekim için hangi gövde ve lensi almalısınız? Kulübümüzün ekipmanlarıyla hazır kombolar.
          </p>
        </div>

        <button
          onClick={() => setShowDictionary(!showDictionary)}
          className={`self-start md:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
            showDictionary 
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/30' 
              : 'bg-white/[0.05] text-white/80 hover:text-white border-white/10 hover:bg-white/[0.08]'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-300" />
          <span>{showDictionary ? 'Temel Terimleri Kapat' : 'Temel Terimler (Diyafram / mm)'}</span>
        </button>
      </div>

      {/* Quick Photography Terms (Collapsible 3-box) */}
      {showDictionary && (
        <div className="p-4 rounded-2xl bg-[#180c16] border border-amber-500/20 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-amber-200 font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sıfırdan Başlayanlar İçin 3 Temel Kural:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="font-bold text-amber-300 text-xs block">1. Diyafram (f/ Değeri)</span>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Küçük sayı (f/1.4, f/1.8) = Çok ışık ve flur arka plan (bokeh). Portre ve gecede küçük f seçilir.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="font-bold text-amber-300 text-xs block">2. Odak Uzaklığı (mm)</span>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Küçük mm (17mm, 10mm) = Geniş Açı (bina, oda). Büyük mm (85mm, 200mm) = Telefoto (uzak detay, portre).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <span className="font-bold text-amber-300 text-xs block">3. Sensör: Full Frame vs Crop</span>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Full Frame (5D2, 6D) = Yüksek ışık başarımı ve derin bokeh. Crop (1000D, Nikon) = Hafif ve pratik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Horizontal Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/[0.08]">
        {GUIDE_SCENARIOS.map((sc) => {
          const isActive = sc.id === activeScenario.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(sc.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30'
                  : 'bg-white/[0.04] text-white/70 hover:text-white border-white/[0.08] hover:bg-white/[0.08]'
              }`}
            >
              <span className="text-base">{sc.icon}</span>
              <span>{sc.title}</span>
            </button>
          );
        })}
      </div>

      {/* Scenario Content Container */}
      <div className="space-y-6">
        
        {/* Scenario Header Info */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <span className="text-base">{activeScenario.icon}</span>
              <span className="uppercase tracking-wider">{activeScenario.tag}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {activeScenario.title}
            </h2>
            <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
              {activeScenario.shortDesc}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-purple-300/80 font-medium">
              {activeScenario.combos.length} Kulüp Kombosu
            </span>
          </div>
        </div>

        {/* Combo Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {activeScenario.combos.map((combo, idx) => {
            const isSelected = idx === safeComboIndex;
            return (
              <button
                key={combo.id}
                onClick={() => setSelectedComboIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-500/25 text-purple-200 border-purple-400 font-semibold shadow-sm'
                    : 'bg-white/[0.03] text-white/60 hover:text-white border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                <span className="text-[10px] text-purple-400 font-bold">{idx + 1}.</span>
                <span>{combo.name}</span>
              </button>
            );
          })}
        </div>

        {/* SELECTED COMBO MAIN CARD */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#180a15] border border-purple-500/30 space-y-5 shadow-xl shadow-purple-950/40">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-1">
                {activeCombo.badge}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activeCombo.name}
              </h3>
            </div>
          </div>

          {/* Body + Lens Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Body Box */}
            {(() => {
              const body = getEq(activeCombo.bodyId);
              if (!body) return null;
              return (
                <div className="md:col-span-5 p-4 rounded-xl bg-white/[0.04] border border-white/15 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6e2a4f] text-white uppercase tracking-wider">
                        Önerilen Gövde
                      </span>
                      <StatusBadge status={body.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {body.image_url ? (
                          <img src={body.image_url} alt={body.name} className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="text-xs font-semibold text-white block truncate" title={body.name}>
                          {body.name}
                        </strong>
                        <span className="text-[10px] text-purple-300/80 block mt-0.5">
                          Demirbaş: {body.serial_number}
                        </span>
                        <span className="text-[11px] text-white/60 block mt-0.5 line-clamp-2">
                          {body.description}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReserve(body.id)}
                    className="w-full py-2 rounded-lg bg-[#6e2a4f] hover:bg-[#83335e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <span>1. Adım: Bu Gövdeyi Rezerve Et</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })()}

            {/* Plus Connector */}
            <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow">
                <Plus className="w-4 h-4 font-bold" />
              </div>
              <span className="text-[10px] text-purple-300/70 font-semibold mt-1">Uyumlu Kombo</span>
            </div>

            {/* Lens Box */}
            {activeCombo.lensId ? (
              (() => {
                const lens = getEq(activeCombo.lensId);
                if (!lens) return null;
                return (
                  <div className="md:col-span-5 p-4 rounded-xl bg-white/[0.04] border border-white/15 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4e3b52] text-white uppercase tracking-wider">
                          Önerilen Lens
                        </span>
                        <StatusBadge status={lens.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-black/50 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                          {lens.image_url ? (
                            <img src={lens.image_url} alt={lens.name} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-white/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <strong className="text-xs font-semibold text-white block truncate" title={lens.name}>
                            {lens.name}
                          </strong>
                          <span className="text-[10px] text-purple-300/80 block mt-0.5">
                            Demirbaş: {lens.serial_number}
                          </span>
                          <span className="text-[11px] text-white/60 block mt-0.5 line-clamp-2">
                            {lens.description}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReserve(lens.id)}
                      className="w-full py-2 rounded-lg bg-[#4e3b52] hover:bg-[#634c68] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                    >
                      <span>2. Adım: Bu Lensi Rezerve Et</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="md:col-span-5 p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-center p-6 text-xs text-white/60">
                <span>Bu analog makinede lens dahili (Fujinon) olarak gövde üzerindedir. Ek lens gerekmez.</span>
              </div>
            )}

          </div>

          {/* Optional Accessory Box */}
          {activeCombo.accessoryId && (() => {
            const acc = getEq(activeCombo.accessoryId);
            if (!acc) return null;
            return (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {acc.image_url ? (
                      <img src={acc.image_url} alt={acc.name} className="w-full h-full object-cover" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">Tamamlayıcı Kulüp Aksesuarı</span>
                    <strong className="text-xs text-white block truncate">{acc.name}</strong>
                    <span className="text-[11px] text-white/60 block truncate">{acc.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleReserve(acc.id)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 transition-colors cursor-pointer"
                >
                  Aksesuarı Seç
                </button>
              </div>
            );
          })()}

          {/* Short "Neden Bu Kombo?" info */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-semibold text-white">Neden Bu Kombo?: </span>
              <span className="text-white/70">{activeCombo.whyThisCombo}</span>
            </div>
          </div>

          {/* Settings & Memory Card Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-300 block">Kamera Ayarı:</span>
                <span className="text-white/70 text-[11px]">{activeScenario.settingsTip}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300 block">Hafıza Kartı & Uyarı:</span>
                <span className="text-amber-200/80 text-[11px]">{activeScenario.cardNote}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
