import { useEffect, useMemo, useState } from 'react'
import { useNearbyData } from '../context/NearbyDataContext'
import { buildPriceIntelligence } from '../services/priceIntelligence'
import {
  loadShoppingChecklist,
  saveShoppingChecklist,
  shoppingListSignature,
  type ShoppingChecklistState,
} from '../services/shoppingChecklistStorage'
import type { ShoppingListItem } from '../types'
import '../price-intelligence.css'
import '../shopping-checklist.css'

type PriceIntelligencePanelProps = {
  shoppingList: ShoppingListItem[]
  catalogTotal: number
}

type ChecklistUiState = ShoppingChecklistState & { signature: string }

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function distanceText(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

export function PriceIntelligencePanel({ shoppingList, catalogTotal }: PriceIntelligencePanelProps) {
  const { places, preferredMarket, setPreferredMarket } = useNearbyData()
  const signature = useMemo(() => shoppingListSignature(shoppingList), [shoppingList])
  const [checklist, setChecklist] = useState<ChecklistUiState>(() => ({ signature, ...loadShoppingChecklist(signature) }))

  useEffect(() => {
    setChecklist({ signature, ...loadShoppingChecklist(signature) })
  }, [signature])

  useEffect(() => {
    if (checklist.signature !== signature) return
    saveShoppingChecklist(signature, {
      pantryIngredientIds: checklist.pantryIngredientIds,
      purchasedIngredientIds: checklist.purchasedIngredientIds,
    })
  }, [signature, checklist])

  const activeChecklist = checklist.signature === signature
    ? checklist
    : { signature, pantryIngredientIds: [], purchasedIngredientIds: [] }
  const pantryIds = useMemo(() => new Set(activeChecklist.pantryIngredientIds), [activeChecklist.pantryIngredientIds])
  const purchasedIds = useMemo(() => new Set(activeChecklist.purchasedIngredientIds), [activeChecklist.purchasedIngredientIds])
  const remainingItems = useMemo(
    () => shoppingList.filter((item) => !pantryIds.has(item.ingredientId) && !purchasedIds.has(item.ingredientId)),
    [shoppingList, pantryIds, purchasedIds],
  )
  const remainingCatalogTotal = remainingItems.reduce((sum, item) => sum + item.estimatedCost, 0)
  const handledCount = Math.min(shoppingList.length, pantryIds.size + purchasedIds.size)
  const checklistPct = Math.round(handledCount / Math.max(1, shoppingList.length) * 100)

  const togglePantry = (ingredientId: string) => {
    setChecklist((current) => {
      const pantry = new Set(current.pantryIngredientIds)
      const purchased = new Set(current.purchasedIngredientIds)
      if (pantry.has(ingredientId)) pantry.delete(ingredientId)
      else {
        pantry.add(ingredientId)
        purchased.delete(ingredientId)
      }
      return { ...current, pantryIngredientIds: [...pantry], purchasedIngredientIds: [...purchased] }
    })
  }

  const togglePurchased = (ingredientId: string) => {
    setChecklist((current) => {
      const pantry = new Set(current.pantryIngredientIds)
      const purchased = new Set(current.purchasedIngredientIds)
      if (purchased.has(ingredientId)) purchased.delete(ingredientId)
      else {
        purchased.add(ingredientId)
        pantry.delete(ingredientId)
      }
      return { ...current, pantryIngredientIds: [...pantry], purchasedIngredientIds: [...purchased] }
    })
  }

  const resetChecklist = () => setChecklist((current) => ({ ...current, pantryIngredientIds: [], purchasedIngredientIds: [] }))

  const markets = useMemo(() => places.filter((place) => place.category === 'Market'), [places])
  const intelligence = useMemo(() => buildPriceIntelligence(markets, remainingItems), [markets, remainingItems])

  const selectedQuote = preferredMarket
    ? intelligence.quotes.find((quote) => quote.market.id === preferredMarket.id)
    : undefined

  const volatileItems = useMemo(() => {
    if (intelligence.quotes.length < 2) return []
    return remainingItems
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
  }, [intelligence.quotes, remainingItems])

  const checklistPanel = (
    <section className="shopping-checklist-panel">
      <div className="shopping-checklist-head">
        <div><span className="price-mode-badge">🧺 Sepet hazırlığı</span><h3>Evdekini düş, aldığını işaretle.</h3><p>“Evde var” dediğin veya marketten aldığın kalemleri kalan sepet ve fiyat karşılaştırmasından çıkarıyoruz.</p></div>
        {handledCount > 0 && <button type="button" onClick={resetChecklist}>Tümünü sıfırla</button>}
      </div>
      <div className="shopping-progress-line"><div><i style={{ width: `${checklistPct}%` }} /></div><span>%{checklistPct}</span></div>
      <div className="shopping-checklist-items">
        {shoppingList.map((item) => {
          const pantry = pantryIds.has(item.ingredientId)
          const purchased = purchasedIds.has(item.ingredientId)
          return (
            <article className={`shopping-check-row ${pantry ? 'is-pantry' : ''} ${purchased ? 'is-purchased' : ''}`} key={item.ingredientId}>
              <span>{item.emoji}</span>
              <div><strong>{item.name}</strong><small>{item.packages} × {item.packageLabel} • katalog ≈ {money(item.estimatedCost)} ₺</small></div>
              <button type="button" className={pantry ? 'active-pantry' : ''} onClick={() => togglePantry(item.ingredientId)}>{pantry ? '✓ Evde var' : 'Evde var'}</button>
              <button type="button" className={purchased ? 'active-purchased' : ''} onClick={() => togglePurchased(item.ingredientId)}>{purchased ? '✓ Aldım' : 'Aldım'}</button>
            </article>
          )
        })}
      </div>
      <div className="shopping-check-summary"><span>🏠 Evde: {pantryIds.size}</span><span>✅ Alındı: {purchasedIds.size}</span><span>🛒 Kalan: {remainingItems.length}</span><span>💸 Kalan katalog: {money(remainingCatalogTotal)} ₺</span></div>
      {remainingItems.length === 0 && <div className="shopping-all-done">🎉 Bu planın alışveriş kalemlerinin tamamı hazır görünüyor.</div>}
    </section>
  )

  if (remainingItems.length === 0) return checklistPanel

  if (markets.length === 0) {
    return (
      <>
        {checklistPanel}
        <section className="price-intelligence-panel price-empty">
          <div className="price-intelligence-heading">
            <div><span className="price-mode-badge">🧪 Fiyat İstihbaratı v0.2</span><h3>Kalan {remainingItems.length} ürünü marketler arasında karşılaştıralım.</h3><p>Önce Nearby bölümündeki “Çevremi tara”yı çalıştır. Gerçek marketler bulunduğunda Lokma fiyat motoru yalnızca kalan sepet üzerinde senaryo üretecek.</p></div>
          </div>
        </section>
      </>
    )
  }

  const bestSingle = intelligence.bestSingle
  const splitPlan = intelligence.splitPlan

  return (
    <>
      {checklistPanel}
      <section className="price-intelligence-panel">
        <div className="price-intelligence-heading">
          <div>
            <span className="price-mode-badge">🧪 Fiyat İstihbaratı v0.2 • SİMÜLASYON</span>
            <h3>Kalan sepeti nereden almak daha mantıklı?</h3>
            <p>Market isimleri ve mesafeler gerçek Nearby verisidir. “Evde var” ve “Aldım” kalemleri çıkarıldı. Aşağıdaki ürün fiyatları henüz canlı değildir; optimizasyon motorunu test eden simülasyon senaryosudur.</p>
          </div>
        </div>

        <div className="price-summary-grid">
          <article><span>📒 Orijinal katalog</span><strong>{money(catalogTotal)} ₺</strong><small>planın tüm paketleri</small></article>
          <article><span>🧺 Kalan katalog</span><strong>{money(remainingCatalogTotal)} ₺</strong><small>{remainingItems.length} kalem kaldı</small></article>
          <article className="price-best"><span>🏪 En iyi tek market</span><strong>{bestSingle ? `${money(bestSingle.total)} ₺` : '—'}</strong><small>{bestSingle ? `${bestSingle.market.name} • ${distanceText(bestSingle.market.distanceMeters)}` : 'Hesaplanamadı'}</small></article>
          <article className="price-split"><span>✨ En iyi 2-market planı</span><strong>{splitPlan ? `${money(splitPlan.total)} ₺` : '—'}</strong><small>{splitPlan ? `${splitPlan.marketCount} durak • ${money(splitPlan.savingsVsBestSingle)} ₺ avantaj` : 'Hesaplanamadı'}</small></article>
        </div>

        <div className="market-quote-list">
          <div className="price-subheading"><div><strong>Tek market karşılaştırması</strong><small>Yakındaki ilk {intelligence.quotes.length} gerçek market • kalan sepet • fiyatlar simülasyon</small></div></div>
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
            <div className="price-subheading"><div><strong>🧩 2-market sepet optimizasyonu</strong><small>Her kalan ürünü seçili market çifti içindeki daha düşük simülasyon fiyatına yönlendirir.</small></div><b>{money(splitPlan.total)} ₺</b></div>
            <div className="split-market-grid">
              {splitPlan.groups.map((group) => (
                <article key={group.market.id}>
                  <header><div><strong>{group.market.name}</strong><small>{distanceText(group.market.distanceMeters)} • {group.items.length} kalem</small></div><b>{money(group.subtotal)} ₺</b></header>
                  <div className="split-item-chips">{group.items.slice(0, 8).map((item) => <span key={item.ingredientId}>{item.emoji} {item.name}</span>)}</div>
                  {group.items.length > 8 && <small className="more-items">+ {group.items.length - 8} ürün daha</small>}
                </article>
              ))}
            </div>
            <div className="split-saving-note">💡 Bu senaryoda en iyi tek markete kıyasla <strong>{money(splitPlan.savingsVsBestSingle)} ₺</strong> daha düşük kalan sepet çıkıyor. Gerçek rota verisi geldiğinde ikinci durağın zaman/yol maliyeti de hesaba katılacak.</div>
          </div>
        )}

        {volatileItems.length > 0 && (
          <div className="price-spread-card">
            <div className="price-subheading"><div><strong>📊 Kalan sepette fiyatı en çok oynayanlar</strong><small>Simülasyonda market seçimini en çok etkileyen ürünler.</small></div></div>
            <div className="price-spread-list">
              {volatileItems.map(({ item, min, max, spread }) => (
                <div key={item.ingredientId}><span>{item.emoji}</span><div><strong>{item.name}</strong><small>{item.packageLabel} paket senaryosu</small></div><b>{money(min)}–{money(max)} ₺</b><em>Δ {money(spread)} ₺</em></div>
              ))}
            </div>
          </div>
        )}

        <div className="price-data-contract"><span>🔌</span><div><strong>Canlı fiyat bağlantısına hazır mimari</strong><p>Checklist kalan sepeti belirliyor; fiyat motoru sadece o kalemleri karşılaştırıyor. Gerçek sağlayıcı geldiğinde `simulated` yerine `live` fiyatlar aynı akışa girecek.</p></div></div>
      </section>
    </>
  )
}
