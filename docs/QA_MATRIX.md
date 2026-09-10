# Lokma — Final QA Matrisi

Bu dosya final preview üretilmeden önce geçilecek kontrol listesidir.

## İlk kullanım

- [ ] Temiz cihazda açılış doğrudan konum/plan kurma akışına gider.
- [ ] Konum izni reddedilirse il / ilçe / mahalle ile devam edilebilir.
- [ ] Canlı konum alınırsa adres çözümleme başarısız olsa bile kullanıcı akışta kalır.
- [ ] Kullanıcı bütün seçimleri bitirince önce haftalık menüyü görür; onaysız plan başlamaz.
- [ ] “Başka menü oluştur” aynı tercihleri korur.
- [ ] “Tercihleri düzenle” verileri kaybetmeden geri döner.

## Menü / tarif

- [ ] 2, 3 ve 4 öğün düzenleri boş gün üretmez.
- [ ] Kahvaltı kapalı profilde kahvaltı önerilmez.
- [ ] Vegan/vejetaryen/pesketaryen filtreleri doğru çalışır.
- [ ] Deniz ürünü hassasiyetinde balık kaçmaz.
- [ ] Soya hassasiyetinde tofu kaçmaz.
- [ ] Dar filtrelerde uygulama çökmez; uygun alternatif yoksa anlaşılır fallback gösterir.
- [ ] Ocak / fırın / airfryer / mikrodalga / tost makinesi / blender tercihleri ev tariflerine yansır.
- [ ] Tarif çekmecesi Escape ile kapanır ve klavye odağı görünürdür.
- [ ] Alerji/hassasiyet ekranında tıbbi güvenlik garantisi verilmez.

## Günlük kullanım

- [ ] Yedim / Atladım / Geri al durumları refresh sonrası korunur.
- [ ] Favoriler refresh sonrası korunur ve yeni planı ölçülü etkiler.
- [ ] Kilitli öğün shuffle sırasında değişmez.
- [ ] Yedim/atladım öğünü yanlışlıkla değiştirilemez.
- [ ] Yeni gün başladığında uygulama Bugün sekmesine döner.
- [ ] 7 gün bitince eski hafta arşivlenir ve yeni menü önce onaya gelir.

## Alışveriş

- [ ] Dolap miktarı kısmi ise yalnızca eksik miktar hesaplanır.
- [ ] “Aldım” işaretli ürün kalan sepetten çıkar.
- [ ] BİM / A101 / ŞOK / Migros / CarrefourSA bantları canlı fiyat gibi sunulmaz.
- [ ] Sıfır kalan ürün olduğunda tamamlandı durumu görünür.
- [ ] Plan değişince alışveriş imzası eski checklist'i yanlış sepete taşımaz.

## Restoran / konum

- [ ] Market için konum taraması yapılmaz.
- [ ] Restoran taraması kullanıcı isteğiyle başlar.
- [ ] Restoran API/açık veri hatası planın kalanını bozmaz.
- [ ] Restoran yoksa boş durum anlaşılırdır.
- [ ] Dışarı öğünü restoran seçilmeden de kullanılabilir.

## Hesap / bulut

- [ ] Supabase ayarı yokken uygulama tamamen local çalışır.
- [ ] Offline durumda plan çalışır, bulut butonları pasif kalır.
- [ ] Giriş / kayıt hataları kullanıcıya okunabilir mesaj verir.
- [ ] Şifremi unuttum e-postası gönderilebilir.
- [ ] Recovery linkinden dönünce yeni şifre ekranı açılır.
- [ ] Bulut yedek tarihi ve kayıt sayısı gösterilir.
- [ ] Geri yükleme mevcut cihaz verisini ezmeden önce onay ister.
- [ ] Bozuk/uyumsuz snapshot restore edilmez.
- [ ] Restore hata verirse eski local kayıtlar mümkün olduğunca geri alınır.
- [ ] Bulut snapshot kesin GPS koordinatı içermez.
- [ ] Hesap silme local planı ayrıca silmez.

## Erişilebilirlik

- [ ] Klavyeyle tüm ana aksiyonlara ulaşılabilir.
- [ ] Skip-link görünür odakta çalışır.
- [ ] Focus-visible halkası kaybolmaz.
- [ ] Sistem Reduce Motion tercihi otomatik uygulanır.
- [ ] Uygulama içi Hareketleri azalt ayarı çalışır.
- [ ] Büyük metin modunda butonlar taşmaz.
- [ ] Yüksek kontrast modunda metin/çerçeve/odak ayrımı korunur.
- [ ] Mobil dokunma hedefleri en az yaklaşık 44 px'dir.
- [ ] 320 px, 375 px, 390 px, 430 px ve tablet genişliklerinde yatay taşma kontrol edilir.

## Release otomasyonu

- [ ] `npm run qa:release` yeşil.
- [ ] Derlenmiş pakette OpenAI / ChatGPT ibaresi yok.
- [ ] Derlenmiş pakette teknik `Plan motoru vX` rozeti yok.
- [ ] Derlenmiş pakette kullanıcıya dönük `Nearby` geliştirme terimi yok.
- [ ] Manifest ve app icon build'e kopyalanıyor.
- [ ] Capacitor package ID `com.fatiharslan.lokma`.
- [ ] Manual Android Shell Smoke debug APK üretebiliyor.
- [ ] Final preview yalnızca bu listenin kritik maddeleri temizken üretilir.
