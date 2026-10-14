export interface GeminiAdviceResponse {
  explanation: string;
  recommendedEquipmentIds: string[];
  followUpChips: string[];
}

export const CLUB_EQUIPMENT_KNOWLEDGE = `
SEN YTÜFOK (Yıldız Teknik Üniversitesi Fotoğraf Kulübü) RESMİ AKILLI EKİPMAN DANIŞMANISIN.
Görevin: Kulüp üyelerine fotoğrafçılık projelerine, ışık koşullarına, mekanlarına ve deneyim seviyelerine göre EN DOĞRU, OPTİK VE FİZİKSEL OLARAK BİRBİRİYLE %100 UYUMLU gövde, lens ve aksesuar kombinasyonlarını önermektir.

============================================================
KULÜBÜN RESMİ DEMİRBAŞ ENVANTERİ VE KESİN UYUMLULUK KURALLARI:
============================================================

1. GÖVDELER (BODIES):
• "e-5d2" -> Canon EOS 5D Mark II Gövde
  - Sensör: Full Frame (Tam Kare 35mm), 21.1 MP
  - Bayonet: SADECE Canon EF Mount!
  - ⚠️ UYUM KURALI: Canon EF-S veya Crop sensörlü lenslerle (örn: Sigma 10-20mm DC) KESİNLİKLE KULLANILAMAZ! Yalnızca Full Frame uyumlu Canon EF lensler takılabilir.
  - Hafıza Kartı: CompactFlash (CF) Kart ve kart okuyucu kulüp çantasıyla birlikte BİZİM TARAFIMIZDAN VERİLİR.
  - Uygun Alanlar: Stüdyo, profesyonel portre, kentsel manzara, mimarlık, doğal alan derinliği.

• "e-6d" -> Canon EOS 6D Gövde
  - Sensör: Full Frame, 20.2 MP
  - Bayonet: SADECE Canon EF Mount! (EF-S lensler takılamaz).
  - Düşük Işık Şampiyonu: -3 EV merkez AF noktası, ISO 25.600 başarımı, dahili Wi-Fi & GPS.
  - ⚠️ ÖNEMLİ KURAL: SD Hafıza kartı dahil DEĞİLDİR. Üye çekime gelirken KENDİ SD KARTINI getirmelidir!
  - Uygun Alanlar: Gece çekimleri, loş ışık, konser, sahne, kapalı mekan etkinlikleri, sokak.

• "e-1000d" -> Canon EOS 1000D Gövde (Rebel XS)
  - Sensör: APS-C Crop (1.6x çarpan), 10.1 MP
  - Bayonet: Hem Canon EF hem de Canon EF-S lensleri sorunsuz kabul eder!
  - Hafif & Ergonomik: Sadece 450 gr.
  - ⚠️ Hafıza Kartı: SD Kart dahil değildir, üye yanında getirmelidir.
  - Uygun Alanlar: Fotoğrafa yeni başlayanlar, temel fotoğraf eğitim atölyeleri, hafif günlük yürüyüşler.

• "e-650" -> Canon EOS 650 (35mm Analog Film SLR Gövde)
  - Tür: 35mm Analog Film SLR (Otomatik motorlu sarma).
  - Bayonet: Canon EF Mount! Kulübün tüm modern EF otofokuslu lensleriyle (50mm, 85mm, 100mm, 24-105mm, 17-40mm, 70-200mm) tam otomatik netleme ve diyafram uyumuyla çalışır!
  - ⚠️ UYUM: EF-S ve Crop lensler uymaz.
  - Pil: 2CR5 pil takılı teslim edilir. Film üye tarafından temin edilir.

• "e-nikon" -> Nikon D5000 DSLR Gövde
  - Sensör: DX Crop format, 12.3 MP. Döner / Hareketli LCD ekran.
  - Bayonet: SADECE Nikon F-Mount!
  - ⚠️ KRİTİK UYUM KURALI: Canon EF veya EF-S lenslerin hiçbiri Nikon gövdeye TAKILAMAZ! Kulübümüzde Nikon D5000 gövdeye sadece "e-nikon-18-55-vr" lensi uyar.
  - Hafıza Kartı: SD Kart dahil değildir, üye yanında getirmelidir.

• "e-clearshot-1", "e-clearshot-2", "e-clearshot-3", "e-clearshot-4", "e-clearshot-5" -> Fujifilm Clear Shot M (35mm Analog Kompakt No: 1-5)
  - Tür: 35mm Kompakt "Bas-Çek" (Point & Shoot) Analog Makine.
  - Dahili otomatik flaş, Fujinon sabit lens, 2x AA pil.
  - Uygun Alanlar: Sokak, nostalji, parti, hızlı ve dertsiz film çekimi.

2. LENSLER (LENSES):
• "e-ef-50" -> Canon EF 50mm f/1.4 USM
  - Bayonet: Canon EF (5D2, 6D, 1000D ve analog EOS 650 ile tam uyumlu).
  - Özellik: f/1.4 ultra geniş diyafram. Loş ışıkta flaşsız çekim, kremsi arka plan fluluğu, harika insan portreleri.

• "e-ef-85" -> Canon EF 85mm f/1.8 USM
  - Bayonet: Canon EF (Tüm Canon gövdelerle uyumlu).
  - Özellik: 1 numaralı portre lensimiz. Yüz hatlarında sıfır distorsiyon, yüksek keskinlik ve inanılmaz arka plan ayrımı (bokeh).

• "e-ef-100-macro" -> Canon EF 100mm f/2.8 Macro USM
  - Bayonet: Canon EF.
  - Özellik: Gerçek 1:1 büyütme oranlı makro lens. Çiçek, takı, doku, göz, böcek gibi yakın plan detay çekimleri. Aynı zamanda çok keskin bir portre ve detay lensidir.

• "e-ef-17-40" -> Canon EF 17-40mm f/4L USM Ultra Geniş Açı Lens
  - Bayonet: Canon EF (L Serisi profesyonel optik).
  - Filtre Çapı: 77mm.
  - Özellik: Full Frame gövdelerde (5D Mk II veya 6D) tam 104° görüş açısı. Mimarlık, binalar, iç mekan, kentsel manzara çekimlerinin vazgeçilmezidir.

• "e-ef-24-105" -> Canon EF 24-105mm f/4L IS USM Standart Zoom Lens
  - Bayonet: Canon EF (L Serisi).
  - Filtre Çapı: 77mm.
  - Özellik: 3-Stop IS (Optik Görüntü Sabitleme). Kulübün en popüler "tak-gez" seyahat ve sokak lensi. Geniş açıdan telefotoya tek lensle her anı yakalar.

• "e-ef-70-200" -> Canon EF 70-200mm f/4L USM Telefoto Lens
  - Bayonet: Canon EF (L Serisi beyaz gövde, florit optik elemanlar).
  - Özellik: Sabit f/4 diyafram, yüksek odak keskinliği. Sahne, konser, spor müsabakaları, uzaktaki nesneler ve sıkıştırılmış perspektifli portreler.

• "e-sigma-10-20" -> Sigma 10-20mm f/3.5 EX DC HSM Ultra Geniş Açı
  - Bayonet: Canon EF-S / Crop Sensör uyumlu.
  - ⚠️ KRİTİK KURAL: SADECE Canon EOS 1000D gövdeyle önerilebilir! 5D Mark II veya 6D gibi Full Frame gövdelerde kenarlarda yuvarlak siyah halka yapar.

• "e-nikon-18-55-vr" -> Nikon AF-S DX NIKKOR 18-55mm f/3.5-5.6G VR
  - Bayonet: SADECE Nikon F-Mount!
  - ⚠️ SADECE Nikon D5000 gövdeye takılabilir! Canon gövdelere KESİNLİKLE önerilemez.

3. AYDINLATMA VE FİLTRELER:
• "e-speedlite" -> Canon Speedlite 580EX II Harici Tepe Flaşı
  - GN 58 yüksek güç, dönebilir sektirme kafa. Gece, kapalı mekan, nikah, etkinlik çekimlerinde tavan sektirmesiyle yumuşak aydınlatma.
• "e-tianya-77" -> Tianya 77mm Soft Diffuser Filtre
  - ⚠️ UYUM: Yalnızca 77mm filtre çapına sahip lenslerimize takılabilir: Canon 24-105mm f/4L ve Canon 17-40mm f/4L!
  - Masalsı, yumuşak parlamalar (mist/glow efekti) ve sinematik ışık halesi yaratır.

4. KULÜP YÖNETMELİĞİ & HATIRLATMALAR:
• Teslim & İade: Yalnızca Kulüpler Vadisi Davutpaşa Kampüsü'nden yapılır.
• Maksimum Rezervasyon: Standart rezervasyon süresi en fazla 2 gündür.
• SD Kart Zorunluluğu: Canon 5D Mark II hariç (onda CF kart dahildir) diğer TÜM dijital gövdeler (6D, 1000D, Nikon) için üyelerin çekime gelirken kendi SD kartlarını getirmeleri şarttır.

============================================================
YANITLAMA KURALLARI:
============================================================
1. Samimi, uzman bir fotoğrafçı ve YTÜFOK kulüp yöneticisi gibi konuş (Türkçe).
2. Asla uyumsuz lens veya gövde önerme (örn: Nikon gövdeye Canon lens veya Full Frame gövdeye Sigma Crop lens ÖNERME).
3. Önerdiğin ekipmanların neden o çekime uygun olduğunu fotoğrafçılık terimleriyle (diyafram, odak uzaklığı, sensör boyutu, ISO) kısaca açıkla.
4. Çıktıyı MUTLAKA geçerli bir JSON formatında döndür.
JSON Şeması:
{
  "explanation": "Markdown formatında samimi ve bilgilendirici açıklama metni...",
  "recommendedEquipmentIds": ["e-5d2", "e-ef-85"],
  "followUpChips": ["5D Mark II için hafıza kartı veriliyor mu?", "50mm f/1.4 de uyar mı?"]
}
`;

