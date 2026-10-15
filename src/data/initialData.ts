import { Equipment, Member, Reservation, Announcement, GalleryItem, AdminProfile, DarkroomSlot, DarkroomSlotTemplate, DarkroomReservation, Trip } from '../types';

export const INITIAL_ADMIN_PROFILES: AdminProfile[] = [
  {
    id: 'admin-baskan',
    role: 'president',
    title: 'Kulüp Başkanı',
    short_title: 'Başkan',
    full_name: 'Sıla Dönmez',
    student_number: '24084005',
    phone: '',
    avatar_color: 'from-[#4b253b] via-[#301322] to-[#657796]'
  },
  {
    id: 'admin-by1',
    role: 'vice_president_1',
    title: 'Başkan Yardımcısı',
    short_title: 'Başkan Yrd.',
    full_name: 'Yavuz Selim Bahadır',
    student_number: '21065054',
    phone: '',
    avatar_color: 'from-[#657796] via-[#4e3b52] to-[#301322]'
  },
  {
    id: 'admin-by2',
    role: 'vice_president_2',
    title: 'Başkan Yardımcısı',
    short_title: 'Başkan Yrd.',
    full_name: 'Alara Tezelli',
    student_number: '23084041',
    phone: '',
    avatar_color: 'from-[#584964] via-[#4b253b] to-[#8193b2]'
  },
  {
    id: 'admin-sayman',
    role: 'treasurer',
    title: 'Mali İşler Sorumlusu (Sayman)',
    short_title: 'Sayman',
    full_name: 'Duru Anlar',
    student_number: '23084006',
    phone: '',
    avatar_color: 'from-[#301322] via-[#421d31] to-[#5b657e]'
  },
  {
    id: 'admin-sekreter',
    role: 'secretary',
    title: 'Genel Sekreter & Arşiv',
    short_title: 'Genel Sekreter',
    full_name: 'Yağmur Dursun',
    student_number: '23084023',
    phone: '',
    avatar_color: 'from-[#421d31] via-[#584964] to-[#657796]'
  },
  {
    id: 'admin-sosyal-medya',
    role: 'social_media',
    title: 'Sosyal Medya Koordinatörü',
    short_title: 'Sosyal Medya Koord.',
    full_name: 'Sümeyra Sever',
    student_number: '24084024',
    phone: '',
    avatar_color: 'from-[#6e2a4f] via-[#541e3d] to-[#7d8fa9]'
  },
  {
    id: 'admin-gezi',
    role: 'trip_coordinator',
    title: 'Gezi Koordinatörü',
    short_title: 'Gezi Koord.',
    full_name: 'İlayda Sudem Güneş',
    student_number: '24084602',
    phone: '',
    avatar_color: 'from-[#38263a] via-[#4b253b] to-[#657796]'
  },
  {
    id: 'admin-sponsorluk',
    role: 'sponsorship',
    title: 'Sponsorluk Koordinatörü',
    short_title: 'Sponsorluk Koord.',
    full_name: 'Öykü Aydın',
    student_number: '24084025',
    phone: '',
    avatar_color: 'from-[#4e3b52] via-[#301322] to-[#8193b2]'
  }
];

