import React, { useState } from 'react';
import { 
  Film, 
  ChevronDown, 
  Layers, 
  Gauge, 
  Sparkles, 
  Eye, 
  Droplets, 
  Compass, 
  ArrowRight, 
  Sliders, 
  Sun, 
  Moon, 
  Info,
  CheckCircle2,
  BookOpen,
  Camera
} from 'lucide-react';
import { TabType } from '../lib/routes';

interface UsefulInfoPageProps {
  onNavigate: (tab: TabType, extraParam?: string) => void;
}

export const UsefulInfoPage: React.FC<UsefulInfoPageProps> = ({ onNavigate }) => {
  // Accordion state - "film-nedir" is open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'film-nedir': true,
    'pozlama-ucgeni': false,
    'karanlik-oda-banyo': false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-8 space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold tracking-wide uppercase border border-purple-500/30">
            YTÜFOK Akademi
          </span>
          <span className="text-xs text-white/50">• Fotoğrafçılık & Teknik Bilgi Havuzu</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-club tracking-tight">
          Faydalı Bilgiler
        </h1>
        <p className="text-sm sm:text-base text-[#a9b9d3] max-w-2xl font-normal leading-relaxed">
          Analog fotoğrafçılık disiplini, film kimyası, karanlık oda teknikleri ve temel pozlama kurallarına dair kapsamlı rehberler.
        </p>
      </div>

      {/* Accordion Container */}
      <div className="space-y-5">
        
        {/* 1. ACCORDION ITEM: FILM NEDİR? (ANA REHBER) */}
        <div className="rounded-2xl bg-[#180a15] border border-purple-500/30 overflow-hidden shadow-xl shadow-purple-950/20 transition-all duration-200">
          
          {/* Accordion Header / Trigger Button */}
          <button
            type="button"
            onClick={() => toggleSection('film-nedir')}
            className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            aria-expanded={openSections['film-nedir']}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                <Film className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Teknik Rehber
                  </span>
                  <span className="text-[11px] text-white/40 hidden sm:inline">• Analog Film Sınıflandırması</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  Film Nedir? — Sınıflandırma ve Teknik Rehber
                </h2>
                <p className="text-xs text-white/60 line-clamp-1">
                  Boyutlarına, hızlarına (ASA/DIN) ve kimyasal yapılarına göre film çeşitleri.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 text-white/70">
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections['film-nedir'] ? 'rotate-180 text-purple-300' : ''}`} />
            </div>
          </button>

          {/* Accordion Content Body */}
          {openSections['film-nedir'] && (
            <div className="px-5 sm:px-8 pb-8 pt-2 border-t border-white/[0.08] space-y-10 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* Introduction Callout */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
                  Analog fotoğrafta film, ışığa duyarlı kimyasal katmanlardan meydana gelen fiziksel kayıt ortamıdır. Doğru filmi seçmek; çekeceğiniz konunun hareket hızına, mevcut ışık miktarına ve elde etmek istediğiniz gren/keskinlik dokusuna doğrudan etki eder.
                </p>
              </div>

              {/* ---------------------------------------------------- */}
              {/* BÖLÜM 1: BOYUTLARINA GÖRE FİLMLER */}
              {/* ---------------------------------------------------- */}
              <section className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/10 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Boyutlarına Göre Filmler
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 leading-relaxed">
                  <span className="font-semibold text-white">Temel Optik Kuralı: </span>
                  Film formatı büyüdükçe elde edilen görüntünün keskinliği ve detay kapasitesi artarken; küçüldükçe bu özellikler azalır.
                </div>

                {/* Film Size Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                  
                  {/* Büyük Format */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
                        Ultra Detay / Stüdyo
                      </span>
                      <h4 className="text-sm font-bold text-white">Büyük Format</h4>
                      <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                        10 × 12,5 cm, 20 × 25 cm ve daha büyük ölçüdeki tabaka (sheet) filmlerdir. Mimari ve stüdyo çekimlerinde mikroskobik çözünürlük sağlar.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-[10px] text-white/40">
                      Ölçü: 10×12,5 cm ve üzeri
                    </div>
                  </div>

                  {/* Orta Format */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300 block mb-1">
                        120 / 220 Roll
                      </span>
                      <h4 className="text-sm font-bold text-white">Orta Format</h4>
                      <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                        Rulo (roll) halinde, genellikle 4,5 cm veya 6 cm genişliğinde ve 80 cm uzunluğunda şerit formattaki filmlerdir (6×4.5, 6×6, 6×7 karesi).
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-[10px] text-white/40">
                      Ölçü: 6 cm eninde rulo
                    </div>
                  </div>

                  {/* Küçük Format (35mm) */}
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
                        En Yaygın Standart
                      </span>
                      <h4 className="text-sm font-bold text-white">Küçük Format (35mm)</h4>
                      <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
                        18 × 24 mm (half-frame) veya 24 × 36 mm boyutlarındaki dünyada ve kulübümüzde en yaygın kullanılan 135 kasetli film ölçüsüdür.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[10px] text-amber-300/80 font-semibold">
                      Kulüp standardı: 24 × 36 mm
                    </div>
                  </div>

                  {/* Minyatür */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
                        Kompakt Kaset
                      </span>
                      <h4 className="text-sm font-bold text-white">Minyatür Format</h4>
                      <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                        C110 ve benzeri özel, ultra kompakt kaset formatları bu sınıfa dahildir. Minyatür casus ve cep makinelerinde kullanılır.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-[10px] text-white/40">
                      Ölçü: 110 Kaset
                    </div>
                  </div>

                </div>
              </section>

              {/* ---------------------------------------------------- */}
              {/* BÖLÜM 2: HIZLARINA GÖRE FİLMLER (ISO/ASA ve DIN) */}
              {/* ---------------------------------------------------- */}
              <section className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/10 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Hızlarına Göre Filmler (ISO/ASA ve DIN)
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 leading-relaxed">
                  <span className="font-semibold text-white">Temel Gren Kuralı: </span>
                  Film hızı arttıkça ışık ihtiyacı ve pozlama süresi azalır; ancak fotoğrafı oluşturan gümüş kristalleri yani <strong className="text-amber-300">grenler</strong> büyür. Grenlerin büyümesi baskı keskinliğini düşürür.
                </div>

                {/* 4 Speed Tiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Yavaş Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 text-xs">Yavaş Filmler</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                        16 – 40 ASA
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Poz süresi uzundur. Grenler mikroskobik boyutta olduğu için baskılarda en yüksek keskinliği verir. Işık sorununun olmadığı parlak güneşli ortamlarda veya tripodlu durağan çekimlerde tercih edilir.
                    </p>
                  </div>

                  {/* Orta Hızlı Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 text-xs">Orta Hızlı Filmler</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold border border-cyan-500/20">
                        50 – 100 ASA
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      En yaygın kullanılan dengeli hızdır. Gren ve keskinlik dengesi mükemmeldir. Gün ışığı dış mekan çekimleri, sokak ve durağan veya az hareketli konular için idealdir.
                    </p>
                  </div>

                  {/* Hızlı Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-xs">Hızlı Filmler</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                        125 – 400 ASA
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Hareketli sahnelerde, bulutlu havalarda veya gölgeli ışık koşullarında kullanılır. İri grenli yapıları nedeniyle keskinlik bir miktar düşer fakat her koşula uyum sağlar.
                    </p>
                  </div>

                  {/* Çok Hızlı Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 text-xs">Çok Hızlı Filmler</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] font-bold border border-rose-500/20">
                        800 – 3200 ASA
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      Gece çekimleri, konser salonları ve yüksek hızlı hareketler için tasarlanmıştır. Grenler oldukça iridir; kapalı mekanlar ve yetersiz aydınlatma koşullarında kullanılır.
                    </p>
                  </div>

                </div>

                {/* Standards Explanation: ASA vs DIN */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    Film Hız Standartları (ASA ve DIN Mantığı)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <strong className="text-white block font-semibold">ASA (American Standards Association):</strong>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        Aritmetik bir dizi izler. Sayı katlandıkça hassasiyet tam iki katına çıkar (Örn: 100 ASA bir film, 50 ASA bir filmden iki kat daha duyarlıdır).
                      </p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-white block font-semibold">DIN (Deutsches Institut für Normung):</strong>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        Logaritmik bir sisteme dayanır. Her 3 birimlik artışta duyarlılık iki katına çıkar (Örn: 24 DIN, 21 DIN'in iki katı duyarlılıktadır).
                      </p>
                    </div>
                  </div>

                  {/* Conversion Table */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                      ASA / DIN Karşılık Tablosu
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-center text-xs">
                        <thead>
                          <tr className="bg-white/[0.06] border-b border-white/10 text-purple-200">
                            <th className="py-2.5 px-3 font-bold text-left">Ölçüm Birimi</th>
                            <th className="py-2.5 px-3 font-semibold">12 ASA</th>
                            <th className="py-2.5 px-3 font-semibold">50 ASA</th>
                            <th className="py-2.5 px-3 font-semibold">64 ASA</th>
                            <th className="py-2.5 px-3 font-semibold">100 ASA</th>
                            <th className="py-2.5 px-3 font-semibold">160 ASA</th>
                            <th className="py-2.5 px-3 font-semibold">400 ASA</th>
                            <th className="py-2.5 px-3 font-semibold">800 ASA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-left bg-white/[0.02] text-white">ASA</td>
                            <td className="py-2.5 px-3">12</td>
                            <td className="py-2.5 px-3">50</td>
                            <td className="py-2.5 px-3">64</td>
                            <td className="py-2.5 px-3 font-bold text-amber-300">100</td>
                            <td className="py-2.5 px-3">160</td>
                            <td className="py-2.5 px-3 font-bold text-amber-300">400</td>
                            <td className="py-2.5 px-3">800</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-left bg-white/[0.02] text-white">DIN</td>
                            <td className="py-2.5 px-3">12</td>
                            <td className="py-2.5 px-3">18</td>
                            <td className="py-2.5 px-3">19</td>
                            <td className="py-2.5 px-3 font-bold text-amber-300">21</td>
                            <td className="py-2.5 px-3">23</td>
                            <td className="py-2.5 px-3 font-bold text-amber-300">27</td>
                            <td className="py-2.5 px-3">30</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </section>

              {/* ---------------------------------------------------- */}
              {/* BÖLÜM 3: FİLM TÜRLERİ VE YAPILARI */}
              {/* ---------------------------------------------------- */}
              <section className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/10 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Film Türleri ve Yapıları
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Siyah-Beyaz Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      <h4 className="text-sm font-bold text-white">Siyah-Beyaz Filmler</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Esnek bir taban üzerine kaplanmış gümüş bileşiklerinden oluşur (1 mm² alanda yaklaşık bir milyon kristal/gren bulunur). Üstteki ince jelatin tabaka bileşikleri korur ve banyo/kurutma sırasında filmin kıvrılmasını önler. Negatiften pozitif görüntü elde etmek için karanlık odada siyah-beyaz kartlara agrandisörle baskı yapılır.
                    </p>
                  </div>

                  {/* Renkli Negatif Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-400"></div>
                      <h4 className="text-sm font-bold text-white">Renkli Negatif Filmler (C-41)</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Üst üste üç ana renge duyarlı fonksiyonel tabakadan (üstten alta: <strong>mavi, yeşil, kırmızı</strong>) meydana gelir. Mavi ışığın alt tabakalara sızmasını önlemek için mavi duyarlı tabakanın altına sarı bir filtre konur. Geliştirme banyosunda her tabaka tamamlayıcı boyalarla (sarı, magenta, cyan) boyanır ve gümüş bileşikleri temizlenerek renkli negatif elde edilir.
                    </p>
                  </div>

                  {/* Renkli ve Siyah-Beyaz Pozitif Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <h4 className="text-sm font-bold text-white">Renkli ve Siyah-Beyaz Pozitif Filmler (Dia / Slayt)</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Projeksiyon veya direkt baskı amacıyla kullanılırlar. Siyah-beyaz pozitifler, renkli pozitiflerle benzer yapıdadır ancak yalnızca siyah-beyaz tonları ortaya çıkaracak bileşenler içerir. Banyo işlemi bittiğinde film doğrudan pozitif görüntü verir.
                    </p>
                  </div>

                  {/* Polaroid (Anında Görüntü) Filmler */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-pink-400"></div>
                      <h4 className="text-sm font-bold text-white">Polaroid (Anında Görüntü) Filmler</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Boya maddesinin ve banyo kimyasallarının kartuş içinde hazır bulunduğu sistemlerdir. Fotoğraf makineden çekilme esnasında silindirler aracılığıyla kimyasal kart üzerine homojen şekilde yayılır ve birkaç dakika içinde anında pozitif görüntü oluşur.
                    </p>
                  </div>

                  {/* APS (Advanced Photo System) */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-400"></div>
                      <h4 className="text-sm font-bold text-white">APS (Advanced Photo System)</h4>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      35mm'den küçük, 24 mm eninde kartuşlu sistemlerdir. Çekim sırasında 9/16 oranında kaydedilen kareler isteğe göre klasik (C), orta (H) veya panoramik (P) formatlarda basılabilir. Kartuşun film bitmeden çıkartılıp daha sonra tekrar makineye takılabilmesi ve manyetik şeride çekim tarihi/mekan gibi verilerin basılabilmesi büyük bir teknolojik avantaj sağlamıştır.
                    </p>
                  </div>

                </div>
              </section>

              {/* Kulüp Karanlık Oda Çağrısı */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#301322] via-[#22101b] to-[#180a15] border border-[#657796]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Davutpaşa Karanlık Oda</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Çektiğiniz Siyah-Beyaz Filmleri Kulübümüzde Banyo Edin
                  </h4>
                  <p className="text-xs text-white/70 max-w-xl">
                    Kulüpler Vadisi'ndeki karanlık odamızda tank banyosu yapabilir ve agrandisörle kart baskısı alabilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('darkroom')}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#12080f] hover:bg-white/90 text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Droplets className="w-3.5 h-3.5 text-purple-700" />
                  <span>Karanlık Odaya Git</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}
        </div>

        {/* 2. ACCORDION ITEM: POZLAMA ÜÇGENİ (KISA & ÖZ REHBER) */}
        <div className="rounded-2xl bg-[#180a15] border border-white/10 overflow-hidden shadow-lg transition-all duration-200">
          <button
            type="button"
            onClick={() => toggleSection('pozlama-ucgeni')}
            className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            aria-expanded={openSections['pozlama-ucgeni']}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Temel Fotoğraf
                  </span>
                  <span className="text-[11px] text-white/40 hidden sm:inline">• Diyafram • Enstantane • ISO</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  Pozlama Üçgeni Nedir?
                </h2>
                <p className="text-xs text-white/60 line-clamp-1">
                  Fotoğrafın aydınlığını ve kompozisyonunu belirleyen üç temel ayağın çalışma mantığı.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 text-white/70">
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections['pozlama-ucgeni'] ? 'rotate-180 text-cyan-300' : ''}`} />
            </div>
          </button>

          {openSections['pozlama-ucgeni'] && (
            <div className="px-5 sm:px-8 pb-8 pt-2 border-t border-white/[0.08] space-y-6 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
              <p className="text-white/80 leading-relaxed">
                Pozlama üçgeni; fotoğraf makinesinin sensörüne veya filmine ne kadar ışık gireceğini belirleyen <strong>Diyafram</strong>, <strong>Enstantane</strong> ve <strong>ISO</strong> değişkenlerinin dengesidir. Bir değeri değiştirdiğinizde aynı poz parlaklığını korumak için diğerlerinden birini dengelemeniz gerekir.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="font-bold text-amber-300 text-xs block">1. Diyafram (Aperture - f/)</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Lense giren ışık miktarını ve <strong>alan derinliğini</strong> belirler. Küçük f sayısı (f/1.4, f/2.8) arka planı bulanıklaştırır (bokeh). Büyük f sayısı (f/8, f/16) tüm kareyi keskinleştirir.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="font-bold text-amber-300 text-xs block">2. Enstantane (Shutter Speed)</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Perdenin açık kalma süresidir. Hızlı enstantane (1/1000s) hareketi dondurur (spor/kuş). Yavaş enstantane (1/2s, Bulb) su akışını ve ışık izlerini pürüzsüzleştirir.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="font-bold text-amber-300 text-xs block">3. ISO (Hassasiyet)</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Sensörün ışığa olan elektriksel hassasiyetidir. Düşük ISO (100) en temiz görüntüyü verir. Yüksek ISO (3200+) karanlıkta çekim yapmayı sağlar ancak gren/kumlanma artar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. ACCORDION ITEM: KARANLIK ODA BANYO AŞAMALARI */}
        <div className="rounded-2xl bg-[#180a15] border border-white/10 overflow-hidden shadow-lg transition-all duration-200">
          <button
            type="button"
            onClick={() => toggleSection('karanlik-oda-banyo')}
            className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            aria-expanded={openSections['karanlik-oda-banyo']}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                <Droplets className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Karanlık Oda
                  </span>
                  <span className="text-[11px] text-white/40 hidden sm:inline">• Kimyasal Süreçler</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  Siyah-Beyaz Film Banyosu Nasıl Yapılır?
                </h2>
                <p className="text-xs text-white/60 line-clamp-1">
                  Geliştirici (Developer), Durdurucu (Stop Bath) ve Sabitleyici (Fixer) temel adımları.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 text-white/70">
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections['karanlik-oda-banyo'] ? 'rotate-180 text-emerald-300' : ''}`} />
            </div>
          </button>

          {openSections['karanlik-oda-banyo'] && (
            <div className="px-5 sm:px-8 pb-8 pt-2 border-t border-white/[0.08] space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
              <p className="text-white/80 leading-relaxed">
                Siyah-beyaz film banyosu, ışık almayan zifiri karanlık ortamda filmin spirale sarılıp tanka yerleştirilmesiyle başlar. Tank kapağı kapandıktan sonra ışıklı ortamda kimyasal adımlara geçilir:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="font-bold text-emerald-300 text-xs block">1. Geliştirici (Developer)</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Işık görmüş gümüş tuzlarını metalik gümüşe dönüştürerek gizli görüntüyü görünür hale getirir. Sıcaklık (genellikle 20°C) ve süre hassastır.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="font-bold text-cyan-300 text-xs block">2. Durdurucu (Stop Bath)</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Hafif asidik solüsyon, geliştiricinin alkali etkisini anında nötürleyerek geliştirme sürecini saniyesinde durdurur ve sabitleyicinin ömrünü korur.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="font-bold text-amber-300 text-xs block">3. Sabitleyici (Fixer)</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Işık görmemiş duyarlı gümüş tuzlarını filmden temizler. Bu adımdan sonra film ışığa karşı tamamen kararlı hale gelir ve tank açılabilir.
                  </p>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-white/60">
                Son adımda film 10-15 dakika bol suyla yıkanır, damla önleyici solüsyona (Photo-Flo / Agepon) batırılır ve tozsuz ortamda kurumaya bırakılır.
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
