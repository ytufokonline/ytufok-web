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
  Check,
  Wrench
} from 'lucide-react';
import { Equipment } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { TabType } from '../lib/routes';
import { INITIAL_EQUIPMENT } from '../data/initialData';
import { AppleReveal } from '../components/AppleReveal';

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
  altBodyIds?: string[];
  lensId?: string;
  altLensIds?: string[];
  accessoryId?: string;
  whyThisCombo: string;
  alternativeNotes?: {
    equipmentId: string;
    note: string;
  }[];
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
        altBodyIds: ['e-5d2', 'e-1000d'],
        lensId: 'e-ef-24-105',
        altLensIds: ['e-ef-50', 'e-ef-17-40'],
        accessoryId: 'e-tianya-77',
        whyThisCombo: '24-105mm lens hem tarihi yapıları hem uzaktaki detayları çeker. IS sabitleme yürürken titremeyi sıfırlar. Dahili GPS konumları kaydeder.',
        alternativeNotes: [
          { equipmentId: 'e-6d', note: '1. Tercih: Full Frame sensör, dahili Wi-Fi & GPS ve hareketli gezi çekimlerinde yüksek ISO dengesi.' },
          { equipmentId: 'e-5d2', note: 'Alternatif Gövde: 21.1 MP efsanevi Full Frame magnezyum gövde ve 32GB CF kart hazır çantada.' },
          { equipmentId: 'e-1000d', note: 'Alternatif Gövde: Yürüyüşte boynu yormayan 450 gr ultra hafif sokak gövdesi.' },
          { equipmentId: 'e-ef-24-105', note: '1. Tercih: 24mm geniş açıdan 105mm telefotoya tek lensle seyahat esnekliği.' },
          { equipmentId: 'e-ef-50', note: 'Alternatif Lens: Akşam sokak lambaları altında flaşsız çekim için f/1.4 ultra açık diyafram.' },
          { equipmentId: 'e-ef-17-40', note: 'Alternatif Lens: Tarihi dar sokakları ve devasa meydanları kadraja sığdıran ultra geniş açı.' }
        ]
      },
      {
        id: 'c-street-compact',
        name: 'Kompakt Hafif Sokak Kiti',
        badge: 'Hafif & Loş Işık',
        bodyId: 'e-1000d',
        altBodyIds: ['e-6d', 'e-nikon'],
        lensId: 'e-ef-50',
        altLensIds: ['e-ef-24-105', 'e-sigma-10-20'],
        whyThisCombo: 'Yalnızca 450 gr gövde. f/1.4 açık diyaframı sayesinde akşam sokak lambaları altında flaşsız net kareler üretir.',
        alternativeNotes: [
          { equipmentId: 'e-1000d', note: '1. Tercih: 450 gr tüy gibi hafiflik ve fark edilmeden doğal anları yakalama.' },
          { equipmentId: 'e-6d', note: 'Alternatif Gövde: Düşük ışıkta daha temiz ve gren yapmayan Full Frame sensör.' },
          { equipmentId: 'e-nikon', note: 'Alternatif Gövde: Döner hareketli LCD ekranıyla bel hizasından gizli kadraj.' },
          { equipmentId: 'e-ef-50', note: '1. Tercih: f/1.4 diyafram ile loş ışık performansı ve sokak portreleri.' },
          { equipmentId: 'e-ef-24-105', note: 'Alternatif Lens: Odak aralığı değiştirilebilen çok yönlü gezi zoomu.' }
        ]
      },
      {
        id: 'c-street-nikon',
        name: 'Döner Ekranlı Gizli Kadraj Kiti',
        badge: 'Hareketli Ekran',
        bodyId: 'e-nikon',
        altBodyIds: ['e-1000d'],
        lensId: 'e-nikon-18-55-vr',
        altLensIds: ['e-ef-50'],
        whyThisCombo: 'Döner LCD ekranı sayesinde makineyi göz hizasına kaldırmadan, bel hizasından fark ettirmeden doğal anları yakalayın.',
        alternativeNotes: [
          { equipmentId: 'e-nikon', note: '1. Tercih: Döner ekranı sayesinde sokakta dikkat çekmeden bel hizasından çekim.' },
          { equipmentId: 'e-1000d', note: 'Alternatif Gövde: Benzer hafiflikte Canon ekosistemi gövdesi.' },
          { equipmentId: 'e-nikon-18-55-vr', note: '1. Tercih: Dahili VR titreşim engelleme ve esnek sokak kadrajı.' }
        ]
      },
      {
        id: 'c-street-analog',
        name: 'Analog Bas-Çek Sokak Kiti',
        badge: '35mm Film',
        bodyId: 'e-clearshot-1',
        altBodyIds: ['e-clearshot-2', 'e-clearshot-3', 'e-clearshot-4', 'e-clearshot-5', 'e-650'],
        whyThisCombo: 'Ayar derdi olmadan cebe atıp çıkmalık. Dahili flaşıyla 90’lar analog sokak estetiği.',
        alternativeNotes: [
          { equipmentId: 'e-clearshot-1', note: '1. Tercih: Cebe sığan, dahili flaşlı klasik analog bas-çek makine.' },
          { equipmentId: 'e-650', note: 'Alternatif Gövde: Manuel diyafram/enstantane ve EF lens uyumlu 35mm SLR gövdesi.' }
        ]
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
        altBodyIds: ['e-6d', 'e-1000d'],
        lensId: 'e-ef-85',
        altLensIds: ['e-ef-50', 'e-ef-100-macro', 'e-ef-70-200'],
        accessoryId: 'e-tianya-77',
        whyThisCombo: '85mm yüz hatlarını bozmaz, f/1.8 diyafram arka planı eritir. 5D Mark II ile 32GB CF kart çantada hazır teslim edilir.',
        alternativeNotes: [
          { equipmentId: 'e-5d2', note: '1. Tercih: Stüdyo ve dış mekan portresinde amiral gemisi Full Frame magnezyum gövde.' },
          { equipmentId: 'e-6d', note: 'Alternatif Gövde: Loş ışıkta veya stüdyoda dahili Wi-Fi ile telefona anında aktarım.' },
          { equipmentId: 'e-1000d', note: 'Alternatif Gövde: 1.6x çarpanla 85mm lensi 136mm telefoto portre menziline ulaştırır.' },
          { equipmentId: 'e-ef-85', note: '1. Tercih: f/1.8 diyafram ile arka planı eritip modeli kristal netlikte öne çıkarma.' },
          { equipmentId: 'e-ef-50', note: 'Alternatif Lens: Mekanlı veya tam boy portrelerde daha geniş açı ve f/1.4 ışık avantajı.' },
          { equipmentId: 'e-ef-100-macro', note: 'Alternatif Lens: Göz bebeği ve takı detaylarında en yüksek mikroskobik keskinlik.' },
          { equipmentId: 'e-ef-70-200', note: 'Alternatif Lens: Dış mekan çekimlerinde arka planı büyütüp modele yaklaştıran telefoto sıkıştırması.' }
        ]
      },
      {
        id: 'c-portrait-natural',
        name: 'Doğal Açı & Loş Işık Portre Kiti',
        badge: 'f/1.4 Diyafram',
        bodyId: 'e-6d',
        altBodyIds: ['e-5d2', 'e-1000d'],
        lensId: 'e-ef-50',
        altLensIds: ['e-ef-85', 'e-ef-24-105'],
        whyThisCombo: '50mm insan gözü açısına en yakındır. f/1.4 ultra açık diyafram loş kafelerde ve akşam portrelerinde harikadır.',
        alternativeNotes: [
          { equipmentId: 'e-6d', note: '1. Tercih: Akşam portrelerinde kumlanmasız yüksek ISO performansı.' },
          { equipmentId: 'e-5d2', note: 'Alternatif Gövde: Efsanevi portre renkleri ve dayanıklı magnezyum gövde.' },
          { equipmentId: 'e-ef-50', note: '1. Tercih: İnsan gözü açısına en yakın doğal perspektif ve f/1.4 bokeh.' },
          { equipmentId: 'e-ef-85', note: 'Alternatif Lens: Daha sıkı yüz kadrajları ve daha yoğun arka plan fluluğu.' },
          { equipmentId: 'e-ef-24-105', note: 'Alternatif Lens: Tek lensle hem boy hem yüz portresi kadrajı.' }
        ]
      },
      {
        id: 'c-portrait-macro',
        name: 'Ultra Keskin Detay Portre Kiti',
        badge: 'Jilet Keskinlik',
        bodyId: 'e-5d2',
        altBodyIds: ['e-6d', 'e-1000d'],
        lensId: 'e-ef-100-macro',
        altLensIds: ['e-ef-85', 'e-ef-70-200'],
        whyThisCombo: 'Göz bebeği ve saç teli detaylarını en yüksek keskinlikte yakalamak isteyenler için 100mm f/2.8 lens.',
        alternativeNotes: [
          { equipmentId: 'e-5d2', note: '1. Tercih: 21.1 MP çözünürlükle en ince saç teli ve doku ayrıntısı.' },
          { equipmentId: 'e-ef-100-macro', note: '1. Tercih: 1:1 büyütme ile makro keskinlikte yaratıcı detay portreleri.' },
          { equipmentId: 'e-ef-85', note: 'Alternatif Lens: Klasik portre perspektifi ve daha yumuşak geçişler.' },
          { equipmentId: 'e-ef-70-200', note: 'Alternatif Lens: Uzaktan doğal model ifadelerini yakalayan telefoto.' }
        ]
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
        altBodyIds: ['e-5d2', 'e-1000d'],
        lensId: 'e-ef-17-40',
        altLensIds: ['e-ef-24-105'],
        accessoryId: 'e-tianya-77',
        whyThisCombo: '17mm odak uzaklığı Full Frame sensörde 104° görüş açısı sunar. Duvara yaslanmadan tüm salonu ve binayı sığdırır.',
        alternativeNotes: [
          { equipmentId: 'e-6d', note: '1. Tercih: 17mm odak uzaklığında gerçek 104° görüş açısı sunan Full Frame sensör.' },
          { equipmentId: 'e-5d2', note: 'Alternatif Gövde: Yüksek dinamik aralıklı 21.1 MP Full Frame alternatif.' },
          { equipmentId: 'e-ef-17-40', note: '1. Tercih: Duvara yaslanmadan tüm tarihi yapıyı ve iç mekanı sığdırır.' },
          { equipmentId: 'e-ef-24-105', note: 'Alternatif Lens: 24mm başlangıç açısıyla hem geniş hem detay çekimi.' }
        ]
      },
      {
        id: 'c-arch-crop',
        name: 'Crop Sensör Geniş Açı Kiti',
        badge: 'f/3.5 Sabit Diyafram',
        bodyId: 'e-1000d',
        altBodyIds: ['e-nikon'],
        lensId: 'e-sigma-10-20',
        altLensIds: ['e-ef-17-40'],
        whyThisCombo: '1000D gövdede çarpan etkisini kırarak 10mm gerçek geniş açı sağlar. Sabit f/3.5 iç mekanlar için idealdir.',
        alternativeNotes: [
          { equipmentId: 'e-1000d', note: '1. Tercih: Hafif gövde ve Sigma 10-20mm ile gerçek 10mm ultra geniş açı.' },
          { equipmentId: 'e-sigma-10-20', note: '1. Tercih: f/3.5 sabit diyafram ve geniş açılı iç mekan perspektifi.' }
        ]
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
        altBodyIds: ['e-5d2'],
        lensId: 'e-ef-50',
        altLensIds: ['e-ef-85', 'e-ef-24-105'],
        whyThisCombo: 'Canon 6D yüksek ISO’da kumlanma yapmaz. 50mm f/1.4 lense maksimum ışık alarak karanlıkta perde hızını korur.',
        alternativeNotes: [
          { equipmentId: 'e-6d', note: '1. Tercih: 6400+ ISO değerlerinde bile kumlanmasız karanlık sahne performansı.' },
          { equipmentId: 'e-5d2', note: 'Alternatif Gövde: CF kartlı ve sağlam Full Frame alternatif.' },
          { equipmentId: 'e-ef-50', note: '1. Tercih: f/1.4 ultra açık diyafram loş sahnede enstantaneyi kurtarır.' },
          { equipmentId: 'e-ef-85', note: 'Alternatif Lens: Sahneye daha yakın çekimler için f/1.8 telefoto avantajı.' },
          { equipmentId: 'e-ef-24-105', note: 'Alternatif Lens: Işık yeterli olduğunda IS optik sabitlemeli zoom.' }
        ]
      },
      {
        id: 'c-night-flash',
        name: 'Etkinlik & Parti Tepe Flaşlı Kiti',
        badge: 'Sektirme Flaş',
        bodyId: 'e-6d',
        altBodyIds: ['e-5d2', 'e-1000d'],
        lensId: 'e-ef-24-105',
        altLensIds: ['e-ef-50', 'e-ef-17-40'],
        accessoryId: 'e-speedlite',
        whyThisCombo: 'Speedlite 580EX II flaşı tavana sektirerek stüdyo kalitesinde yumuşak ışık elde edin. Şarjlı piller dahildir.',
        alternativeNotes: [
          { equipmentId: 'e-ef-24-105', note: '1. Tercih: Flaşla birleştiğinde partilerde hem kalabalık hem tekil anları yakalar.' },
          { equipmentId: 'e-ef-17-40', note: 'Alternatif Lens: Dar iç mekan partilerinde tüm dans pistini kadraja alır.' },
          { equipmentId: 'e-ef-50', note: 'Alternatif Lens: Flaşsız ortam ışığı portreleri için açık diyafram.' }
        ]
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
        altBodyIds: ['e-6d', 'e-1000d'],
        lensId: 'e-ef-70-200',
        altLensIds: ['e-ef-100-macro', 'e-ef-85'],
        whyThisCombo: 'Florit optik camlı beyaz lens. 200mm’de bile kristal netlik sunar, arka planı büyüterek derinlik katar.',
        alternativeNotes: [
          { equipmentId: 'e-5d2', note: '1. Tercih: Sahne ve spor için amiral gemisi Full Frame gövde.' },
          { equipmentId: 'e-6d', note: 'Alternatif Gövde: Karanlık sahnelerde üstün ISO temizliği.' },
          { equipmentId: 'e-1000d', note: 'Alternatif Gövde: 1.6x çarpan sayesinde 70-200mm lensi 320mm devasa menzile ulaştırır.' },
          { equipmentId: 'e-ef-70-200', note: '1. Tercih: Beyaz L serisi florit optiklerle uzaktaki solisti kristal netlikte yakalama.' },
          { equipmentId: 'e-ef-100-macro', note: 'Alternatif Lens: f/2.8 diyaframla daha loş sahnelerde ışık avantajı.' },
          { equipmentId: 'e-ef-85', note: 'Alternatif Lens: Sahneye yakınsanız f/1.8 açık diyafram avantajı.' }
        ]
      },
      {
        id: 'c-tele-superzoom',
        name: 'Süper Menzil Kiti (Crop 1.6x)',
        badge: '320mm Eşdeğer',
        bodyId: 'e-1000d',
        altBodyIds: ['e-5d2', 'e-6d'],
        lensId: 'e-ef-70-200',
        altLensIds: ['e-ef-100-macro'],
        whyThisCombo: '1000D crop sensörü lensi 112-320mm devasa bir menzile ulaştırır. Çok uzaktaki sahneler ve spor için idealdir.',
        alternativeNotes: [
          { equipmentId: 'e-1000d', note: '1. Tercih: 1.6x çarpanla 320mm eşdeğer süper telefoto menzili.' },
          { equipmentId: 'e-ef-70-200', note: '1. Tercih: 70-200mm L optik cam keskinliği.' }
        ]
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
        altBodyIds: ['e-6d', 'e-1000d'],
        lensId: 'e-ef-100-macro',
        altLensIds: ['e-ef-85', 'e-ef-50'],
        whyThisCombo: '31 cm mesafeden madeni para yazıları, takı taşları veya çiçek damarlarını gerçek boyutunda odaklar.',
        alternativeNotes: [
          { equipmentId: 'e-5d2', note: '1. Tercih: 21.1 MP Full Frame yüksek dinamik aralık ve CF kart dahil.' },
          { equipmentId: 'e-1000d', note: 'Alternatif Gövde: Crop sensör nesneyi kadrajda %60 daha büyük hissettirir.' },
          { equipmentId: 'e-ef-100-macro', note: '1. Tercih: 1:1 gerçek boyutlu Life-Size makro büyütme ve dahili odak sınırlayıcı.' },
          { equipmentId: 'e-ef-85', note: 'Alternatif Lens: Yakın plan ürün ve obje çekimlerinde yumuşak arka plan.' },
          { equipmentId: 'e-ef-50', note: 'Alternatif Lens: Genel masaüstü obje ve detay fotoğrafları.' }
        ]
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
        altBodyIds: ['e-clearshot-1', 'e-clearshot-2', 'e-clearshot-3', 'e-clearshot-4', 'e-clearshot-5'],
        lensId: 'e-ef-50',
        altLensIds: ['e-ef-85', 'e-ef-24-105'],
        whyThisCombo: 'Canon EOS 650, kulübümüzün dijital EF lensleriyle otomatik netleme ve diyafram uyumuyla çalışır.',
        alternativeNotes: [
          { equipmentId: 'e-650', note: '1. Tercih: Kulübün modern EF lensleriyle çalışan otomatik netlemeli analog SLR.' },
          { equipmentId: 'e-clearshot-1', note: 'Alternatif Gövde: Ayar yapmadan cebe atıp bas-çek film estetiği.' },
          { equipmentId: 'e-ef-50', note: '1. Tercih: Analog filmde klasik 50mm insan gözü açısı ve f/1.4 derinlik.' },
          { equipmentId: 'e-ef-85', note: 'Alternatif Lens: Filmli portre çekimlerinde nostaljik bokeh.' }
        ]
      },
      {
        id: 'c-analog-pointshoot',
        name: 'Kompakt Bas-Çek Analog Kiti (No: 1-5)',
        badge: 'Cebe Sığan Klasik',
        bodyId: 'e-clearshot-1',
        altBodyIds: ['e-clearshot-2', 'e-clearshot-3', 'e-clearshot-4', 'e-clearshot-5', 'e-650'],
        whyThisCombo: 'Dahili flaşı ve otomatik sarımıyla bas-çek analog keyfi. Kulüp havuzumuzda 5 adet Clear Shot M mevcuttur.',
        alternativeNotes: [
          { equipmentId: 'e-clearshot-1', note: '1. Tercih: 5 adet eş Clear Shot M havuzundan bas-çek analog makine.' },
          { equipmentId: 'e-650', note: 'Alternatif Gövde: SLR kontrolü ve lens değiştirme esnekliği.' }
        ]
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
        altBodyIds: ['e-6d', 'e-nikon'],
        lensId: 'e-ef-50',
        altLensIds: ['e-ef-24-105', 'e-ef-85'],
        whyThisCombo: '450 gr hafif gövde, sade Türkçe menü ve f/1.4 lens ile diyaframın mantığını 1 günde kavrarsınız.',
        alternativeNotes: [
          { equipmentId: 'e-1000d', note: '1. Tercih: Temel fotoğraf eğitimleri için sade Türkçe menü ve 450 gr hafif gövde.' },
          { equipmentId: 'e-6d', note: 'Alternatif Gövde: Full Frame mantığını öğrenmek isteyen hevesli öğrenciler için.' },
          { equipmentId: 'e-nikon', note: 'Alternatif Gövde: Döner ekranlı Nikon alternatif gövdesi.' },
          { equipmentId: 'e-ef-50', note: '1. Tercih: Diyaframın arka planı nasıl erittiğini 1 günde öğreten f/1.4 lens.' },
          { equipmentId: 'e-ef-24-105', note: 'Alternatif Lens: Farklı odak uzaklıklarının perspektife etkisini öğrenmek için zoom lens.' }
        ]
      },
      {
        id: 'c-beginner-nikon',
        name: 'Titreşim Engellemeli Nikon Kiti',
        badge: 'VR Destekli',
        bodyId: 'e-nikon',
        altBodyIds: ['e-1000d'],
        lensId: 'e-nikon-18-55-vr',
        altLensIds: ['e-ef-50'],
        whyThisCombo: 'VR titreşim engelleme desteği ve döner ekranı acemilikte el titremesi bulanıklığını önler.',
        alternativeNotes: [
          { equipmentId: 'e-nikon', note: '1. Tercih: VR titreşim engelleme ve hareketli ekran ile acemiliği kolaylaştıran gövde.' },
          { equipmentId: 'e-1000d', note: 'Alternatif Gövde: Canon eğitim gövdesi.' },
          { equipmentId: 'e-nikon-18-55-vr', note: '1. Tercih: Titreşim önleme özellikli esnek eğitim lensi.' }
        ]
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

  // Bakımda veya arızalı olan ekipmanları tespit et
  const isEquipmentInMaintenance = (eq?: Equipment | null): boolean => {
    if (!eq) return false;
    if (eq.status === 'maintenance') return true;
    if (eq.current_condition) {
      const cond = eq.current_condition.toLowerCase();
      if (cond.includes('bakım') || cond.includes('arız') || cond.includes('servis') || cond.includes('tamir')) {
        return true;
      }
    }
    return false;
  };

  // Clear Shot analog makinelerden 5 adet mevcuttur. Biri bakımdaysa diğer sağlam olana yönlendir.
  const resolveBodyId = (bodyId: string): string => {
    if (bodyId.startsWith('e-clearshot-')) {
      const current = getEq(bodyId);
      if (isEquipmentInMaintenance(current)) {
        const clearShotKeys = ['e-clearshot-1', 'e-clearshot-2', 'e-clearshot-3', 'e-clearshot-4', 'e-clearshot-5'];
        const workingKey = clearShotKeys.find((k) => !isEquipmentInMaintenance(getEq(k)));
        if (workingKey) return workingKey;
      }
    }
    return bodyId;
  };

  const [selectedBodyOverride, setSelectedBodyOverride] = useState<string | null>(null);
  const [selectedLensOverride, setSelectedLensOverride] = useState<string | null>(null);

  const getAvailableBodiesForCombo = (combo: EquipmentCombo): string[] => {
    const all = [combo.bodyId, ...(combo.altBodyIds || [])].map(resolveBodyId);
    const unique = Array.from(new Set(all));
    return unique.filter((id) => {
      const eq = getEq(id);
      return eq && !isEquipmentInMaintenance(eq);
    });
  };

  const getAvailableLensesForCombo = (combo: EquipmentCombo): string[] => {
    if (!combo.lensId) return [];
    const all = [combo.lensId, ...(combo.altLensIds || [])];
    const unique = Array.from(new Set(all));
    return unique.filter((id) => {
      const eq = getEq(id);
      return eq && !isEquipmentInMaintenance(eq);
    });
  };

  // Bir kombo önerilebilir mi? (Gövde veya lens için en az bir sağlam seçenek varsa)
  const isComboAvailable = (combo: EquipmentCombo): boolean => {
    const bodies = getAvailableBodiesForCombo(combo);
    if (bodies.length === 0) return false;

    if (combo.lensId) {
      const lenses = getAvailableLensesForCombo(combo);
      if (lenses.length === 0) return false;
    }

    // Flaş kiti gibi temeli aksesuara dayalı kombolarda aksesuar arızalıysa önerme
    if (combo.id === 'c-night-flash' && combo.accessoryId) {
      const acc = getEq(combo.accessoryId);
      if (!acc || isEquipmentInMaintenance(acc)) {
        return false;
      }
    }

    return true;
  };

  // Senaryoya ait sadece bakımda/arızalı OLMAYAN komboları getir
  const getAvailableCombosForScenario = (sc: GuideScenario): EquipmentCombo[] => {
    return sc.combos
      .filter(isComboAvailable)
      .map((combo) => ({
        ...combo,
        bodyId: resolveBodyId(combo.bodyId)
      }));
  };

  const activeScenario = GUIDE_SCENARIOS.find((sc) => sc.id === selectedScenarioId) || GUIDE_SCENARIOS[0];
  const availableCombos = React.useMemo(() => {
    return getAvailableCombosForScenario(activeScenario);
  }, [activeScenario, equipmentList]);

  const safeComboIndex = Math.min(selectedComboIndex, Math.max(0, availableCombos.length - 1));
  const activeCombo = availableCombos.length > 0 ? availableCombos[safeComboIndex] : null;

  const currentAvailableBodies = React.useMemo(() => {
    return activeCombo ? getAvailableBodiesForCombo(activeCombo) : [];
  }, [activeCombo, equipmentList]);

  const currentAvailableLenses = React.useMemo(() => {
    return activeCombo ? getAvailableLensesForCombo(activeCombo) : [];
  }, [activeCombo, equipmentList]);

  const activeBodyId = React.useMemo(() => {
    if (!activeCombo || currentAvailableBodies.length === 0) return '';
    if (selectedBodyOverride && currentAvailableBodies.includes(selectedBodyOverride)) {
      return selectedBodyOverride;
    }
    return currentAvailableBodies[0];
  }, [activeCombo, currentAvailableBodies, selectedBodyOverride]);

  const activeLensId = React.useMemo(() => {
    if (!activeCombo || !activeCombo.lensId || currentAvailableLenses.length === 0) return undefined;
    if (selectedLensOverride && currentAvailableLenses.includes(selectedLensOverride)) {
      return selectedLensOverride;
    }
    return currentAvailableLenses[0];
  }, [activeCombo, currentAvailableLenses, selectedLensOverride]);

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setSelectedComboIndex(0);
    setSelectedBodyOverride(null);
    setSelectedLensOverride(null);
  };

  const handleComboChange = (idx: number) => {
    setSelectedComboIndex(idx);
    setSelectedBodyOverride(null);
    setSelectedLensOverride(null);
  };

  const handleReserve = (equipmentId: string) => {
    onSelectEquipmentToReserve(equipmentId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-14 text-[#ded0d9]">
      
      {/* Page Header */}
      <AppleReveal delay={0}>
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/40">
                YTÜFOK Eğitim & Rehber
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-club">
                Çekim & Ekipman Rehberi
              </h1>
              <p className="text-base sm:text-lg text-white/60 font-light leading-relaxed max-w-2xl">
                Hangi çekim türü için hangi gövde ve lensi almalısınız? Kulübümüzün demirbaş envanterine göre optimize edilmiş hazır kombolar.
              </p>
            </div>

            <button
              onClick={() => setShowDictionary(!showDictionary)}
              className={`self-start md:self-auto px-4 py-2.5 rounded-xl text-xs font-mono border flex items-center gap-2 transition-all cursor-pointer ${
                showDictionary 
                  ? 'bg-white text-black border-white shadow-md font-medium' 
                  : 'border-white/10 text-white/70 hover:text-white hover:border-white/30 bg-white/[0.02]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showDictionary ? 'Terimleri Kapat' : 'Temel Terimler (f / mm)'}</span>
            </button>
          </div>

          {/* Hairline Spec Strip */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-white/[0.08] text-xs font-mono text-white/50">
            <div>
              <span className="text-white/30 uppercase mr-2 tracking-wider">Senaryo Sayısı:</span>
              <span className="text-white font-semibold">{GUIDE_SCENARIOS.length} Çekim Türü</span>
            </div>
            <div>
              <span className="text-white/30 uppercase mr-2 tracking-wider">Demirbaş:</span>
              <span className="text-white">Tam Uyumlu Gövde & Lensler</span>
            </div>
            <div>
              <span className="text-white/30 uppercase mr-2 tracking-wider">Öneri:</span>
              <span className="text-white">1 Gövde + 1 Lens Rezerve Edin</span>
            </div>
          </div>
        </header>
      </AppleReveal>

      {/* Quick Photography Terms (Collapsible) */}
      {showDictionary && (
        <div className="p-6 rounded-2xl border border-white/10 bg-black/25 space-y-4 animate-in fade-in duration-150 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/70">
            <Sparkles className="w-3.5 h-3.5 text-white/80" />
            <span>Temel Fotoğrafçılık İlkeleri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-black/35 space-y-1.5">
              <span className="font-semibold text-white text-xs block">1. Diyafram (f/ Değeri)</span>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Küçük sayı (f/1.4, f/1.8) = Yüksek ışık alımı ve flur arka plan (bokeh). Portre ve düşük ışıkta küçük f tercih edilir.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-black/35 space-y-1.5">
              <span className="font-semibold text-white text-xs block">2. Odak Uzaklığı (mm)</span>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Küçük mm (17mm, 10mm) = Geniş Açı (bina, mimari, manzara). Büyük mm (85mm, 200mm) = Telefoto (uzak detay, portre).
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-black/35 space-y-1.5">
              <span className="font-semibold text-white text-xs block">3. Sensör: Full Frame vs Crop</span>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                Full Frame (5D2, 6D) = Yüksek dinamik aralık ve derinlik. Crop (1000D, Nikon) = Hafif, pratik ve telefotoda 1.6x ekstra menzil.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Horizontal Tabs Bar */}
      <AppleReveal delay={120}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/[0.08]">
          {GUIDE_SCENARIOS.map((sc) => {
            const isActive = sc.id === activeScenario.id;
            const availableCount = getAvailableCombosForScenario(sc).length;
            const isAllUnderMaintenance = availableCount === 0;

            return (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all border flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black border-white shadow-md font-semibold'
                    : isAllUnderMaintenance
                    ? 'border-white/5 text-white/35 hover:text-white/60 bg-black/20'
                    : 'border-white/10 text-white/60 hover:text-white hover:border-white/25 bg-black/30'
                }`}
              >
                <span>{sc.title}</span>
                {isAllUnderMaintenance && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-400/20 text-amber-300/80 bg-amber-500/10 font-normal">
                    Bakımda
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </AppleReveal>

      {/* Scenario Content Container */}
      <AppleReveal delay={180}>
        <div className="space-y-6">
        
        {/* Scenario Header Info */}
        <div className="p-6 rounded-2xl border border-white/10 bg-black/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
              {activeScenario.tag}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-club">
              {activeScenario.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-light max-w-2xl leading-relaxed">
              {activeScenario.shortDesc}
            </p>
          </div>

          <div className="shrink-0">
            <span className={`text-xs font-mono border px-3 py-1.5 rounded-full ${
              availableCombos.length === 0
                ? 'border-amber-400/25 bg-amber-500/10 text-amber-300'
                : 'text-white/40 border border-white/10'
            }`}>
              {availableCombos.length === 0 ? 'Ekipmanlar Bakımda' : `${availableCombos.length} Önerilen Kombo`}
            </span>
          </div>
        </div>

        {availableCombos.length === 0 || !activeCombo ? (
          <div className="p-8 sm:p-12 rounded-3xl border border-white/10 bg-black/25 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 mx-auto flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white font-club">
                Bu Çekim Türüne Ait Ekipmanlar Bakımda
              </h3>
              <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
                Bu kategori için önerilen gövde veya lensler şu an bakım/servis sürecinde olduğu için önerilmemektedir. Ekipmanlar kulüp havuzuna döndüğünde otomatik olarak tekrar önerilecektir.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('equipment')}
                className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-mono font-semibold hover:bg-white/90 transition-all cursor-pointer shadow-sm"
              >
                Tüm Ekipman Durumlarını Gör
              </button>
              <button
                onClick={() => {
                  const firstWithCombos = GUIDE_SCENARIOS.find((sc) => getAvailableCombosForScenario(sc).length > 0);
                  if (firstWithCombos) handleScenarioChange(firstWithCombos.id);
                }}
                className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-white/80 hover:text-white text-xs font-mono transition-all cursor-pointer bg-white/5"
              >
                Diğer Çekim Türlerine Göz At
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Combo Switcher Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {availableCombos.map((combo, idx) => {
                const isSelected = idx === safeComboIndex;
                return (
                  <button
                    key={combo.id}
                    onClick={() => handleComboChange(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white text-black border-white font-semibold shadow-sm'
                        : 'border-white/10 text-white/50 hover:text-white hover:border-white/25 bg-black/30'
                    }`}
                  >
                    <span className={isSelected ? 'text-black/60 font-bold' : 'text-white/40 font-bold'}>{idx + 1}.</span>
                    <span>{combo.name}</span>
                  </button>
                );
              })}
            </div>

            {/* SELECTED COMBO MAIN CARD */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-black/25 space-y-6 shadow-sm">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border border-white/15 bg-white/5 text-white/80 mb-1.5">
                {activeCombo.badge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeCombo.name}
              </h3>
            </div>
            {(currentAvailableBodies.length > 1 || currentAvailableLenses.length > 1) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 text-xs font-mono font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Alternatif Ekipmanlar Mevcut</span>
              </span>
            )}
          </div>

          {/* Body + Lens Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Body Box */}
            {(() => {
              const body = getEq(activeBodyId);
              if (!body) return null;
              const isPrimary = activeBodyId === resolveBodyId(activeCombo.bodyId);
              return (
                <div className="md:col-span-5 p-5 rounded-2xl border border-white/10 bg-black/35 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border border-white/15 text-white/70">
                          {isPrimary ? '1. Tercih Gövde' : 'Alternatif Gövde'}
                        </span>
                        {currentAvailableBodies.length > 1 && (
                          <span className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            {currentAvailableBodies.length} Seçenek
                          </span>
                        )}
                      </div>
                      <StatusBadge status={body.status} size="sm" />
                    </div>

                    {/* Body Alternative Switcher Pills */}
                    {currentAvailableBodies.length > 1 && (
                      <div className="space-y-1 mb-3 pt-0.5">
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                          Gövdeyi Değiştir:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {currentAvailableBodies.map((bId) => {
                            const bEq = getEq(bId);
                            if (!bEq) return null;
                            const isSelected = bId === activeBodyId;
                            const isP = bId === resolveBodyId(activeCombo.bodyId);
                            return (
                              <button
                                key={bId}
                                type="button"
                                onClick={() => setSelectedBodyOverride(bId)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border flex items-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-black border-white font-semibold shadow-sm'
                                    : 'border-white/10 text-white/60 hover:text-white hover:border-white/25 bg-black/40'
                                }`}
                              >
                                {isP && <span className={isSelected ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold'}>★</span>}
                                <span>{bEq.name.replace(' Gövde', '').replace(' DSLR', '').replace(' 35mm SLR', '')}</span>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    bEq.status === 'available' ? 'bg-emerald-400' : 'bg-amber-400/80'
                                  }`}
                                  title={bEq.status === 'available' ? 'Müsait' : 'Kullanımda/Rezerve'}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {body.image_url ? (
                          <img src={body.image_url} alt={body.name} className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-sm font-semibold text-white block truncate" title={body.name}>
                            {body.name}
                          </strong>
                        </div>
                        <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                          Demirbaş: {body.serial_number} {isPrimary ? '• (Önerilen 1. Tercih)' : '• (Uyumlu Alternatif)'}
                        </span>
                        <span className="text-xs text-white/60 font-light block mt-1 line-clamp-2 leading-relaxed">
                          {body.description}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReserve(body.id)}
                    disabled={body.status !== 'available'}
                    className={`w-full py-2.5 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      body.status === 'available'
                        ? 'bg-white text-black hover:bg-white/90 cursor-pointer'
                        : 'border border-white/10 text-white/30 bg-white/5 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {body.status === 'available'
                        ? `1. Adım: ${body.name.replace(' Gövde', '').replace(' DSLR', '')} Rezerve Et`
                        : body.status === 'reserved'
                        ? 'Gövde Rezerve Edildi'
                        : 'Gövde Kullanımda'}
                    </span>
                    {body.status === 'available' && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })()}

            {/* Plus Connector */}
            <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white/80">
                <Plus className="w-4 h-4 font-bold" />
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-1.5">Uyumlu Set</span>
            </div>

            {/* Lens Box */}
            {activeCombo.lensId ? (
              (() => {
                const lens = activeLensId ? getEq(activeLensId) : undefined;
                if (!lens) return null;
                const isPrimary = activeLensId === activeCombo.lensId;
                return (
                  <div className="md:col-span-5 p-5 rounded-2xl border border-white/10 bg-black/35 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border border-white/15 text-white/70">
                            {isPrimary ? '1. Tercih Lens' : 'Alternatif Lens'}
                          </span>
                          {currentAvailableLenses.length > 1 && (
                            <span className="text-[10px] font-mono text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              {currentAvailableLenses.length} Seçenek
                            </span>
                          )}
                        </div>
                        <StatusBadge status={lens.status} size="sm" />
                      </div>

                      {/* Lens Alternative Switcher Pills */}
                      {currentAvailableLenses.length > 1 && (
                        <div className="space-y-1 mb-3 pt-0.5">
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            Lensi Değiştir:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {currentAvailableLenses.map((lId) => {
                              const lEq = getEq(lId);
                              if (!lEq) return null;
                              const isSelected = lId === activeLensId;
                              const isP = lId === activeCombo.lensId;
                              return (
                                <button
                                  key={lId}
                                  type="button"
                                  onClick={() => setSelectedLensOverride(lId)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border flex items-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-white text-black border-white font-semibold shadow-sm'
                                      : 'border-white/10 text-white/60 hover:text-white hover:border-white/25 bg-black/40'
                                  }`}
                                >
                                  {isP && <span className={isSelected ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold'}>★</span>}
                                  <span>{lEq.name.replace('Canon EF ', '').replace(' Lens', '')}</span>
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      lEq.status === 'available' ? 'bg-emerald-400' : 'bg-amber-400/80'
                                    }`}
                                    title={lEq.status === 'available' ? 'Müsait' : 'Kullanımda/Rezerve'}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                          {lens.image_url ? (
                            <img src={lens.image_url} alt={lens.name} className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-white/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-sm font-semibold text-white block truncate" title={lens.name}>
                              {lens.name}
                            </strong>
                          </div>
                          <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                            Demirbaş: {lens.serial_number} {isPrimary ? '• (Önerilen 1. Tercih)' : '• (Uyumlu Alternatif)'}
                          </span>
                          <span className="text-xs text-white/60 font-light block mt-1 line-clamp-2 leading-relaxed">
                            {lens.description}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReserve(lens.id)}
                      disabled={lens.status !== 'available'}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        lens.status === 'available'
                          ? 'bg-white text-black hover:bg-white/90 cursor-pointer'
                          : 'border border-white/10 text-white/30 bg-white/5 cursor-not-allowed'
                      }`}
                    >
                      <span>
                        {lens.status === 'available'
                          ? `2. Adım: ${lens.name.replace('Canon EF ', '').replace(' Lens', '')} Rezerve Et`
                          : lens.status === 'reserved'
                          ? 'Lens Rezerve Edildi'
                          : 'Lens Kullanımda'}
                      </span>
                      {lens.status === 'available' && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="md:col-span-5 p-6 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-center text-xs text-white/50 font-light">
                <span>Bu analog makinede sabit Fujinon lens gövde üzerindedir. Ek lens takılmaz.</span>
              </div>
            )}

          </div>

          {/* Alternatives Detail Card */}
          {(currentAvailableBodies.length > 1 || currentAvailableLenses.length > 1) && (
            <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-black/35 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Uyumlu Alternatif Ekipman Seçenekleri</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">
                  {currentAvailableBodies.length} Gövde • {currentAvailableLenses.length || 1} Lens Seçeneği
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Body Alternatives Explanations */}
                {currentAvailableBodies.length > 1 && (
                  <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block font-semibold">
                      Gövde Alternatifleri & Özellikleri
                    </span>
                    <div className="space-y-1.5">
                      {currentAvailableBodies.map((bId) => {
                        const bEq = getEq(bId);
                        if (!bEq) return null;
                        const isSelected = bId === activeBodyId;
                        const altNote = activeCombo.alternativeNotes?.find(n => n.equipmentId === bId)?.note;
                        return (
                          <div 
                            key={bId}
                            onClick={() => setSelectedBodyOverride(bId)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              isSelected 
                                ? 'border-amber-400/40 bg-amber-500/10 text-white shadow-sm' 
                                : 'border-white/5 hover:border-white/20 bg-black/25 text-white/70'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white text-xs">{bEq.name}</span>
                                {bId === resolveBodyId(activeCombo.bodyId) && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/90">1. Tercih</span>
                                )}
                              </div>
                              <p className="text-[11px] text-white/60 font-light mt-0.5 leading-relaxed">
                                {altNote || bEq.description}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <StatusBadge status={bEq.status} size="sm" />
                              <span className="text-[10px] font-mono text-amber-300/80 underline mt-1">
                                {isSelected ? 'Seçildi' : 'Gövdeyi Seç'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lens Alternatives Explanations */}
                {currentAvailableLenses.length > 1 && (
                  <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block font-semibold">
                      Lens Alternatifleri & Özellikleri
                    </span>
                    <div className="space-y-1.5">
                      {currentAvailableLenses.map((lId) => {
                        const lEq = getEq(lId);
                        if (!lEq) return null;
                        const isSelected = lId === activeLensId;
                        const altNote = activeCombo.alternativeNotes?.find(n => n.equipmentId === lId)?.note;
                        return (
                          <div 
                            key={lId}
                            onClick={() => setSelectedLensOverride(lId)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                              isSelected 
                                ? 'border-amber-400/40 bg-amber-500/10 text-white shadow-sm' 
                                : 'border-white/5 hover:border-white/20 bg-black/25 text-white/70'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white text-xs">{lEq.name}</span>
                                {lId === activeCombo.lensId && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/90">1. Tercih</span>
                                )}
                              </div>
                              <p className="text-[11px] text-white/60 font-light mt-0.5 leading-relaxed">
                                {altNote || lEq.description}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <StatusBadge status={lEq.status} size="sm" />
                              <span className="text-[10px] font-mono text-amber-300/80 underline mt-1">
                                {isSelected ? 'Seçildi' : 'Lensi Seç'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optional Accessory Box */}
          {activeCombo.accessoryId && (() => {
            const acc = getEq(activeCombo.accessoryId);
            if (!acc || isEquipmentInMaintenance(acc)) return null;
            return (
              <div className="p-4 rounded-xl border border-white/10 bg-black/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {acc.image_url ? (
                      <img src={acc.image_url} alt={acc.name} className="w-full h-full object-cover" />
                    ) : (
                      <Zap className="w-4 h-4 text-white/60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Tamamlayıcı Kulüp Aksesuarı</span>
                    <strong className="text-xs text-white block truncate">{acc.name}</strong>
                    <span className="text-[11px] text-white/50 font-light block truncate">{acc.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleReserve(acc.id)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/30 text-white text-xs font-mono transition-colors shrink-0 cursor-pointer"
                >
                  Aksesuarı Seç
                </button>
              </div>
            );
          })()}

          {/* Short "Neden Bu Kombo?" info */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/30 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-semibold text-white">Neden Bu Kombo?: </span>
              <span className="text-white/70 font-light leading-relaxed">{activeCombo.whyThisCombo}</span>
            </div>
          </div>

          {/* Settings & Memory Card Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl border border-white/10 bg-black/30 flex items-start gap-2.5 text-xs">
              <Sliders className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-white/40 text-[10px] uppercase tracking-wider block">Önerilen Kamera Ayarı</span>
                <span className="text-white/80 text-xs font-light mt-0.5 block">{activeScenario.settingsTip}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-black/30 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-white/40 text-[10px] uppercase tracking-wider block">Hafıza Kartı & Not</span>
                <span className="text-white/80 text-xs font-light mt-0.5 block">{activeScenario.cardNote}</span>
              </div>
            </div>
          </div>

        </div>
          </>
        )}
      </div>
      </AppleReveal>

    </div>
  );
};
