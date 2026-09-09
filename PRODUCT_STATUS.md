# Lokma — Product Status

## Local MVP / review hedefi

Bu aşamanın amacı uygulamayı yayınlamak değil; kullanıcının telefonda kullanıyormuş gibi baştan sona deneyebileceği, build'i geçen ve temel ürün kararları tamamlanmış bir local sürüm üretmektir.

### Review sürümünde tamam sayılan alanlar

- first-run konum + onboarding
- returning-user resume
- mobil Bugün / Hafta / Liste / Profil navigasyonu
- tarih bazlı plan döngüsü
- bütçe / kalori / protein plan motoru
- diyet / hassasiyet / dislikes filtreleri
- mutfak ekipmanı uyumluluğu
- öğün swap / lock / shuffle
- tarif detayı + alternatif pişirme yöntemleri
- favoriler ve favori-aware yeni plan
- günlük Yedim / Atladım takibi
- 3 günlük meal-prep görevleri
- paket bazlı alışveriş listesi
- miktarlı dolap stoğu ve net ihtiyaç hesabı
- gerçek Nearby market/restoran keşfi
- gerçek işletmeyi öğün veya sepete bağlama
- açıkça etiketli simülasyon fiyat istihbaratı
- 1-market / 2-market sepet optimizasyonu
- profil merkezi ve erişilebilirlik ayarı
- plan geçmişi
- app-level error recovery
- mobile manifest / standalone hazırlığı
- non-deploying CI build doğrulaması

## Launch fazına bilerek bırakılan işler

Aşağıdaki işler local MVP'nin feature-complete olmasını engellemez; gerçek servis, hukuki metin, mağaza hesabı veya monetizasyon kararı gerektirir.

### Veri / backend

- gerçek market ürün, stok ve fiyat sağlayıcıları
- gerçek restoran menü / fiyat / besin verisi
- kullanıcı hesabı, backend ve cihazlar arası sync
- gerçek routing/ETA sağlayıcısı
- server-side cache / rate-limit koruması

### Mobil mağaza

- Capacitor/native shell veya seçilecek native paketleme stratejisi
- iOS/Android permission metinleri
- app icon / splash / store screenshots
- signing, bundle identifiers, certificates
- TestFlight / Play Internal Testing
- App Store / Google Play listing

### Operasyon / hukuk

- Privacy Policy
- Terms of Service
- KVKK/GDPR ve gerektiğinde consent akışı
- analytics/crash-reporting sağlayıcısı
- support/contact akışı

### Monetizasyon

- reklam ağı seçimi
- consent / ATT / reklam gizlilik ayarları
- premium/freemium teklifi
- reklam yoğunluğu A/B kararı
- gelir ölçümü

## Reklam ürün kuralı

Reklamlar local MVP'de kapalıdır. Daha sonra reklam açılsa bile onboarding, konum izni, alerji/hassasiyet girişi, tarif pişirme adımları ve hata kurtarma ekranı reklam dışı kalmalıdır.

## Review sonrası karar

Kullanıcı local nihai sürümü inceledikten sonra üç ayrı iş paketi açılır:

1. gerçek veri sağlayıcıları,
2. mobil mağaza paketleme,
3. monetizasyon + analytics + hukuki hazırlık.
