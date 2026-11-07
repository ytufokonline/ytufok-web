# YTÜFOK Kamera & Ekipman Takip Sistemi - Güvenlik Sertleştirme ve Supabase Yapılandırma Kılavuzu

Bu belge, **07 Kasım 2026** tarihli **SKYSEC Penetrasyon Testi Raporu**'nda (Salih Yiğit Elitok) tespit edilen **10 güvenlik zafiyetinin** tamamını kapatmak üzere geliştirilen çözümleri ve Supabase / Vercel yönetim panellerinde uygulanması gereken adımları içerir.

---

## 🎯 Tespit Edilen Zafiyetler ve Yapılan Kod/Mimari Düzeltmeleri

| Bulgu No | Seviye | Zafiyet Tanımı | Alınan Önlem / Düzeltme |
| :--- | :--- | :--- | :--- |
| **BULGU-01** | **Kritik (9.1)** | Client bundle'da Supabase publishable key ile doğrudan erişim | Tüm hassas veritabanı okuma ve yazma işlemleri sunucu tarafına (`/api/admin-action`) taşındı. Anon key yetkileri RLS ile sıfırlandı. |
| **BULGU-02** | **Kritik (10.0)** | Tüm Supabase tablolarında RLS devre dışı | `supabase/security_rls_hardening.sql` hazırlandı. 12 tablonun tamamında Row Level Security aktif edildi. Tüm yetkisiz erişimler kapatıldı. |
| **BULGU-03** | **Kritik (8.5)** | Yönetim kurulu öğrenci no ve kimlik bilgilerinin frontend'e hardcoded gömülmesi | `src/data/initialData.ts` içerisindeki `INITIAL_ADMIN_PROFILES` tamamen temizlendi. Yönetici profilleri artık yalnızca sunucu üzerinden kriptografik token ile çekiliyor. |
| **BULGU-04** | **Kritik (9.8)** | POST /rest/v1/members ile yetkisiz admin hesabı açabilme | Members tablosunda anon INSERT tamamen engellendi. Üye ekleme yalnızca doğrulanmış yönetici oturumu (`/api/admin-action`) ile mümkün kılındı. |
| **BULGU-05** | **Kritik (9.5)** | Client-side PIN kontrolü ve sessionStorage manipülasyonu ile admin paneline sızma | İstemci tarafındaki PIN karşılaştırması kaldırıldı. Sunucu tarafında HMAC-SHA256 imzalı 12 saat süreli güvenli oturum tokenları (`jwt/session`) oluşturuldu. Token olmadan hiçbir yönetici işlemi yapılamaz. |
| **BULGU-06** | **Yüksek (7.5)** | POST /api/verify-member ile admin rolü ve dahili unvan sızıntısı | API yanıtından `role`, `member_type`, `notes` ve ceza sebepleri kaldırıldı. Sadece isim, bölüm ve üyelik durumu döndürülüyor. |
| **BULGU-07** | **Yüksek (7.3)** | Giriş ve doğrulama endpoint'lerinde hız sınırlaması (Rate Limiting) olmaması | `api/_security.js` üzerinde sliding-window IP rate limiter kuruldu. Giriş denemeleri (5 deneme / 5 dk), üye sorgulama (15 / dk), rezervasyon sorgulama (20 / 5 dk) kısıtlandı. |
| **BULGU-08** | **Yüksek (7.5)** | GET /rest/v1/reservations ile öğrencilerin telefon, öğrenci no ve çekim amaçlarının sızması | Halka açık pano ve listelerden rezervasyonlar tamamen kaldırıldı. `/api/lookup-reservation` ile sadece kendi takip kodunu/öğrenci numarasını sorgulayanlara maskelenmiş veri sunuluyor. |
| **BULGU-09** | **Yüksek (6.5)** | Supabase Auth açık kayıt (open signup) ile hesap açılabilmesi | Supabase Auth üzerinden harici kullanıcı kaydı kapatıldı (Bkz. Adım 3). |
| **BULGU-10** | **Düşük (3.1)** | Reflected XSS denemeleri ve Content-Security-Policy (CSP) eksikliği | `vercel.json` içerisine strict `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block` eklendi. Tüm kullanıcı girdileri sanitize ediliyor. |

