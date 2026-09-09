import { useMemo, useState } from 'react'
import { generateWeeklyPlan } from '../engine/planEngine'
import { rebuildEditedPlan, swapMealInEditedPlan } from '../engine/planEditor'
import { RecipeDetailDrawer } from './RecipeDetailDrawer'
import { BrowserLocationError, requestBrowserLocation, type BrowserCoordinates } from '../services/browserLocation'
import { reverseGeocodeCoordinates, type ResolvedLocation } from '../services/reverseGeocode'
import type { IngredientDefinition, PlannedMeal, ShoppingListItem, UserPlanProfile, WeeklyPlan } from '../types'
import '../plan-engine.css'
import '../meal-editor.css'
import '../recipe-detail.css'
import '../location-ui.css'

type StarterPlanDashboardProps = {
  profile: UserPlanProfile
  onEdit: () => void
  onHome: () => void
}

type DashboardTab = 'week' | 'shopping'
type SelectedMeal = { dayIndex: number; mealIndex: number }
type ReadableLocation = Pick<ResolvedLocation, 'city' | 'district' | 'neighborhood'>
type LocationStatus = {
  status: 'idle' | 'loading' | 'success' | 'error'
  coords?: BrowserCoordinates
  resolved?: ReadableLocation
  message?: string
}

const CATEGORY_ORDER: IngredientDefinition['category'][] = ['Protein', 'Sebze & meyve', 'Kahvaltılık', 'Kuru gıda', 'Diğer']

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function sourceEmoji(source: PlannedMeal['source']) {
  if (source === 'Evde') return '🏠'
  if (source === 'Sipariş') return '🛵'
  return '🍽️'
}

function sourceClass(source: PlannedMeal['source']) {
  if (source === 'Evde') return 'source-home'
  if (source === 'Sipariş') return 'source-delivery'
  return 'source-out'
}

function quantityText(item: ShoppingListItem) {
  if (item.unit === 'g' && item.requiredQuantity >= 1000) return `${(item.requiredQuantity / 1000).toFixed(1).replace('.', ',')} kg`
  if (item.unit === 'ml' && item.requiredQuantity >= 1000) return `${(item.requiredQuantity / 1000).toFixed(1).replace('.', ',')} L`
  return `${item.requiredQuantity} ${item.unit}`
}

function mealKey(dayIndex: number, mealIndex: number) {
  return `${dayIndex}:${mealIndex}`
}

