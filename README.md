# 🍋 Lokma — Akıllı Yemek Planlayıcı

Türkiye'den başlayıp daha sonra Avrupa ve ABD'ye açılması planlanan; bütçe, beslenme tipi, hedef, konum, mutfak ekipmanı ve gün sayısı üzerinden haftalık yemek planı oluşturan mobil-first uygulama.

> Bu repo şu aşamada yalnızca **local development** içindir. Netlify, Vercel veya başka bir publish/deploy ayarı yoktur.

## ▶️ Localde çalıştırma

Gereksinim: Node.js 18+.

```bash
npm install
npm run dev
```

Tarayıcıda Vite'ın verdiği local adresi aç. Varsayılan adres genellikle `http://localhost:5173` olur.

## 📱 Uygulama davranışı

Lokma artık landing-first bir web sitesi gibi davranmaz.

- **İlk kez giren kullanıcı** doğrudan konum → profil → plan oluşturma akışına gider.
- İlk onboarding tamamlandığında profil bu cihazda localStorage ile saklanır.
- **Geri gelen kullanıcı** doğrudan mevcut plan deneyimine gider.
- Dashboard'un ana sekmesi **☀️ Bugün** ekranıdır.
- Aynı gün içinde kullanıcı son açık sekmesine dönebilir; yeni gün başladığında uygulama otomatik olarak Bugün ekranına döner.
- Haftalık plan, öğün değişiklikleri, kilitli öğünler, `Yedim / Atladım` durumları, plan tarihi ve açık sekme plan oturumu olarak saklanır.
- Profil değişirse eski plan oturumu fingerprint uyuşmadığı için otomatik kullanılmaz; yeni tercihlerle yeni plan oluşturulur.
- Tanıtım/“Lokma hakkında” ekranı ikincil ekrandır; ürünün ana giriş kapısı değildir.
- Mobil dashboard alt navigasyonu **Bugün / Hafta / Liste / Profil** şeklindedir.
- iOS/Android safe-area ve mobil web-app meta ayarları bulunur.

## ☀️ Bugün ekranı

Lokma'nın günlük kullanım merkezi:

- planın başladığı tarihe göre bugünün gerçek plan gününü otomatik bulur
- Türkçe gerçek tarih gösterir
- günün sıradaki öğününü öne çıkarır
- öğünlerde `Yedim`, `Atladım`, `Değiştir`, `Detay` aksiyonları vardır
- günlük yenilen kalori ve protein ilerlemesini gösterir
- öğün durumları cihazda kalıcıdır
- tarifleri `♥ Favori` olarak saklar; favoriler plan değişse bile korunur
- bugün ve yarın ortak kullanılan malzemelerden **“yarın için şimdi hazırla”** önerisi üretir
- bugün tekrar kullanılan alışveriş malzemelerini gösterir
- plan süresi bittiğinde mevcut tercihleri koruyarak bugünden yeni plan başlatabilir

## 🛒 Alışveriş deneyimi

- paket boyuna göre haftalık alışveriş listesi
- `Evde var` ve `Aldım` checklist aksiyonları
- checklist durumu aynı sepet için cihazda kalıcıdır
- `Evde var` veya `Aldım` işaretlenen kalemler kalan sepetten çıkarılır
- Fiyat İstihbaratı yalnızca gerçekten kalan ürünleri karşılaştırır
- kalan katalog maliyeti ve tamamlanma yüzdesi anlık güncellenir

## ✅ Şu anda çalışan ürün parçaları

