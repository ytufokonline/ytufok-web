import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  Bot, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Camera,
  Film,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Equipment } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from './StatusBadge';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  recommendedEquipmentIds?: string[];
  followUpChips?: string[];
  timestamp: Date;
}

interface EquipmentAiAdvisorProps {
  onSelectEquipmentToReserve: (equipmentId: string) => void;
}

// Pre-defined scenarios for instant recommendations
interface Scenario {
  id: string;
  label: string;
  icon: string;
  description: string;
  query: string;
}

const QUICK_SCENARIOS: Scenario[] = [
  {
    id: 'portrait',
    label: 'Portre & Bokeh (Flu Arka Plan)',
    icon: '📸',
    description: 'Keskin yüz hatları ve kremsi arka plan bulanıklığı',
    query: 'Portre çekimi için flu arka planlı en iyi kombinasyon nedir?'
  },
  {
    id: 'architecture',
    label: 'Mimarlık & Geniş Açı',
    icon: '🏛️',
    description: 'İç mekan, yapılar ve kentsel manzara çekimleri',
    query: 'Mimari ve geniş açı çekimleri için hangi ekipmanları önerirsin?'
  },
  {
    id: 'night_concert',
    label: 'Gece, Konser & Loş Işık',
    icon: '🌙',
    description: 'Yüksek ISO başarımı ve açık diyaframlı lensler',
    query: 'Gece veya konser gibi karanlık ortamlarda ne kullanmalıyım?'
  },
  {
    id: 'analog_film',
    label: 'Analog 35mm Film Çekimi',
    icon: '🎞️',
    description: 'Nostaljik film estetiği, otomatik AF veya kompakt gövde',
    query: 'Analog 35mm film çekmek istiyorum, kulüpte neler var?'
  },
  {
    id: 'street_travel',
    label: 'Sokak & Gezi (Hafif Tak-Gez)',
    icon: '🚶',
    description: 'Tek lensle çok yönlülük, hızlı ve pratik sokak çekimi',
    query: 'Sokak fotoğrafçılığı ve seyahat için tak-gez ne önerirsin?'
  },
  {
    id: 'stage_tele',
    label: 'Sahne & Uzak Mesafe (Telefoto)',
    icon: '🔭',
    description: 'Uzaktaki detaylar, spor veya sahne performansları',
    query: 'Sahne veya uzaktaki nesneler için telefoto lens önerir misin?'
  },
  {
    id: 'macro',
    label: 'Makro & Detay Çekimi',
    icon: '🔍',
    description: '1:1 gerçek boyutlu ince detay ve doku çekimleri',
    query: 'Makro çekim için uygun bir lens var mı?'
  },
  {
    id: 'beginner',
    label: 'Yeni Başlayan / Temel Eğitim',
    icon: '🎓',
    description: 'Kulüp atölyeleri, temel ayarlar ve hafif DSLR',
    query: 'Fotoğrafa yeni başladım, temel eğitim için ne almalıyım?'
  }
];