// Güvenlik: Üye listesi istemci koduna gömülmez; Supabase veritabanında tutulur.
export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_EQUIPMENT: Equipment[] = [
  // ==========================================
  // GÖVDELER (DSLR & ANALOG SLR)
  // ==========================================
  {
    id: 'e-5d2',
    name: 'Canon EOS 5D Mark II Gövde',
    category: 'camera',
    brand: 'Canon',
    model: 'EOS 5D Mark II',
    serial_number: 'YTU-EOS-5D2',
    description: '21.1 MP Full Frame sensörü ve sinematik renkleriyle stüdyo ve dış mekan portrelerine uygun amiral gemisi gövde.',
    specs: {
      'Sensör': '35.8 x 23.9 mm Full Frame 21.1 MP CMOS',
      'Bayonet': 'Canon EF Mount',
      'ISO Aralığı': '100 - 6.400 (Genişletilmiş 25.600)',
      'Video': '1080p 30fps Full HD',
      'Hafıza Kartı': 'CompactFlash (CF) Kart (Kulüp Tarafından Dahil Edilir)',
      'Ağırlık': '810 gr (Sağlam magnezyum alaşım gövde)'
    },
    package_contents: [
      'Canon EOS 5D Mark II Gövde',
      '2x Orijinal Canon LP-E6 Batarya',
      'Canon LC-E6 Hızlı Şarj Cihazı',
      'SanDisk Extreme 32GB CF Kart (Dahil)',
      'Yüksek Hızlı USB CF Kart Okuyucu (Dahil)',
      'Canon Orijinal Geniş Omuz Askısı',
      'Sert Koruyucu Taşıma Çantası'
    ],
    image_url: '/equipment/canon-5d-mark2.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-6d',
    name: 'Canon EOS 6D Gövde',
    category: 'camera',
    brand: 'Canon',
    model: 'EOS 6D',
    serial_number: 'YTU-EOS-6D',
    description: 'Yüksek ISO başarımı ve dahili Wi-Fi özellikli, hafif ve kompakt Full Frame gövde.',
    specs: {
      'Sensör': 'Full Frame 20.2 MP CMOS',
      'Bayonet': 'Canon EF Mount',
      'ISO Aralığı': '100 - 25.600 (Genişletilmiş 102.400)',
      'Hafıza Kartı': 'SD Kart (Üye Yanında Getirmelidir / Kulüpte Yok)',
      'Bağlantı': 'Dahili Wi-Fi & GPS Modülü',
      'Ağırlık': '755 gr'
    },
    package_contents: [
      'Canon EOS 6D Gövde',
      '2x Orijinal LP-E6 Batarya',
      'LC-E6 Şarj Cihazı',
      '⚠️ SD Kart Dahil Değildir (Üye yanında getirmelidir / not düşülmeli)',
      'Canon 6D Orijinal Boyun Askısı',
      'Gövde Ön Kapağı'
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Canon_EOS_6D_body.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-1000d',
    name: 'Canon EOS 1000D Gövde (Rebel XS)',
    category: 'camera',
    brand: 'Canon',
    model: 'EOS 1000D',
    serial_number: 'YTU-EOS-1000D',
    description: 'Temel fotoğraf eğitimleri ve pratik sokak çekimleri için hafif ve ergonomik APS-C gövde.',
    specs: {
      'Sensör': 'APS-C 10.1 MP CMOS (1.6x Çarpan)',
      'Bayonet': 'Canon EF ve EF-S Mount Uyumlu',
      'ISO': '100 - 1.600',
      'Hafıza Kartı': 'SD Kart (Üye Yanında Getirmelidir / Kulüpte Yok)',
      'Ekran': '2.5 inç Live View Destekli LCD',
      'Ağırlık': '450 gr (Son derece hafif)'
    },
    package_contents: [
      'Canon EOS 1000D Gövde',
      '2x LP-E5 Batarya',
      'Orijinal Şarj Cihazı',
      '⚠️ SD Kart Dahil Değildir (Üye yanında getirmelidir / not düşülmeli)',
      'Canon Boyun Askısı'
    ],
    image_url: '/equipment/canon-eos-1000d.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-650',
    name: 'Canon EOS 650 (35mm Analog Film SLR Gövde)',
    category: 'analog',
    brand: 'Canon',
    model: 'EOS 650 35mm SLR',
    serial_number: 'YTU-EOS-650-ANALOG',
    description: 'Tüm modern EF lenslerle tam uyumlu çalışan, otomatik netlemeli klasik 35mm analog film gövdesi.',
    specs: {
      'Film Tipi': 'Standart 35mm Film (135 Negatif / Siyah Beyaz)',
      'Bayonet': 'Canon EF Mount (Elektronik Diyafram & AF)',
      'Enstantane': '1/2000s - 30s + Bulb Modu',
      'Film Sarma': 'Otomatik Motorlu Film Sarma ve Geri Sarma',
      'Pil': '2CR5 6V Lityum Pil'
    },
    package_contents: [
      'Canon EOS 650 Analog Gövde',
      '2CR5 Lityum Pil (Dolu takılı)',
      'Gövde Süngü Kapağı',
      'Vintage Hakiki Kumaş Omuz Askısı'
    ],
    image_url: '/equipment/canon-eos-650.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-nikon',
    name: 'Nikon D5000 DSLR Gövde',
    category: 'camera',
    brand: 'Nikon',
    model: 'D5000',
    serial_number: 'YTU-NIK-D5000',
    description: 'Döner LCD ekranı ve 12.3 MP çözünürlüğüyle ergonomik Nikon DX format DSLR gövde.',
    specs: {
      'Çözünürlük': '12.3 Megapiksel DX-Format CMOS',
      'Ekran': '2.7" Değişken Açılı (Hareketli / Döner) LCD',
      'Video': '720p HD D-Movie Video Kaydı (24 fps)',
      'Odaklama': '11 Noktalı 3D Tracking Multi-CAM 1000 AF',
      'ISO Aralığı': '200 - 3200 (Genişletilebilir Hi-1 ile 6400)',
      'Bayonet': 'Nikon F-Mount (DX)',
      'Hafıza': 'SD / SDHC Kart (Üye Yanında Getirmelidir / Kulüpte Yok)'
    },
    package_contents: [
      'Nikon D5000 DSLR Gövde',
      '1x Orijinal EN-EL9a Batarya',
      'Nikon MH-23 Şarj Cihazı',
      '⚠️ SD Kart Dahil Değildir (Üye yanında getirmelidir / not düşülmeli)',
      'Nikon Omuz Askısı',
      'Gövde Kapağı'
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Nikon_D5000_body_%28front%29.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },

  // ==========================================
  // LENSLER (CANON EF MOUNT & SIGMA)
  // ==========================================
  {
    id: 'e-ef-50',
    name: 'Canon EF 50mm f/1.4 USM Lens',
    category: 'lens',
    brand: 'Canon',
    model: 'EF 50mm f/1.4 USM',
    serial_number: 'YTU-LENS-50MM',
    description: 'f/1.4 diyaframıyla loş ışıkta yüksek performans ve kremsi arka plan fluluğu sunan standart portre lensi.',
    specs: {
      'Diyafram': 'f/1.4 - f/22 (8 Diyafram Bıçağı)',
      'Bayonet': 'Canon EF Mount (Full Frame & APS-C Uyumlu)',
      'Filtre Çapı': '58 mm',
      'Odak Motoru': 'Mikro USM (Hızlı ve Sessiz)',
      'Ağırlık': '290 gr (Hafif ve Kompakt)'
    },
    package_contents: [
      'Canon EF 50mm f/1.4 Lens',
      'Ön ve Arka Kapaklar',
      '58mm UV Koruma Filtresi',
      'Mikrofiber Lens Bezi'
    ],
    image_url: '/equipment/canon-ef-50mm.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-ef-85',
    name: 'Canon EF 85mm f/1.8 USM Lens',
    category: 'lens',
    brand: 'Canon',
    model: 'EF 85mm f/1.8 USM',
    serial_number: 'YTU-LENS-85MM',
    description: 'Doğal perspektif açısı ve hızlı USM motoruyla keskin sonuçlar veren profesyonel portre lensi.',
    specs: {
      'Diyafram': 'f/1.8 - f/22',
      'Bayonet': 'Canon EF Mount',
      'Filtre Çapı': '58 mm',
      'Odak Motoru': 'Ring USM (Tam Zamanlı Manuel Odak)',
      'Minimum Odak Mesafesi': '85 cm',
      'Ağırlık': '425 gr'
    },
    package_contents: [
      'Canon EF 85mm f/1.8 Lens',
      'Ön & Arka Süngü Kapakları',
      '58mm İnce Çerçeve Koruyucu Filtre',
      'Yumuşak Taşıma Kılıfı'
    ],
    image_url: '/equipment/canon-ef-85mm.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-ef-100-macro',
    name: 'Canon EF 100mm f/2.8 Macro USM Lens',
    category: 'lens',
    brand: 'Canon',
    model: 'EF 100mm f/2.8 Macro USM',
    serial_number: 'YTU-LENS-100-MACRO',
    description: '1:1 büyütme oranlı, hem ince detay makro hem de keskin portre çekimlerine uygun f/2.8 lens.',
    specs: {
      'Büyütme Oranı': '1:1 (Gerçek Boyut / Life-Size Macro)',
      'Diyafram': 'f/2.8 - f/32 (8 Diyafram Bıçağı)',
      'Bayonet': 'Canon EF Mount (Full Frame & Crop Uyumlu)',
      'Filtre Çapı': '58 mm',
      'Netleme Motoru': 'Ring USM (Ultra Hızlı ve Sessiz Dahili Odaklama)',
      'Minimum Odak Mesafesi': '31 cm',
      'Ağırlık': '600 gr'
    },
    package_contents: [
      'Canon EF 100mm f/2.8 Macro Lens',
      'Ön ve Arka Kapaklar',
      '58mm Slim UV Koruma Filtresi',
      'Dolgulu Koruyucu Taşıma Kılıfı'
    ],
    image_url: '/equipment/canon-ef-100mm-macro.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-ef-70-200',
    name: 'Canon EF 70-200mm f/4L USM Telefoto Lens',
    category: 'lens',
    brand: 'Canon',
    model: 'EF 70-200mm f/4L USM',
    serial_number: 'YTU-LENS-70-200L',
    description: 'Konser, sahne ve spor çekimleri için köşeden köşeye yüksek keskinlik sunan L serisi telefoto zoom lens.',
    specs: {
      'Diyafram': 'f/4 Sabit Diyafram (Tüm odak aralığında)',
      'Bayonet': 'Canon EF Mount (L Serisi Profesyonel Optik)',
      'Optik Yapı': '13 grupta 16 eleman (1 Florit, 2 UD Cam)',
      'Filtre Çapı': '67 mm',
      'Ağırlık': '705 gr'
    },
    package_contents: [
      'Canon EF 70-200mm f/4L Lens',
      'Ön ve Arka Kapaklar',
      '67mm UV Koruyucu Filtre',
      'Canon Orijinal Sert Dolgulu Çanta'
    ],
    image_url: '/equipment/canon-ef-70-200mm.webp',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-ef-17-40',
    name: 'Canon EF 17-40mm f/4L USM Ultra Geniş Açı Lens',
    category: 'lens',
    brand: 'Canon',
    model: 'EF 17-40mm f/4L USM',
    serial_number: 'YTU-LENS-17-40L',
    description: 'Mimari projeler, iç mekan ve manzara çekimleri için L serisi profesyonel ultra geniş açı lens.',
    specs: {
      'Diyafram': 'f/4 Sabit Diyafram',
      'Bayonet': 'Canon EF Mount',
      'Görüş Açısı': '104° - 57° (Ultra Geniş Açı)',
      'Filtre Çapı': '77 mm',
      'Yalıtım': 'Toz ve Neme Dayanıklı Profesyonel Gövde',
      'Ağırlık': '500 gr'
    },
    package_contents: [
      'Canon EF 17-40mm f/4L Lens',
      '77mm Slim UV Koruma Filtresi',
      'Ön ve Arka Kapaklar',
      'Dolgulu Lens Çantası'
    ],
    image_url: '/equipment/canon-ef-17-40mm.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-ef-24-105',
    name: 'Canon EF 24-105mm f/4L IS USM Standart Zoom Lens',
    category: 'lens',
    brand: 'Canon',
    model: 'EF 24-105mm f/4L IS USM',
    serial_number: 'YTU-LENS-24-105L',
    description: 'Optik görüntü sabitleyici (IS) destekli, her türlü genel çekime uygun çok yönlü L serisi standart zoom lens.',
    specs: {
      'Diyafram': 'f/4 Sabit Diyafram',
      'Stabilizasyon': '3-Stop Image Stabilizer (IS Optik Sabitleme)',
      'Bayonet': 'Canon EF Mount',
      'Filtre Çapı': '77 mm',
      'Odak Motoru': 'Ring USM',
      'Ağırlık': '670 gr'
    },
    package_contents: [
      'Canon EF 24-105mm f/4L IS Lens',
      '77mm B+W UV Filtre',
      'Ön ve Arka Kapaklar'
    ],
    image_url: '/equipment/canon-ef-24-105mm.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-sigma-10-20',
    name: 'Sigma 10-20mm f/3.5 EX DC HSM Ultra Geniş Açı Lens',
    category: 'lens',
    brand: 'Sigma',
    model: '10-20mm f/3.5 EX DC HSM (Canon Mount)',
    serial_number: 'YTU-LENS-SIGMA-10-20',
    description: 'Crop gövdeler için sabit f/3.5 diyaframlı, iç mekan ve etkinlik çekimlerine özel ultra geniş açı lens.',
    specs: {
      'Diyafram': 'f/3.5 Sabit Diyafram',
      'Bayonet': 'Canon EF-S / Crop Sensör Uyumlu',
      'Odak Motoru': 'HSM (Hyper Sonic Motor - Sessiz Hızlı AF)',
      'Filtre Çapı': '82 mm',
      'Ağırlık': '520 gr'
    },
    package_contents: [
      'Sigma 10-20mm f/3.5 EX Lens',
      'Ön ve Arka Kapaklar',
      'Fermuarlı Dolgulu Sigma Taşıma Çantası'
    ],
    image_url: '/equipment/sigma-10-20mm.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-nikon-18-55-vr',
    name: 'Nikon AF-S DX NIKKOR 18-55mm f/3.5-5.6G VR Lens',
    category: 'lens',
    brand: 'Nikon',
    model: 'AF-S DX NIKKOR 18-55mm f/3.5-5.6G VR',
    serial_number: 'YTU-LENS-NIK-18-55',
    description: 'VR titreşim engelleme özellikli, günlük kullanım ve genel çekimler için kompakt standart zoom lens.',
    specs: {
      'Odak Uzaklığı': '18-55 mm (35mm eşdeğeri: 27-82.5 mm)',
      'Diyafram': 'f/3.5 - f/5.6 (7 Bıçaklı Yuvarlak Diyafram)',
      'Görüntü Sabitleme': 'VR (Vibration Reduction - 3 Stop Titreşim Engelleme)',
      'Bayonet': 'Nikon F-Mount (DX Sensör Uyumlu)',
      'Filtre Çapı': '52 mm',
      'Netleme Motoru': 'SWM (Silent Wave Motor - Sessiz Hızlı AF)',
      'Ağırlık': '265 gr (Hafif ve Kompakt)'
    },
    package_contents: [
      'Nikon AF-S DX 18-55mm f/3.5-5.6G VR Lens',
      'Ön Lens Kapağı (52mm Snap-on)',
      'Arka Lens Kapağı',
      '52mm UV Koruyucu Filtre',
      'Mikrofiber Lens Bezi'
    ],
    image_url: '/equipment/nikon-18-55mm.webp',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },

  // ==========================================
  // AYDINLATMA (FLAŞ)
  // ==========================================
  {
    id: 'e-speedlite',
    name: 'Canon Speedlite 580EX II Harici Tepe Flaşı',
    category: 'lighting',
    brand: 'Canon',
    model: 'Speedlite 580EX II',
    serial_number: 'YTU-FLASH-580EXII',
    description: 'GN 58 yüksek kılavuz numarası ve dönebilir sektirme başlığıyla profesyonel E-TTL II harici tepe flaşı.',
    specs: {
      'Kılavuz Numarası': 'GN 58 (ISO 100, 105mm)',
      'Uyumluluk': 'Canon E-TTL / E-TTL II Otomatik Pozlama',
      'Güç Kaynağı': '4x AA Kalem Pil / Şarj Edilebilir Pil',
      'Dönüş Açısı': 'Dikey -7° - 90° / Yatay 180° Sektirme Başlığı',
      'Özellikler': 'HSS (Yüksek Hızlı Senk.), Kablosuz Master/Slave Tetikleme, Hava ve Toz Yalıtımlı Metal Yuva'
    },
    package_contents: [
      'Canon Speedlite 580EX II Flaş Gövdesi',
      '4x Panasonic Eneloop Pro Şarjlı Pil',
      'Masaüstü Mini Stand (Flaş Ayağı)',
      'Yumuşatıcı Plastik Difüzör Başlık',
      'Fermuarlı Kumaş Taşıma Kılıfı'
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Canon_Speedlite_580EX_II_Front.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },

  // ==========================================
  // ANALOG FOTOĞRAF MAKİNELERİ (FUJIFILM CLEAR SHOT M - 5 ADET HAVUZ)
  // ==========================================
  {
    id: 'e-clearshot-1',
    name: 'Fujifilm Clear Shot M (35mm Analog Kompakt No: 1)',
    category: 'analog',
    brand: 'Fujifilm',
    model: 'Clear Shot M',
    serial_number: 'YTU-ANALOG-CS-01',
    description: 'Otomatik film sarma ve dahili flaşa sahip, sokak ve seyahat çekimleri için pratik 35mm kompakt analog makine.',
    specs: {
      'Film Tipi': '35mm Standart Negatif / Siyah Beyaz Film (135)',
      'Lens': 'Fujinon Lens',
      'Flaş': 'Dahili Otomatik / Manuel Aç-Kapa Flaş',
      'Güç': '2x AA Kalem Pil'
    },
    package_contents: ['Fujifilm Clear Shot M Makine (No: 1)', 'Bilek Askısı', '2x AA Pil'],
    image_url: '/equipment/fujifilm-clear-shot-m.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-clearshot-2',
    name: 'Fujifilm Clear Shot M (35mm Analog Kompakt No: 2)',
    category: 'analog',
    brand: 'Fujifilm',
    model: 'Clear Shot M',
    serial_number: 'YTU-ANALOG-CS-02',
    description: 'Otomatik film sarma ve dahili flaşa sahip, sokak ve seyahat çekimleri için pratik 35mm kompakt analog makine.',
    specs: {
      'Film Tipi': '35mm Film',
      'Lens': 'Fujinon Lens',
      'Flaş': 'Dahili Flaş',
      'Güç': '2x AA Pil'
    },
    package_contents: ['Fujifilm Clear Shot M Makine (No: 2)', 'Bilek Askısı', '2x AA Pil'],
    image_url: '/equipment/fujifilm-clear-shot-m.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-clearshot-3',
    name: 'Fujifilm Clear Shot M (35mm Analog Kompakt No: 3)',
    category: 'analog',
    brand: 'Fujifilm',
    model: 'Clear Shot M',
    serial_number: 'YTU-ANALOG-CS-03',
    description: 'Otomatik film sarma ve dahili flaşa sahip, sokak ve seyahat çekimleri için pratik 35mm kompakt analog makine.',
    specs: {
      'Film Tipi': '35mm Film',
      'Lens': 'Fujinon Lens',
      'Flaş': 'Dahili Flaş',
      'Güç': '2x AA Pil'
    },
    package_contents: ['Fujifilm Clear Shot M Makine (No: 3)', 'Bilek Askısı', '2x AA Pil'],
    image_url: '/equipment/fujifilm-clear-shot-m.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-clearshot-4',
    name: 'Fujifilm Clear Shot M (35mm Analog Kompakt No: 4)',
    category: 'analog',
    brand: 'Fujifilm',
    model: 'Clear Shot M',
    serial_number: 'YTU-ANALOG-CS-04',
    description: 'Otomatik film sarma ve dahili flaşa sahip, sokak ve seyahat çekimleri için pratik 35mm kompakt analog makine.',
    specs: {
      'Film Tipi': '35mm Film',
      'Lens': 'Fujinon Lens',
      'Flaş': 'Dahili Flaş',
      'Güç': '2x AA Pil'
    },
    package_contents: ['Fujifilm Clear Shot M Makine (No: 4)', 'Bilek Askısı', '2x AA Pil'],
    image_url: '/equipment/fujifilm-clear-shot-m.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },
  {
    id: 'e-clearshot-5',
    name: 'Fujifilm Clear Shot M (35mm Analog Kompakt No: 5)',
    category: 'analog',
    brand: 'Fujifilm',
    model: 'Clear Shot M',
    serial_number: 'YTU-ANALOG-CS-05',
    description: 'Otomatik film sarma ve dahili flaşa sahip, sokak ve seyahat çekimleri için pratik 35mm kompakt analog makine.',
    specs: {
      'Film Tipi': '35mm Film',
      'Lens': 'Fujinon Lens',
      'Flaş': 'Dahili Flaş',
      'Güç': '2x AA Pil'
    },
    package_contents: ['Fujifilm Clear Shot M Makine (No: 5)', 'Bilek Askısı', '2x AA Pil'],
    image_url: '/equipment/fujifilm-clear-shot-m.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  },

  // ==========================================
  // FİLTRE & AKSESUARLAR
  // ==========================================
  {
    id: 'e-tianya-77',
    name: 'Tianya 77mm Soft Diffuser Filtre',
    category: 'accessory',
    brand: 'Tianya',
    model: '77mm Soft Diffuser',
    serial_number: 'YTU-FLTR-TIANYA-77',
    description: 'Güçlü ışıklarda sinematik yumuşak hale ve masalsı tonlar oluşturan 77mm optik efekt filtresi.',
    specs: {
      'Filtre Çapı': '77 mm (Canon 24-105mm f/4L & 17-40mm f/4L Uyumlu)',
      'Filtre Tipi': 'Soft Diffuser (Yumuşatıcı / Mist Efekt Filtresi)',
      'Optik Etki': 'Parlak ışıklarda yumuşak hale (bloom/glow) & sinematik yumuşatma',
      'Çerçeve': 'İnce (Slim) Metal Vidalı Çerçeve',
      'Cam': 'Özel kaplamalı optik cam'
    },
    package_contents: [
      'Tianya 77mm Soft Diffuser Filtre',
      'Sert Koruyucu Plastik Taşıma Kutusu',
      'Mikrofiber Filtre Bezi'
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/B%2BW_Camera_Lens_Filter_%2845476356054%29.jpg',
    status: 'available',
    current_condition: 'değerlendirilecek'
  }
];

export const INITIAL_RESERVATIONS: Reservation[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a-sd-card',
    title: 'Canon 5D Mark II (CF kartlı) hariç tüm dijital gövdeler için üyelerimizin çekime gelirken kendi SD kartlarını getirmeleri gerekmektedir.',
    content: 'Canon 5D Mark II (CF kartlı) hariç tüm dijital gövdeler için üyelerimizin çekime gelirken kendi SD kartlarını getirmeleri gerekmektedir.',
    category: 'Ekipman & Kural',
    is_pinned: true,
    created_at: '2026-10-12T12:00:00Z'
  },
  {
    id: 'a-1',
    title: 'Tüm ekipman teslim ve iadeleri yalnızca Kulüpler Vadisi Davutpaşa Kampüsü noktasından yapılmaktadır (maksimum standart rezervasyon süresi 2 gündür).',
    content: 'Tüm ekipman teslim ve iadeleri yalnızca Kulüpler Vadisi Davutpaşa Kampüsü noktasından yapılmaktadır (maksimum standart rezervasyon süresi 2 gündür).',
    category: 'Kural & Yönetmelik',
    is_pinned: true,
    created_at: '2026-10-01T09:00:00Z'
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'g-1',
    title: 'En kısa zamanda yüklenecek',
    photographer_name: 'YTÜFOK',
    camera_used: 'Kulüp Demirbaşı',
    location: 'YTÜ Davutpaşa',
    image_url: '',
    created_at: '2026-10-12'
  },
  {
    id: 'g-2',
    title: 'En kısa zamanda yüklenecek',
    photographer_name: 'YTÜFOK',
    camera_used: 'Kulüp Demirbaşı',
    location: 'YTÜ Davutpaşa',
    image_url: '',
    created_at: '2026-10-12'
  },
  {
    id: 'g-3',
    title: 'En kısa zamanda yüklenecek',
    photographer_name: 'YTÜFOK',
    camera_used: 'Kulüp Demirbaşı',
    location: 'YTÜ Davutpaşa',
    image_url: '',
    created_at: '2026-10-12'
  },
  {
    id: 'g-4',
    title: 'En kısa zamanda yüklenecek',
    photographer_name: 'YTÜFOK',
    camera_used: 'Kulüp Demirbaşı',
    location: 'YTÜ Davutpaşa',
    image_url: '',
    created_at: '2026-10-12'
  }
];

// ==========================================
// KARANLIK ODA STANDART SEANS ŞABLONLARI (1,5 SAAT - 90 DK)
// Yöneticilerin tek tıkla seans açması için şablon saatler
// ==========================================
export const STANDARD_DARKROOM_TEMPLATES: DarkroomSlotTemplate[] = [
  {
    id: 'tpl-1',
    startTime: '10:00',
    endTime: '11:30',
    durationMinutes: 90,
    label: '1. Seans (10:00 - 11:30)'
  },
  {
    id: 'tpl-2',
    startTime: '11:30',
    endTime: '13:00',
    durationMinutes: 90,
    label: '2. Seans (11:30 - 13:00)'
  },
  {
    id: 'tpl-3',
    startTime: '13:30',
    endTime: '15:00',
    durationMinutes: 90,
    label: '3. Seans (13:30 - 15:00)'
  },
  {
    id: 'tpl-4',
    startTime: '15:00',
    endTime: '16:30',
    durationMinutes: 90,
    label: '4. Seans (15:00 - 16:30)'
  },
  {
    id: 'tpl-5',
    startTime: '16:30',
    endTime: '18:00',
    durationMinutes: 90,
    label: '5. Seans (16:30 - 18:00)'
  },
  {
    id: 'tpl-6',
    startTime: '18:00',
    endTime: '19:30',
    durationMinutes: 90,
    label: '6. Seans (18:00 - 19:30)'
  }
];

// DEFAULTTA RANDEVU OLMASIN (Yöneticiler belirleyip açar)
export const DARKROOM_SLOTS: DarkroomSlot[] = [];

// Gün farkına göre dinamik tarih üretici
const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const INITIAL_DARKROOM_RESERVATIONS: DarkroomReservation[] = [];
 
// ==========================================
// KULÜP GEZİLERİ (TRIPS)
// Aktif üyeler geziden 5 gün önce, normal üyeler 3 gün önce rezerve edebilir
// ==========================================
export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-eskisehir-2026',
    title: 'Büyükada Gezisi',
    destination: 'Büyükada, İstanbul',
    start_date: '2026-10-17',
    end_date: '2026-10-17',
    description: 'Gezi kapsamında yeni üyelerimize Büyükada tanıtılacak ve fotoğraf yerleri gösterilecektir.',
    is_active: false,
    created_at: '2026-10-05T12:00:00Z',
    created_by: 'Alara Tezelli'
  }
];

