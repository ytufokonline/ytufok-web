# 📸 YTÜFOK - Kamera Rezervasyon ve Takip Web Uygulaması

**Yıldız Teknik Üniversitesi Fotoğraf Kulübü (YTÜFOK)** için geliştirilmiş modern, güvenli, mobil uyumlu ve veritabanı destekli ekipman rezervasyon ve demirbaş zimmet takip platformu.

---

## 🌟 Öne Çıkan Özellikler

1. **🏛️ Ana Sayfa / Vitrin (Showcase):**
   - Kulüp misyonu, tarihi ve ekipman kullanım rehberi.
   - Öne çıkan Sony, Fujifilm ve Canon aynasız gövdeler.
   - Kulüp duyuruları ve kural bildirimleri.
   - Kulüp üyelerinin çektiği fotoğraflardan oluşan etkileşimli lightbox galeri.

2. **📷 Kamera & Lens Havuzu:**
   - Detaylı filtreleme (Fotoğraf Makineleri, Objektifler, Tripodlar, Flaş & Işık).
   - Anlık müsaitlik durumu rozetleri: `Müsait (Yeşil)`, `Rezerve (Sarı)`, `Kullanımda / Zimmette (Mavi)`, `Bakımda (Kırmızı)`.
   - Demirbaş / Seri numarası, teknik parametreler ve kutu içeriği (2x Batarya, Şarj aleti, SD kart, boyun askısı, çanta).

3. **🛡️ Öğrenci Numarası Doğrulama (Whitelist):**
   - Rezervasyon formunda öğrenci numarası girildiğinde Supabase `members` tablosundaki aktif üye listesi taranır.
   - Listede bulunmayan öğrencilerin talep oluşturması engellenir.
   - Cezalı veya askıya alınmış üyelere gecikme gerekçesi gösterilerek yeni talep hakkı kısıtlanır.

4. **⏳ Rezervasyon & Admin Onay Akışı:**
   - Üye tarih aralığı (maksimum 2 gün) ve çekim amacını girerek formu gönderir.
   - Talep veritabanına **"Onay Bekliyor"** (`pending`) statüsünde kaydedilir ve benzersiz bir takip kodu (`YTU-2026-XXXX`) üretilir.
   - Yönetim kurulu panelden talebi inceler; **[Onayla]** dendiğinde kamera otomatik olarak `reserved` durumuna geçer.

5. **📊 Takip ve Yönetim Paneli (Admin Portal):**
   - **Genel Bakış (KPI):** Onay bekleyen talepler, dışarıda zimmette olan kameralar, geciken iadeler ve toplam demirbaş.
   - **Talepler Tablosu:** Onayla, Reddet (gerekçeli), Teslim Et (Zimmetle), İade Al (Kondisyon notu ile).
   - **Canlı Zimmet ("Hangi Kamera Kimde?"):** Dışarıdaki tüm makinelerin öğrenci iletişim bilgileri ve son iade günü sayacı.
   - **Envanter Yönetimi:** Yeni kamera/lens ekleme ve bakım durumuna alma.
   - **Üye Whitelist & Ceza Yönetimi:** Öğrenci numarası ekleme, ceza puanı yazma ve üyelik dondurma.
   - **Supabase Entegrasyon Kılavuzu:** Tek tıkla kopyalanabilir SQL şeması ve `.env` yapılandırma rehberi.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend / Veritabanı:** Supabase (PostgreSQL, Row Level Security, Triggers & Functions)
- **Veri Katmanı:** `@supabase/supabase-js` (Çevrimdışı/Demo modunu ve gerçek Supabase bağlantısını otomatik algılayan hibrit servis mimarisi)

---

## 📁 Proje Klasör Yapısı

