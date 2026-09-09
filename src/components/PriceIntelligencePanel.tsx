import { useEffect, useMemo, useState } from 'react'
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

type MarketProfile = {
  name: string
  emoji: string
  low: number
  high: number
  note: string
}

const MARKET_PROFILES: MarketProfile[] = [
  { name: 'BİM', emoji: '🟦', low: 0.86, high: 1.02, note: 'Temel ürünlerde ekonomik bant' },
  { name: 'A101', emoji: '🟩', low: 0.88, high: 1.04, note: 'Temel ürün + dönemsel kampanya' },
  { name: 'ŞOK', emoji: '🟨', low: 0.89, high: 1.06, note: 'Mahalle tipi ekonomik sepet' },
  { name: 'Migros', emoji: '🟧', low: 0.98, high: 1.18, note: 'Geniş ürün seçeneği' },
  { name: 'CarrefourSA', emoji: '🟥', low: 0.97, high: 1.17, note: 'Geniş ürün ve marka seçeneği' },
]

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
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
  return { ...item, requiredQuantity: Math.round(remainingQuantity), packages, estimatedCost: packages * packagePrice }
}

export function PriceIntelligencePanel({ shoppingList, catalogTotal }: PriceIntelligencePanelProps) {
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

  const activeChecklist = checklist.signature === signature
    ? checklist
    : { signature, pantryQuantities: {}, purchasedIngredientIds: [] }

  const purchasedIds = useMemo(() => new Set(activeChecklist.purchasedIngredientIds), [activeChecklist.purchasedIngredientIds])
  const remainingItems = useMemo(() => shoppingList.flatMap((item) => {
    if (purchasedIds.has(item.ingredientId)) return []
    const next = remainingItem(item, activeChecklist.pantryQuantities[item.ingredientId] ?? 0)
    return next ? [next] : []
  }), [shoppingList, purchasedIds, activeChecklist.pantryQuantities])

  const remainingCatalogTotal = remainingItems.reduce((sum, item) => sum + item.estimatedCost, 0)
  const pantryCoveredItems = shoppingList.filter((item) => (activeChecklist.pantryQuantities[item.ingredientId] ?? 0) >= item.requiredQuantity).length
  const partialPantryItems = shoppingList.filter((item) => {
    const quantity = activeChecklist.pantryQuantities[item.ingredientId] ?? 0
    return quantity > 0 && quantity < item.requiredQuantity
  }).length
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

  return (
    <>
      <section className="shopping-checklist-panel">
        <div className="shopping-checklist-head">
          <div><span className="price-mode-badge">🧺 Dolap + sepet</span><h3>Evdeki miktarı yaz, sadece eksiğini al.</h3><p>Örneğin 900 g pirinç gerekiyor ve evde 600 g varsa kalan 300 g ihtiyacı paket boyuna göre yeniden hesaplanır.</p></div>
          {(pantryCoveredItems > 0 || partialPantryItems > 0 || purchasedIds.size > 0) && <button type="button" onClick={resetChecklist}>Tümünü sıfırla</button>}
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
                <div className="shopping-check-main"><strong>{item.name}</strong><small>İhtiyaç: {quantityText(item.requiredQuantity, item.unit)} • {item.packages} × {item.packageLabel}</small>{pantryQuantity > 0 && !purchased && <em>{pantryComplete ? '✓ Tamamı dolapta' : `Dolap sonrası eksik: ${quantityText(remaining, item.unit)}`}</em>}</div>
                <label className="pantry-quantity-field"><span>Evde</span><div><input type="number" min="0" step={item.unit === 'adet' ? 1 : 50} value={pantryQuantity || ''} placeholder="0" onChange={(event) => setPantryQuantity(item.ingredientId, Number(event.target.value), item.requiredQuantity)} /><b>{item.unit}</b></div></label>
                <button type="button" className={`pantry-fill-button ${pantryComplete ? 'active-pantry' : ''}`} onClick={() => setPantryQuantity(item.ingredientId, pantryComplete ? 0 : item.requiredQuantity, item.requiredQuantity)}>{pantryComplete ? 'Evde ✓' : 'Tamamı evde'}</button>
                <button type="button" className={purchased ? 'active-purchased' : ''} onClick={() => togglePurchased(item.ingredientId)}>{purchased ? '✓ Aldım' : 'Aldım'}</button>
              </article>
            )
          })}
        </div>
        <div className="shopping-check-summary"><span>🏠 Tam dolap: {pantryCoveredItems}</span><span>🥣 Kısmi stok: {partialPantryItems}</span><span>✅ Alındı: {purchasedIds.size}</span><span>🛒 Kalan: {remainingItems.length}</span><span>💸 Kalan referans: {money(remainingCatalogTotal)} ₺</span></div>
        {remainingItems.length === 0 && <div className="shopping-all-done">🎉 Bu planın alışveriş ihtiyacının tamamı dolapta veya alınmış görünüyor.</div>}
      </section>

      {remainingItems.length > 0 && (
        <section className="price-intelligence-panel">
          <div className="price-intelligence-heading"><div><span className="price-mode-badge">🏪 Market fiyat rehberi</span><h3>Bu sepeti hangi fiyat bandında toplayabilirsin?</h3><p>Yakındaki market araması yapmıyoruz. BİM, A101, ŞOK, Migros ve CarrefourSA için planlama amaçlı yaklaşık fiyat bantları gösteriyoruz.</p></div></div>
          <div className="price-summary-grid"><article><span>📒 İlk sepet referansı</span><strong>{money(catalogTotal)} ₺</strong><small>plan oluşturulurken</small></article><article><span>🧺 Dolap sonrası kalan</span><strong>{money(remainingCatalogTotal)} ₺</strong><small>{remainingItems.length} kalem</small></article></div>
          <div className="market-quote-list static-market-list">
            {MARKET_PROFILES.map((market) => <article className="market-quote-row" key={market.name}><span className="market-quote-rank">{market.emoji}</span><div className="market-quote-main"><strong>{market.name}</strong><small>{market.note}</small></div><div className="market-quote-total"><strong>{money(remainingCatalogTotal * market.low)}–{money(remainingCatalogTotal * market.high)} ₺</strong><small>yaklaşık sepet bandı</small></div></article>)}
          </div>
          <div className="price-subheading"><div><strong>Örnek ürün fiyat bantları</strong><small>Kalan sepette maliyeti en yüksek ürünlerden örnekler</small></div></div>
          <div className="price-volatility-grid">
            {[...remainingItems].sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 6).map((item) => {
              const packagePrice = item.estimatedCost / Math.max(1, item.packages)
              return <article key={item.ingredientId}><span>{item.emoji}</span><div><strong>{item.name}</strong><small>{item.packageLabel}</small></div><b>≈ {money(packagePrice * .86)}–{money(packagePrice * 1.18)} ₺</b></article>
            })}
          </div>
          <div className="price-intelligence-note">ℹ️ Bu rakamlar canlı mağaza fiyatı değildir. Şube, marka, kampanya, gramaj ve tarihe göre değişebilir. Amaç alışverişe çıkmadan önce gerçekçi bir bütçe bandı vermektir.</div>
        </section>
      )}
    </>
  )
}