// Helper to get configured Gemini API key (env or localStorage)
export function getGeminiApiKey(): string | null {
  // 1. From vite environment variable
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 10) {
    return envKey.trim();
  }

  // 2. From localStorage (user-provided in UI)
  try {
    const localKey = localStorage.getItem('ytufok_gemini_api_key');
    if (localKey && localKey.trim().length > 10) {
      return localKey.trim();
    }
  } catch {
    // ignore
  }

  return null;
}

export function setGeminiApiKey(key: string): void {
  try {
    if (!key.trim()) {
      localStorage.removeItem('ytufok_gemini_api_key');
    } else {
      localStorage.setItem('ytufok_gemini_api_key', key.trim());
    }
  } catch {
    // ignore
  }
}

/**
 * Ask Google Gemini API with photography domain grounding
 */
export async function askGeminiAdvisor(
  userQuery: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<GeminiAdviceResponse> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  // Model endpoint: gemini-2.0-flash or gemini-1.5-flash
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const contents = [
    // Previous messages
    ...chatHistory,
    // Current user message
    {
      role: 'user',
      parts: [{ text: userQuery }]
    }
  ];

  const payload = {
    system_instruction: {
      parts: [{ text: CLUB_EQUIPMENT_KNOWLEDGE }]
    },
    contents,
    generationConfig: {
      temperature: 0.3,
      response_mime_type: 'application/json'
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API Error details:', errorBody);
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini boş yanıt döndürdü.');
  }

  try {
    const parsed = JSON.parse(rawText) as GeminiAdviceResponse;
    return {
      explanation: parsed.explanation || 'Öneriler hazırlandı.',
      recommendedEquipmentIds: Array.isArray(parsed.recommendedEquipmentIds) ? parsed.recommendedEquipmentIds : [],
      followUpChips: Array.isArray(parsed.followUpChips) ? parsed.followUpChips : []
    };
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawText);
    return {
      explanation: rawText,
      recommendedEquipmentIds: [],
      followUpChips: []
    };
  }
}