export function StarterPlanDashboard({ profile, onEdit, onHome }: StarterPlanDashboardProps) {
  const [seed, setSeed] = useState(1)
  const [swapSeed, setSwapSeed] = useState(10)
  const [tab, setTab] = useState<DashboardTab>('week')
  const [plan, setPlan] = useState<WeeklyPlan>(() => generateWeeklyPlan(profile, 1))
  const [lockedMeals, setLockedMeals] = useState<Set<string>>(() => new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<SelectedMeal | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => {
    if (profile.latitude != null && profile.longitude != null) {
      return {
        status: 'success',
        coords: {
          latitude: profile.latitude,
          longitude: profile.longitude,
          accuracy: profile.locationAccuracy ?? 0,
        },
        resolved: { city: profile.city, district: profile.district, neighborhood: profile.neighborhood },
        message: profile.locationSource === 'device' ? 'Plan oluştururken seçtiğin canlı konum kullanılıyor.' : 'Plan konumun hazır.',
      }
    }
    return { status: 'idle' }
  })

  const shoppingGroups = useMemo(() => CATEGORY_ORDER
    .map((category) => ({ category, items: plan.shoppingList.filter((item) => item.category === category) }))
    .filter((group) => group.items.length > 0), [plan.shoppingList])

  const budgetOkay = plan.remainingBudget >= 0
  const calorieDelta = plan.averageCalories - plan.nutritionTargets.calories
  const proteinDelta = plan.averageProtein - plan.nutritionTargets.protein
  const selectedMealValue = selectedMeal ? plan.days[selectedMeal.dayIndex]?.meals[selectedMeal.mealIndex] : undefined
  const selectedMealLocked = selectedMeal ? lockedMeals.has(mealKey(selectedMeal.dayIndex, selectedMeal.mealIndex)) : false
  const readableLocation: ReadableLocation = locationStatus.resolved ?? {
    city: profile.city,
    district: profile.district,
    neighborhood: profile.neighborhood,
  }
  const readableTitle = [readableLocation.neighborhood, readableLocation.district, readableLocation.city].filter(Boolean).join(', ')

  const toggleMealLock = (dayIndex: number, mealIndex: number) => {
    const key = mealKey(dayIndex, mealIndex)
    const meal = plan.days[dayIndex]?.meals[mealIndex]
    setLockedMeals((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
        setNotice(`${meal?.title ?? 'Öğün'} kilidi açıldı. Artık değiştirilebilir.`)
      } else {
        next.add(key)
        setNotice(`${meal?.title ?? 'Öğün'} sabitlendi. Haftayı karıştırsan bile korunacak.`)
      }
      return next
    })
  }

  const swapMeal = (dayIndex: number, mealIndex: number) => {
    if (lockedMeals.has(mealKey(dayIndex, mealIndex))) {
      setNotice('Bu öğün kilitli 🔒 Önce kilidi aç, sonra değiştirebilirsin.')
      return
    }
    const currentMeal = plan.days[dayIndex]?.meals[mealIndex]
    const nextSwapSeed = swapSeed + 1
    const nextPlan = swapMealInEditedPlan(plan, profile, dayIndex, mealIndex, nextSwapSeed)
    setSwapSeed(nextSwapSeed)
    if (nextPlan === plan) {
      setNotice('Bu öğün için filtrelerine uyan başka bir alternatif bulamadım.')
      return
    }
    const nextMeal = nextPlan.days[dayIndex]?.meals[mealIndex]
    setPlan(nextPlan)
    setNotice(`${currentMeal?.title ?? 'Öğün'} → ${nextMeal?.title ?? 'yeni alternatif'} olarak değişti. Bütçe ve alışveriş listesi yeniden hesaplandı.`)
  }

  const shufflePlan = () => {
    const nextSeed = seed + 1
    const freshPlan = generateWeeklyPlan(profile, nextSeed)
    if (lockedMeals.size === 0) {
      setPlan(freshPlan)
    } else {
      const mergedDays = freshPlan.days.map((day, dayIndex) => ({
        ...day,
        meals: day.meals.map((meal, mealIndex) => lockedMeals.has(mealKey(dayIndex, mealIndex))
          ? (plan.days[dayIndex]?.meals[mealIndex] ?? meal)
          : meal),
      }))
      setPlan(rebuildEditedPlan(profile, mergedDays, {
        adjustedForBudget: freshPlan.adjustedForBudget,
        convertedOutsideMeals: freshPlan.convertedOutsideMeals,
      }))
    }
    setSeed(nextSeed)
    setNotice(lockedMeals.size > 0
      ? `Hafta yeniden oluşturuldu; ${lockedMeals.size} kilitli öğün aynen korundu.`
      : 'Hafta yeni bir kombinasyonla yeniden oluşturuldu.')
  }

  const useLiveLocation = async () => {
    setLocationStatus({ status: 'loading', message: 'Cihazından canlı konum alınıyor…' })
    try {
      const coords = await requestBrowserLocation()
      try {
        const resolved = await reverseGeocodeCoordinates(coords)
        setLocationStatus({
          status: 'success',
          coords,
          resolved,
          message: 'Canlı konum adres bilgisine çevrildi. Yakındaki işletmeler fazında bu nokta kullanılacak.',
        })
      } catch {
        setLocationStatus({
          status: 'success',
          coords,
          resolved: { city: profile.city, district: profile.district, neighborhood: profile.neighborhood },
          message: 'Koordinat yenilendi fakat adres otomatik çözülemedi; plan profilindeki il / ilçe / mahalle gösteriliyor.',
        })
      }
    } catch (error) {
      const message = error instanceof BrowserLocationError
        ? error.message
        : 'Konum alınırken beklenmeyen bir sorun oluştu.'
      setLocationStatus({ status: 'error', message })
    }
  }

  return (
    <main className="dashboard-page plan-v1-page">
      <nav className="topbar shell dashboard-nav">
        <button className="brand brand-button" type="button" onClick={onHome}><span className="brand-mark">🍋</span><span>lokma</span></button>
        <div className="nav-links dashboard-tabs">
          <button type="button" className={`dashboard-nav-button ${tab === 'week' ? 'active' : ''}`} onClick={() => setTab('week')}>📅 Haftam</button>
          <button type="button" className={`dashboard-nav-button ${tab === 'shopping' ? 'active' : ''}`} onClick={() => setTab('shopping')}>🛒 Alışveriş <span className="nav-count">{plan.shoppingList.length}</span></button>
          <button type="button" className="profile-pill" onClick={onEdit}>👤 {profile.name || 'Profil'} <span>⚙️</span></button>
        </div>
      </nav>

      <section className="dashboard-hero shell plan-engine-hero">
        <div>
          <span className="hero-badge">🧠 Plan motoru v1.3 çalışıyor</span>
          <h1>{profile.name ? `${profile.name}, ` : ''}haftanı <em>Lokma hesapladı.</em></h1>
          <p>{profile.days} gün • {profile.diet} • {profile.goal} • {profile.people} kişi • {readableTitle}</p>
          <div className="engine-status-row">
            <span>🎯 ≈ {plan.nutritionTargets.calories} kcal hedef</span>
            <span>💪 ≈ {plan.nutritionTargets.protein} g protein</span>
            <span>♻️ %{plan.reuseScore} malzeme yeniden kullanım</span>
            {lockedMeals.size > 0 && <span className="locked-status">🔒 {lockedMeals.size} öğün sabit</span>}
          </div>
        </div>
        <div className="dashboard-hero-actions">
          <button type="button" className="shuffle-plan-button" onClick={shufflePlan}>🎲 Kilitler hariç karıştır</button>
          <button type="button" className="edit-plan-button" onClick={onEdit}>⚙️ Tercihleri düzenle</button>
        </div>
      </section>

      <section className="shell location-bridge-card">
        <span className="location-bridge-icon">📍</span>
        <div className="location-bridge-copy">
          <strong>{locationStatus.status === 'loading' ? 'Konum alınıyor…' : readableTitle || 'Plan konumu'}</strong>
          <p>{locationStatus.message ?? 'Bu il / ilçe / mahalle planı oluştururken seçtiğin konumdan geliyor. Canlı konumla istediğin zaman yenileyebilirsin.'}</p>
          <div className="location-readable-line">
            <span><small>İl</small>{readableLocation.city || '—'}</span>
            <span><small>İlçe</small>{readableLocation.district || '—'}</span>
            <span><small>Mahalle</small>{readableLocation.neighborhood || '—'}</span>
          </div>
          {locationStatus.coords && (
            <span className="location-coordinate">{locationStatus.coords.latitude.toFixed(5)}, {locationStatus.coords.longitude.toFixed(5)} • ±{Math.round(locationStatus.coords.accuracy)} m</span>
          )}
        </div>
        <button type="button" className="location-bridge-action" disabled={locationStatus.status === 'loading'} onClick={useLiveLocation}>
          {locationStatus.status === 'loading' ? 'Konum alınıyor…' : locationStatus.status === 'success' ? 'Canlı konumu yenile' : 'Canlı konumu kullan'}
        </button>
      </section>

      {notice && <section className="shell plan-editor-notice" role="status"><span>✨</span><p>{notice}</p><button type="button" onClick={() => setNotice(null)} aria-label="Bildirimi kapat">×</button></section>}

      {plan.adjustedForBudget && (
        <section className="shell budget-smart-note">
          <span className="budget-smart-icon">🪄</span>
          <div><strong>Bütçeyi korumak için planı akıllıca dengeledik.</strong><p>Seçtiğin ev/sipariş oranını başlangıç kabul ettik; tahmini toplam bütçeyi aşınca {plan.convertedOutsideMeals} dışarı öğününü daha ekonomik ev yemeğine çevirdik.</p></div>
          <span className="budget-note-pill">{budgetOkay ? `+${money(plan.remainingBudget)} ₺ pay` : `${money(Math.abs(plan.remainingBudget))} ₺ aşım`}</span>
        </section>
      )}

      <section className="plan-metrics shell engine-metrics">
        <article className={budgetOkay ? '' : 'metric-warning'}><span>💸 Gerçek plan bütçesi</span><strong>{money(plan.totalCost)} ₺</strong><small>{money(profile.budget)} ₺ haftalık limitin</small><div className="metric-progress"><i style={{ width: `${Math.min(100, plan.budgetUsagePct)}%` }} /></div></article>
        <article className={budgetOkay ? 'metric-good' : 'metric-warning'}><span>{budgetOkay ? '💚 Tahmini kalan' : '⚠️ Bütçe farkı'}</span><strong>{money(Math.abs(plan.remainingBudget))} ₺</strong><small>{budgetOkay ? 'Limit içinde kaldık' : 'Son değişiklik bütçeyi aştı'}</small></article>
        <article><span>🔥 Günlük ortalama</span><strong>{plan.averageCalories} kcal</strong><small>{calorieDelta === 0 ? 'Hedefle aynı' : `${calorieDelta > 0 ? '+' : ''}${calorieDelta} kcal hedef farkı`}</small></article>
        <article><span>💪 Protein ortalaması</span><strong>{plan.averageProtein} g</strong><small>{proteinDelta === 0 ? 'Hedefle aynı' : `${proteinDelta > 0 ? '+' : ''}${proteinDelta} g hedef farkı`}</small></article>
      </section>

      <section className="shell split-cost-strip">
        <div><span>🛒 Market paketleri</span><strong>{money(plan.marketCost)} ₺</strong></div><span className="split-plus">+</span>
        <div><span>🛵 Sipariş / dışarı</span><strong>{money(plan.outsideCost)} ₺</strong></div><span className="split-equals">=</span>
        <div className="split-total"><span>Haftalık tahmin</span><strong>{money(plan.totalCost)} ₺</strong></div>
        <small>Bir öğünü değiştirdiğinde bu rakamlar ve alışveriş listesi anında yeniden hesaplanır. Fiyatlar şimdilik demo katalog fiyatlarıdır.</small>
      </section>

      {tab === 'week'
        ? <WeekView profile={profile} plan={plan} lockedMeals={lockedMeals} onSwap={swapMeal} onToggleLock={toggleMealLock} onOpenDetail={(dayIndex, mealIndex) => setSelectedMeal({ dayIndex, mealIndex })} onShopping={() => setTab('shopping')} />
        : <ShoppingView groups={shoppingGroups} plan={plan} onWeek={() => setTab('week')} />}

      {selectedMeal && selectedMealValue && (
        <RecipeDetailDrawer meal={selectedMealValue} profile={profile} plan={plan} locked={selectedMealLocked} onClose={() => setSelectedMeal(null)} onSwap={() => swapMeal(selectedMeal.dayIndex, selectedMeal.mealIndex)} onToggleLock={() => toggleMealLock(selectedMeal.dayIndex, selectedMeal.mealIndex)} />
      )}
    </main>
  )
}

