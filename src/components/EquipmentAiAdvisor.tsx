import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  Bot, 
  User, 
  CheckCircle2, 
  Camera, 
  ArrowRight
} from 'lucide-react';
import { Equipment } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import { askGeminiAdvisor } from '../lib/gemini';

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
      text: 'Merhaba! Ben **YTÜFOK Akıllı Ekipman Danışmanı**. 📸\n\nKulüp envanterimizdeki tüm gövde, lens ve aksesuarlar arasından çekim amacına %100 optik ve fiziksel olarak uyumlu kombinasyonu seçmene yardımcı oluyorum.\n\nAşağıdaki popüler çekim senaryolarından birine tıklayabilir veya aklındaki çekimi doğrudan yazabilirsin!',
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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const getEquipmentById = (id: string): Equipment | undefined => {
    return equipmentList.find((e) => e.id === id);
  };

  // Safe fallback if offline
  const generateFallbackResponse = (userInput: string): { text: string; equipmentIds: string[]; followUpChips: string[] } => {
    const lower = userInput.toLowerCase().trim();

    if (lower.includes('nikon') || lower.includes('d5000')) {
      return {
        text: `Kulübümüzün Nikon gövdesi için bayonet uyumluluğu:\n\n` +
          `• **Nikon D5000 Gövde:** Nikon F-Mount süngüye sahiptir.\n` +
          `• **Nikon AF-S DX 18-55mm f/3.5-5.6G VR:** Kulübümüzdeki tek Nikon uyumlu lenstir.\n\n` +
          `⚠️ *Kulübümüzdeki Canon lensler Nikon gövdeye takılamaz. Çekime gelirken kendi SD kartınızı getirmelisiniz.*`,
        equipmentIds: ['e-nikon', 'e-nikon-18-55-vr'],
        followUpChips: ['Canon Full Frame gövdeler', 'Portre lensi hangisi?', 'SD kart gerekiyor mu?']
      };
    }

    if (lower.includes('portre') || lower.includes('bokeh') || lower.includes('flu') || lower.includes('85mm') || lower.includes('50mm')) {
      return {
        text: `Portre ve arka plan fluluğu (bokeh) için Full Frame Canon setimiz:\n\n` +
          `• **Canon EOS 5D Mark II Gövde:** 21.1 MP Full Frame sensörle doğal alan derinliği.\n` +
          `• **Canon EF 85mm f/1.8 USM:** Kusursuz yüz oranları ve kremsi arka plan fluluğu.\n` +
          `• **Canon EF 50mm f/1.4 USM:** f/1.4 açık diyaframla düşük ışıkta yüksek performans.\n\n` +
          `💡 *5D Mark II için 32GB CF hafıza kartı çanta içerisinde dahil olarak verilir.*`,
        equipmentIds: ['e-5d2', 'e-ef-85', 'e-ef-50'],
        followUpChips: ['50mm ile 85mm farkı', 'Gece portresi nasıl çekilir?', 'Rezervasyon süresi ne kadar?']
      };
    }

    return {
      text: `Nasıl bir çekim planlıyorsun? Aşağıdaki kategorilerden birini seçebilirsin:\n\n` +
        `• **Portre / Bokeh:** 5D Mk II + 85mm f/1.8 veya 50mm f/1.4\n` +
        `• **Geniş Açı / Mimari:** 6D + 17-40mm f/4L Ultra Geniş Açı\n` +
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
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    } catch (err: any) {
      console.warn('Gemini request fallback:', err);
      const fallbackResult = generateFallbackResponse(query);
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: fallbackResult.text,
        recommendedEquipmentIds: fallbackResult.equipmentIds,
        followUpChips: fallbackResult.followUpChips,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }
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
                  AI
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
                <p className="text-[11px] text-white/60">YTÜFOK Akıllı Envanter Rehberi • Aktif</p>
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
            <div className="mt-2 text-[10px] text-center text-white/40 flex items-center justify-center gap-1">
              <span>YTÜFOK Akıllı Ekipman Asistanı</span>
              <span>•</span>
              <span>Kulüpler Vadisi Davutpaşa</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
