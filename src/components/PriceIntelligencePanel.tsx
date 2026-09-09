import { useMemo } from 'react'
import { useNearbyData } from '../context/NearbyDataContext'
import { buildPriceIntelligence } from '../services/priceIntelligence'
import type { ShoppingListItem } from '../types'
import '../price-intelligence.css'

type PriceIntelligencePanelProps = {
  shoppingList: ShoppingListItem[]
  catalogTotal: number
}

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function distanceText(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

export function PriceIntelligencePanel({ shoppingList, catalogTotal }: PriceIntelligencePanelProps) {
  const { places, preferredMarket, setPreferredMarket } = useNearbyData()
  const markets = useMemo(() => places.filter((place) => place.category === 'Market'), [places])
  const intelligence = useMemo(() => buildPriceIntelligence(markets, shoppingList), [markets, shoppingList])

  const selectedQuote = preferredMarket
    ? intelligence.quotes.find((quote) => quote.market.id === preferredMarket.id)
    : undefined

  const volatileItems = useMemo(() => {
    if (intelligence.quotes.length < 2) return []
    return shoppingList
      .map((item) => {
        const prices = intelligence.quotes
          .map((quote) => quote.items.find((entry) => entry.ingredientId === item.ingredientId)?.quotedPackagePrice)
          .filter((value): value is number => value != null)
        if (prices.length < 2) return null
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        return { item, min, max, spread: max - min }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => right.spread - left.spread)
      .slice(0, 5)
  }, [intelligence.quotes, shoppingList])

  if (markets.length === 0) {
    return (
      <section className="price-intelligence-panel price-empty">
        <div className="price-intelligence-heading">
          <div><span className="price-mode-badge">🧪 Fiyat İstihbaratı v0.1</span><h3>Sepeti marketler arasında karşılaştıralım.</h3><p>Önce Nearby bölümündeki “Çevremi tara”yı çalıştır. Gerçek marketler bulunduğunda Lokma fiyat motoru bu sepet üzerinde senaryo üretecek.</p></div>
        </div>
      </section>
    )
  }

  const bestSingle = intelligence.bestSingle
  const splitPlan = intelligence.splitPlan

  return (
    <section className="price-intelligence-panel">
      <div className="price-intelligence-heading">
        <div>
          <span className="price-mode-badge">🧪 Fiyat İstihbaratı v0.1 • SİMÜLASYON</span>
          <h3>Bu sepeti nereden almak daha mantıklı?</h3>
          <p>Market isimleri ve mesafeler gerçek Nearby verisidir. Aşağıdaki ürün fiyatları henüz canlı değildir; gerçek fiyat sağlayıcısını bağlamadan önce optimizasyon motorunu test eden, market bazında sabitlenmiş simülasyon senaryosudur.</p>
        </div>
      </div>

      <div className="price-summary-grid">
        <article><span>📒 Katalog baz toplam</span><strong>{money(catalogTotal)} ₺</strong><small>Plan motorundaki demo paket fiyatları</small></article>
        <article className="price-best"><span>🏪 En iyi tek market</span><strong>{bestSingle ? `${money(bestSingle.total)} ₺` : '—'}</strong><small>{bestSingle ? `${bestSingle.market.name} • ${distanceText(bestSingle.market.distanceMeters)}` : 'Hesaplanamadı'}</small></article>
        <article className="price-split"><span>✨ En iyi 2-market planı</span><strong>{splitPlan ? `${money(splitPlan.total)} ₺` : '—'}</strong><small>{splitPlan ? `${splitPlan.marketCount} durak • tek markete göre ${money(splitPlan.savingsVsBestSingle)} ₺ avantaj` : 'Hesaplanamadı'}</small></article>
        <article><span>📌 Seçili market</span><strong>{selectedQuote ? `${money(selectedQuote.total)} ₺` : 'Seçilmedi'}</strong><small>{selectedQuote ? `${selectedQuote.market.name} • simülasyon` : 'Aşağıdan bir market seçebilirsin'}</small></article>
      </div>

      <div className="market-quote-list">
        <div className="price-subheading"><div><strong>Tek market karşılaştırması</strong><small>Yakındaki ilk {intelligence.quotes.length} gerçek market • fiyatlar simülasyon</small></div></div>
        {intelligence.quotes.map((quote, index) => {
          const selected = preferredMarket?.id === quote.market.id
          const difference = bestSingle ? quote.total - bestSingle.total : 0
          return (
            <article className={`market-quote-row ${index === 0 ? 'best' : ''} ${selected ? 'selected' : ''}`} key={quote.market.id}>
              <span className="market-quote-rank">{index + 1}</span>
              <div className="market-quote-main"><strong>{quote.market.name}</strong><small>{quote.market.subtype} • {distanceText(quote.market.distanceMeters)}</small></div>
              <div className="market-quote-total"><strong>{money(quote.total)} ₺</strong><small>{index === 0 ? '⭐ en düşük senaryo' : `+${money(difference)} ₺`}</small></div>
              <button type="button" className={selected ? 'selected' : ''} onClick={() => setPreferredMarket(selected ? undefined : quote.market)}>{selected ? '✓ Sepet burada' : 'Sepet için seç'}</button>
            </article>
          )
        })}
      </div>

      {splitPlan && splitPlan.groups.length > 0 && (
        <div className="split-basket-card">
          <div className="price-subheading"><div><strong>🧩 2-market sepet optimizasyonu</strong><small>Her ürünü seçili market çifti içindeki daha düşük simülasyon fiyatına yönlendirir.</small></div><b>{money(splitPlan.total)} ₺</b></div>
          <div className="split-market-grid">
            {splitPlan.groups.map((group) => (
              <article key={group.market.id}>
                <header><div><strong>{group.market.name}</strong><small>{distanceText(group.market.distanceMeters)} • {group.items.length} kalem</small></div><b>{money(group.subtotal)} ₺</b></header>
                <div className="split-item-chips">{group.items.slice(0, 8).map((item) => <span key={item.ingredientId}>{item.emoji} {item.name}</span>)}</div>
                {group.items.length > 8 && <small className="more-items">+ {group.items.length - 8} ürün daha</small>}
              </article>
            ))}
          </div>
          <div className="split-saving-note">💡 Bu senaryoda en iyi tek markete kıyasla <strong>{money(splitPlan.savingsVsBestSingle)} ₺</strong> daha düşük sepet çıkıyor. Gerçek fiyat ve rota verisi geldiğinde “ikinci markete uğramaya değer mi?” hesabına yol maliyeti/zamanı da eklenecek.</div>
        </div>
      )}

      {volatileItems.length > 0 && (
        <div className="price-spread-card">
          <div className="price-subheading"><div><strong>📊 Fiyatı en çok oynayan kalemler</strong><small>Bu sadece mevcut simülasyonda market seçimini en çok etkileyen ürünleri gösterir.</small></div></div>
          <div className="price-spread-list">
            {volatileItems.map(({ item, min, max, spread }) => (
              <div key={item.ingredientId}><span>{item.emoji}</span><div><strong>{item.name}</strong><small>{item.packageLabel} paket senaryosu</small></div><b>{money(min)}–{money(max)} ₺</b><em>Δ {money(spread)} ₺</em></div>
            ))}
          </div>
        </div>
      )}

      <div className="price-data-contract"><span>🔌</span><div><strong>Canlı fiyat bağlantısına hazır mimari</strong><p>UI ve optimizasyon artık fiyatın kaynağını biliyor. Sonraki sağlayıcı gerçek ürün fiyatı döndürdüğünde `simulated` yerine `live` olarak işaretlenecek; aynı tek-market / çoklu-market motoru çalışmaya devam edecek.</p></div></div>
    </section>
  )
}
