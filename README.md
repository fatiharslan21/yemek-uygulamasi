# 🍋 Lokma — Akıllı Yemek Planlayıcı

Türkiye'den başlayıp daha sonra Avrupa ve ABD'ye açılması planlanan, kullanıcının bütçesi + beslenme tipi + hedefi + konumu + gün sayısı üzerinden haftalık yemek planı oluşturan uygulamanın başlangıç iskeleti.

Bu repo şu aşamada yalnızca local development içindir. Netlify, Vercel veya başka bir publish/deploy ayarı yoktur.

## Localde çalıştırma

Gereksinim: Node.js 18+.

```bash
npm install
npm run dev
```

Tarayıcıda Vite'ın verdiği local adresi aç. Varsayılan adres genellikle `http://localhost:5173` olur.

## İlk ürün kapsamı

- gün sayısı
- haftalık bütçe
- hepçil / vejetaryen / vegan / pesketaryen
- kilo verme / koruma / bulk / dengeli beslenme
- evde yap / dışarıdan söyle / karışık
- il / ilçe / mahalle konumu
- örnek market ve restoran verileri
- bütçe ve makro odaklı plan önerileri

## Sonraki adımlar

1. onboarding ve kullanıcı profili
2. gerçek haftalık takvim görünümü
3. alerjenler ve sevmediği ürünler
4. porsiyon / kişi sayısı
5. bütçe optimizasyon motoru
6. Türkiye için market ve restoran veri katmanı
7. konum servisleri
8. gerçek fiyat normalizasyonu

## Tasarım ilkeleri

- mobil öncelikli responsive yapı
- bol görsel
- sıcak yemek dili
- kontrollü emoji kullanımı
- hafif animasyonlar
- bütçenin her zaman görünür olması
- gerçek veri ile demo verisinin açıkça ayrılması
