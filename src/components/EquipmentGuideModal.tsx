import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Camera, 
  Search, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Layers, 
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';
import { Equipment } from '../types';
import { StatusBadge } from './StatusBadge';

export interface GuideScenario {
  id: string;
  title: string;
  icon: string;
  tag: string;
  shortDesc: string;
  beginnerExplanation: string;
  recommendedEquipmentIds: string[];
  recommendedBodyId: string;
  recommendedLensId: string;
  recommendedAccessoryId?: string;
  cameraSettingsTip: string;
  compatibilityNote: string;
}

export const GUIDE_SCENARIOS: GuideScenario[] = [
  {
    id: 'portrait',
    title: 'Portre & Bokeh (Arka Plan Fluluğu)',
    icon: '📸',
    tag: 'İnsan & Model Çekimleri',
    shortDesc: 'Modelin ön plana çıktığı, arka planın kremsi şekilde bulanıklaştığı profesyonel portreler.',
    beginnerExplanation: 'Diyafram (f) değeri ne kadar küçülürse (f/1.4, f/1.8 gibi), lense o kadar çok ışık girer ve modelin arkasındaki nesneler o kadar çok bulanıklaşır (bokeh efekti). 85mm odak uzaklığı ise insan yüzünü geniş açı lensler gibi yayvanlaştırmaz; burun ve yüz hatlarını en doğal oranlarında gösterir.',
    recommendedEquipmentIds: ['e-5d2', 'e-ef-85', 'e-ef-50', 'e-tianya-77'],
    recommendedBodyId: 'e-5d2',
    recommendedLensId: 'e-ef-85',
    recommendedAccessoryId: 'e-tianya-77',
    cameraSettingsTip: 'Çekim Modu: Diyafram Öncelikli (Av) • Diyafram: f/1.8 - f/2.2 • Netleme: Tek Nokta AF (Modele en yakın göze netleyin).',
    compatibilityNote: 'Canon 5D Mark II Full Frame gövdedir. Kulüp çantasında 32GB CF hafıza kartı ve okuyucusu dahildir. 85mm lens bu gövdeye doğrudan tam oturur.'
  },
  {
    id: 'architecture',
    title: 'Mimarlık, İç Mekan & Geniş Açı',
    icon: '🏛️',
    tag: 'Yapılar & Kentsel Mekan',
    shortDesc: 'Dar odalarda veya devasa binaların önünde geri çekilemediğinizde tüm kadrajı sığdırma.',
    beginnerExplanation: 'Odak uzaklığı (mm) küçüldükçe görüş açısı genişler. Standart bir insan gözü yaklaşık 50mm görürken, 17mm veya 10mm gibi lensler gözün gördüğünün iki katından fazlasını tek kareye sığdırır. Odanın veya binanın tüm haşmetini yakalamak için vazgeçilmezdir.',
    recommendedEquipmentIds: ['e-6d', 'e-ef-17-40', 'e-5d2', 'e-sigma-10-20'],
    recommendedBodyId: 'e-6d',
    recommendedLensId: 'e-ef-17-40',
    cameraSettingsTip: 'Diyafram: f/8 veya f/11 (Köşeden köşeye maksimum netlik için) • ISO: 100-200 • Makineyi yere tam paralel tutun (Binaların geriye doğru devrilmesini önler).',
    compatibilityNote: '⚠️ Önemli Bayonet Kuralı: Canon EF 17-40mm L serisi Full Frame gövdelere (5D2 ve 6D) tam 104° geniş açı verir. Sigma 10-20mm lens ise sadece Crop sensörlü gövdelere (EOS 1000D) takılmalıdır.'
  },
  {
    id: 'night_concert',
    title: 'Gece, Konser & Loş Işık',
    icon: '🌙',
    tag: 'Düşük Işık & Sahne',
    shortDesc: 'Karanlık sokaklar, konser salonları, parti ve gece etkinliklerinde flaşsız net fotoğraflar.',
    beginnerExplanation: 'Ortamda ışık az olduğunda kameranın sensör hassasiyetini (ISO) artırmak gerekir. Ancak sıradan makineler yüksek ISO\'da kumlanma (gren) yapar. Canon 6D\'nin Full Frame sensörü ve f/1.4 açık diyaframlı 50mm lens birleştiğinde, karanlık bir odada bile flaş patlatmadan tertemiz sonuçlar alırsınız.',
    recommendedEquipmentIds: ['e-6d', 'e-ef-50', 'e-speedlite'],
    recommendedBodyId: 'e-6d',
    recommendedLensId: 'e-ef-50',
    recommendedAccessoryId: 'e-speedlite',
    cameraSettingsTip: 'ISO: 3200 - 6400 • Diyafram: f/1.4 - f/2.0 • Enstantane: Sahne hareketliyse en az 1/125s • Flaş kullanılacaksa tavana/duvara sektirin.',
    compatibilityNote: '⚠️ Hafıza Kartı Hatırlatması: Canon 6D gövde için çekime gelirken kendi SD kartınızı getirmelisiniz (kulüpte SD kart verilmez).'
  },
  {
    id: 'street_travel',
    title: 'Sokak & Gezi (Hafif Tak-Gez)',
    icon: '🚶',
    tag: 'Seyahat & Genel Çekim',
    shortDesc: 'Tek bir lensle hem geniş manzaraları hem de uzaktaki insanları ve detayları yakalama.',
    beginnerExplanation: 'Sokakta yürürken sürekli çantanızı açıp lens değiştirmek zordur ve anı kaçırmanıza yol açar. Canon 24-105mm L lens, 24mm geniş açıdan 105mm telefotoya kadar zoom yapabilir. Ayrıca dahili "Image Stabilizer (IS)" özelliği sayesinde yürürken veya düşük enstantanede elinizin titremesini amorti eder.',
    recommendedEquipmentIds: ['e-ef-24-105', 'e-6d', 'e-5d2', 'e-nikon', 'e-nikon-18-55-vr'],
    recommendedBodyId: 'e-6d',
    recommendedLensId: 'e-ef-24-105',
    cameraSettingsTip: 'Diyafram: f/5.6 • Lens üzerindeki Stabilizer (IS) anahtarını açık tutun • Netleme: Çoklu nokta veya tek merkez nokta AF.',
    compatibilityNote: 'Nikon tercih edecekseniz Nikon D5000 + 18-55mm VR setini seçebilirsiniz. D5000\'in hareketli ekranı bel hizasından gizli sokak kareleri çekmeyi çok kolaylaştırır.'
  },
  {
    id: 'analog_film',
    title: 'Analog 35mm Film Çekimi',
    icon: '🎞️',
    tag: 'Vintage & Karanlık Oda',
    shortDesc: 'Dijital ekran yok, sınır 36 poz; saf fotoğrafçılık disiplini ve kimyasal film dokusu.',
    beginnerExplanation: 'Analog makinelerde görüntü ışığa duyarlı gümüş tuzlu filme kaydedilir. Çektiğiniz fotoğrafı anında ekranda göremezsiniz; bu da her kareyi daha dikkatli kadrajlamanızı sağlar. Kulübümüzdeki Canon EOS 650, tüm modern Canon EF lenslerle otomatik netleme ve diyafram uyumuyla çalışır.',
    recommendedEquipmentIds: ['e-650', 'e-clearshot-1', 'e-ef-50', 'e-ef-85'],
    recommendedBodyId: 'e-650',
    recommendedLensId: 'e-ef-50',
    cameraSettingsTip: 'Filminizin ISO (ASA) değerini makinenin kadranından doğru ayarlayın (örn: 200 veya 400 ISO). Pozlama sayacını takip edin.',
    compatibilityNote: 'Çekim bittikten sonra filminizi kulübümüzün Karanlık Odasında banyo edebilir ve agrandisörle fotoğraf kartına baskı alabilirsiniz!'
  },
  {
    id: 'stage_tele',
    title: 'Sahne, Spor & Uzak Mesafe (Telefoto)',
    icon: '🔭',
    tag: 'Uzak Detaylar & Sahne',
    shortDesc: 'Konserde sahneye yaklaşamadığınızda veya uzaktaki nesneleri devasa boyutlara taşıma.',
    beginnerExplanation: '70-200mm gibi telefoto lensler uzaktaki nesneleri büyütür ve perspektif sıkıştırması yapar. Yani uzaktaki nesneyle arkasındaki fon birbirine çok yakınmış gibi görünür. Efsanevi beyaz gövdeli Canon 70-200mm f/4L, florit optik elemanlarıyla kristal berraklığında keskinlik sunar.',
    recommendedEquipmentIds: ['e-ef-70-200', 'e-5d2', 'e-6d'],
    recommendedBodyId: 'e-5d2',
    recommendedLensId: 'e-ef-70-200',
    cameraSettingsTip: 'Enstantane Kuralı: Titremeyi önlemek için enstantane hızı odak uzaklığından yüksek olmalıdır (200mm zoomda en az 1/250s veya 1/500s kullanın).',
    compatibilityNote: 'L serisi metal gövdesi nedeniyle çanta ile teslim edilir. Full Frame 5D2 ve 6D gövdelerle tam uyumludur.'
  },
  {
    id: 'macro',
    title: 'Makro & İnce Detay Çekimi',
    icon: '🔍',
    tag: 'Doku, Çiçek, Ürün & Yakın Plan',
    shortDesc: 'Gözün göremediği ince dokular, madeni paralar, takılar, çiçek taç yaprakları ve böcekler.',
    beginnerExplanation: 'Sıradan lensler nesneye 40-50 cm\'den fazla yaklaşamaz, yaklaşırlarsa netleyemezler. Canon EF 100mm f/2.8 Macro lens, 1:1 "life-size" büyütme oranına sahiptir; yani 1 cm\'lik bir nesne sensör üzerine tam 1 cm olarak düşer. Ayrıca olağanüstü keskin bir portre lensidir.',
    recommendedEquipmentIds: ['e-ef-100-macro', 'e-5d2'],
    recommendedBodyId: 'e-5d2',
    recommendedLensId: 'e-ef-100-macro',
    cameraSettingsTip: '1:1 makroda netleme alanı saç teli kadar incedir. Net alan derinliğini artırmak için diyaframı f/8 veya f/11\'e kadar kısın. Sabit çekim yapmaya özen gösterin.',
    compatibilityNote: 'Tam zamanlı manuel odak (Ring USM) desteği sayesinde milimetrik netleme halkasını elle çevirebilirsiniz.'
  },
  {
    id: 'beginner',
    title: 'Fotoğrafa Yeni Başlayanlar (Temel Eğitim)',
    icon: '🎓',
    tag: 'Atölyeler & İlk DSLR Deneyimi',
    shortDesc: 'Diyafram, Enstantane ve ISO üçgenini öğrenmek için sade menülü ve hafif gövdeler.',
    beginnerExplanation: 'Ağır profesyonel gövdeler ilk başta kafa karıştırabilir. Canon EOS 1000D sadece 450 gr ağırlığında olup, ergonomik yapısı ve anlaşılır arayüzüyle kulüp temel eğitim atölyeleri ve gezi yürüyüşleri için mükemmel bir başlangıç makinesidir.',
    recommendedEquipmentIds: ['e-1000d', 'e-ef-50', 'e-nikon', 'e-nikon-18-55-vr'],
    recommendedBodyId: 'e-1000d',
    recommendedLensId: 'e-ef-50',
    cameraSettingsTip: 'Manuel moda (M) geçmeden önce Diyafram Öncelikli (Av) ve Enstantane Öncelikli (Tv) modlarında denemeler yaparak ışığın mantığını kavrayın.',
    compatibilityNote: 'Canon 1000D hem EF hem de EF-S lensleri kabul eder. Çekime gelirken kendi SD kartınızı getirmeyi unutmayınız.'
  }
];