type WeekViewProps = {
  profile: UserPlanProfile
  plan: WeeklyPlan
  lockedMeals: Set<string>
  onSwap: (dayIndex: number, mealIndex: number) => void
  onToggleLock: (dayIndex: number, mealIndex: number) => void
  onOpenDetail: (dayIndex: number, mealIndex: number) => void
  onShopping: () => void
}

function WeekView({ profile, plan, lockedMeals, onSwap, onToggleLock, onOpenDetail, onShopping }: WeekViewProps) {
  return (
    <>
      <section className="week-section shell engine-week-section">
        <div className="section-title-row">
          <div><span className="eyebrow">📅 {plan.days.length} günlük düzenlenebilir plan</span><h2>Gün gün yemek planın</h2><p>Bir öğünü değiştirebilir, sevdiğini kilitleyebilir veya detayını açıp Lokma'nın neden seçtiğini görebilirsin.</p></div>
          <button className="shopping-jump-button" type="button" onClick={onShopping}>🛒 Listeye geç →</button>
        </div>
        <div className="meal-editor-guide"><span><b>👁 Detay</b> malzeme, hazırlama ve seçim nedenini gösterir.</span><span><b>↻ Değiştir</b> yeni alternatif bulur.</span><span><b>🔒 Sabitle</b> sonraki karıştırmalarda korur.</span></div>
        <div className="engine-day-grid">
          {plan.days.map((day) => {
            const caloriePct = Math.round(day.totalCalories / Math.max(1, plan.nutritionTargets.calories) * 100)
            const proteinPct = Math.round(day.totalProtein / Math.max(1, plan.nutritionTargets.protein) * 100)
            return (
              <article className="engine-day-card" key={day.index}>
                <div className="engine-day-header"><div><span className="day-number">{String(day.index + 1).padStart(2, '0')}</span><div><h3>{day.name}</h3><small>≈ {money(day.totalEstimatedPrice)} ₺ marjinal öğün değeri</small></div></div><span className="day-goal-chip">{day.index === 0 ? 'Başlangıç' : day.index === plan.days.length - 1 ? 'Hafta sonu' : 'Dengeli gün'}</span></div>
                <div className="engine-meal-list">
                  {day.meals.map((meal, mealIndex) => <MealRow key={meal.id} meal={meal} locked={lockedMeals.has(mealKey(day.index, mealIndex))} onDetail={() => onOpenDetail(day.index, mealIndex)} onSwap={() => onSwap(day.index, mealIndex)} onToggleLock={() => onToggleLock(day.index, mealIndex)} />)}
                </div>
                <div className="day-targets"><div><span>🔥 {day.totalCalories} / {plan.nutritionTargets.calories} kcal</span><div><i style={{ width: `${Math.min(100, caloriePct)}%` }} /></div></div><div><span>💪 {day.totalProtein} / {plan.nutritionTargets.protein} g</span><div><i style={{ width: `${Math.min(100, proteinPct)}%` }} /></div></div></div>
              </article>
            )
          })}
        </div>
      </section>
      <section className="reuse-insight shell">
        <div className="reuse-insight-copy"><span className="step-kicker">♻️ Lokma'nın maliyet numarası</span><h2>{plan.reusedIngredientCount} malzemeyi haftada birden fazla öğünde kullanıyoruz.</h2><p>Alışverişi tarif tarif değil, haftanın tamamı üzerinden topluyoruz. Öğün değiştirdiğinde bu zincir de tekrar hesaplanıyor.</p><div className="reuse-stats"><span><b>%{plan.reuseScore}</b> tekrar kullanım</span><span><b>≈ {money(plan.estimatedWasteSaving)} ₺</b> paket avantajı</span><span><b>{profile.people} kişi</b> için miktarlandı</span></div></div>
        <button type="button" onClick={onShopping}>Alışveriş listesini aç <span>→</span></button>
      </section>
    </>
  )
}

