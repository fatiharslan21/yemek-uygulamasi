import { AD_POLICY_SUMMARY } from '../services/adPolicy'
import '../legal-center.css'

export function LegalCenter() {
  return (
    <section className="profile-section shell legal-center-card">
      <div className="profile-section-head">
        <div><span>🛡️</span><div><small>Gizlilik & koşullar</small><h2>Lokma neyi nasıl kullanıyor?</h2><p>Kısa, okunabilir ve uygulama davranışıyla uyumlu veri ve kullanım özeti.</p></div></div>
      </div>

      <div className="legal-grid">
        <article><span>📍</span><div><strong>Konum</strong><p>İl / ilçe / mahalle restoran keşfi için kullanılabilir. Canlı konumdan alınan kesin enlem, boylam ve doğruluk bilgisi bulut yedeğine dahil edilmez.</p></div></article>
        <article><span>⚖️</span><div><strong>Beslenme & kilo</strong><p>Kalori, protein ve kilo takibi genel planlama amaçlıdır; tıbbi tanı veya tedavi yerine geçmez. Özel sağlık durumlarında profesyonel görüş gerekir.</p></div></article>
        <article><span>⚠️</span><div><strong>Alerji / hassasiyet</strong><p>Filtreler risk azaltmaya yardımcı olur ancak ürün etiketi, restoran bilgisi ve çapraz bulaşma kontrolünün yerine geçmez. Kullanıcı her zaman güncel içerik bilgisini doğrulamalıdır.</p></div></article>
        <article><span>🛒</span><div><strong>Market fiyatları</strong><p>BİM, A101, ŞOK, Migros ve CarrefourSA için gösterilen fiyatlar canlı mağaza fiyatı değil, bütçe planlaması için tahmini aralıklardır.</p></div></article>
        <article><span>🍽️</span><div><strong>Restoran bilgisi</strong><p>Yakın restoran bilgileri üçüncü taraf harita kayıtlarından gelebilir; saat, telefon, servis ve konum bilgisi eksik veya güncelliğini yitirmiş olabilir.</p></div></article>
        <article><span>☁️</span><div><strong>Hesap & yedek</strong><p>Hesap açmak zorunlu değildir. Bulut bağlantısı etkinse kullanıcı kendi yedeğini açıkça gönderir veya geri getirir; otomatik ve sessiz veri ezme yapılmaz.</p></div></article>
      </div>

      <div className="legal-ad-policy">
        <div><span>🌿</span><div><strong>Reklam sınırımız</strong><p>İlk {AD_POLICY_SUMMARY.adFreeDays} gün tamamen reklamsızdır. Bugün, onboarding, menü onayı, tarif adımları, kilo takibi ve profil ekranında reklam gösterilmez. Gelecekte reklam açılırsa yalnızca Hafta veya Alışveriş ekranında en fazla {AD_POLICY_SUMMARY.maxNativeCardsPerScreen} doğal sponsor kartı ve en az {AD_POLICY_SUMMARY.minHoursBetweenSponsoredCards} saat aralık hedeflenir.</p></div></div>
      </div>

      <div className="legal-terms-note">Lokma’daki tahmini fiyat, beslenme hedefi ve işletme bilgileri karar desteğidir. Kullanıcı satın alma, tüketim ve sağlık kararlarında güncel kaynakları ayrıca kontrol etmelidir.</div>
    </section>
  )
}