- plan başlamadan önce canlı konum veya İl / İlçe / Mahalle seçimi
- tarayıcı Geolocation API ile gerçek koordinat alma
- OpenStreetMap Nominatim ile koordinatı İl / İlçe / Mahalle bilgisine dönüştürme
- manuel İl / İlçe / Mahalle bilgisini harita noktasına dönüştürebilme
- kullanıcı profili: yaş, boy, kilo, aktivite, hedef
- hepçil / vejetaryen / vegan / pesketaryen
- alerji / hassasiyet ve sevmediği yiyecek filtreleri
- haftalık bütçe, gün sayısı ve kişi sayısı
- ev / sipariş / dışarı yemek dağılımı
- mutfak ekipmanı profili: Ocak, Fırın, Airfryer, Mikrodalga, Tost makinesi, Blender
- ekipman uyumluluğunu dikkate alan plan motoru
- 3–7 günlük haftalık plan üretimi
- planı gerçek başlangıç tarihine bağlayan takvim katmanı
- haftalık görünümde gerçek tarih başlıkları ve `Bugün / Geçmiş / Planlı` durumları
- kalori / protein hedefleri
- malzeme yeniden kullanım / israf azaltma mantığı
- öğün değiştirme ve kilitleme
- kilitli öğünleri koruyarak haftayı yeniden karıştırma
- günlük öğün durumu takibi (`Yedim / Atladım`)
- planlar arasında kalıcı tarif favorileri
- tarif detay çekmecesi
- aynı ev yemeği için alternatif pişirme senaryoları (ör. Ocak / Fırın / Airfryer)
- **Nearby v0.3:** OpenStreetMap / Overpass ile çevredeki gerçek market ve restoran isimleri, türleri ve kuş uçuşu mesafeleri
- OSM kaydında varsa açılış saati, web sitesi, telefon, paket servis / gel-al etiketleri
- gerçek yakındaki restoranları sipariş / dışarı öğünlerine bağlama
- gerçek yakındaki marketlerden birini alışveriş sepeti marketi olarak seçme
- **Fiyat İstihbaratı v0.2:** kalan sepeti yakın gerçek marketler üzerinde açıkça etiketlenmiş fiyat simülasyonuyla karşılaştırma
- simülasyon üzerinden “en ucuz tek market” karşılaştırması
- en fazla 2 markete bölünmüş sepet optimizasyonu
- market seçimini en çok etkileyen fiyat oynaklığı yüksek ürünleri gösterme

## 📍 Konum ve işletme verisi

Şu anda gerçek konum ve gerçek işletme keşfi vardır. Nearby v0.3, anahtar gerektirmeyen açık veri kaynaklarıyla çalışır:

- OpenStreetMap Nominatim: adres / koordinat çözümleme
- OpenStreetMap Overpass: yakındaki market ve restoran keşfi

Restoran adayları öğünün adı / etiketi, işletmenin mutfak türü ve mesafesi birlikte değerlendirilerek sıralanır. Kullanıcı bir restoranı doğrudan dışarı / sipariş öğününe bağlayabilir. Market tarafında da yakındaki gerçek işletmelerden biri sepet marketi olarak seçilebilir.

OpenStreetMap kayıtları eksik veya güncel olmayabilir. İşletme meta bilgileri sadece OSM kaydında mevcutsa gösterilir.

## 💸 Fiyat veri sözleşmesi

Lokma fiyatın kaynağını veri modelinde ayırır. Böylece simülasyon fiyatı yanlışlıkla canlı fiyatmış gibi gösterilmez.

- `simulated`: geliştirme / optimizasyon senaryosu
- `manual`: kullanıcı veya operasyon tarafından doğrulanmış manuel fiyat girişi
- `live`: gerçek market / menü fiyat sağlayıcısından gelen veri

**Fiyat İstihbaratı v0.2** şu anda `simulated` çalışır. Market adı ve mesafesi gerçek Nearby verisidir; ürün fiyatı değildir.

## 🧪 Şimdilik demo / simülasyon kalan veri

- market ürün fiyatları
- restoran / sipariş fiyatları
- restoran menü besin değerleri
- stok bilgisi
- yürüyüş / sürüş rota mesafesi

## 🗺️ Sıradaki büyük geliştirmeler

1. favorilerin yeni plan seçimlerine kontrollü biçimde ağırlık vermesi
2. gerçek market ürün sağlayıcısı / fiyat normalizasyon adaptörleri
3. gerçek restoran menü / ürün eşleştirme katmanı
4. kullanıcı doğrulamalı manuel fiyat girişi ve fiyat geçmişi
5. çoklu market optimizasyonuna yürüyüş/sürüş zamanı ve yol maliyeti ekleme
6. batch cooking / meal-prep zamanı ve haftalık mutfak takvimi
7. geçmiş planlar ve kullanıcı geri bildiriminden öğrenme

## 🎨 Tasarım ilkeleri

- **mobile-first**: web sitesi hissinden çok mobil uygulama davranışı
- kullanıcıyı ilk girişte doğrudan temel işe götürmek
- günlük tekrar kullanım için ayrı Bugün yüzeyi
- tek elle kullanılabilir büyük dokunma alanları
- alt sabit uygulama navigasyonu
- safe-area uyumu
- bol görsel ve sıcak yemek dili
- kontrollü emoji kullanımı
- hafif mikro animasyonlar
- bütçenin her zaman görünür olması
- “neden bunu önerdin?” açıklanabilirliği
- gerçek veri ile demo / simülasyon verisinin açıkça ayrılması
- kullanıcının elindeki ekipmana ve gerçek çevresine uyan öneriler
