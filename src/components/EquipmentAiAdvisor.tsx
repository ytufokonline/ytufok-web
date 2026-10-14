import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  Bot, 
  User, 
  CheckCircle2, 
  Key, 
  Camera, 
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { Equipment } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import { 
  askGeminiAdvisor, 
  getGeminiApiKey, 
  setGeminiApiKey 
} from '../lib/gemini';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  recommendedEquipmentIds?: string[];
  followUpChips?: string[];
  timestamp: Date;
  modelUsed?: 'gemini' | 'rules';
}

interface EquipmentAiAdvisorProps {
  onSelectEquipmentToReserve: (equipmentId: string) => void;
}

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
    query: 'Portre çekimi için arka planı en güzel flulaştıran uyumlu gövde ve lens seti nedir?'
  },
  {
    id: 'architecture',
    label: 'Mimarlık & Geniş Açı',
    icon: '🏛️',
    description: 'İç mekan, yapılar ve kentsel manzara çekimleri',
    query: 'Mimarlık ve iç mekan çekimleri için uyumlu geniş açı seti ne önerirsin?'
  },
  {
    id: 'night_concert',
    label: 'Gece, Konser & Loş Işık',
    icon: '🌙',
    description: 'Yüksek ISO başarımı ve açık diyaframlı lensler',
    query: 'Gece veya konser gibi karanlık ortamlarda hangi gövde ve lensi almalıyım?'
  },
  {
    id: 'analog_film',
    label: 'Analog 35mm Film Çekimi',
    icon: '🎞️',
    description: 'Nostaljik film estetiği, otomatik AF veya kompakt gövde',
    query: 'Kulüpte analog 35mm film çekebileceğim hangi seçenekler var?'
  },
  {
    id: 'street_travel',
    label: 'Sokak & Gezi (Hafif Tak-Gez)',
    icon: '🚶',
    description: 'Tek lensle çok yönlülük, hızlı ve pratik sokak çekimi',
    query: 'Sokak fotoğrafçılığı ve seyahat için tak-gez olarak ne önerirsin?'
  },
  {
    id: 'stage_tele',
    label: 'Sahne & Uzak Mesafe (Telefoto)',
    icon: '🔭',
    description: 'Uzaktaki detaylar, spor veya sahne performansları',
    query: 'Sahne veya uzaktaki nesneler için telefoto lens seti önerir misin?'
  },
  {
    id: 'macro',
    label: 'Makro & Detay Çekimi',
    icon: '🔍',
    description: '1:1 gerçek boyutlu ince detay ve doku çekimleri',
    query: 'Makro çekim için uygun gövde ve lens kombinasyonu nedir?'
  },
  {
    id: 'beginner',
    label: 'Yeni Başlayan / Temel Eğitim',
    icon: '🎓',
    description: 'Kulüp atölyeleri, temel ayarlar ve hafif DSLR',
    query: 'Fotoğrafa yeni başladım, temel eğitim ve kulüp gezileri için ne almalıyım?'
  }
];

