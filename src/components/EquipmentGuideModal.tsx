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
  Sliders, 
  Package, 
  Plus,
  ShieldCheck,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { Equipment } from '../types';
import { StatusBadge } from './StatusBadge';

export interface EquipmentCombo {
  id: string;
  name: string;
  badge: string;
  badgeColor?: string;
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
  beginnerExplanation: string;
  combos: EquipmentCombo[];
  cameraSettingsTip: string;
  compatibilityNote: string;
}

export const GUIDE_SCENARIOS: GuideScenario[] = [
  {
    id: 'street_travel',
    title: 'Sokak & Gezi (Tak-Gez Seyahat)',
    icon: '🚶',
    tag: 'Seyahat & Günlük Hayat',
    shortDesc: 'Yürüyüşlerde ve gezilerde tek lensle hem geniş caddeleri hem de uzaktaki insanları yakalama.',
    beginnerExplanation: 'Sokakta gezerken sürekli çanta açıp lens değiştirmek zordur ve anı kaçırmanıza yol açar. "Tak-gez" lensler (24-105mm gibi) geniş açıdan telefotoya kadar zoom yapabilir ve optik sabitleme (IS) sayesinde yürürken elinizin titremesini amorti eder.',
    combos: [
      {
        id: 'c-street-pro',
        name: 'Profesyonel Çok Yönlü Gezi Kiti (Full Frame)',
        badge: 'En Popüler Gezi Kiti',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        bodyId: 'e-6d',
        lensId: 'e-ef-24-105',
        accessoryId: 'e-tianya-77',
        whyThisCombo: '24-105mm f/4L IS lens, 24mm geniş açıdan 105mm yakınlaştırmaya kadar her anı yakalar. Dahili 3-Stop IS sabitleyici yürürken bulanıklığı engeller. Canon 6D’nin dahili GPS modülü ise çektiğiniz fotoğrafların haritadaki tam koordinatlarını kaydeder.'
      },
      {
        id: 'c-street-compact',
        name: 'Kompakt & Hafif Sokak Kiti (Loş Sokaklar)',
        badge: 'Hafif & Dikkat Çekmeyen',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        bodyId: 'e-1000d',
        lensId: 'e-ef-50',
        whyThisCombo: 'Ağır makineler sokakta insanların çekinmesine neden olur. Yalnızca 450 gr olan Canon 1000D gövde ve 50mm f/1.4 lens son derece ufaktır. f/1.4 devasa diyaframı sayesinde akşam loş sokak lambaları altında bile flaşsız net kareler üretir.'
      },
      {
        id: 'c-street-nikon',
        name: 'Döner Ekranlı Gizli Kadraj Kiti',
        badge: 'Hareketli Ekran Avantajı',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        bodyId: 'e-nikon',
        lensId: 'e-nikon-18-55-vr',
        whyThisCombo: 'Nikon D5000’in döner açılı ekranı sayesinde kamerayı göz hizasına kaldırmadan, bel hizasından kimseye fark ettirmeden samimi sokak fotoğrafları çekebilirsiniz. 18-55mm VR lens titreşimi engeller.'
      },
      {
        id: 'c-street-analog',
        name: 'Otomatik 35mm Analog Bas-Çek Kiti',
        badge: 'Vintage Sokak Dokusu',
        badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        bodyId: 'e-clearshot-1',
        whyThisCombo: 'Hiçbir teknik ayarla uğraşmadan cebe atıp çıkmalık gerçek analog deneyimi. Dahili flaşı ve Fujinon lensiyle 90’lar sokak fotoğrafçılığı estetiğini doğrudan 35mm filme kaydeder.'
      }
    ],
    cameraSettingsTip: 'Çekim Modu: Diyafram Öncelikli (Av) • Diyafram: f/4 - f/5.6 • Lens IS (Sabitleyici) anahtarını açık tutun • Netleme: Tek nokta veya dinamik çoklu nokta AF.',
    compatibilityNote: '⚠️ Hafıza Kartı Hatırlatması: Canon 6D, 1000D ve Nikon D5000 gövdeler için üyelerimizin kendi SD kartlarını getirmeleri gerekmektedir.'
  },
  {
    id: 'portrait',
    title: 'Portre & Bokeh (Arka Plan Fluluğu)',
    icon: '📸',
    tag: 'İnsan & Model Çekimleri',
    shortDesc: 'Modelin ön plana çıktığı, arka planın kremsi şekilde buğulandığı profesyonel portreler.',
    beginnerExplanation: 'Diyafram (f) değeri ne kadar küçülürse (f/1.4, f/1.8 gibi), lense o kadar çok ışık girer ve modelin arkasındaki alan o kadar çok bulanıklaşır (bokeh efekti). 85mm odak uzaklığı ise insan yüzünü geniş açılar gibi yayvanlaştırmaz; burun ve yüz hatlarını en doğal oranlarında gösterir.',
    combos: [
      {
        id: 'c-portrait-master',
        name: 'Amiral Gemisi Sinematik Portre Kiti',
        badge: 'Maksimum Bokeh & Kalite',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        bodyId: 'e-5d2',
        lensId: 'e-ef-85',
        accessoryId: 'e-tianya-77',
        whyThisCombo: 'Fotoğrafçılıkta 85mm "altın portre" standardıdır. Modelin yüz hatlarını asla bozmaz ve f/1.8 diyafram ile arka planı suluboya gibi eritir. Canon 5D Mark II Full Frame sensörü cilt tonlarını sinematik yakalar; 32GB CF kartı ve okuyucusu çantasında kulüp tarafından verilir.'
      },
      {
        id: 'c-portrait-natural',
        name: 'Doğal İnsan Gözü & Düşük Işık Portre Kiti',
        badge: 'f/1.4 Ultra Açık Diyafram',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        bodyId: 'e-6d',
        lensId: 'e-ef-50',
        whyThisCombo: '50mm insan gözünün standart görüş açısına en yakındır. Kulübün en açık diyaframlı lensi olan f/1.4 USM ile stüdyoda, kafede veya akşam ışığında modele yaklaşarak büyüleyici portreler çekebilirsiniz.'
      },
      {
        id: 'c-portrait-sharp',
        name: 'Jilet Keskinliğinde Detay Portre Kiti',
        badge: 'Ultra Yüksek Keskinlik',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        bodyId: 'e-5d2',
        lensId: 'e-ef-100-macro',
        whyThisCombo: 'Canon 100mm f/2.8 Macro lens optik olarak kulübün en keskin lensidir. Modelin kirpiklerini, göz bebeklerindeki yansımayı ve saç tellerini mikroskobik netlikte portrelemek için profesyonel bir tercihtir.'
      }
    ],
    cameraSettingsTip: 'Çekim Modu: Diyafram Öncelikli (Av) • Diyafram: f/1.8 - f/2.2 • Netleme: Tek Nokta AF (Modele en yakın göz bebeğine odaklayın).',
    compatibilityNote: '✅ Canon 5D Mark II gövde için kulüp tarafından 32GB SanDisk CF hafıza kartı ve yüksek hızlı USB okuyucu çanta içerisinde teslim edilir.'
  },
  {
    id: 'architecture',
    title: 'Mimarlık, İç Mekan & Kentsel Geniş Açı',
    icon: '🏛️',
    tag: 'Yapılar & Kentsel Mekan',
    shortDesc: 'Dar odalarda veya devasa binaların önünde geri çekilemediğinizde tüm kadrajı sığdırma.',
    beginnerExplanation: 'Odak uzaklığı (mm) küçüldükçe görüş açısı genişler. Standart bir insan gözü yaklaşık 50mm görürken, 17mm veya 10mm gibi lensler gözün gördüğünün iki katından fazlasını tek kareye sığdırır. Odanın veya binanın tüm haşmetini yakalamak için vazgeçilmezdir.',
    combos: [
      {
        id: 'c-arch-fullframe',
        name: 'Profesyonel Full Frame Mimari Kiti (104° Görüş)',
        badge: 'L Serisi Mimari Standart',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        bodyId: 'e-6d',
        lensId: 'e-ef-17-40',
        accessoryId: 'e-tianya-77',
        whyThisCombo: '17mm odak uzaklığı Full Frame Canon 6D sensöründe 104° devasa bir görüş açısı sunar. Tarihi camiler, yüksek tavanlı salonlar ve dar sokaklardaki cepheleri geri çekilmeden tek kareye sığdırır.'
      },
      {
        id: 'c-arch-crop',
        name: 'Crop Sensör İç Mekan & Geniş Açı Kiti',
        badge: 'f/3.5 Sabit Diyaframlı Ultra Geniş',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        bodyId: 'e-1000d',
        lensId: 'e-sigma-10-20',
        whyThisCombo: 'Crop sensörlü 1000D gövdede standart lensler darlaşır (1.6x çarpan). Sigma 10-20mm lens bu çarpanı telafi ederek crop gövdede bile büyüleyici bir 10mm geniş açı sağlar.'
      }
    ],
    cameraSettingsTip: 'Diyafram: f/8 veya f/11 (Köşeden köşeye maksimum netlik için) • ISO: 100 - 200 • Makineyi yere tam paralel tutun (Binaların geriye doğru devrilmesini önler).',
    compatibilityNote: '⚠️ Bayonet Uyarısı: Canon EF 17-40mm Full Frame gövdelere (5D2, 6D) tam oturur. Sigma 10-20mm ise sadece Crop gövdelere (1000D) takılmalıdır.'
  },
  {
    id: 'night_concert',
    title: 'Gece, Konser & Düşük Işık',
    icon: '🌙',
    tag: 'Düşük Işık & Sahne',
    shortDesc: 'Karanlık sokaklar, konser salonları, parti ve gece etkinliklerinde flaşsız net fotoğraflar.',
    beginnerExplanation: 'Ortamda ışık az olduğunda kameranın sensör hassasiyetini (ISO) artırmak gerekir. Canon 6D’nin Full Frame sensörü yüksek ISO\'da kumlanma yapmaz; kulübün f/1.4 açık diyaframlı 50mm lensiyle birleşince karanlıkta bile flaşsız net çekim yaparsınız.',
    combos: [
      {
        id: 'c-night-lowlight',
        name: 'Karanlık Mekan & Loş Konser Kiti (Flaşsız)',
        badge: 'Maksimum Işık Geçirgenliği',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        bodyId: 'e-6d',
        lensId: 'e-ef-50',
        whyThisCombo: 'Konser ve loş ışıklı sahnelerde flaş yasaktır. Canon 6D’nin ISO 6400 başarımı ve 50mm lensin f/1.4 dev diyaframı birleştiğinde karanlıkta perde hızını yüksek tutup netsizliği önlersiniz.'
      },
      {
        id: 'c-night-flash',
        name: 'Kulüp Etkinlik & Parti Tepe Flaşlı Kiti',
        badge: 'Profesyonel Sektirme Işık',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        bodyId: 'e-6d',
        lensId: 'e-ef-24-105',
        accessoryId: 'e-speedlite',
        whyThisCombo: 'Kapalı mekan etkinliklerinde Canon Speedlite 580EX II harici flaşın döner başlığını tavana doğru sektirerek stüdyo softbox’ı gibi yumuşacık ve gölgesiz aydınlatma sağlarsınız. 4 adet Eneloop şarjlı pil dahildir.'
      }
    ],
    cameraSettingsTip: 'ISO: 3200 - 6400 • Diyafram: f/1.4 - f/2.0 • Enstantane: Sahne hareketliyse en az 1/125s • Flaş varsa tavana 45° açıyla sektirin.',
    compatibilityNote: '⚠️ Hafıza Kartı Hatırlatması: Canon 6D için çekime gelirken kendi SD kartınızı getirmelisiniz.'
  },
  {
    id: 'stage_tele',
    title: 'Sahne, Spor & Uzak Mesafe (Telefoto)',
    icon: '🔭',
    tag: 'Uzak Detaylar & Sahne',
    shortDesc: 'Konserde sahneye yaklaşamadığınızda veya uzaktaki nesneleri devasa boyutlara taşıma.',
    beginnerExplanation: '70-200mm gibi telefoto lensler uzaktaki nesneleri büyütür ve perspektif sıkıştırması yapar. Beyaz gövdeli efsanevi Canon 70-200mm f/4L lens, florit optik elemanlarıyla kristal berraklığında keskinlik sunar.',
    combos: [
      {
        id: 'c-tele-pro',
        name: 'L Serisi Beyaz Telefoto Kiti (Full Frame)',
        badge: 'Profesyonel Sahne Standardı',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        bodyId: 'e-5d2',
        lensId: 'e-ef-70-200',
        whyThisCombo: 'Konser salonunda sahneden uzakta otursanız bile solistin yüzündeki mimikleri ve enstrüman detaylarını yakalayabilirsiniz. Perspektifi sıkıştırarak arka planı büyütür ve büyüleyici bir derinlik katar.'
      },
      {
        id: 'c-tele-superzoom',
        name: 'Ekstra Menzilli Telefoto Kiti (Crop 1.6x)',
        badge: '320mm Eşdeğer Süper Zoom',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        bodyId: 'e-1000d',
        lensId: 'e-ef-70-200',
        whyThisCombo: 'Canon 1000D’nin 1.6x crop sensörü, 70-200mm lensi adeta 112-320mm devasa bir telefotoya dönüştürür! Çok uzaktaki spor müsabakaları ve kuş çekimleri için ekstra menzil sağlar.'
      }
    ],
    cameraSettingsTip: 'Enstantane Kuralı: Titremeyi önlemek için enstantane hızı odak uzaklığından yüksek olmalıdır (200mm zoomda en az 1/250s veya 1/500s kullanın).',
    compatibilityNote: 'L serisi metal gövdesi nedeniyle çanta ile teslim edilir. Canon 5D Mark II gövdeyle CF kart dahildir.'
  },
  {
    id: 'macro',
    title: 'Makro & İnce Detay / Ürün Çekimi',
    icon: '🔍',
    tag: 'Doku, Takı, Çiçek & Yakın Plan',
    shortDesc: 'Gözün göremediği ince dokular, madeni paralar, takılar, çiçek taç yaprakları ve böcekler.',
    beginnerExplanation: 'Sıradan lensler nesneye 40-50 cm\'den fazla yaklaşamaz, yaklaşırlarsa netleyemezler. Canon EF 100mm f/2.8 Macro lens, 1:1 "life-size" büyütme oranına sahiptir; yani 1 cm\'lik bir nesne sensör üzerine tam 1 cm olarak düşer.',
    combos: [
      {
        id: 'c-macro-pro',
        name: '1:1 Gerçek Boyutlu Makro & Ürün Kiti',
        badge: '1:1 Life-Size Büyütme',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        bodyId: 'e-5d2',
        lensId: 'e-ef-100-macro',
        whyThisCombo: '31 cm mesafeden 1:1 büyütme ile madeni paraların yazısını, kumaş dokularını, takı taşlarını veya çiçek damarlarını gerçek boyutunda sensöre odaklar. Ring USM motoru milimetrik manuel odaklamaya izin verir.'
      }
    ],
    cameraSettingsTip: '1:1 makroda netleme alanı milimetriktir. Net alan derinliğini artırmak için diyaframı f/8 veya f/11\'e kadar kısın. Titreşimi önlemek için sabit durun.',
    compatibilityNote: 'Canon 5D Mark II Full Frame gövde ile 32GB CF hafıza kartı kulüp çantasında hazır teslim edilir.'
  },
  {
    id: 'analog_film',
    title: 'Analog 35mm Film Çekimi',
    icon: '🎞️',
    tag: 'Vintage & Karanlık Oda',
    shortDesc: 'Dijital ekran yok, sınır 36 poz; saf fotoğrafçılık disiplini ve kimyasal film dokusu.',
    beginnerExplanation: 'Analog makinelerde görüntü ışığa duyarlı kimyasal filme kaydedilir. Çektiğiniz fotoğrafı anında ekranda göremezsiniz; bu da her kareyi daha dikkatli kadrajlamanızı sağlar. Çektiğiniz filmi kulübümüzün Karanlık Odasında kendiniz banyo edebilirsiniz!',
    combos: [
      {
        id: 'c-analog-slr',
        name: 'Otomatik Netlemeli 35mm SLR Analog Kiti',
        badge: 'Modern EF Lenslerle Çalışır',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        bodyId: 'e-650',
        lensId: 'e-ef-50',
        whyThisCombo: 'Canon EOS 650, kulübümüzün dijital EF lensleriyle tam uyumlu çalışan ilk SLR modeldir! Elektronik diyafram kontrolü, otomatik motorlu film sarımı ve AF desteğiyle analog fotoğrafçılığı zahmetsizce deneyimlemenizi sağlar.'
      },
      {
        id: 'c-analog-pointshoot',
        name: 'Nostaljik Bas-Çek Kompakt Analog Kiti (No: 1-5)',
        badge: 'Cebe Sığan Klasik',
        badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        bodyId: 'e-clearshot-1',
        whyThisCombo: 'Netleme veya ayar düşünmeden, bas-çek mantığıyla 90’lar analog nostaljisini yaşamak ve Davutpaşa Karanlık Odamızda filmini banyo etmek isteyenler için kulüp havuzumuzda 5 adet Clear Shot M makine bulunmaktadır.'
      }
    ],
    cameraSettingsTip: 'Filminizin ISO (ASA) değerini makinenin kadranından doğru ayarlayın (örn: 200 veya 400 ISO). Pozlama sayacını takip edin.',
    compatibilityNote: 'Çekim bittikten sonra filminizi kulübümüzün Karanlık Odasında banyo edebilir ve agrandisörle fotoğraf kartına baskı alabilirsiniz!'
  },
  {
    id: 'beginner',
    title: 'Fotoğrafa Yeni Başlayanlar (Temel Eğitim)',
    icon: '🎓',
    tag: 'Atölyeler & İlk DSLR Deneyimi',
    shortDesc: 'Diyafram, Enstantane ve ISO üçgenini öğrenmek için sade menülü ve hafif gövdeler.',
    beginnerExplanation: 'Ağır profesyonel gövdeler ilk başta kafa karıştırabilir. Canon EOS 1000D sadece 450 gr ağırlığında olup, ergonomik yapısı ve anlaşılır arayüzüyle kulüp temel eğitim atölyeleri ve gezi yürüyüşleri için mükemmel bir başlangıç makinesidir.',
    combos: [
      {
        id: 'c-beginner-canon',
        name: 'Kulüp Temel DSLR Eğitim Kiti (Hafif & Sade)',
        badge: 'En İdeal Başlangıç Seti',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        bodyId: 'e-1000d',
        lensId: 'e-ef-50',
        whyThisCombo: 'Karmaşık tuş kalabalığı olmadan enstantane, diyafram ve ISO üçgenini pratik ederek kavramak için kulübümüzün en popüler başlangıç setidir. 50mm f/1.4 lens diyaframın mantığını hemen gösterir.'
      },
      {
        id: 'c-beginner-nikon',
        name: 'Titreşim Engellemeli Nikon Alternatif Kiti',
        badge: 'VR Destekli & Döner Ekranlı',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        bodyId: 'e-nikon',
        lensId: 'e-nikon-18-55-vr',
        whyThisCombo: 'VR (Titreşim Engelleme) desteği sayesinde el titremelerini absorbe eder, döner ekranı ile acemilikte vizöre eğilmeden rahatça kadraj yapmanızı sağlar.'
      }
    ],
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
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('street_travel');
  const [selectedComboIndex, setSelectedComboIndex] = useState<number>(0);
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
  const safeComboIndex = Math.min(selectedComboIndex, activeScenario.combos.length - 1);
  const activeCombo = activeScenario.combos[safeComboIndex] || activeScenario.combos[0];

  const getEq = (id?: string) => {
    if (!id) return undefined;
    return equipmentList.find((e) => e.id === id);
  };

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setSelectedComboIndex(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-[#160b13] border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        
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
                  Kulüp Demirbaşı Komboları
                </span>
              </div>
              <p className="text-xs text-white/60">Kulübümüzün gövdelerine ve lenslerine özel uyumlu kombolar ve öğretici rehber.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDictionary(!showDictionary)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
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
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
                  Küçük mm (17mm, 10mm) <strong>Geniş Açı</strong> verir, mekanı sığdırır. Büyük mm (85mm, 200mm) <strong>Telefoto</strong> olup uzaktakileri yaklaştırır.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="font-bold text-amber-300 block mb-0.5">Sensör: Full Frame vs Crop</span>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  <strong>Full Frame (5D2, 6D):</strong> Büyük sensör, yüksek ışık başarımı ve derin arka plan fluluğu sunar. <strong>Crop (1000D, Nikon):</strong> Hafiftir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Sidebar + Detail View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Sidebar: Scenario Selector */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#120710]/70 flex flex-col shrink-0">
            {/* Search filter in scenarios */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Çekim türü ara (sokak, portre)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* List of scenarios */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filteredScenarios.map((sc) => {
                const isActive = sc.id === activeScenario.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => handleScenarioChange(sc.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-900/60 to-pink-900/40 border border-purple-500/40 text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="text-xl shrink-0">{sc.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">{sc.title}</div>
                      <div className="text-[10px] text-white/50 truncate mt-0.5">{sc.tag}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Detail Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
            
            {/* Scenario Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <span className="text-lg">{activeScenario.icon}</span>
                <span className="uppercase tracking-wider">{activeScenario.tag}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeScenario.title}
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                {activeScenario.shortDesc}
              </p>
            </div>

            {/* "Nasıl Çalışır / Neden Bu Ekipman?" Educational Explainer */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h4>Fotoğrafçılık Mantığı (Yeni Başlayanlar):</h4>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                {activeScenario.beginnerExplanation}
              </p>
            </div>

            {/* KOMBO SELECTION TABS (If more than 1 combo exists) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Önerilen Ekipman Komboları (Gövde + Lens)
                  </h4>
                </div>
                <span className="text-[11px] text-purple-300/80 font-medium">
                  {activeScenario.combos.length} Farklı Kulüp Kombosu
                </span>
              </div>

              {/* Combo Pills / Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {activeScenario.combos.map((combo, idx) => {
                  const isSelected = idx === safeComboIndex;
                  return (
                    <button
                      key={combo.id}
                      onClick={() => setSelectedComboIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30'
                          : 'bg-white/[0.05] text-white/70 hover:text-white border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>{idx + 1}. Kombo:</span>
                      <span className="font-semibold">{combo.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE COMBO CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#190d17] border border-purple-500/30 space-y-4 shadow-xl shadow-purple-950/40">
                
                {/* Combo Title & Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mb-1 ${activeCombo.badgeColor || 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                      {activeCombo.badge}
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {activeCombo.name}
                    </h5>
                  </div>
                </div>

                {/* VISUAL COMBO PAIRING (Body + Lens (+ Accessory)) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  
                  {/* Body Box */}
                  {(() => {
                    const body = getEq(activeCombo.bodyId);
                    if (!body) return null;
                    return (
                      <div className="md:col-span-5 p-3.5 rounded-xl bg-white/[0.05] border border-white/15 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#6e2a4f] text-white uppercase tracking-wider">
                              1. Önerilen Gövde
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
                          onClick={() => {
                            onClose();
                            onSelectEquipmentToReserve(body.id);
                          }}
                          className="w-full py-2 rounded-lg bg-[#6e2a4f] hover:bg-[#83335e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                        >
                          <span>1. Adım: Bu Gövdeyi Rezerve Et</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })()}

                  {/* Plus Icon / Connector */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow">
                      <Plus className="w-4 h-4 font-bold" />
                    </div>
                    <span className="text-[10px] text-purple-300/70 font-semibold mt-1">Uyumlu Kombo</span>
                  </div>

                  {/* Lens Box */}
                  {(() => {
                    const lens = getEq(activeCombo.lensId);
                    if (!lens) {
                      return (
                        <div className="md:col-span-5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-center p-6 text-xs text-white/50">
                          <span>Bu analog bas-çek makinede lens dahili (Fujinon) olarak gövde üzerindedir. Ek lens gerekmez.</span>
                        </div>
                      );
                    }
                    return (
                      <div className="md:col-span-5 p-3.5 rounded-xl bg-white/[0.05] border border-white/15 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4e3b52] text-white uppercase tracking-wider">
                              2. Önerilen Lens
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
                          onClick={() => {
                            onClose();
                            onSelectEquipmentToReserve(lens.id);
                          }}
                          className="w-full py-2 rounded-lg bg-[#4e3b52] hover:bg-[#634c68] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                        >
                          <span>2. Adım: Bu Lensi Rezerve Et</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })()}

                </div>

                {/* Optional Accessory Card */}
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
                          <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">Komboyu Tamamlayan Kulüp Aksesuarı</span>
                          <strong className="text-xs text-white block truncate">{acc.name}</strong>
                          <span className="text-[11px] text-white/60 block truncate">{acc.description}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectEquipmentToReserve(acc.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 transition-colors cursor-pointer"
                      >
                        Aksesuarı Seç
                      </button>
                    </div>
                  );
                })()}

                {/* Why this combo explainer */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Neden Bu Kombo? (Kulüp Ekipmanı Avantajı):</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {activeCombo.whyThisCombo}
                  </p>
                </div>

              </div>
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
                  <span>Uyumluluk & Hafıza Kartı Hatırlatması:</span>
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
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
