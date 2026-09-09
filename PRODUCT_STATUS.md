# Lokma — Product Status

## Local review hedefi

Bu aşamanın amacı uygulamayı yayınlamak değil; kullanıcının telefonda kullanıyormuş gibi baştan sona deneyebileceği, build'i geçen ve temel ürün kararları tamamlanmış bir local sürüm üretmektir.

### Tamamlanan ürün alanları

- first-run konum + onboarding
- haftalık menüyü görmeden planı başlatmama
- menü yeniden oluşturma / düzenleme / onaylama
- returning-user resume
- mobil Bugün / Hafta / Liste / Profil navigasyonu
- tarih bazlı plan döngüsü
- yeni hafta için tekrar menü onayı
- bütçe / kalori / protein plan motoru
- diyet / hassasiyet / dislikes filtreleri
- ek katalog güvenlik eşlemeleri
- mutfak ekipmanı uyumluluğu
- öğün swap / lock / shuffle
- tarif detayı + alternatif pişirme yöntemleri
- favoriler ve favori-aware yeni plan
- günlük Yedim / Atladım takibi
- 3 günlük meal-prep görevleri
- paket bazlı alışveriş listesi
- miktarlı dolap stoğu ve net ihtiyaç hesabı
- sabit BİM / A101 / ŞOK / Migros / CarrefourSA tahmini fiyat bantları
- gerçek Nearby restoran keşfi
- dışarı/sipariş öğününe restoran bağlama
- kilo takibi
- profil merkezi ve erişilebilirlik ayarı
- plan geçmişi
- local-first hesap/bulut adaptörü
- Supabase auth + kullanıcı yedeği için hazır servis ve RLS şeması
- kesin GPS koordinatını bulut yedeğinden çıkarma
- yerel JSON yedeği indirme
- uygulama içi gizlilik / kullanım özeti
- kullanıcı dostu reklam politikasının kod seviyesinde tanımlanması
- app-level error recovery
- PWA manifest / standalone hazırlığı
- Capacitor 8 native shell config ve scriptleri
- non-deploying CI build doğrulaması

## Yayından önce tamamlanacak işler

### Bulut / hesap

- gerçek Supabase projesi oluşturup env anahtarlarını bağlama
- üretim e-posta şablonları
- şifre sıfırlama akışı
- Apple Sign In
- Google Sign In
- hesap silme akışı
- otomatik senkronizasyon açılacaksa conflict/merge stratejisi

### Gerçek veri

- gerçek market ürün / stok / fiyat sağlayıcıları
- gerçek restoran menü / fiyat / besin verisi
- rota API'siyle yürüyüş/sürüş süresi
- server-side cache / rate-limit koruması

### Mobil mağaza

- Android/iOS platform klasörlerini nihai bundle ID ile oluşturma
- iOS/Android permission metinleri
- app icon / splash / store screenshots
- signing, certificates ve provisioning
- TestFlight / Play Internal Testing
- App Store / Google Play listing

### Operasyon / hukuk

- yayınlanabilir tam Privacy Policy URL'i
- Terms of Service URL'i
- KVKK/GDPR yükümlülüklerinin final kontrolü
- gerektiğinde consent / ATT akışı
- analytics/crash-reporting sağlayıcısı
- support/contact akışı

### Monetizasyon

- reklam ağı seçimi
- premium/freemium ürün paketi
- satın alma/abonelik entegrasyonu
- reklam consent ve ölçümleme
- gelir / retention dashboard'u

## Reklam ürün kuralı

Reklamlar local review sürümünde kapalıdır.

Gelecekte reklam açılsa bile:

- ilk 3 gün reklam gösterilmez,
- onboarding reklam dışıdır,
- menü onayı reklam dışıdır,
- tarif adımları reklam dışıdır,
- kilo takibi reklam dışıdır,
- Hafta / Alışveriş ekranında en fazla bir doğal sponsor kartı hedeflenir.

## Teknik yayın kararı

Mevcut React/Vite uygulaması Capacitor ile iOS ve Android shell içine alınmaya hazırdır. Store signing başlamadan önce `com.lokma.app` geçici app ID'si nihai bundle/application ID ile değiştirilmelidir.
