# 🍋 Lokma — Akıllı Yemek Planlayıcı

Lokma; bütçe, beslenme tercihi, hedef, konum, mutfak ekipmanı ve günlük hayatı tek bir mobil-first yemek planında birleştiren Türkiye-first uygulama.

> Şu aşamada ürün **local review** içindir. Netlify/Vercel/GitHub Pages deploy'u, App Store veya Google Play paketi yoktur. Önce ürün deneyimi tamamlanır ve incelenir; yayın fazı daha sonra başlatılır.

## ▶️ Localde çalıştırma

Node.js 18+ gerekir.

```bash
npm install
npm run dev
```

Günlük kullanımda kod güncellendikten sonra çoğunlukla:

```bash
git pull
npm run dev
```

yeterlidir.

## 📱 Ürün davranışı

- İlk kullanıcı landing'e düşmez; doğrudan **Konum → Profil/Tercihler → Plan** akışına girer.
- Geri gelen kullanıcı doğrudan mevcut planına döner.
- Ana kullanım yüzeyi **☀️ Bugün** ekranıdır.
- Mobil alt navigasyon: **Bugün / Hafta / Liste / Profil**.
- Plan ve günlük davranışlar cihazda otomatik saklanır.
- Yeni gün başladığında uygulama günlük kullanımı öne almak için tekrar Bugün'e döner.
- Plan döngüsü tamamlandığında mevcut tercihleri koruyarak yeni plan başlatılabilir.
- Beklenmeyen UI hatalarında uygulama seviyesinde kurtarma ekranı vardır.

## ☀️ Bugün

- gerçek Türkçe tarih ve plan günü
- sıradaki öğün
- `Yedim / Atladım / Değiştir / Detay`
- günlük kalori ve protein ilerlemesi
- tahmini öğün harcaması
- kalıcı tarif favorileri
- bugün/yarın ortak malzeme sinyali
- 3 günlük **Meal Prep** görevleri: ortak malzeme, toplam miktar, yaklaşık hazırlık süresi ve uygun ekipman

## 🧠 Plan motoru

- 3–7 günlük plan
- hedef kalori/protein
- haftalık bütçe
- kişi sayısı
- hepçil / vejetaryen / vegan / pesketaryen
- alerji/hassasiyet ve sevmediği ürün filtreleri
- ev / sipariş / dışarı dağılımı
- Ocak / Fırın / Airfryer / Mikrodalga / Tost makinesi / Blender uyumluluğu
- malzeme yeniden kullanımı ve tekrar cezası
- bütçe gerektiğinde pahalı dışarı öğünlerini daha uygun ev seçenekleriyle dengeleme
- favorileri kontrollü biçimde yeni planlara taşıyan kişiselleştirme katmanı

## 🍳 Tarif ve düzenleme

- öğün değiştirme
- öğün kilitleme
- kilitli öğünleri koruyarak haftayı yeniden karıştırma
- kişi sayısına göre malzeme miktarı
- “Lokma bunu neden seçti?” açıklaması
- aynı ev yemeği için uygun olduğunda farklı pişirme senaryoları
- Ocak / Fırın / Airfryer vb. ekipman kontrolü

## 🛒 Dolap + alışveriş

- haftanın tamamından üretilen paket bazlı alışveriş listesi
- her kalem için **evdeki miktarı** girme
- örneğin ihtiyaç 900 g, dolapta 600 g ise net 300 g ihtiyacı yeniden hesaplama
- `Tamamı evde` ve `Aldım` aksiyonları
- kalan miktarı market paket boyuna tekrar yuvarlama
- checklist ve stok durumu localStorage'da saklama
- Fiyat İstihbaratı yalnızca net kalan sepet üzerinde çalışır

## 📍 Gerçek çevre

Anahtar gerektirmeyen açık veri kaynaklarıyla:

- Browser Geolocation: gerçek cihaz koordinatı
- Nominatim: koordinat ↔ İl / İlçe / Mahalle çözümleme
- OpenStreetMap / Overpass: yakındaki gerçek market ve restoran keşfi
- gerçek işletme adı, türü ve kuş uçuşu mesafe
- OSM kaydında varsa açılış saati, web sitesi, telefon, paket servis/gel-al bilgisi
- dışarı/sipariş öğününe gerçek restoran bağlama
- alışveriş sepetine gerçek yakın market seçme

OpenStreetMap kayıtları eksik veya eski olabilir; bu yüzden işletme metadatası kesin gerçek-zaman bilgisi gibi sunulmaz.

## 💸 Fiyat İstihbaratı

Fiyat kaynağı modelde açıkça ayrıdır:

- `simulated`: geliştirme / optimizasyon senaryosu
- `manual`: doğrulanmış manuel fiyat girişi için ayrılmış sınıf
- `live`: gerçek sağlayıcı için ayrılmış sınıf

Şu an market isimleri ve mesafeler gerçektir; ürün fiyatları **simülasyondur**.

Çalışan optimizasyon:

- net kalan sepet için tek-market karşılaştırması
- en fazla 2 markete bölünmüş sepet senaryosu
- market seçimini en çok etkileyen fiyat farkı yüksek ürünler
- seçilen gerçek marketi sepetle ilişkilendirme

## 👤 Profil ve öğrenme

- mobil Profil Merkezi
- hedef / bütçe / konum / mutfak özeti
- favori tarifleri görme ve silme
- “favorileri yeni plana kat” ayarı
- hareketleri azalt / erişilebilirlik tercihi
- geçmiş planları otomatik arşivleme
- geçmiş planda takip yüzdesi, bütçe, ortalama kalori/protein ve yemek özeti
- yerel verileri tamamen sıfırlama

## 🧪 Bilerek launch fazına bırakılanlar

Bunlar local ürün deneyiminin kırık olduğu anlamına gelmez; dış servis, mağaza veya operasyon kararı gerektiren yayın işleri olarak ayrılmıştır:

- gerçek market ürün/stok/fiyat sağlayıcıları
- gerçek restoran menü ve menü fiyatları
- rota API'siyle yürüyüş/sürüş süresi
- kullanıcı hesabı ve bulut senkronizasyonu
- push notification altyapısı
- analytics / crash reporting sağlayıcısı
- App Store / Google Play native paketleme ve mağaza varlıkları
- privacy/terms/consent metinleri
- reklam SDK'sı / premium modeli

## 💰 Monetizasyon hazırlığı

Kod tabanında reklam/premium sözleşmesi ayrılmıştır ancak **reklamlar tamamen kapalıdır**. İlk kullanım, konum izni, alerji/hassasiyet ve tarif pişirme adımları reklam dışı yüzeyler olarak tanımlanmıştır. Gerçek reklam modeli ürün incelemesinden sonra birlikte kararlaştırılacaktır.

## ✅ Kalite

`.github/workflows/ci.yml` yalnızca doğrulama yapar; deploy etmez.

Her push'ta:

```bash
npm install
npm run build
```

çalıştırılarak TypeScript + Vite build kontrol edilir. Hata halinde kısa süreli build log artifact'i üretilir.

## 🎨 Tasarım ilkeleri

- mobile-first, tek elle kullanılabilir
- ilk girişte doğrudan temel işe götürme
- günlük kullanım için Bugün yüzeyi
- warm/off-white + yeşil Lokma dili
- safe-area uyumu
- açıklanabilir öneriler
- bütçeyi görünür tutma
- gerçek veri ile demo/simülasyonu asla karıştırmama
- mutfak ekipmanı ve çevreyi gerçek ürün girdisi kabul etme
- reklamı kullanıcı deneyiminin önüne koymama
