# 🍋 Lokma — Kişisel Yemek Planlayıcı

Lokma; bütçe, beslenme tercihi, hedef, konum, mutfak ekipmanı ve günlük hayatı tek bir mobil-first yemek planında birleştiren Türkiye-first uygulama.

> Ürün hâlâ **local review** modundadır. Deploy yoktur. App Store / Google Play yayınlama, signing ve canlı reklamlar daha sonra yapılacaktır.

## ▶️ Localde çalıştırma

Node.js 22 önerilir.

```bash
npm install
npm run dev
```

Bağımlılık değişmediyse sonraki güncellemelerde çoğunlukla:

```bash
git pull
npm run dev
```

yeterlidir.

## 📱 Ana kullanıcı akışı

- İlk kullanıcı landing'e düşmez; doğrudan **Konum → Profil/Tercihler → Menü Önizleme** akışına girer.
- Plan, kullanıcı haftalık menünün tamamını görüp **onay vermeden başlamaz**.
- Menü önizlemede `Tercihleri düzenle / Başka menü oluştur / Bu menüyü onayla` aksiyonları vardır.
- Geri gelen kullanıcı doğrudan mevcut planına döner.
- Ana kullanım yüzeyi **☀️ Bugün** ekranıdır.
- Mobil alt navigasyon: **Bugün / Hafta / Liste / Profil**.
- Plan döngüsü tamamlanınca yeni hafta da yine menü onayından geçer.

## ☀️ Bugün

- gerçek Türkçe tarih ve plan günü
- sıradaki öğün
- `Yedim / Atladım / Değiştir / Detay`
- günlük kalori ve protein ilerlemesi
- tahmini öğün harcaması
- kalıcı tarif favorileri
- bugün/yarın ortak malzeme sinyali
- 3 günlük Meal Prep görevleri

## 🧠 Plan motoru

- 3–7 günlük plan
- hedef kalori/protein
- haftalık bütçe
- kişi sayısı
- hepçil / vejetaryen / vegan / pesketaryen
- alerji/hassasiyet ve sevmediği ürün filtreleri
- Deniz ürünü ↔ balık ve Soya ↔ tofu gibi ek katalog güvenlik eşlemeleri
- ev / sipariş / dışarı dağılımı
- Ocak / Fırın / Airfryer / Mikrodalga / Tost makinesi / Blender uyumluluğu
- malzeme yeniden kullanımı ve tekrar cezası
- bütçe gerektiğinde pahalı dışarı öğünlerini ev seçenekleriyle dengeleme
- favorileri kontrollü biçimde yeni planlara taşıyan kişiselleştirme katmanı

> Alerji filtresi yardımcı bir ürün özelliğidir; ürün etiketi, restoran beyanı ve çapraz bulaşma kontrolünün yerine geçmez.

## 🍳 Tarif ve düzenleme

- öğün değiştirme
- öğün kilitleme
- kilitli öğünleri koruyarak haftayı yeniden karıştırma
- kişi sayısına göre malzeme miktarı
- öneri gerekçesi
- aynı ev yemeği için uygun olduğunda farklı pişirme senaryoları
- Ocak / Fırın / Airfryer vb. ekipman kontrolü

## 🛒 Dolap + alışveriş

- haftanın tamamından üretilen paket bazlı alışveriş listesi
- her kalem için evdeki miktarı girme
- net eksik miktarı yeniden hesaplama
- `Tamamı evde` ve `Aldım` aksiyonları
- kalan miktarı paket boyuna tekrar yuvarlama
- checklist ve stok durumunu cihazda saklama

### Market fiyat rehberi

Yakındaki market taraması kullanıcı yüzünden kaldırıldı. Bunun yerine sabit referans zincirleri gösterilir:

- BİM
- A101
- ŞOK
- Migros
- CarrefourSA

Lokma bu zincirler için **tahmini fiyat aralığı** üretir. Bunlar canlı mağaza fiyatı veya stok garantisi değildir; bütçe planlama bandıdır.

## 📍 Restoran keşfi

Konum sadece restoran keşfinde kullanılır:

- Browser Geolocation
- Nominatim: koordinat ↔ İl / İlçe / Mahalle çözümleme
- OpenStreetMap / Overpass: yakındaki gerçek restoran keşfi
- işletme adı, türü ve kuş uçuşu mesafe
- kayıtta varsa açılış saati, web sitesi, telefon, paket servis/gel-al bilgisi
- dışarı/sipariş öğününe restoran bağlama

OpenStreetMap kayıtları eksik veya eski olabilir; işletme metadatası gerçek-zaman garantisi olarak sunulmaz.

## ⚖️ Kilo takibi

- tarih + kilo kaydı
- ilk / son kayıt
- toplam değişim
- küçük trend grafiği
- son tartımlar
- kilo kayıtları mevcut haftalık planı otomatik değiştirmez
- plan kilosu değiştirildiğinde yeni menü yeniden görülür ve onaylanır

## ☁️ Hesap ve bulut yedek

Lokma **local-first** çalışır; hesap zorunlu değildir.

Supabase adaptörü hazırdır. Ortam değişkenleri yoksa uygulama local modda çalışmaya devam eder. Supabase bağlandığında Profil ekranında:

- e-posta + şifre hesap açma
- giriş / çıkış
- `Bu cihazı buluta yedekle`
- `Buluttaki yedeği getir`
- hesapsız JSON yedeği indirme

aktif olur.

Kesin `latitude`, `longitude` ve `locationAccuracy` bilgileri bulut yedeğine dahil edilmez.

Kurulum: `docs/CLOUD_SETUP.md`

## 🛡️ Gizlilik ve reklam politikası

Profil içinde okunabilir Gizlilik & Koşullar özeti vardır.

Reklamlar şu anda tamamen kapalıdır. Kod seviyesinde ürün kuralı:

- ilk 3 gün reklam yok
- onboarding'de reklam yok
- menü onayında reklam yok
- tarif adımlarında reklam yok
- kilo takibinde reklam yok
- ileride açılırsa yalnızca Hafta / Alışveriş yüzeyinde en fazla 1 doğal sponsor kartı hedeflenir

## 📲 iOS / Android hazırlığı

Capacitor 8 tabanlı native shell hazırlığı repoya eklenmiştir.

```bash
npm run mobile:add:android
npm run mobile:add:ios
npm run mobile:sync
```

Platform oluşturma ve store signing henüz yapılmaz. Ayrıntı: `docs/MOBILE_SETUP.md`.

## 👤 Profil ve öğrenme

- mobil Profil Merkezi
- hedef / bütçe / konum özeti
- hesap ve yedek kartı
- kilo takibi
- favori tarifleri görme ve silme
- favorileri yeni plana kat ayarı
- hareketleri azalt tercihi
- geçmiş planları otomatik arşivleme
- gizlilik & koşullar merkezi
- yerel verileri tamamen sıfırlama

## ✅ Kalite

`.github/workflows/ci.yml` deploy etmez; her push'ta:

```bash
npm install
npm run build
```

ile TypeScript + Vite doğrulaması yapar ve başarılıysa kısa süreli review `dist` artifact'i üretir.

## 🎨 Tasarım ilkeleri

- mobile-first, tek elle kullanılabilir
- ilk girişte doğrudan temel işe götürme
- kullanıcı onayı olmadan planı başlatmama
- warm/off-white + yeşil Lokma dili
- safe-area uyumu
- bütçeyi görünür tutma
- tahmini veri ile gerçek veriyi karıştırmama
- kesin konumu gereksiz yere buluta taşımama
- hesabı zorunlu tutmama
- reklamı kullanıcı deneyiminin önüne koymama
