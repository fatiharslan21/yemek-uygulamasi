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

function quantityText(value: number, unit: ShoppingListItem['unit']) {
  if (unit === 'g' && value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')} kg`
  if (unit === 'ml' && value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')} L`
  return `${Math.round(value)} ${unit}`
}

function remainingItem(item: ShoppingListItem, pantryQuantity: number): ShoppingListItem | null {
  const remainingQuantity = Math.max(0, item.requiredQuantity - pantryQuantity)
  if (remainingQuantity <= 0) return null

  const packagePrice = item.estimatedCost / Math.max(1, item.packages)
  const packages = Math.max(1, Math.ceil(remainingQuantity / Math.max(1, item.packageSize)))
  return {
    ...item,
    requiredQuantity: Math.round(remainingQuantity),
    packages,
    estimatedCost: packages * packagePrice,
  }
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
      pantryQuantities: checklist.pantryQuantities,
      purchasedIngredientIds: checklist.purchasedIngredientIds,
    })
  }, [signature, checklist])

  const activeChecklist: ChecklistUiState = checklist.signature === signature
    ? checklist
    : { signature, pantryQuantities: {}, purchasedIngredientIds: [] }

  const purchasedIds = useMemo(() => new Set(activeChecklist.purchasedIngredientIds), [activeChecklist.purchasedIngredientIds])

  const remainingItems = useMemo(() => shoppingList.flatMap((item) => {
    if (purchasedIds.has(item.ingredientId)) return []
    const pantryQuantity = activeChecklist.pantryQuantities[item.ingredientId] ?? 0
    const next = remainingItem(item, pantryQuantity)
    return next ? [next] : []
  }), [shoppingList, purchasedIds, activeChecklist.pantryQuantities])

  const remainingCatalogTotal = remainingItems.reduce((sum, item) => sum + item.estimatedCost, 0)
  const pantryCoveredItems = shoppingList.filter((item) => (activeChecklist.pantryQuantities[item.ingredientId] ?? 0) >= item.requiredQuantity).length
  const partialPantryItems = shoppingList.filter((item) => {
    const quantity = activeChecklist.pantryQuantities[item.ingredientId] ?? 0
    return quantity > 0 && quantity < item.requiredQuantity
  }).length
  const handledCount = Math.min(shoppingList.length, pantryCoveredItems + purchasedIds.size)

  const quantityCoverage = shoppingList.reduce((sum, item) => {
    if (purchasedIds.has(item.ingredientId)) return sum + 1
    const pantry = Math.min(item.requiredQuantity, activeChecklist.pantryQuantities[item.ingredientId] ?? 0)
    return sum + (pantry / Math.max(1, item.requiredQuantity))
  }, 0)
  const checklistPct = Math.round(quantityCoverage / Math.max(1, shoppingList.length) * 100)

  const setPantryQuantity = (ingredientId: string, value: number, maxUseful: number) => {
    setChecklist((current) => {
      const pantryQuantities = { ...current.pantryQuantities }
      const purchased = new Set(current.purchasedIngredientIds)
      const normalized = Math.max(0, Math.min(Number.isFinite(value) ? value : 0, Math.max(maxUseful * 3, maxUseful)))
      if (normalized <= 0) delete pantryQuantities[ingredientId]
      else pantryQuantities[ingredientId] = normalized
      if (normalized > 0) purchased.delete(ingredientId)
      return { ...current, pantryQuantities, purchasedIngredientIds: [...purchased] }
    })
  }

  const togglePurchased = (ingredientId: string) => {
    setChecklist((current) => {
      const pantryQuantities = { ...current.pantryQuantities }
      const purchased = new Set(current.purchasedIngredientIds)
      if (purchased.has(ingredientId)) purchased.delete(ingredientId)
      else {
        purchased.add(ingredientId)
        delete pantryQuantities[ingredientId]
      }
      return { ...current, pantryQuantities, purchasedIngredientIds: [...purchased] }
    })
  }

  const resetChecklist = () => setChecklist((current) => ({ ...current, pantryQuantities: {}, purchasedIngredientIds: [] }))

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
        <div>
          <span className="price-mode-badge">🧺 Dolap + sepet</span>
          <h3>Evdeki miktarı yaz, Lokma sadece eksiğini alsın.</h3>
          <p>Örneğin plan 900 g pirinç istiyor ve evde 600 g varsa kalan 300 g ihtiyacı paket boyuna göre yeniden hesaplanır.</p>
        </div>
        {(handledCount > 0 || partialPantryItems > 0) && <button type="button" onClick={resetChecklist}>Tümünü sıfırla</button>}
      </div>

      <div className="shopping-progress-line"><div><i style={{ width: `${checklistPct}%` }} /></div><span>%{checklistPct}</span></div>

      <div className="shopping-checklist-items">
        {shoppingList.map((item) => {
          const pantryQuantity = activeChecklist.pantryQuantities[item.ingredientId] ?? 0
          const pantryComplete = pantryQuantity >= item.requiredQuantity
          const pantryPartial = pantryQuantity > 0 && !pantryComplete
          const purchased = purchasedIds.has(item.ingredientId)
          const remaining = purchased ? 0 : Math.max(0, item.requiredQuantity - pantryQuantity)

          return (
            <article className={`shopping-check-row ${pantryComplete ? 'is-pantry' : ''} ${pantryPartial ? 'is-partial-pantry' : ''} ${purchased ? 'is-purchased' : ''}`} key={item.ingredientId}>
              <span>{item.emoji}</span>
              <div className="shopping-check-main">
                <strong>{item.name}</strong>
                <small>İhtiyaç: {quantityText(item.requiredQuantity, item.unit)} • {item.packages} × {item.packageLabel}</small>
                {pantryQuantity > 0 && !purchased && <em>{pantryComplete ? '✓ Tamamı dolapta' : `Dolap sonrası eksik: ${quantityText(remaining, item.unit)}`}</em>}
              </div>

              <label className="pantry-quantity-field">
                <span>Evde</span>
                <div><input type="number" min="0" step={item.unit === 'adet' ? 1 : 50} value={pantryQuantity || ''} placeholder="0" onChange={(event) => setPantryQuantity(item.ingredientId, Number(event.target.value), item.requiredQuantity)} /><b>{item.unit}</b></div>
              </label>

              <button type="button" className={`pantry-fill-button ${pantryComplete ? 'active-pantry' : ''}`} onClick={() => setPantryQuantity(item.ingredientId, pantryComplete ? 0 : item.requiredQuantity, item.requiredQuantity)}>{pantryComplete ? 'Evde ✓' : 'Tamamı evde'}</button>
              <button type="button" className={purchased ? 'active-purchased' : ''} onClick={() => togglePurchased(item.ingredientId)}>{purchased ? '✓ Aldım' : 'Aldım'}</button>
            </article>
          )
        })}
      </div>

      <div className="shopping-check-summary">
        <span>🏠 Tam dolap: {pantryCoveredItems}</span>
        <span>🥣 Kısmi stok: {partialPantryItems}</span>
        <span>✅ Alındı: {purchasedIds.size}</span>
        <span>🛒 Kalan: {remainingItems.length}</span>
        <span>💸 Kalan katalog: {money(remainingCatalogTotal)} ₺</span>
      </div>
      {remainingItems.length === 0 && <div className="shopping-all-done">🎉 Bu planın alışveriş ihtiyacının tamamı dolapta veya alınmış görünüyor.</div>}
    </section>
  )

  if (remainingItems.length === 0) return checklistPanel

  if (markets.length === 0) {
    return (
      <>
        {checklistPanel}
        <section className="price-intelligence-panel price-empty">
          <div className="price-intelligence-heading">
            <div><span className="price-mode-badge">🧪 Fiyat İstihbaratı v0.3</span><h3>Kalan {remainingItems.length} ürünü marketler arasında karşılaştıralım.</h3><p>Önce Nearby bölümündeki “Çevremi tara”yı çalıştır. Gerçek marketler bulunduğunda Lokma fiyat motoru yalnızca net kalan sepet üzerinde senaryo üretecek.</p></div>
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
            <span className="price-mode-badge">🧪 Fiyat İstihbaratı v0.3 • SİMÜLASYON</span>
            <h3>Net kalan sepeti nereden almak daha mantıklı?</h3>
            <p>Market isimleri ve mesafeler gerçek Nearby verisidir. Dolaptaki miktarlar ve alınan ürünler düşülmüştür. Ürün fiyatları canlı sağlayıcı gelene kadar açıkça simülasyon olarak kalır.</p>
          </div>
        </div>

        <div className="price-summary-grid">
          <article><span>📒 Orijinal katalog</span><strong>{money(catalogTotal)} ₺</strong><small>planın tüm paketleri</small></article>
          <article><span>🧺 Net kalan katalog</span><strong>{money(remainingCatalogTotal)} ₺</strong><small>{remainingItems.length} kalem kaldı</small></article>
          <article className="price-best"><span>🏪 En iyi tek market</span><strong>{bestSingle ? `${money(bestSingle.total)} ₺` : '—'}</strong><small>{bestSingle ? `${bestSingle.market.name} • ${distanceText(bestSingle.market.distanceMeters)}` : 'Hesaplanamadı'}</small></article>
          <article className="price-split"><span>✨ En iyi 2-market planı</span><strong>{splitPlan ? `${money(splitPlan.total)} ₺` : '—'}</strong><small>{splitPlan ? `${splitPlan.marketCount} durak • ${money(splitPlan.savingsVsBestSingle)} ₺ avantaj` : 'Hesaplanamadı'}</small></article>
        </div>

        <div className="market-quote-list">
          <div className="price-subheading"><div><strong>Tek market karşılaştırması</strong><small>Yakındaki ilk {intelligence.quotes.length} gerçek market • net sepet • fiyatlar simülasyon</small></div></div>
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

        {selectedQuote && <div className="selected-market-quote">📌 Seçili market: <strong>{selectedQuote.market.name}</strong> • net sepet simülasyonu {money(selectedQuote.total)} ₺</div>}

        {splitPlan && splitPlan.groups.length > 0 && (
          <div className="split-basket-card">
            <div className="price-subheading"><div><strong>🧩 2-market sepet optimizasyonu</strong><small>Her kalan ürünü market çifti içindeki daha düşük simülasyon fiyatına yönlendirir.</small></div><b>{money(splitPlan.total)} ₺</b></div>
            <div className="split-market-grid">
              {splitPlan.groups.map((group) => (
                <article key={group.market.id}>
                  <header><div><strong>{group.market.name}</strong><small>{distanceText(group.market.distanceMeters)} • {group.items.length} kalem</small></div><b>{money(group.subtotal)} ₺</b></header>
                  <div className="split-item-chips">{group.items.slice(0, 8).map((item) => <span key={item.ingredientId}>{item.emoji} {item.name}</span>)}</div>
                  {group.items.length > 8 && <small className="more-items">+ {group.items.length - 8} ürün daha</small>}
                </article>
              ))}
            </div>
            <div className="split-saving-note">💡 En iyi tek markete kıyasla <strong>{money(splitPlan.savingsVsBestSingle)} ₺</strong> daha düşük sepet çıkıyor. Canlı rota katmanında ikinci durağın zaman/yol maliyeti de bu avantaja karşı tartılacak.</div>
          </div>
        )}

        {volatileItems.length > 0 && (
          <div className="price-spread-card">
            <div className="price-subheading"><div><strong>📊 Net sepette fiyatı en çok oynayanlar</strong><small>Simülasyonda market seçimini en çok etkileyen ürünler.</small></div></div>
            <div className="price-spread-list">
              {volatileItems.map(({ item, min, max, spread }) => (
                <div key={item.ingredientId}><span>{item.emoji}</span><div><strong>{item.name}</strong><small>{item.packageLabel} paket senaryosu</small></div><b>{money(min)}–{money(max)} ₺</b><em>Δ {money(spread)} ₺</em></div>
              ))}
            </div>
          </div>
        )}

        <div className="price-data-contract"><span>🔌</span><div><strong>Canlı fiyat bağlantısına hazır</strong><p>Dolap miktarı → net ihtiyaç → paket sayısı → market fiyatı zinciri artık ayrı katmanlarda. Gerçek sağlayıcı geldiğinde yalnızca fiyat kaynağını değiştiririz.</p></div></div>
      </section>
    </>
  )
}