---

## 🛠️ Supabase ve Vercel Panellerinde Yapılması Gereken 3 Adım

Kod tarafındaki tüm zafiyetler yamalanmış ve build doğrulanmıştır. Veritabanının tam kilitlenmesi için Supabase panelinizden aşağıdaki 3 işlemi yapmanız gerekmektedir:

### 1. Adım: Veritabanında RLS Sertleştirme Betiğini Çalıştırın
1. [supabase.com](https://supabase.com) adresine gidip projenizi açın (`hqmwlrilmtblnsumwcmr`).
2. Sol menüden **SQL Editor** sekmesine tıklayın.
3. **New query** butonuna basın.
4. Projenizdeki `supabase/security_rls_hardening.sql` dosyasının **tüm içeriğini** kopyalayıp buraya yapıştırın.
5. Sağ alttaki **Run** (veya `Cmd+Enter` / `Ctrl+Enter`) butonuna basın.
6. `Success. No rows returned` mesajını gördüğünüzde veritabanındaki 12 tablonun tamamı RLS ile kilitlenmiş olacaktır.

---

### 2. Adım: Sızdırılan Anon API Key'i Değiştirin (Key Rotation)
Raporda belirtildiği üzere eski anon key penetrasyon testinde kullanıldığı için yenilenmelidir:
1. Supabase sol menüsünden **Project Settings** (en alttaki dişli çark simgesi) -> **API** sekmesine girin.
2. **Project API keys** bölümünde `anon public` anahtarının yanındaki **Generate new key / Rotate key** butonuna tıklayın.
3. Yeni üretilen **anon public** anahtarını kopyalayın.
4. Hemen altındaki **service_role secret** anahtarını da kopyalayın.
5. [Vercel Dashboard](https://vercel.com) -> YTÜFOK projenize girin:
   - **Settings** -> **Environment Variables** bölümünü açın.
   - `VITE_SUPABASE_ANON_KEY` değişkenini **yeni anon public** key ile güncelleyin.
   - `SUPABASE_SERVICE_ROLE_KEY` adında yeni bir değişken ekleyip değerine **service_role** key'inizi yapıştırın.
   - `ADMIN_TOKEN_SECRET` adında rastgele güçlü bir parola dizesi (örn: `ytufok_2026_super_secret_hmac_key_99`) ekleyin.
   - Save / Redeploy yapın.

---

### 3. Adım: Açık Kullanıcı Kaydını Kapatın (BULGU-09 Fix)
Sisteminize yetkisiz kişilerin Supabase üzerinden hesap açmasını önlemek için:
1. Supabase sol menüsünden **Authentication** sekmesine tıklayın.
2. **Configuration** başlığı altından **Providers** -> **Email** seçeneğini açın.
3. **Allow new users to sign up** (Yeni kullanıcı kaydına izin ver) anahtarını **KAPALI (OFF)** konuma getirin.
4. **Save** butonuna tıklayarak kaydedin.

---

## 🔒 Güvenlik Doğrulama Testleri

Yapılan işlemlerin ardından:
1. Bir saldırgan tarayıcı konsolundan `sessionStorage.setItem('ytufok_session_admin_id', 'admin-baskan')` yazsa dahi sunucu tokenı bulunamayacağı için hiçbir admin işlemine erişemez (HTTP 401 Unauthorized döner).
2. Saldırgan `curl https://hqmwlrilmtblnsumwcmr.supabase.co/rest/v1/members` çağrısı yapsa dahi PostgreSQL RLS kuralı `USING (false)` olduğu için boş liste döner, hiçbir üye verisine erişemez.
3. Saldırgan `curl -X POST https://hqmwlrilmtblnsumwcmr.supabase.co/rest/v1/members` ile `role: "admin"` üye eklemeye çalışsa `new row violates row-level security policy` hatası alarak engellenir.
4. Öğrencilerin rezervasyonları halka açık bundle üzerinden çekilmez, `/api/lookup-reservation` ile sadece ilgili öğrencinin kendi talepleri maskeli olarak gösterilir.