interface EquipmentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: Equipment[];
  onSelectEquipmentToReserve: (equipmentId: string) => void;
}

export const EquipmentGuideModal: React.FC<EquipmentGuideModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  onSelectEquipmentToReserve
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('portrait');
  const [searchFilter, setSearchFilter] = useState('');
  const [showDictionary, setShowDictionary] = useState(false);

  if (!isOpen) return null;

  const filteredScenarios = GUIDE_SCENARIOS.filter((sc) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      sc.title.toLowerCase().includes(q) ||
      sc.tag.toLowerCase().includes(q) ||
      sc.shortDesc.toLowerCase().includes(q) ||
      sc.beginnerExplanation.toLowerCase().includes(q)
    );
  });

  const activeScenario = GUIDE_SCENARIOS.find((sc) => sc.id === selectedScenarioId) || GUIDE_SCENARIOS[0];

  const getEq = (id: string) => equipmentList.find((e) => e.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#160b13] border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#301322] via-[#22101b] to-[#160b13] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6e2a4f] to-[#301322] border border-white/20 flex items-center justify-center text-white shadow-inner">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight font-club">
                  YTÜFOK Ekipman & Çekim Rehberi
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#657796]/30 text-amber-300 rounded border border-amber-300/20 uppercase">
                  Öğretici Kılavuz
                </span>
              </div>
              <p className="text-xs text-white/60">Hangi çekim için hangi gövde ve lensi almalısınız? Yeni başlayanlar için rehber.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDictionary(!showDictionary)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                showDictionary 
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/30' 
                  : 'bg-white/[0.05] text-white/70 hover:text-white border-white/10'
              }`}
              title="Fotoğrafçılık Terimleri Sözlüğü"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>{showDictionary ? 'Sözlüğü Kapat' : 'Temel Terimler'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photography Quick Dictionary (Collapsible) */}
        {showDictionary && (
          <div className="p-4 bg-[#120710] border-b border-white/10 text-xs text-white/80 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Yeni Başlayanlar İçin Temel Fotoğrafçılık Sözlüğü:
              </strong>
              <span className="text-[10px] text-white/50">Diyafram • Odak Uzaklığı • Sensör</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="font-bold text-amber-300 block mb-0.5">Diyafram (f/ Değeri)</span>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Sayı küçüldükçe (f/1.4, f/1.8) lense çok ışık girer ve arka plan <strong>bulanıklaşır (bokeh)</strong>. Portre ve gece çekiminde küçük f seçilir.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="font-bold text-amber-300 block mb-0.5">Odak Uzaklığı (mm)</span>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Küçük mm (17mm, 10mm) <strong>Geniş Açı</strong> verir, odayı ve manzarayı sığdırır. Büyük mm (85mm, 200mm) <strong>Telefoto</strong> olup uzaktakileri yaklaştırır.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="font-bold text-amber-300 block mb-0.5">Sensör: Full Frame vs Crop</span>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  <strong>Full Frame (5D2, 6D):</strong> 35mm büyük sensör, derin arka plan fluluğu ve yüksek ışık başarımı sunar. <strong>Crop (1000D, Nikon):</strong> Hafif ve ekonomiktir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Sidebar + Detail View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Left Category Scroller / List */}
          <div className="w-full md:w-72 bg-[#120710]/95 border-b md:border-b-0 md:border-r border-white/10 flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Çekim türü ara (örn: portre, gece...)"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#6e2a4f]"
                />
              </div>
            </div>

            {/* Scenario Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 md:space-y-1.5">
              {filteredScenarios.map((sc) => {
                const isActive = sc.id === activeScenario.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6e2a4f] to-[#4e3b52] text-white shadow-md border border-white/20'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] text-white/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="text-xl shrink-0">{sc.icon}</span>
                    <div className="min-w-0 flex-1">
                      <strong className="text-xs font-semibold block truncate leading-tight">
                        {sc.title}
                      </strong>
                      <span className={`text-[10px] block truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                        {sc.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Detail Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#160b13]">
            
            {/* Scenario Header Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activeScenario.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-white font-club">{activeScenario.title}</h3>
                  <span className="text-xs text-amber-300 font-medium">{activeScenario.tag}</span>
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-normal">
                {activeScenario.shortDesc}
              </p>
            </div>

            {/* "Nasıl Çalışır / Neden Bu Ekipman?" Educational Explainer */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h4>Yeni Başlayanlar İçin Fotoğrafçılık Mantığı:</h4>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                {activeScenario.beginnerExplanation}
              </p>
            </div>

            {/* Recommended Equipment Pairings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Kulüp Demirbaşı Tavsiye Edilen Uyumlu Kombinasyon:
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Body Card */}
                {(() => {
                  const body = getEq(activeScenario.recommendedBodyId);
                  if (!body) return null;
                  return (
                    <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/15 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6e2a4f]/50 text-white uppercase tracking-wider">
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
                            <span className="text-[11px] text-white/60 block mt-0.5 line-clamp-2">
                              {body.description}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          onSelectEquipmentToReserve(body.id);
                        }}
                        className="w-full py-2 rounded-lg bg-[#6e2a4f] hover:bg-[#83335e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                      >
                        <span>Gövdeyi Rezerve Et</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}

                {/* Lens Card */}
                {(() => {
                  const lens = getEq(activeScenario.recommendedLensId);
                  if (!lens) return null;
                  return (
                    <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/15 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
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
                            <span className="text-[11px] text-white/60 block mt-0.5 line-clamp-2">
                              {lens.description}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          onSelectEquipmentToReserve(lens.id);
                        }}
                        className="w-full py-2 rounded-lg bg-[#6e2a4f] hover:bg-[#83335e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                      >
                        <span>Lensi Rezerve Et</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Optional Accessory / Filter Card */}
              {activeScenario.recommendedAccessoryId && (() => {
                const acc = getEq(activeScenario.recommendedAccessoryId);
                if (!acc) return null;
                return (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {acc.image_url ? (
                          <img src={acc.image_url} alt={acc.name} className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">Tamamlayıcı Aksesuar</span>
                        <strong className="text-xs text-white block truncate">{acc.name}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectEquipmentToReserve(acc.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 transition-colors"
                    >
                      Aksesuarı Seç
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Technical Tips & Compatibility Warning */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Kamera Ayar İpucu:</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  {activeScenario.cameraSettingsTip}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Uyumluluk & Hafıza Kartı:</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  {activeScenario.compatibilityNote}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 bg-[#120710] border-t border-white/10 flex items-center justify-between text-xs text-white/50 shrink-0">
          <span>YTÜFOK Ekipman Yönetimi • Kulüpler Vadisi Davutpaşa Kampüsü</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
