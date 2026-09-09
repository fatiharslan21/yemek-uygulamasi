# Lokma — Hesap ve Bulut Yedek Kurulumu

Lokma local-first çalışır. Supabase bağlanmasa bile uygulamanın plan, favori, kilo ve geçmiş özellikleri cihazda çalışmaya devam eder.

## 1. Supabase projesi oluştur

Yeni bir Supabase projesi aç. Proje oluşturulduktan sonra SQL Editor içinde `supabase/schema.sql` dosyasını çalıştır.

Bu şema yalnızca oturum açmış kullanıcının kendi `user_state` kaydını okuyup yazabilmesine izin veren RLS politikalarını içerir.

## 2. Auth ayarları

İlk sürümde e-posta + şifre kullanılır. Supabase Authentication içinden Email provider açık olmalıdır.

E-posta doğrulaması açık bırakılabilir. Bu durumda yeni kullanıcı gelen kutusundaki doğrulama bağlantısını onayladıktan sonra giriş yapar.

Apple ve Google ile giriş store hazırlığı sırasında ayrıca bağlanacaktır.

## 3. Local env

Repo kökünde `.env.example` dosyasını `.env.local` olarak kopyala ve değerleri doldur:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

`.env.local` git'e gönderilmez.

## 4. Hesap silme fonksiyonunu deploy et

Uygulama içindeki “Hesabımı kalıcı olarak sil” butonu sunucu tarafında `supabase/functions/delete-account/index.ts` fonksiyonunu çağırır.

Supabase CLI ile proje bağlandıktan sonra:

```bash
supabase functions deploy delete-account
```

Fonksiyon, istekteki kullanıcı oturumunu doğrular ve yalnızca o kullanıcıyı siler. `SUPABASE_SERVICE_ROLE_KEY` yalnızca Edge Function ortamında kalır; web uygulamasına veya `VITE_*` değişkenlerine asla konmaz.

## 5. Çalıştır

```bash
npm install
npm run dev
```

Profil > Planını güvenceye al bölümünde hesap açma/giriş ve yedekleme butonları aktif olur.

## Senkronizasyon davranışı

- Kullanıcı hesabı zorunlu değildir.
- Yedekleme kullanıcı tarafından açıkça başlatılır.
- Geri yükleme mevcut cihaz verisini ezmeden önce kullanıcı onayı ister.
- Kesin `latitude`, `longitude` ve `locationAccuracy` alanları bulut payload'ından çıkarılır.
- Bulut yedeği plan, favoriler, kilo geçmişi, plan geçmişi ve diğer `lokma.*` yerel kayıtlarını taşır.
- Hesap silme bulut hesabı ve bulut yedeğini kaldırır; cihazdaki yerel plan ayrıca silinmez.

## Canlıya çıkmadan önce

- E-posta şablonları Lokma markasına göre düzenlenmeli.
- Şifre sıfırlama akışı eklenmeli.
- Apple ve Google login test edilmeli.
- Hesap silme Edge Function'ı production ortamında test edilmeli.
- Store politika gereksinimleri yayın haftasında yeniden kontrol edilmeli.
- Sunucu tarafında son-yazma / merge politikası netleştirilmeden otomatik çift yönlü senkronizasyon açılmamalı.
