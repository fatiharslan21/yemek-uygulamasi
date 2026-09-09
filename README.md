# 🍋 Lokma — Akıllı Yemek Planlayıcı

Türkiye'den başlayıp daha sonra Avrupa ve ABD'ye açılması planlanan; bütçe, beslenme tipi, hedef, konum, mutfak ekipmanı ve gün sayısı üzerinden haftalık yemek planı oluşturan uygulama.

> Bu repo şu aşamada yalnızca **local development** içindir. Netlify, Vercel veya başka bir publish/deploy ayarı yoktur.

## ▶️ Localde çalıştırma

Gereksinim: Node.js 18+.

```bash
npm install
npm run dev
```

Tarayıcıda Vite'ın verdiği local adresi aç. Varsayılan adres genellikle `http://localhost:5173` olur.

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
- kalori / protein hedefleri
- paket boyuna göre alışveriş listesi
- malzeme yeniden kullanım / israf azaltma mantığı
- öğün değiştirme
- öğün kilitleme
- kilitli öğünleri koruyarak haftayı yeniden karıştırma
- tarif detay çekmecesi
- aynı ev yemeği için alternatif pişirme senaryoları (ör. Ocak / Fırın / Airfryer)
- **Nearby v0.2:** OpenStreetMap / Overpass ile çevredeki gerçek market ve restoran isimleri, türleri ve kuş uçuşu mesafeleri
- gerçek yakındaki restoranları sipariş / dışarı öğünlerine bağlama
- seçilen restoranı haftalık öğün kartında gösterme
- gerçek yakındaki marketlerden birini alışveriş sepeti marketi olarak seçme
- seçilen / en yakın marketi alışveriş sekmesinde sepetle birlikte gösterme

## 🧠 Plan motorunun mevcut girdileri

- beslenme tipi
- alerjen / hassasiyet
- sevmediği ürünler
- hedef kalori / protein
- haftalık bütçe
- kişi sayısı
- ev / sipariş / dışarı oranı
- mevcut mutfak ekipmanı
- malzeme yeniden kullanımı

## 📍 Konum ve işletme verisi

Şu anda gerçek konum ve gerçek işletme keşfi vardır. Nearby v0.2, anahtar gerektirmeyen açık veri kaynaklarıyla çalışır:

- OpenStreetMap Nominatim: adres / koordinat çözümleme
- OpenStreetMap Overpass: yakındaki market ve restoran keşfi

Restoran adayları öğünün adı / etiketi, işletmenin mutfak türü ve mesafesi birlikte değerlendirilerek sıralanır. Kullanıcı bir restoranı doğrudan dışarı / sipariş öğününe bağlayabilir. Market tarafında da yakındaki gerçek işletmelerden biri sepet marketi olarak seçilebilir.

Bu kaynakların kapsaması bölgeye göre değişebilir. Market ürün fiyatları ve restoran menü fiyatları henüz gerçek veri değildir.

## 💸 Şimdilik demo kalan veri

- market ürün fiyatları
- restoran / sipariş fiyatları
- restoran menü besin değerleri
- stok bilgisi
- yürüyüş / sürüş rota mesafesi

## 🗺️ Sıradaki büyük geliştirmeler

1. gerçek restoran menü / ürün eşleştirme katmanı
2. gerçek market fiyat kaynakları ve fiyat normalizasyonu
3. “en ucuz tek market” ve “en ucuz çoklu market sepeti” optimizasyonu
4. yürüyüş / sürüş mesafesi ve rota maliyeti
5. tarif kataloğunu büyütme ve tarif bazlı doğrulanmış pişirme adımları
6. favoriler, geçmiş planlar ve kullanıcı geri bildiriminden öğrenme
7. batch cooking / meal-prep zamanı ve haftalık mutfak takvimi

## 🎨 Tasarım ilkeleri

- mobil öncelikli responsive yapı
- bol görsel ve sıcak yemek dili
- kontrollü emoji kullanımı
- hafif mikro animasyonlar
- bütçenin her zaman görünür olması
- “neden bunu önerdin?” açıklanabilirliği
- gerçek veri ile demo verisinin açıkça ayrılması
- kullanıcının elindeki ekipmana ve gerçek çevresine uyan öneriler