```text
ytufok-kamera-takip/
├── public/                     # Statik varlıklar
├── src/
│   ├── components/             # Yeniden kullanılabilir arayüz bileşenleri
│   │   ├── Navbar.tsx          # Navigasyon, sayaçlar ve mobil menü
│   │   ├── Footer.tsx          # Kulüp iletişim ve kampüs konumları
│   │   ├── StatusBadge.tsx     # Renkli durum rozetleri
│   │   └── SupabaseBanner.tsx  # Canlı veritabanı bağlantı barı
│   ├── data/
│   │   └── initialData.ts      # Gerçekçi YTÜFOK başlangıç verileri
│   ├── lib/
│   │   ├── api.ts              # Whitelist, rezervasyon, envanter iş mantığı
│   │   └── supabase.ts         # Supabase client istemcisi
│   ├── pages/
│   │   ├── HomePage.tsx        # Vitrin, duyurular, istatistikler ve galeri
│   │   ├── EquipmentPage.tsx   # Kamera & lens kataloğu, arama ve filtreler
│   │   ├── ReservationPage.tsx # 3 Adımlı Whitelist doğrulamalı rezervasyon formu
│   │   ├── ReservationStatusPage.tsx # Takip kodu ile durum sorgulama
│   │   └── AdminDashboard.tsx  # Yönetim kurulu onay ve zimmet kontrol merkezi
│   ├── types/
│   │   └── index.ts            # TypeScript veri tipleri
│   ├── App.tsx                 # Ana uygulama düzeni
│   ├── index.css               # Tailwind CSS yönergeleri & koyu tema stilleri
│   ├── main.tsx                # React kök başlatıcı
│   └── vite-env.d.ts           # Vite ortam değişkeni tipleri
├── supabase/
│   └── schema.sql              # Supabase PostgreSQL SQL şeması, RLS & Trigger'lar
├── .env.example                # Örnek ortam değişkenleri
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🚀 Hızlı Başlangıç (Kurulum)

### 1. Bağımlılıkları Yükleme ve Projeyi Başlatma

```bash
cd ytufok-kamera-takip
npm install
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine giderek uygulamayı anında görüntüleyebilirsiniz.

---

## 🗄️ Supabase Veritabanı Kurulumu (Ücretsiz Katman)

1. [supabase.com](https://supabase.com) adresinde ücretsiz bir hesap oluşturun ve yeni bir proje başlatın (Örn: `YTUFOK-Kamera`).
2. Sol menüden **SQL Editor** alanına girin.
3. Proje içerisindeki `supabase/schema.sql` dosyasının içeriğini kopyalayıp SQL Editor'e yapıştırın ve **Run** butonuna basın.
4. Bu işlem şu tabloları, tetikleyicileri ve başlangıç verilerini otomatik kuracaktır:
   - `members`: Aktif kulüp üyeleri, öğrenci numaraları ve ceza puanları (Whitelist).
   - `equipment`: Kulüp kameraları, lensleri, seri numaraları ve donanım özellikleri.
   - `reservations`: Rezervasyon talepleri, teslim/iade tarihleri ve onay durumları.
   - `announcements` & `gallery_items`: Duyurular ve üye fotoğrafları.
   - `trg_sync_equipment_status`: Rezervasyon durumu onaylandığında veya iade edildiğinde ekipman durumunu (`available` / `reserved` / `in_use`) senkronize eden veritabanı tetikleyicisi.
5. Supabase panelinde **Project Settings > API** bölümünden `Project URL` ve `anon public key` değerlerini alın.
6. Proje kök dizinindeki `.env` dosyasına kaydedin:
   ```env
   VITE_SUPABASE_URL=https://projeniz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
7. `npm run dev` ile uygulamayı başlattığınızda sistem artık canlı Supabase veritabanıyla çalışır. *(Değerler girilmediğinde sistem güvenli yerel önizleme moduyla çalışmaya devam eder).*

---

## 🧪 Canlı Test ve Örnek Senaryolar

Uygulamayı denerken kullanabileceğiniz hazır whitelist öğrenci numaraları:

| Öğrenci No | İsim | Durum | Beklenen Sonuç |
|---|---|---|---|
| `21011045` | Ahmet Yılmaz (Yönetici) | Aktif | Whitelist başarılı doğrulanır, form açılır |
| `22052018` | Zeynep Kaya | Aktif | Whitelist başarılı doğrulanır |
| `19041003` | Burak Çelik | Askıya Alındı (Cezalı) | Kırmızı uyarı: "2 Ceza Puanı - Yeni rezervasyon hakkı askıya alındı" |
| `99999999` | Tanımsız Numara | Yok | "Öğrenci numarası aktif üye listesinde bulunamadı" |

**Örnek Takip Kodları (Talep Sorgula Ekranı):**
- `YTU-2026-B101` (Kullanımda / Zimmette)
- `YTU-2026-F204` (Onaylandı)
- `YTU-2026-P308` (Onay Bekliyor)
