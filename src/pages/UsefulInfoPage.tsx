import React, { useState } from 'react';
import { 
  ChevronDown, 
  ArrowUpRight,
  Plus,
  Minus
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
    'karanlik-oda': false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24 space-y-16">
      
      {/* 1. Page Header (Editorial & Clean Whitespace) */}
      <header className="space-y-4 max-w-3xl">
        <div className="text-[11px] font-mono font-medium tracking-[0.2em] uppercase text-white/40">
          Akademi & Arşiv
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-club leading-[1.08]">
          Faydalı Bilgiler
        </h1>
        <p className="text-base sm:text-lg text-white/60 font-normal leading-relaxed pt-1">
          Analog fotoğrafçılık disiplini, film kimyası, karanlık oda teknikleri ve optik standartlara dair teknik referans rehberleri.
        </p>
      </header>

      {/* 2. Editorial Accordion Stack */}
      <div className="border-t border-white/[0.08] divide-y divide-white/[0.08]">
        
        {/* ================================================================= */}
        {/* ACCORDION 01: FİLM NEDİR? (ANA REHBER) */}
        {/* ================================================================= */}
        <section className="py-2">
          
          {/* Header Row Button */}
          <button
            type="button"
            onClick={() => toggleSection('film-nedir')}
            className="w-full py-8 sm:py-10 flex items-start sm:items-center justify-between gap-6 text-left group cursor-pointer transition-colors"
            aria-expanded={openSections['film-nedir']}
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-white/30 tracking-wider">01</span>
                <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/40">
                  Teknik Kılavuz
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white group-hover:text-white/80 transition-colors">
                Film Nedir? — Sınıflandırma ve Teknik Rehber
              </h2>
              <p className="text-xs sm:text-sm text-white/50 font-normal pt-0.5">
                Boyutlarına, hızlarına (ISO/ASA ve DIN) ve kimyasal yapılarına göre film çeşitleri.
              </p>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0 text-white/40 group-hover:text-white transition-colors">
              {openSections['film-nedir'] ? (
                <Minus className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Plus className="w-5 h-5 stroke-[1.5]" />
              )}
            </div>
          </button>

          {/* Accordion Body: Editorial Typography & Grid */}
          {openSections['film-nedir'] && (
            <div className="pb-16 pt-2 space-y-20 animate-in fade-in duration-200">
              
              {/* Introduction Note */}
              <div className="border-l-2 border-white/20 pl-6 max-w-3xl">
                <p className="text-sm sm:text-base text-white/70 font-normal leading-relaxed">
                  Film; şeffaf ve esnek bir taban üzerine kaplanmış, ışığa duyarlı gümüş halojenür kristallerinden oluşan fiziksel bir kayıt ortamıdır. Doğru filmin seçimi; ışık koşullarına, perde hızına ve fotoğrafta hedeflenen gren dokusu ile baskı keskinliğine doğrudan yön verir.
                </p>
              </div>

              {/* ---------------------------------------------------- */}
              {/* BÖLÜM 1: BOYUTLARINA GÖRE FİLMLER */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-8">
                <div className="space-y-2 max-w-2xl">
                  <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-white/40">
                    Bölüm 01
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    Boyutlarına Göre Filmler
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Film formatı büyüdükçe elde edilen görüntünün keskinliği ve detay kapasitesi artarken, küçüldükçe bu özellikler azalır.
                  </p>
                </div>

                {/* Clean Editorial Columns (No box borders, purely whitespace & hairlines) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pt-2">
                  
                  {/* Büyük Format */}
                  <div className="border-t border-white/[0.08] pt-4 space-y-2.5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                      Ölçü: 10×12,5 cm+
                    </div>
                    <h4 className="text-base font-semibold text-white tracking-tight">
                      Büyük Format
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      10 × 12,5 cm, 20 × 25 cm ve daha büyük ölçüdeki tekli tabaka (sheet) filmlerdir. Mimari ve stüdyo reprodüksiyonlarında mikroskobik detay sunar.
                    </p>
                  </div>

                  {/* Orta Format */}
                  <div className="border-t border-white/[0.08] pt-4 space-y-2.5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                      Ölçü: 6 cm Roll
                    </div>
                    <h4 className="text-base font-semibold text-white tracking-tight">
                      Orta Format
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Rulo halinde, genellikle 4,5 cm veya 6 cm genişliğinde ve 80 cm uzunluğundaki şerit filmlerdir (6×4.5, 6×6, 6×7 kadraj standartları).
                    </p>
                  </div>

                  {/* Küçük Format (35mm) */}
                  <div className="border-t border-white/20 pt-4 space-y-2.5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/80">
                      Ölçü: 24×36 mm (135)
                    </div>
                    <h4 className="text-base font-semibold text-white tracking-tight">
                      Küçük Format (35mm)
                    </h4>
                    <p className="text-xs text-white/70 leading-relaxed">
                      18 × 24 mm veya 24 × 36 mm boyutlarındaki en yaygın film standardıdır. Kulübümüzün analog gövdeleri bu formatla çalışır.
                    </p>
                  </div>

                  {/* Minyatür */}
                  <div className="border-t border-white/[0.08] pt-4 space-y-2.5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                      Ölçü: 110 Kaset
                    </div>
                    <h4 className="text-base font-semibold text-white tracking-tight">
                      Minyatür
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      C110 gibi özel ve kompakt kaset formatları bu sınıfa dahildir. Ultra kompakt cep makinelerinde kullanılır.
                    </p>
                  </div>

                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* BÖLÜM 2: HIZLARINA GÖRE FİLMLER (ISO/ASA ve DIN) */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-white/40">
                    Bölüm 02
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    Hızlarına Göre Filmler (ISO/ASA ve DIN)
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Film hızı arttıkça ışık ihtiyacı ve pozlama süresi azalır; ancak fotoğrafı oluşturan gümüş kristalleri (grenler) büyür. Grenlerin büyümesi baskı keskinliğini düşürür.
                  </p>
                </div>

                {/* 4 Speed Categories (Hairline editorial rows) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                  
                  {/* Yavaş Filmler */}
                  <div className="border-t border-white/[0.08] pt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Yavaş Filmler
                      </h4>
                      <span className="text-xs font-mono text-white/50">16 – 40 ASA</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Poz süresi uzundur. Grenler mikroskobik boyutta olduğu için baskılarda yüksek keskinlik sağlarlar. Işık sorununun olmadığı ortamlarda veya durağan çekimlerde tercih edilir.
                    </p>
                  </div>

                  {/* Orta Hızlı Filmler */}
                  <div className="border-t border-white/[0.08] pt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Orta Hızlı Filmler
                      </h4>
                      <span className="text-xs font-mono text-white/50">50 – 100 ASA</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      En yaygın kullanılan film hızlarındandır. Dengeli bir görüntü ve keskinlik sunar; dış mekan çekimleri ile durağan veya az hareketli konular için idealdir.
                    </p>
                  </div>

                  {/* Hızlı Filmler */}
                  <div className="border-t border-white/[0.08] pt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Hızlı Filmler
                      </h4>
                      <span className="text-xs font-mono text-white/50">125 – 400 ASA</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Hareketli sahnelerde veya yetersiz ışık koşullarında kullanılır. İri grenli yapıları nedeniyle keskinlik bir miktar düşer.
                    </p>
                  </div>

                  {/* Çok Hızlı Filmler */}
                  <div className="border-t border-white/[0.08] pt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Çok Hızlı Filmler
                      </h4>
                      <span className="text-xs font-mono text-white/50">800 – 3200 ASA</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Gece çekimleri ve yüksek hızlı hareketler için tasarlanmıştır. Grenler çok iridir; kapalı mekanlar ve yetersiz aydınlatma koşullarında kullanılır.
                    </p>
                  </div>

                </div>

                {/* Film Speed Standards & Apple Tech Specs Table */}
                <div className="pt-4 space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white tracking-tight">
                      Film Hız Standartları: ASA vs DIN
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed max-w-3xl">
                      <strong>ASA (American Standards Association):</strong> Aritmetik bir dizi izler; örneğin 100 ASA'lık bir film, 50 ASA'lık bir filmden iki kat daha duyarlıdır.<br />
                      <strong>DIN (Deutsches Institut für Normung):</strong> Logaritmik bir sisteme dayanır ve her 3 birimlik artışta duyarlılık iki katına çıkar (Örn: 24 DIN, 21 DIN'in iki katı duyarlılıktadır).
                    </p>
                  </div>

                  {/* Apple Style Minimalist Tech Spec Table */}
                  <div className="overflow-x-auto border-t border-b border-white/[0.08]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-white/40">
                          <th className="py-3.5 pr-6 font-medium">Birim</th>
                          <th className="py-3.5 px-4 font-medium text-center">Ultra Yavaş</th>
                          <th className="py-3.5 px-4 font-medium text-center">Yavaş</th>
                          <th className="py-3.5 px-4 font-medium text-center">Düşük</th>
                          <th className="py-3.5 px-4 font-medium text-center text-white">Standart</th>
                          <th className="py-3.5 px-4 font-medium text-center">Orta</th>
                          <th className="py-3.5 px-4 font-medium text-center text-white">Çok Yönlü</th>
                          <th className="py-3.5 pl-4 font-medium text-center">Hızlı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-white/80">
                        <tr>
                          <td className="py-3 pr-6 font-semibold text-white font-sans">ASA</td>
                          <td className="py-3 px-4 text-center">12</td>
                          <td className="py-3 px-4 text-center">50</td>
                          <td className="py-3 px-4 text-center">64</td>
                          <td className="py-3 px-4 text-center font-bold text-white">100</td>
                          <td className="py-3 px-4 text-center">160</td>
                          <td className="py-3 px-4 text-center font-bold text-white">400</td>
                          <td className="py-3 pl-4 text-center">800</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-6 font-semibold text-white font-sans">DIN</td>
                          <td className="py-3 px-4 text-center">12</td>
                          <td className="py-3 px-4 text-center">18</td>
                          <td className="py-3 px-4 text-center">19</td>
                          <td className="py-3 px-4 text-center font-bold text-white">21</td>
                          <td className="py-3 px-4 text-center">23</td>
                          <td className="py-3 px-4 text-center font-bold text-white">27</td>
                          <td className="py-3 pl-4 text-center">30</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* ---------------------------------------------------- */}
              {/* BÖLÜM 3: FİLM TÜRLERİ VE YAPILARI */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-8">
                <div className="space-y-2 max-w-2xl">
                  <div className="text-[11px] font-mono tracking-[0.16em] uppercase text-white/40">
                    Bölüm 03
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    Film Türleri ve Yapıları
                  </h3>
                </div>

                {/* Vertical Hairline Editorial List */}
                <div className="border-t border-white/[0.08] divide-y divide-white/[0.08]">
                  
                  {/* Siyah-Beyaz Filmler */}
                  <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Siyah-Beyaz Filmler
                      </h4>
                      <span className="text-[11px] font-mono text-white/40 block mt-0.5">Gümüş Halojenür</span>
                    </div>
                    <div className="md:col-span-8 text-xs text-white/70 leading-relaxed">
                      Esnek bir taban üzerine kaplanmış gümüş bileşiklerinden oluşur (1 mm² alanda yaklaşık bir milyon kristal/gren bulunur). Üstteki ince jelatin tabaka bileşikleri korur ve banyo/kurutma sırasında filmin kıvrılmasını önler. Negatiften pozitif görüntü elde etmek için siyah-beyaz kartlara baskı yapılır.
                    </div>
                  </div>

                  {/* Renkli Negatif Filmler */}
                  <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Renkli Negatif Filmler
                      </h4>
                      <span className="text-[11px] font-mono text-white/40 block mt-0.5">C-41 Süreci</span>
                    </div>
                    <div className="md:col-span-8 text-xs text-white/70 leading-relaxed">
                      Üst üste üç ana renge duyarlı fonksiyonel tabakadan (üstten alta sırasıyla: <strong>mavi, yeşil, kırmızı</strong>) meydana gelir. Mavi ışığın alt tabakalara sızmasını önlemek için mavi duyarlı tabakanın altına sarı bir filtre konur. Geliştirme banyosunda her tabaka kendi karakterine uygun boya maddeleriyle (mavi için sarı, yeşil için magenta, kırmızı için cyan) boyanır ve gümüş bileşikleri temizlenerek renkli negatif elde edilir.
                    </div>
                  </div>

                  {/* Renkli ve Siyah-Beyaz Pozitif Filmler */}
                  <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Pozitif Filmler (Dia / Slayt)
                      </h4>
                      <span className="text-[11px] font-mono text-white/40 block mt-0.5">E-6 / Direkt Pozitif</span>
                    </div>
                    <div className="md:col-span-8 text-xs text-white/70 leading-relaxed">
                      Projeksiyon veya direkt baskı amacıyla kullanılırlar. Siyah-beyaz pozitifler, renkli pozitiflerle benzer yapıdadır ancak yalnızca siyah-beyaz tonları ortaya çıkaracak bileşenler içerir.
                    </div>
                  </div>

                  {/* Polaroid (Anında Görüntü) Filmler */}
                  <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        Polaroid (Anında Görüntü)
                      </h4>
                      <span className="text-[11px] font-mono text-white/40 block mt-0.5">Entegre Kimyasal Kartuş</span>
                    </div>
                    <div className="md:col-span-8 text-xs text-white/70 leading-relaxed">
                      Boya maddesinin ve kimyasalların kartuş içinde hazır bulunduğu, makineden çekilme sırasında silindirler aracılığıyla kimyasalın homojen şekilde yayıldığı ve anında pozitif görüntü veren sistemlerdir.
                    </div>
                  </div>

                  {/* APS (Advanced Photo System) */}
                  <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <h4 className="text-base font-semibold text-white tracking-tight">
                        APS (Advanced Photo System)
                      </h4>
                      <span className="text-[11px] font-mono text-white/40 block mt-0.5">24 mm Manyetik Şerit</span>
                    </div>
                    <div className="md:col-span-8 text-xs text-white/70 leading-relaxed">
                      35mm'den küçük, 24 mm eninde kartuşlu sistemlerdir. Çekim sırasında 9/16 oranında kaydedilen kareler isteğe göre klasik, orta veya panoramik formatlarda basılabilir. Kartuşun film bitmeden değiştirilebilmesi ve index sayfalarına çekim tarihi/mekan gibi verilerin basılabilmesi büyük avantaj sağlar.
                    </div>
                  </div>

                </div>
              </div>

              {/* Minimalist Footnote: Darkroom Callout */}
              <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                <p className="text-xs text-white/50 max-w-xl leading-relaxed">
                  YTÜFOK Karanlık Oda Atölyeleri — Kulüpler Vadisi'ndeki karanlık odamızda siyah-beyaz film banyosu yapabilir ve agrandisörle kart baskısı alabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('darkroom')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-white/70 transition-colors cursor-pointer group"
                >
                  <span>Karanlık Oda Rezervasyonu</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* ACCORDION 02: POZLAMA ÜÇGENİ */}
        {/* ================================================================= */}
        <section className="py-2">
          <button
            type="button"
            onClick={() => toggleSection('pozlama-ucgeni')}
            className="w-full py-8 sm:py-10 flex items-start sm:items-center justify-between gap-6 text-left group cursor-pointer transition-colors"
            aria-expanded={openSections['pozlama-ucgeni']}
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-white/30 tracking-wider">02</span>
                <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/40">
                  Temel Prensipler
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white group-hover:text-white/80 transition-colors">
                Pozlama Üçgeni Nedir?
              </h2>
              <p className="text-xs sm:text-sm text-white/50 font-normal pt-0.5">
                Fotoğrafın parlaklığını ve kompozisyonunu belirleyen Diyafram, Enstantane ve ISO dengesi.
              </p>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0 text-white/40 group-hover:text-white transition-colors">
              {openSections['pozlama-ucgeni'] ? (
                <Minus className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Plus className="w-5 h-5 stroke-[1.5]" />
              )}
            </div>
          </button>

          {openSections['pozlama-ucgeni'] && (
            <div className="pb-16 pt-2 space-y-10 animate-in fade-in duration-200">
              <p className="text-sm text-white/70 font-normal leading-relaxed max-w-3xl border-l-2 border-white/20 pl-6">
                Pozlama üçgeni; sensör veya filme ulaşan ışık miktarını kontrol eden üç ayağın (Diyafram, Perde Süresi ve Hassasiyet) birbirine olan geometrik bağımlılığıdır. Herhangi bir parametredeki 1 duraklık değişim, poz dengesini korumak için diğer parametrelerden biriyle dengelenmelidir.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                <div className="border-t border-white/[0.08] pt-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">01 / Işık & Alan Derinliği</div>
                  <h4 className="text-base font-semibold text-white tracking-tight">Diyafram (f/)</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Lense giren ışık debisini ve alan derinliğini yönetir. f/1.4 gibi küçük değerler arka planı bulanıklaştırırken (bokeh), f/8 ve f/11 gibi değerler tüm kadrajı netleştirir.
                  </p>
                </div>

                <div className="border-t border-white/[0.08] pt-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">02 / Süre & Hareket</div>
                  <h4 className="text-base font-semibold text-white tracking-tight">Enstantane (Shutter)</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Sensörün ışığa maruz kaldığı süredir. 1/1000s hareketi dondururken, 1/2s veya daha uzun pozlamalar su ve ışık akışlarında pürüzsüz hareket izi oluşturur.
                  </p>
                </div>

                <div className="border-t border-white/[0.08] pt-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">03 / Duyarlılık & Gren</div>
                  <h4 className="text-base font-semibold text-white tracking-tight">ISO / Hassasiyet</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Filmin veya sensörün ışığa karşı duyarlılık katsayısıdır. Düşük ISO (100) en keskin ve temiz sonucu sunarken, yüksek ISO (3200+) karanlıkta çekim sağlar fakat gren üretir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* ACCORDION 03: KARANLIK ODA BANYO AŞAMALARI */}
        {/* ================================================================= */}
        <section className="py-2">
          <button
            type="button"
            onClick={() => toggleSection('karanlik-oda')}
            className="w-full py-8 sm:py-10 flex items-start sm:items-center justify-between gap-6 text-left group cursor-pointer transition-colors"
            aria-expanded={openSections['karanlik-oda']}
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-white/30 tracking-wider">03</span>
                <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/40">
                  Kimyasal Süreç
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white group-hover:text-white/80 transition-colors">
                Siyah-Beyaz Film Banyosu Nasıl Yapılır?
              </h2>
              <p className="text-xs sm:text-sm text-white/50 font-normal pt-0.5">
                Geliştirici (Developer), Durdurucu (Stop Bath) ve Sabitleyici (Fixer) temel kimyasal döngüsü.
              </p>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0 text-white/40 group-hover:text-white transition-colors">
              {openSections['karanlik-oda'] ? (
                <Minus className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Plus className="w-5 h-5 stroke-[1.5]" />
              )}
            </div>
          </button>

          {openSections['karanlik-oda'] && (
            <div className="pb-16 pt-2 space-y-10 animate-in fade-in duration-200">
              <p className="text-sm text-white/70 font-normal leading-relaxed max-w-3xl border-l-2 border-white/20 pl-6">
                Film banyosu, mutlak karanlıkta filmin spirale sarılıp tanka kilitlenmesiyle başlar. Tank kapağı kapandıktan sonra süreç ışıklı ortamda kimyasal banyo adımlarıyla tamamlanır.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                <div className="border-t border-white/[0.08] pt-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Adım 01 / 20°C</div>
                  <h4 className="text-base font-semibold text-white tracking-tight">Geliştirici (Developer)</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Işığa maruz kalmış gümüş halojenürleri metalik gümüşe dönüştürür. Süre ve ısı (standart 20°C) filmin kontrastını ve gren yapısını belirler.
                  </p>
                </div>

                <div className="border-t border-white/[0.08] pt-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Adım 02 / ~1 Dakika</div>
                  <h4 className="text-base font-semibold text-white tracking-tight">Durdurucu (Stop Bath)</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Hafif asidik solüsyon, alkali geliştiricinin etkisini derhal keser. Gelişmeyi saniyesinde dondurarak sabitleyicinin kimyasal ömrünü korur.
                  </p>
                </div>

                <div className="border-t border-white/[0.08] pt-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Adım 03 / ~5 Dakika</div>
                  <h4 className="text-base font-semibold text-white tracking-tight">Sabitleyici (Fixer)</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Işık görmemiş duyarlı gümüş tuzlarını filmden tamamen temizler. Bu adımdan sonra film ışığa karşı kararlı hale gelir ve tank açılabilir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>

    </div>
  );
};