type MealRowProps = { meal: PlannedMeal; locked: boolean; onDetail: () => void; onSwap: () => void; onToggleLock: () => void }

function MealRow({ meal, locked, onDetail, onSwap, onToggleLock }: MealRowProps) {
  return (
    <div className={`engine-meal-row editable-meal-row ${locked ? 'is-locked' : ''}`}>
      <span className="meal-slot">{meal.slot}</span><div className="engine-meal-emoji">{meal.emoji}</div>
      <div className="engine-meal-main"><div><strong>{meal.title}</strong><span className={`source-chip ${sourceClass(meal.source)}`}>{sourceEmoji(meal.source)} {meal.source}</span>{locked && <span className="meal-locked-chip">🔒 sabit</span>}</div><p>{meal.subtitle}</p><div className="meal-nutrition"><span>🔥 {meal.calories} kcal</span><span>💪 {meal.protein} g</span><span>💸 ≈ {money(meal.estimatedPrice)} ₺</span></div></div>
      <div className="meal-editor-side"><div className="meal-tags">{meal.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="meal-editor-actions"><button type="button" className="meal-detail-button" onClick={onDetail}>👁 Detay</button><button type="button" className="meal-swap-button" disabled={locked} onClick={onSwap}><span>↻</span> Değiştir</button><button type="button" className={`meal-lock-button ${locked ? 'active' : ''}`} onClick={onToggleLock}>{locked ? '🔒 Kilitli' : '🔓 Sabitle'}</button></div></div>
    </div>
  )
}

type ShoppingViewProps = { groups: Array<{ category: IngredientDefinition['category']; items: ShoppingListItem[] }>; plan: WeeklyPlan; onWeek: () => void }

function ShoppingView({ groups, plan, onWeek }: ShoppingViewProps) {
  return (
    <section className="shopping-page-section shell">
      <div className="section-title-row shopping-title-row"><div><span className="eyebrow">🛒 Canlı güncellenen paket listesi</span><h2>Öğün değiştiyse sepet de değişti.</h2><p>İhtiyaç miktarını markette satılan paket boyuna yuvarlıyoruz. Bir tarifi değiştirdiğinde malzemeler burada anında yeniden hesaplanıyor.</p></div><button className="shopping-jump-button" type="button" onClick={onWeek}>← Haftaya dön</button></div>
      <div className="shopping-overview-grid"><article><span>🛍️ Toplam ürün</span><strong>{plan.shoppingList.length}</strong><small>farklı market kalemi</small></article><article><span>💸 Market tahmini</span><strong>{money(plan.marketCost)} ₺</strong><small>paket fiyatları üzerinden</small></article><article><span>♻️ Tekrar kullanılan</span><strong>{plan.reusedIngredientCount}</strong><small>birden fazla öğünde</small></article><article><span>✨ Paket avantajı</span><strong>≈ {money(plan.estimatedWasteSaving)} ₺</strong><small>tahmini</small></article></div>
      <div className="shopping-groups">
        {groups.map((group) => <section className="shopping-group" key={group.category}><div className="shopping-group-heading"><h3>{group.category}</h3><span>{group.items.length} ürün</span></div><div className="shopping-item-list">{group.items.map((item) => <article className="shopping-item" key={item.ingredientId}><div className="shopping-item-emoji">{item.emoji}</div><div className="shopping-item-main"><strong>{item.name}</strong><small>İhtiyaç: {quantityText(item)}</small></div><div className="shopping-package"><span>{item.packages} × {item.packageLabel}</span><strong>{money(item.estimatedCost)} ₺</strong></div><div className={`reuse-badge ${item.usedInMeals >= 2 ? 'is-reused' : ''}`}>{item.usedInMeals >= 2 ? `♻️ ${item.usedInMeals} öğünde` : '1 öğünde'}</div></article>)}</div></section>)}
      </div>
      <div className="shopping-demo-note"><span>ℹ️</span><p><strong>Şimdilik demo fiyat.</strong> Konum artık İl / İlçe / Mahalle ve koordinat olarak hazır. Sıradaki Nearby fazında bu sepetin yanına gerçek market, restoran ve mesafe bilgisi bağlanacak.</p></div>
    </section>
  )
}