export const EquipmentAiAdvisor: React.FC<EquipmentAiAdvisorProps> = ({
  onSelectEquipmentToReserve
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load equipment from live API
  useEffect(() => {
    api.getEquipment().then((data) => {
      setEquipmentList(data);
    });
  }, []);

  // Initial welcome message
  useEffect(() => {
    const welcomeMsg: Message = {
      id: 'welcome',
      sender: 'bot',
      text: 'Merhaba! Ben **YTÜFOK Akıllı Ekipman Danışmanı**. 📸\n\nKulüp envanterimizdeki gövde, lens ve aksesuarlar arasından çekim amacına, ışık koşullarına ve deneyimine en uygun seti birlikte belirleyelim.\n\nAşağıdaki popüler çekim senaryolarından birine tıklayabilir veya aklındaki çekimi doğrudan yazabilirsin!',
      followUpChips: [
        'Portre & Bokeh',
        'Gece / Konser',
        'Mimarlık & Geniş Açı',
        'Analog 35mm',
        'Sokak / Tak-Gez',
        'Temel Eğitim'
      ],
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Helper to find equipment by ID
  const getEquipmentById = (id: string): Equipment | undefined => {
    return equipmentList.find((e) => e.id === id);
  };

  // Natural Language & Rule Inference Engine
  const generateBotResponse = (userInput: string): { text: string; equipmentIds: string[]; followUpChips: string[] } => {
    const lower = userInput.toLowerCase().trim();

    // 1. Portre / Bokeh / Model / Flu arka plan
    if (
      lower.includes('portre') ||
      lower.includes('bokeh') ||
      lower.includes('flu') ||
      lower.includes('bulanık') ||
      lower.includes('arka plan') ||
      lower.includes('model') ||
      lower.includes('yüz') ||
      lower.includes('mezuniyet') ||
      lower.includes('düğün') ||
      lower.includes('85mm') ||
      lower.includes('50mm')
    ) {
      return {
        text: `Portre ve arka plan fluluğu (bokeh) için açık diyaframlı prime lenslerimiz en doğru tercihtir:\n\n` +
          `• **Canon EF 85mm f/1.8 USM:** Kusursuz yüz oranları, kremsi arka plan ayrımı ve hızlı netleme motoruyla 1 numaralı portre lensimizdir.\n` +
          `• **Canon EF 50mm f/1.4 USM:** f/1.4 ultra açık diyaframıyla loş ışıkta bile harika sonuçlar verir, tüm gövdelere uygundur.\n` +
          `• **Canon EOS 5D Mark II (Full Frame):** 21.1 MP Full Frame sensörü sayesinde gerçek odak uzaklığı ve doğal alan derinliği sağlar.\n\n` +
          `💡 *İpucu: Masalsı ve sinematik yumuşak parlamalar (mist/glow) elde etmek istersen **Tianya 77mm Soft Diffuser** filtremizi de 77mm lenslerle birlikte deneyebilirsin!*`,
        equipmentIds: ['e-ef-85', 'e-ef-50', 'e-5d2', 'e-tianya-77'],
        followUpChips: ['5D Mark II için kart gerekiyor mu?', 'Gece portresi nasıl çekilir?', 'Rezervasyon süresi ne kadar?']
      };
    }

    // 2. Mimarlık / Geniş Açı / İç Mekan / Manzara / Bina
    if (
      lower.includes('mimar') ||
      lower.includes('geniş açı') ||
      lower.includes('genis aci') ||
      lower.includes('iç mekan') ||
      lower.includes('ic mekan') ||
      lower.includes('bina') ||
      lower.includes('yapı') ||
      lower.includes('oda') ||
      lower.includes('manzara') ||
      lower.includes('17-40') ||
      lower.includes('10-20')
    ) {
      return {
        text: `Mimarlık, iç mekan ve kentsel manzara çekimleri için iki mükemmel geniş açı seçeneğimiz var:\n\n` +
          `• **Canon EF 17-40mm f/4L USM:** Full Frame gövdeler (5D Mk II veya 6D) için profesyonel L serisi ultra geniş açıdır. Köşeden köşeye yüksek keskinlik ve minimum distorsiyon sunar.\n` +
          `• **Sigma 10-20mm f/3.5 EX DC HSM:** Crop (APS-C) sensörlü Canon gövdeler (örn. EOS 1000D) için sabit f/3.5 diyaframlı geniş açıdır.\n\n` +
          `💡 *Tavsiye: 17-40mm L serisi lensi **Canon EOS 6D** veya **5D Mark II** ile eşleştirerek en geniş görüş açısını ve maksimum dinamik aralığı yakalayabilirsin.*`,
        equipmentIds: ['e-ef-17-40', 'e-sigma-10-20', 'e-6d'],
        followUpChips: ['Full Frame ile Crop farkı nedir?', 'Tak-gez lens önerir misin?', 'Tripod gerekiyor mu?']
      };
    }

    // 3. Gece / Konser / Loş Işık / Karanlık / Yüksek ISO / Sahne
    if (
      lower.includes('gece') ||
      lower.includes('konser') ||
      lower.includes('loş') ||
      lower.includes('los') ||
      lower.includes('karanlık') ||
      lower.includes('karanlik') ||
      lower.includes('akşam') ||
      lower.includes('aksam') ||
      lower.includes('iso') ||
      lower.includes('parti') ||
      lower.includes('etkinlik')
    ) {
      return {
        text: `Loş ışık, sahne veya gece çekimleri için düşük gren ve yüksek ışık geçirgenliği şart:\n\n` +
          `• **Canon EOS 6D Gövde:** -3 EV merkez netleme noktası ve ISO 25.600 başarımıyla kulübün düşük ışık şampiyonudur.\n` +
          `• **Canon EF 50mm f/1.4 USM:** f/1.4 diyaframı ortama giren ışığı maksimuma çıkarır ve flaşsız doğal ışık fotoğrafları çekmeni sağlar.\n` +
          `• **Canon Speedlite 580EX II:** Kapalı alan etkinliklerinde tavana/duvara sektirerek yumuşak ve dengeli aydınlatma sağlar.\n\n` +
          `⚠️ *Önemli Hatırlatma: Canon EOS 6D gövde için çekime gelirken kendi **SD Hafıza Kartını** getirmeyi unutma!*`,
        equipmentIds: ['e-6d', 'e-ef-50', 'e-speedlite'],
        followUpChips: ['Flaş nasıl kullanılır?', 'Konser için telefoto lens hangisi?', 'SD kart tipi ne olmalı?']
      };
    }

    // 4. Analog / 35mm / Film / Retro / Vintage / Negatif / Karanlık Oda
    if (
      lower.includes('analog') ||
      lower.includes('film') ||
      lower.includes('35mm') ||
      lower.includes('retro') ||
      lower.includes('vintage') ||
      lower.includes('karanlık oda') ||
      lower.includes('karanlik oda') ||
      lower.includes('banyo') ||
      lower.includes('clear shot') ||
      lower.includes('eos 650')
    ) {
      return {
        text: `Kulübümüzde analog film tutkunları ve karanlık oda atölyesi için iki farklı kategori bulunuyor:\n\n` +
          `• **Canon EOS 650 (35mm SLR Gövde):** Kulübümüzün tüm modern Canon EF lensleriyle (50mm f/1.4, 85mm f/1.8, 24-105mm) tam otomatik netleme ve diyafram uyumuyla çalışır. Gerçek SLR kontrolü verir.\n` +
          `• **Fujifilm Clear Shot M Serisi (5 Adet Kompakt):** Otomatik film sarma ve dahili flaşa sahip pratik "bas-çek" makinelerdir. Sokak, parti ve günlük hatıralar için son derece hafiftir.\n\n` +
          `💡 *Karanlık odamızda film banyosu ve agrandisör ile kart baskısı yapmak için üst menüdeki **Karanlık Oda** sekmesinden randevu alabilirsin!*`,
        equipmentIds: ['e-650', 'e-clearshot-1', 'e-ef-50'],
        followUpChips: ['Karanlık oda randevusu nasıl alınır?', 'Hangi filmi almalıyım?', 'Clear Shot M nasıl kullanılır?']
      };
    }

    // 5. Sokak / Gezi / Seyahat / Tak-Gez / Genel Çekim
    if (
      lower.includes('sokak') ||
      lower.includes('gezi') ||
      lower.includes('seyahat') ||
      lower.includes('tak gez') ||
      lower.includes('tak-gez') ||
      lower.includes('günlük') ||
      lower.includes('pratik') ||
      lower.includes('yürüyüş') ||
      lower.includes('tatil') ||
      lower.includes('24-105')
    ) {
      return {
        text: `Sokak ve seyahat çekimlerinde en önemli şey esneklik ve ağırlık dengesidir:\n\n` +
          `• **Canon EF 24-105mm f/4L IS USM:** Kulübün en çok tercih edilen "tak-gez" profesyonel L serisi zoom lensidir. Dahili 3-stop IS optik sabitlemesiyle hem geniş açı hem de telefoto aralığını tek gövdede sunar.\n` +
          `• **Canon EOS 6D veya 5D Mark II:** 24-105mm lens ile mükemmel bir denge oluşturur.\n` +
          `• **Nikon D5000 + 18-55mm VR Set:** Döner LCD ekranı ve hafif yapısıyla sokakta dikkat çekmeden farklı açılardan çekim yapmayı kolaylaştırır.\n\n` +
          `💡 *İpucu: Sürekli lens değiştirmek istemiyorsan Canon 24-105mm L lens tam sana göre!*`,
        equipmentIds: ['e-ef-24-105', 'e-6d', 'e-nikon', 'e-nikon-18-55-vr'],
        followUpChips: ['24-105 lens hangi gövdelere uyar?', 'Hafif bir makine hangisi?', 'Rezervasyon kuralları neler?']
      };
    }

    // 6. Telefoto / Uzak / Sahne / Spor / Vahşi Yaşam / Zoom
    if (
      lower.includes('tele') ||
      lower.includes('telefoto') ||
      lower.includes('uzak') ||
      lower.includes('spor') ||
      lower.includes('yakınlaştır') ||
      lower.includes('yakinlastir') ||
      lower.includes('zoom') ||
      lower.includes('70-200')
    ) {
      return {
        text: `Uzaktaki aksiyonu, spor müsabakalarını veya sahne performanslarını yakalamak için:\n\n` +
          `• **Canon EF 70-200mm f/4L USM:** Efsanevi beyaz L serisi optik kalitesi! Sabit f/4 diyaframı ve florit cam elemanlarıyla uzaktaki nesnelerde kristal netliğinde keskinlik ve enfes kontrast sunar.\n` +
          `• **Canon EOS 5D Mark II veya 6D:** Tam kare sensörle birleştiğinde 70mm'de nefis portreler, 200mm'de ise dramatik sıkıştırma perspektifi sağlar.\n\n` +
          `💡 *Önemli: 70-200mm lens profesyonel metal gövdesi nedeniyle çanta ile teslim edilir.*`,
        equipmentIds: ['e-ef-70-200', 'e-5d2', 'e-6d'],
        followUpChips: ['70-200 portre için kullanılır mı?', 'Ağırlığı ne kadar?', 'Rezervasyon nasıl yapılır?']
      };
    }

    // 7. Makro / Yakın Çekim / Çiçek / Böcek / Doku / Ürün
    if (
      lower.includes('makro') ||
      lower.includes('macro') ||
      lower.includes('yakın') ||
      lower.includes('yakin') ||
      lower.includes('detay') ||
      lower.includes('çiçek') ||
      lower.includes('cicek') ||
      lower.includes('böcek') ||
      lower.includes('bocek') ||
      lower.includes('ürün') ||
      lower.includes('urun') ||
      lower.includes('100mm')
    ) {
      return {
        text: `İnce detaylar, dokular ve küçük nesneler için kulübümüzün özel makro lensi:\n\n` +
          `• **Canon EF 100mm f/2.8 Macro USM:** Gerçek 1:1 (life-size) büyütme oranına sahiptir. 31 cm minimum odaklama mesafesi sayesinde nesneye çok yaklaşabilir, gözün göremediği detayları kaydedebilirsin.\n` +
          `• Aynı zamanda f/2.8 diyaframı ve 100mm odak uzaklığı sayesinde **muhteşem bir portre lensidir**.\n\n` +
          `💡 *Tavsiye: 1:1 makro çekimlerinde alan derinliği milimetrik olacağından diyaframı f/8 veya f/11 civarına kısmak net alanı artırır.*`,
        equipmentIds: ['e-ef-100-macro', 'e-5d2'],
        followUpChips: ['Makro lens ile portre çekilir mi?', 'Flaş kullanmalı mıyım?', 'Nasıl rezerve edebilirim?']
      };
    }

    // 8. Yeni Başlayan / Temel Eğitim / Atölye / Öğrenci / İlk Kez
    if (
      lower.includes('yeni') ||
      lower.includes('başla') ||
      lower.includes('basla') ||
      lower.includes('acemi') ||
      lower.includes('öğren') ||
      lower.includes('ogren') ||
      lower.includes('ödev') ||
      lower.includes('odev') ||
      lower.includes('atölye') ||
      lower.includes('atolye') ||
      lower.includes('ilk') ||
      lower.includes('1000d')
    ) {
      return {
        text: `Fotoğraf yolculuğuna yeni başlayan kulüp üyelerimiz için öğrenmesi en keyifli ve pratik seçenekler:\n\n` +
          `• **Canon EOS 1000D Gövde:** Sadece 450 gr ağırlığında, sade menüsü ve anlaşılır manuel mod kontrolleriyle temel fotoğraf eğitimleri ve kulüp gezileri için idealdir.\n` +
          `• **Nikon D5000 + 18-55mm VR:** Döner ekranı sayesinde yer hizasından veya baş hizasından kolay kadrajlama yapmayı sağlar.\n` +
          `• **Canon EF 50mm f/1.4 USM:** Diyaframın, alan derinliğinin ve ışığın mantığını kavramak için her fotoğrafçının deneyimlemesi gereken temel lenstir.\n\n` +
          `💡 *Unutma: Kulüp içi atölyelerimizde ve gezilerimizde tüm yönetim kurulu üyelerimiz ayarlarda sana yardımcı olmaktan mutluluk duyar!*`,
        equipmentIds: ['e-1000d', 'e-nikon', 'e-ef-50'],
        followUpChips: ['Ekipmanı nereden teslim alacağım?', 'Kaç gün süreyle alabilirim?', 'SD kart gerekiyor mu?']
      };
    }

    // 9. SD Kart / CF Kart / Hafıza Kartı Sorusu
    if (
      lower.includes('kart') ||
      lower.includes('sd kart') ||
      lower.includes('cf kart') ||
      lower.includes('hafıza') ||
      lower.includes('hafiza') ||
      lower.includes('bellek')
    ) {
      return {
        text: `Kulübümüzde hafıza kartı kuralları şu şekildedir:\n\n` +
          `• **Canon EOS 5D Mark II:** SanDisk Extreme 32GB CompactFlash (CF) kart ve USB kart okuyucu **kulüp çantası içinde hazır verilir**.\n` +
          `• **Diğer Tüm Dijital Gövdeler (Canon 6D, 1000D, Nikon D5000):** Üyelerimizin çekime gelirken **kendi standart SD kartlarını** getirmeleri gerekmektedir (kulüpte SD kart temin edilmemektedir).\n\n` +
          `⚠️ *Çekiminizin aksamaması için rezervasyondan önce kendi SD kartınızın yanınızda olduğundan emin olunuz.*`,
        equipmentIds: ['e-5d2', 'e-6d', 'e-1000d', 'e-nikon'],
        followUpChips: ['5D Mark II rezerve et', '6D rezerve et', 'Rezervasyon süresi ne kadar?']
      };
    }

    // 10. Teslimat / Kural / Süre / Davutpaşa
    if (
      lower.includes('nereden') ||
      lower.includes('nerde') ||
      lower.includes('teslim') ||
      lower.includes('iade') ||
      lower.includes('süre') ||
      lower.includes('gün') ||
      lower.includes('kural') ||
      lower.includes('vadisi') ||
      lower.includes('davutpaşa')
    ) {
      return {
        text: `YTÜFOK Ekipman Kullanım Kuralları:\n\n` +
          `📍 **Teslim & İade Noktası:** Tüm ekipman teslim ve iadeleri yalnızca **Kulüpler Vadisi Davutpaşa Kampüsü** kulüp odasından yönetim kurulu kontrolünde yapılır.\n` +
          `⏱️ **Maksimum Rezervasyon Süresi:** Standart olarak en fazla **2 gündür**.\n` +
          `📋 **Onay Süreci:** Web sitemizden rezervasyon oluşturduktan sonra yönetim kurulu talebini inceler ve onaylandığında SMS/WhatsApp ile bilgilendirilirsin.\n\n` +
          `Hemen ekipman seçerek rezervasyon formuna geçebilirsin!`,
        equipmentIds: ['e-5d2', 'e-6d', 'e-ef-24-105'],
        followUpChips: ['Portre için ne önerirsin?', 'Analog fotoğraf makineleri neler?', 'Geniş açı lens hangisi?']
      };
    }

    // Default Fallback: Smart overview of inventory
    return {
      text: `Aradığın çekim türünü biraz daha detaylandırabilir misin? Örneğin:\n\n` +
        `• **Portre / Bokeh:** Bulanık arka plan ve keskin insan fotoğrafları (85mm f/1.8 & 50mm f/1.4)\n` +
        `• **Geniş Açı / Mimari:** 17-40mm f/4L veya Sigma 10-20mm\n` +
        `• **Gece / Loş Işık:** Düşük ışık ustası Canon 6D\n` +
        `• **Analog:** 35mm AF Canon 650 veya Fujifilm Clear Shot kompakt\n` +
        `• **Genel / Gezi:** Canon 24-105mm f/4L IS tak-gez lens\n\n` +
        `Ne tür bir ortamda ve ne çekmeyi planlıyorsun?`,
      equipmentIds: ['e-5d2', 'e-6d', 'e-ef-85', 'e-ef-24-105'],
      followUpChips: ['Portre çekmek istiyorum', 'Gece çekimi yapacağım', 'Mimari ve manzara', 'Analog film denemek istiyorum']
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulated AI response delay for natural feeling
    setTimeout(() => {
      const response = generateBotResponse(query);
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        recommendedEquipmentIds: response.equipmentIds,
        followUpChips: response.followUpChips,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleScenarioClick = (scenario: Scenario) => {
    handleSendMessage(scenario.query);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: 'Sohbet sıfırlandı. Yeni bir çekim planı için sana nasıl yardımcı olabilirim?',
        followUpChips: [
          'Portre & Bokeh',
          'Gece / Konser',
          'Mimarlık & Geniş Açı',
          'Analog 35mm',
          'Sokak / Tak-Gez',
          'Temel Eğitim'
        ],
        timestamp: new Date()
      }
    ]);
  };

  const handleSelectToReserve = (equipmentId: string) => {
    setIsOpen(false);
    onSelectEquipmentToReserve(equipmentId);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#6e2a4f] via-[#4e3b52] to-[#301322] text-white shadow-xl shadow-[#6e2a4f]/25 border border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
            title="YTÜFOK Ekipman Danışmanı"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#301322]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold tracking-wide text-white flex items-center gap-1">
                Ekipman Danışmanı
                <span className="px-1.5 py-0.2 text-[9px] bg-white/20 rounded text-amber-200 uppercase font-bold tracking-wider">AI</span>
              </span>
              <span className="text-[10px] text-white/70 font-normal">Hangi ekipman sana uygun?</span>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[82vh] h-[640px] flex flex-col bg-[#160b13] border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#301322] via-[#22101b] to-[#160b13] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#6e2a4f] to-[#301322] border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Bot className="w-5 h-5 text-amber-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#160b13]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-white tracking-tight">FOK Ekipman Danışmanı</h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#657796]/30 text-amber-300 rounded border border-amber-300/20">
                    AI BOT
                  </span>
                </div>
                <p className="text-[11px] text-white/60">YTÜFOK Envanter Rehberi • Aktif</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sohbeti Sıfırla"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Scenario Scroller (Sticky Top) */}
          <div className="px-3 py-2 bg-[#120710]/80 border-b border-white/5 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
            {QUICK_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleScenarioClick(sc)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-[#6e2a4f]/40 hover:border-[#6e2a4f] border border-white/10 text-[11px] text-white/80 hover:text-white whitespace-nowrap transition-colors"
              >
                <span>{sc.icon}</span>
                <span>{sc.label}</span>
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-[#301322] border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-amber-300" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-[12.5px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#6e2a4f] to-[#4e3b52] text-white rounded-br-none shadow-md'
                        : 'bg-white/[0.06] border border-white/10 text-white/90 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-amber-200 font-semibold">{part}</strong> : part))}
                    </div>
                  </div>

                  {/* Recommended Equipment Cards embedded in message */}
                  {msg.recommendedEquipmentIds && msg.recommendedEquipmentIds.length > 0 && (
                    <div className="space-y-2 w-full pt-1">
                      <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1 px-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Önerilen Ekipmanlar:
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.recommendedEquipmentIds.map((eqId) => {
                          const eq = getEquipmentById(eqId);
                          if (!eq) return null;

                          return (
                            <div
                              key={eq.id}
                              className="group p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center gap-3"
                            >
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                                {eq.image_url ? (
                                  <img
                                    src={eq.image_url}
                                    alt={eq.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      // Fallback on broken image
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Camera className="w-5 h-5 text-white/40" />
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-white truncate" title={eq.name}>
                                  {eq.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <StatusBadge status={eq.status} size="sm" />
                                  <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider">
                                    {eq.category}
                                  </span>
                                </div>
                              </div>

                              {/* Reserve Action Button */}
                              <button
                                onClick={() => handleSelectToReserve(eq.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#6e2a4f] hover:bg-[#83335e] text-white text-[11px] font-medium flex items-center gap-1 transition-all shadow shrink-0 active:scale-95"
                                title="Bu ekipmanı rezerve et"
                              >
                                <span>Rezerve Et</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Follow-up suggestion chips */}
                  {msg.followUpChips && msg.followUpChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.followUpChips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip)}
                          className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-[#6e2a4f]/30 border border-white/10 hover:border-white/20 text-[10.5px] text-white/70 hover:text-white transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#4e3b52] border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white/90" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-lg bg-[#301322] border border-white/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-none bg-white/[0.06] border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="p-3 bg-[#13060f] border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ne tür bir çekim yapacaksın? Örn: Portre..."
                className="flex-1 bg-white/[0.06] border border-white/15 focus:border-[#6e2a4f] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#6e2a4f] transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#6e2a4f] to-[#4e3b52] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-2 text-[10px] text-center text-white/40 flex items-center justify-center gap-1">
              <span>YTÜFOK Envanter Modeli</span>
              <span>•</span>
              <span>Kulüpler Vadisi Davutpaşa</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