export const EquipmentAiAdvisor: React.FC<EquipmentAiAdvisorProps> = ({
  onSelectEquipmentToReserve
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // API Key Settings Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync current API key
  useEffect(() => {
    const key = getGeminiApiKey();
    setCurrentApiKey(key);
    if (key) {
      setApiKeyInput(key);
    }
  }, [showKeyModal, isOpen]);

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
      text: 'Merhaba! Ben **YTÜFOK Akıllı Ekipman Danışmanı**. 📸\n\nGoogle Gemini yapay zeka desteğiyle kulüp envanterimizdeki tüm gövde, lens ve aksesuarlar arasından çekim amacına %100 optik ve fiziksel uyumlu kombinasyonu seçmene yardımcı oluyorum.\n\nAşağıdaki hazır senaryolardan birine tıklayabilir veya aklındaki çekimi doğrudan yazabilirsin!',
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
    if (isOpen && !showKeyModal) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, showKeyModal]);

  const getEquipmentById = (id: string): Equipment | undefined => {
    return equipmentList.find((e) => e.id === id);
  };

  // Robust, Strictly-Compatible Fallback Rules (When Gemini API Key is not set or network fails)
  const generateStrictFallbackResponse = (userInput: string): { text: string; equipmentIds: string[]; followUpChips: string[] } => {
    const lower = userInput.toLowerCase().trim();

    // Nikon specific query
    if (lower.includes('nikon') || lower.includes('d5000')) {
      return {
        text: `Kulübümüzün Nikon gövdesi için bayonet uyumluluğu:\n\n` +
          `• **Nikon D5000 Gövde:** Nikon F-Mount süngüye sahiptir.\n` +
          `• **Nikon AF-S DX 18-55mm f/3.5-5.6G VR:** Kulübümüzdeki **TEK** Nikon uyumlu lenstir (VR titreşim engelleme özellikli).\n\n` +
          `⚠️ *Önemli Uyum Kuralı: Kulübümüzdeki Canon EF / EF-S lenslerin hiçbiri Nikon gövdeye takılamaz. Çekime gelirken kendi SD kartınızı getirmeyi unutmayınız.*`,
        equipmentIds: ['e-nikon', 'e-nikon-18-55-vr'],
        followUpChips: ['Canon Full Frame gövdeler neler?', 'Portre lensi hangisi?', 'SD kart gerekiyor mu?']
      };
    }

    // Portre / Bokeh
    if (
      lower.includes('portre') ||
      lower.includes('bokeh') ||
      lower.includes('flu') ||
      lower.includes('bulanık') ||
      lower.includes('arka plan') ||
      lower.includes('model') ||
      lower.includes('yüz') ||
      lower.includes('mezuniyet') ||
      lower.includes('85mm') ||
      lower.includes('50mm')
    ) {
      return {
        text: `Portre ve kremsi arka plan fluluğu (bokeh) için %100 uyumlu Canon Full Frame seti:\n\n` +
          `• **Canon EOS 5D Mark II Gövde:** Full Frame 21.1 MP sensörüyle gerçek odak uzaklığı ve doğal alan derinliği sağlar.\n` +
          `• **Canon EF 85mm f/1.8 USM:** 1 numaralı portre lensimizdir. Yüz hatlarında distorsiyon yapmaz, modeli arka plandan jilet gibi ayırır.\n` +
          `• **Canon EF 50mm f/1.4 USM:** f/1.4 ultra açık diyaframıyla hem portre hem de loş ışık için mükemmel alternatiftir.\n\n` +
          `💡 *5D Mark II ile 32GB CF hafıza kartı ve okuyucusu kulüp çantasıyla birlikte teslim edilir.*`,
        equipmentIds: ['e-5d2', 'e-ef-85', 'e-ef-50'],
        followUpChips: ['50mm ile 85mm farkı nedir?', 'Gece portresi nasıl çekilir?', 'Rezervasyon süresi ne kadar?']
      };
    }

    // Mimari / Geniş Açı
    if (
      lower.includes('mimar') ||
      lower.includes('geniş açı') ||
      lower.includes('genis aci') ||
      lower.includes('iç mekan') ||
      lower.includes('ic mekan') ||
      lower.includes('bina') ||
      lower.includes('yapı') ||
      lower.includes('manzara') ||
      lower.includes('17-40') ||
      lower.includes('10-20')
    ) {
      return {
        text: `Mimarlık ve geniş açı çekimleri için iki ayrı uyumlu kombinasyonumuz vardır:\n\n` +
          `1️⃣ **Profesyonel Full Frame Set (Önerilen):**\n` +
          `• **Canon EOS 6D veya 5D Mk II** + **Canon EF 17-40mm f/4L USM** (Ultra Geniş Açı L serisi lens; Full Frame'de tam 104° görüş açısı verir).\n\n` +
          `2️⃣ **Crop (APS-C) Sensör Seti:**\n` +
          `• **Canon EOS 1000D** + **Sigma 10-20mm f/3.5 EX DC HSM** (Sigma DC lens yalnızca Crop gövdelerde kullanılır, Full Frame'e takılamaz).\n\n` +
          `💡 *Mimari çekimlerde Full Frame 6D + 17-40mm f/4L ikilisi maksimum keskinlik ve geniş açı sağlar.*`,
        equipmentIds: ['e-6d', 'e-ef-17-40', 'e-5d2'],
        followUpChips: ['17-40mm lens Full Frame mi?', 'Sigma 10-20 hangi makineye takılır?', 'SD kart gerekiyor mu?']
      };
    }

    // Gece / Konser / Loş Işık
    if (
      lower.includes('gece') ||
      lower.includes('konser') ||
      lower.includes('loş') ||
      lower.includes('karanlık') ||
      lower.includes('sahne') ||
      lower.includes('iso')
    ) {
      return {
        text: `Loş ışık ve gece ortamları için en yüksek ışık hassasiyetine sahip uyumlu set:\n\n` +
          `• **Canon EOS 6D Gövde:** -3 EV merkez netleme hassasiyeti ve ISO 25.600 başarımıyla kulübün düşük ışık ustasıdır.\n` +
          `• **Canon EF 50mm f/1.4 USM:** f/1.4 ultra açık diyaframı sayesinde karanlıkta flaşsız net fotoğraflar çekmeni sağlar.\n` +
          `• **Canon Speedlite 580EX II:** Kapalı alan etkinliklerinde duvara/tavana sektirerek doğal dolgu ışığı verir.\n\n` +
          `⚠️ *Hatırlatma: Canon EOS 6D için çekime gelirken kendi SD kartınızı getirmelisiniz.*`,
        equipmentIds: ['e-6d', 'e-ef-50', 'e-speedlite'],
        followUpChips: ['Flaş nasıl kullanılır?', 'Konser için telefoto lens var mı?', 'SD kart tipi ne olmalı?']
      };
    }

    // Analog 35mm
    if (
      lower.includes('analog') ||
      lower.includes('film') ||
      lower.includes('35mm') ||
      lower.includes('clear shot') ||
      lower.includes('650')
    ) {
      return {
        text: `Analog 35mm film çekimi için kulübümüzdeki iki seçenek:\n\n` +
          `• **Canon EOS 650 (35mm SLR):** Kulübümüzün modern EF lensleriyle (50mm f/1.4, 85mm f/1.8, 24-105mm L) tam otomatik netlemeli ve diyafram kontrollü olarak çalışır.\n` +
          `• **Fujifilm Clear Shot M Kompakt (No: 1-5):** Dahili flaşlı, sokak ve günlük hatıralar için pratik bas-çek makinedir.\n\n` +
          `💡 *Film banyosu ve karanlık oda baskısı için sitemizdeki Karanlık Oda sekmesinden randevu alabilirsin.*`,
        equipmentIds: ['e-650', 'e-clearshot-1', 'e-ef-50'],
        followUpChips: ['Karanlık oda nasıl rezerve edilir?', 'Clear Shot M nasıl kullanılır?', 'Hangi film takılır?']
      };
    }

    // Sokak / Tak-Gez
    if (
      lower.includes('sokak') ||
      lower.includes('gezi') ||
      lower.includes('seyahat') ||
      lower.includes('tak gez') ||
      lower.includes('tak-gez') ||
      lower.includes('24-105')
    ) {
      return {
        text: `Sokak ve seyahat için tek lensle tüm odak mesafelerini kapsayan set:\n\n` +
          `• **Canon EOS 6D veya 5D Mark II Gövde**\n` +
          `• **Canon EF 24-105mm f/4L IS USM:** Kulübün en çok tercih edilen "tak-gez" L serisi zoom lensidir. Dahili optik görüntü sabitleyicisi (IS) sayesinde elde net çekimler sunar.\n\n` +
          `💡 *Dilerseniz sinematik yumuşak parlamalar için bu lense Tianya 77mm Soft Diffuser filtre takabilirsiniz.*`,
        equipmentIds: ['e-ef-24-105', 'e-6d', 'e-5d2'],
        followUpChips: ['24-105 lens hangi gövdelere uyar?', 'Tianya filtre ne işe yarar?', 'Teslim kuralları neler?']
      };
    }

    // Telefoto
    if (lower.includes('tele') || lower.includes('zoom') || lower.includes('uzak') || lower.includes('spor') || lower.includes('70-200')) {
      return {
        text: `Uzaktaki aksiyon ve sahne detayları için efsanevi beyaz L serisi set:\n\n` +
          `• **Canon EF 70-200mm f/4L USM:** Florit cam elemanlarıyla uzaktaki sahnelerde köşeden köşeye yüksek keskinlik sunar.\n` +
          `• **Canon EOS 5D Mark II veya 6D:** Full Frame sensörle birlikte 70-200mm lens nefis bir alan derinliği ve sıkıştırma perspektifi yaratır.`,
        equipmentIds: ['e-ef-70-200', 'e-5d2', 'e-6d'],
        followUpChips: ['70-200 portre için kullanılır mı?', 'Ağırlığı ne kadar?', 'Nasıl rezerve edilir?']
      };
    }

    // Makro
    if (lower.includes('makro') || lower.includes('macro') || lower.includes('çiçek') || lower.includes('böcek') || lower.includes('detay')) {
      return {
        text: `Küçük nesneler, dokular ve ince detaylar için:\n\n` +
          `• **Canon EF 100mm f/2.8 Macro USM:** Gerçek 1:1 boyutlu makro lenstir. 31 cm minimum odaklama mesafesine sahiptir.\n` +
          `• **Canon EOS 5D Mark II:** 21.1 MP çözünürlüğüyle makro çekimlerinde en ince doku detaylarını kaydeder.`,
        equipmentIds: ['e-ef-100-macro', 'e-5d2'],
        followUpChips: ['Makro lensle portre çekilir mi?', 'CF kart veriliyor mu?', 'Nasıl rezerve edilir?']
      };
    }

    // Default overview
    return {
      text: `Nasıl bir çekim planlıyorsun? Aşağıdaki kategorilerden birini seçebilir veya aklındaki projeyi detaylandırabilirsin:\n\n` +
        `• **Portre / Bokeh:** 5D Mk II + 85mm f/1.8 veya 50mm f/1.4\n` +
        `• **Geniş Açı / Mimarlık:** 6D + 17-40mm f/4L Ultra Geniş Açı\n` +
        `• **Gece / Konser:** Düşük ışık ustası Canon 6D + f/1.4 açık diyafram\n` +
        `• **Sokak / Tak-Gez:** Canon 24-105mm f/4L IS optik sabitlemeli zoom lens\n` +
        `• **Analog 35mm:** Canon EOS 650 SLR veya Fujifilm Clear Shot kompakt`,
      equipmentIds: ['e-5d2', 'e-6d', 'e-ef-85', 'e-ef-24-105'],
      followUpChips: ['Portre çekmek istiyorum', 'Gece çekimi yapacağım', 'Mimari ve manzara', 'Analog film denemek istiyorum']
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
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

    const activeApiKey = getGeminiApiKey();

    if (activeApiKey) {
      try {
        // Build chat history for Gemini (last 6 messages)
        const historyForGemini = messages.slice(-6).map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text }]
        }));

        const geminiResult = await askGeminiAdvisor(query, historyForGemini);

        const botMsg: Message = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: geminiResult.explanation,
          recommendedEquipmentIds: geminiResult.recommendedEquipmentIds,
          followUpChips: geminiResult.followUpChips,
          timestamp: new Date(),
          modelUsed: 'gemini'
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
        return;
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to strict rules:', err);
      }
    }

    // Fallback: Strict Photography Compatibility Rules
    setTimeout(() => {
      const fallbackResult = generateStrictFallbackResponse(query);
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: fallbackResult.text,
        recommendedEquipmentIds: fallbackResult.equipmentIds,
        followUpChips: fallbackResult.followUpChips,
        timestamp: new Date(),
        modelUsed: 'rules'
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleScenarioClick = (scenario: Scenario) => {
    handleSendMessage(scenario.query);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: 'Sohbet sıfırlandı. Yeni çekim projen için neye ihtiyacın var?',
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

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
    setCurrentApiKey(apiKeyInput.trim() || null);
    setShowKeyModal(false);
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
              <span className="text-xs font-semibold tracking-wide text-white flex items-center gap-1.5">
                Ekipman Danışmanı
                <span className="px-1.5 py-0.2 text-[9px] bg-white/20 rounded text-amber-200 uppercase font-bold tracking-wider">
                  {currentApiKey ? 'GEMINI' : 'AI'}
                </span>
              </span>
              <span className="text-[10px] text-white/70 font-normal">Hangi ekipman sana uygun?</span>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] max-h-[82vh] h-[660px] flex flex-col bg-[#160b13] border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#301322] via-[#22101b] to-[#160b13] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#6e2a4f] to-[#301322] border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Bot className="w-5 h-5 text-amber-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#160b13]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white tracking-tight">FOK Ekipman Danışmanı</h3>
                  <button
                    onClick={() => setShowKeyModal(true)}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded border flex items-center gap-1 transition-colors ${
                      currentApiKey
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                    title={currentApiKey ? 'Gemini 1.5 Flash Aktif (Ayarları değiştir)' : 'Gemini API Key Tanımla'}
                  >
                    <Key className="w-2.5 h-2.5" />
                    <span>{currentApiKey ? 'Gemini 1.5' : 'Key Ekle'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-white/60">YTÜFOK Uyumlu Envanter Modeli</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowKeyModal(true)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Yapay Zeka API Ayarı"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
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

          {/* Key Missing Banner (If no Gemini key is set yet) */}
          {!currentApiKey && (
            <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-amber-200">
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">Gerçek Google Gemini 1.5 Flash ile yanıt almak için:</span>
              </span>
              <button
                onClick={() => setShowKeyModal(true)}
                className="font-semibold underline ml-1 hover:text-amber-100 shrink-0"
              >
                Key Gir
              </button>
            </div>
          )}

          {/* Quick Scenario Scroller */}
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
                    <div className="whitespace-pre-line space-y-1">
                      {msg.text.split('\n').map((line, lIdx) => {
                        return (
                          <p key={lIdx}>
                            {line.split('**').map((part, i) =>
                              i % 2 === 1 ? (
                                <strong key={i} className="text-amber-200 font-semibold">
                                  {part}
                                </strong>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        );
                      })}
                    </div>

                    {msg.modelUsed && (
                      <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[9px] text-white/40">
                        <span>{msg.modelUsed === 'gemini' ? '⚡ Google Gemini 1.5 Flash' : '🔍 Fotoğraf Uyum Motoru'}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Recommended Equipment Cards */}
                  {msg.recommendedEquipmentIds && msg.recommendedEquipmentIds.length > 0 && (
                    <div className="space-y-2 w-full pt-1">
                      <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1 px-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Uyumlu Ekipman Önerileri:
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
                              <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                                {eq.image_url ? (
                                  <img
                                    src={eq.image_url}
                                    alt={eq.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Camera className="w-5 h-5 text-white/40" />
                                )}
                              </div>

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

                  {/* Follow-up suggestions */}
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
                placeholder="Çekim türünü sor... Örn: Portre için ne almalıyım?"
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
            <div className="mt-2 text-[10px] text-center text-white/40 flex items-center justify-center gap-2">
              <span>YTÜFOK Akıllı Danışman</span>
              <span>•</span>
              <button
                onClick={() => setShowKeyModal(true)}
                className="hover:text-amber-300 underline"
              >
                {currentApiKey ? 'Google Gemini 1.5 Flash Aktif' : 'Gemini Key Tanımla'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Gemini API Key Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1c0f18] border border-white/20 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-semibold text-white">Google Gemini API Yapılandırması</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Botun gerçek bir fotoğraf uzmanı gibi davranması ve kulübün envanter kurallarına göre kusursuz akıl yürütmesi için <strong>Google Gemini API Anahtarınızı</strong> buraya girebilirsiniz.
            </p>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/80 space-y-2">
              <div className="flex items-center gap-1.5 font-medium text-amber-200">
                <span>Ücretsiz API Anahtarı Nasıl Alınır?</span>
              </div>
              <p className="text-[11px] text-white/60">
                1. <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-2.5 h-2.5" /></a> adresine gidin.
              </p>
              <p className="text-[11px] text-white/60">
                2. "Get API Key" butonuna tıklayıp saniyeler içinde ücretsiz anahtarınızı kopyalayın.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90">Gemini API Anahtarı:</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-white/[0.06] border border-white/20 focus:border-[#6e2a4f] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#6e2a4f]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              {currentApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput('');
                    setGeminiApiKey('');
                    setCurrentApiKey(null);
                    setShowKeyModal(false);
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-red-300 hover:bg-red-500/10 transition-colors mr-auto"
                >
                  Anahtarı Kaldır
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-white/70 hover:bg-white/10 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6e2a4f] to-[#4e3b52] hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all"
              >
                Kaydet & Etkinleştir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
