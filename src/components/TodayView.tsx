import { useMemo, useState, type CSSProperties } from 'react'
import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { MealBusinessLine } from './MealBusinessLine'
import { MealPrepPanel } from './MealPrepPanel'
import { MovementCard } from './MovementCard'
import { QuickRescueCard } from './QuickRescueCard'
import { TodayRestaurantStrip } from './TodayRestaurantStrip'
import { WeekRecap } from './WeekRecap'
import { WeekRhythmPanel } from './WeekRhythmPanel'
import { createManualMeal, loadManualMeals, saveManualMeals } from '../services/manualMealLog'
import { recordMealSignal } from '../services/mealPreferenceSignals'
import { formatPlanDate, greetingForNow, localDateKey, planDayIndex } from '../services/planCalendar'
import type { MealActivityStatus } from '../services/planSessionStorage'
import type { PlannedMeal, UserPlanProfile, WeeklyPlan } from '../types'
import '../today.css'
import '../daily-companion.css'

type TodayViewProps = {
  profile: UserPlanProfile
  plan: WeeklyPlan
  planStartedAt: string
  mealStatuses: Record<string, MealActivityStatus>
  favoriteRecipeIds: Set<string>
  onMealStatus: (mealId: string, status: MealActivityStatus) => void
  onToggleFavorite: (recipeId: string) => void
  onOpenDetail: (dayIndex: number, mealIndex: number) => void
  onSwap: (dayIndex: number, mealIndex: number) => void
  onGoWeek: () => void
  onGoShopping: () => void
  onFreshPlan: () => void
}

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function sourceEmoji(source: PlannedMeal['source']) {
  if (source === 'Evde') return '🏠'
  if (source === 'Sipariş') return '🛵'
  return '🍽️'
}

function statusFor(mealId: string, statuses: Record<string, MealActivityStatus>) {
  return statuses[mealId] ?? 'planned'
}

export function TodayView({
  profile,
  plan,
  planStartedAt,
  mealStatuses,
  favoriteRecipeIds,
  onMealStatus,
  onToggleFavorite,
  onOpenDetail,
  onSwap,
  onGoWeek,
  onGoShopping,
  onFreshPlan,
}: TodayViewProps) {
  const currentIndex = planDayIndex(planStartedAt)
  const planExpired = currentIndex >= plan.days.length
  const planNotStarted = currentIndex < 0
  const activeIndex = planNotStarted ? 0 : Math.min(Math.max(0, currentIndex), Math.max(0, plan.days.length - 1))
  const day = plan.days[activeIndex]
  const dateKey = localDateKey()
  const [manualMeals, setManualMeals] = useState(() => loadManualMeals(dateKey))
  const [manualOpen, setManualOpen] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualCalories, setManualCalories] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualPrice, setManualPrice] = useState('')

  const activity = useMemo(() => {
    if (!day) return { eaten: [] as PlannedMeal[], skipped: [] as PlannedMeal[], planned: [] as PlannedMeal[] }
    return day.meals.reduce((result, meal) => {
      const status = statusFor(meal.id, mealStatuses)
      result[status].push(meal)
      return result
    }, { eaten: [] as PlannedMeal[], skipped: [] as PlannedMeal[], planned: [] as PlannedMeal[] })
  }, [day, mealStatuses])

  const manualCaloriesTotal = manualMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const manualProteinTotal = manualMeals.reduce((sum, meal) => sum + meal.protein, 0)
  const manualSpend = manualMeals.reduce((sum, meal) => sum + meal.estimatedPrice, 0)
  const consumedCalories = activity.eaten.reduce((sum, meal) => sum + meal.calories, 0) + manualCaloriesTotal
  const consumedProtein = activity.eaten.reduce((sum, meal) => sum + meal.protein, 0) + manualProteinTotal
  const trackedSpend = activity.eaten.reduce((sum, meal) => sum + meal.estimatedPrice, 0) + manualSpend
  const completionPct = day ? Math.round((activity.eaten.length + activity.skipped.length) / Math.max(1, day.meals.length) * 100) : 0
  const nextMeal = activity.planned[0]
  const nextMealIndex = nextMeal && day ? day.meals.findIndex((meal) => meal.id === nextMeal.id) : -1

  const prepInsight = useMemo(() => {
    if (!day) return []
    const tomorrow = plan.days[activeIndex + 1]
    if (!tomorrow) return []

    const ingredientIds = (meals: PlannedMeal[]) => {
      const ids = new Set<string>()
      meals.filter((meal) => meal.source === 'Evde').forEach((meal) => {
        const recipe = RECIPE_CATALOG.find((item) => item.id === meal.recipeId)
        recipe?.ingredients.forEach((ingredient) => ids.add(ingredient.ingredientId))
      })
      return ids
    }

    const todayIds = ingredientIds(day.meals)
    const tomorrowIds = ingredientIds(tomorrow.meals)
    return [...todayIds]
      .filter((id) => tomorrowIds.has(id))
      .flatMap((id) => {
        const ingredient = INGREDIENT_BY_ID[id]
        return ingredient ? [ingredient] : []
      })
      .slice(0, 4)
  }, [day, activeIndex, plan.days])

  const reusedToday = useMemo(() => {
    if (!day) return []
    const ids = new Set<string>()
    day.meals.filter((meal) => meal.source === 'Evde').forEach((meal) => {
      const recipe = RECIPE_CATALOG.find((item) => item.id === meal.recipeId)
      recipe?.ingredients.forEach((ingredient) => ids.add(ingredient.ingredientId))
    })
    return plan.shoppingList.filter((item) => ids.has(item.ingredientId) && item.usedInMeals >= 2).slice(0, 5)
  }, [day, plan.shoppingList])

  const requestFreshPlan = () => {
    const event = new Event('lokma:renew-plan', { cancelable: true })
    const useLegacyFallback = window.dispatchEvent(event)
    if (useLegacyFallback) onFreshPlan()
  }

  const updateMealStatus = (meal: PlannedMeal, status: MealActivityStatus) => {
    const previous = statusFor(meal.id, mealStatuses)
    if (status === 'eaten' && previous !== 'eaten') recordMealSignal(meal, 'eaten')
    if (status === 'skipped' && previous !== 'skipped') recordMealSignal(meal, 'skipped')
    onMealStatus(meal.id, status)
  }

  const swapWithSignal = (meal: PlannedMeal, mealIndex: number) => {
    recordMealSignal(meal, 'swapped')
    onSwap(activeIndex, mealIndex)
  }

  const addManualMeal = () => {
    if (!manualTitle.trim()) return
    const entry = createManualMeal(manualTitle, Number(manualCalories), Number(manualProtein), Number(manualPrice))
    const next = [...manualMeals, entry]
    setManualMeals(next)
    saveManualMeals(dateKey, next)
    setManualTitle('')
    setManualCalories('')
    setManualProtein('')
    setManualPrice('')
    setManualOpen(false)
  }

  const removeManualMeal = (id: string) => {
    const next = manualMeals.filter((meal) => meal.id !== id)
    setManualMeals(next)
    saveManualMeals(dateKey, next)
  }

  if (planExpired) {
    return (
      <section className="today-page shell">
        <WeekRecap profile={profile} plan={plan} planStartedAt={planStartedAt} mealStatuses={mealStatuses} onNewWeek={requestFreshPlan} />
      </section>
    )
  }

  if (!day) return null

  return (
    <section className="today-page shell">
      <header className="today-hero">
        <div>
          <span className="today-date">{formatPlanDate(planStartedAt, activeIndex)}</span>
          <h1>{greetingForNow()}{profile.name ? `, ${profile.name}` : ''}. <em>Bugün ne var?</em></h1>
          <p>{nextMeal ? `Sıradaki: ${nextMeal.slot} • ${nextMeal.title}` : 'Bugünkü planlı öğünlerin tamamını işaretledin. ✨'}</p>
        </div>
        <div className="today-completion-ring" style={{ '--today-progress': `${completionPct * 3.6}deg` } as CSSProperties}>
          <div><strong>%{completionPct}</strong><small>gün</small></div>
        </div>
      </header>

      <div className="today-progress-grid">
        <article><span>🔥 Yediklerin</span><strong>{consumedCalories}</strong><small>/ {plan.nutritionTargets.calories} kcal</small><div><i style={{ width: `${Math.min(100, consumedCalories / Math.max(1, plan.nutritionTargets.calories) * 100)}%` }} /></div></article>
        <article><span>💪 Protein</span><strong>{consumedProtein} g</strong><small>/ {plan.nutritionTargets.protein} g</small><div><i style={{ width: `${Math.min(100, consumedProtein / Math.max(1, plan.nutritionTargets.protein) * 100)}%` }} /></div></article>
        <article><span>💸 İşaretlenen öğün</span><strong>{money(trackedSpend)} ₺</strong><small>tahmini değer</small></article>
        <article><span>✅ Gün durumu</span><strong>{activity.eaten.length}/{day.meals.length}</strong><small>{activity.skipped.length ? `${activity.skipped.length} öğün atlandı` : 'planlı öğün yenildi'}</small></article>
      </div>

      <div className="today-manual-wrap">
        <button type="button" className="today-manual-trigger" onClick={() => setManualOpen((value) => !value)}>＋ Başka bir şey yedim</button>
        {manualMeals.length > 0 && <div className="today-manual-chips">{manualMeals.map((meal) => <span key={meal.id}>🍽️ {meal.title}{meal.calories ? ` • ${meal.calories} kcal` : ''}<button type="button" aria-label={`${meal.title} kaydını sil`} onClick={() => removeManualMeal(meal.id)}>×</button></span>)}</div>}
        {manualOpen && <div className="today-manual-form"><label><span>Ne yedin?</span><input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} placeholder="Örn. mercimek çorbası" /></label><div><label><span>Kalori <small>opsiyonel</small></span><input inputMode="numeric" type="number" min="0" value={manualCalories} onChange={(event) => setManualCalories(event.target.value)} placeholder="0" /></label><label><span>Protein g <small>opsiyonel</small></span><input inputMode="numeric" type="number" min="0" value={manualProtein} onChange={(event) => setManualProtein(event.target.value)} placeholder="0" /></label><label><span>Tutar ₺ <small>opsiyonel</small></span><input inputMode="numeric" type="number" min="0" value={manualPrice} onChange={(event) => setManualPrice(event.target.value)} placeholder="0" /></label></div><button type="button" disabled={!manualTitle.trim()} onClick={addManualMeal}>Kaydet</button></div>}
      </div>

      <div className="today-section-heading">
        <div><span className="eyebrow">🍽️ Bugünün akışı</span><h2>Öğünlerin</h2></div>
        <button type="button" onClick={onGoWeek}>Tüm hafta →</button>
      </div>

      <div className="today-meal-list">
        {day.meals.map((meal, mealIndex) => {
          const status = statusFor(meal.id, mealStatuses)
          const favorite = favoriteRecipeIds.has(meal.recipeId)
          return (
            <article className={`today-meal-card status-${status}`} key={meal.id}>
              <div className="today-meal-top">
                <div className="today-meal-identity"><span className="today-meal-emoji">{meal.emoji}</span><div><small>{meal.slot} • {sourceEmoji(meal.source)} {meal.source}</small><h3>{meal.title}</h3><p>{meal.subtitle}</p></div></div>
                <button type="button" className={`today-favorite ${favorite ? 'active' : ''}`} onClick={() => onToggleFavorite(meal.recipeId)} aria-label={favorite ? 'Favoriden çıkar' : 'Favoriye ekle'}>{favorite ? '♥' : '♡'}</button>
              </div>

              <div className="today-meal-meta"><span>🔥 {meal.calories} kcal</span><span>💪 {meal.protein} g</span><span>💸 ≈ {money(meal.estimatedPrice)} ₺</span></div>
              <MealBusinessLine meal={meal} />

              {status !== 'planned' && <div className={`today-status-banner ${status}`}>{status === 'eaten' ? '✅ Yedim olarak işaretlendi' : '⏭ Bu öğünü atladın'} <button type="button" onClick={() => updateMealStatus(meal, 'planned')}>Geri al</button></div>}

              <div className="today-meal-actions">
                <button type="button" className="today-detail" onClick={() => onOpenDetail(activeIndex, mealIndex)}>👁 Detay</button>
                <button type="button" className="today-swap" disabled={status !== 'planned'} onClick={() => swapWithSignal(meal, mealIndex)}>↻ Değiştir</button>
                <button type="button" className={`today-eaten ${status === 'eaten' ? 'active' : ''}`} onClick={() => updateMealStatus(meal, status === 'eaten' ? 'planned' : 'eaten')}>✓ Yedim</button>
                <button type="button" className={`today-skipped ${status === 'skipped' ? 'active' : ''}`} onClick={() => updateMealStatus(meal, status === 'skipped' ? 'planned' : 'skipped')}>Atladım</button>
              </div>
            </article>
          )
        })}
      </div>

      {nextMeal && nextMealIndex >= 0 && <QuickRescueCard profile={profile} meal={nextMeal} planStartedAt={planStartedAt} dayIndex={activeIndex} mealIndex={nextMealIndex} />}
      <TodayRestaurantStrip meal={nextMeal} onOpenDetail={() => nextMealIndex >= 0 && onOpenDetail(activeIndex, nextMealIndex)} />

      <div className="today-smart-grid">
        <article className="today-prep-card">
          <span className="today-smart-icon">🔪</span>
          <div><small>Yarın için 10 dakika kazan</small><h3>{prepInsight.length ? 'Bugünden biraz hazırlayabilirsin.' : 'Yarın için ekstra hazırlık gerekmiyor.'}</h3><p>{prepInsight.length ? 'Bugün ve yarın ortak kullanılan malzemeleri tek seferde hazırlamak işi azaltır.' : 'Mevcut iki gün arasında güçlü bir ortak hazırlık fırsatı görmedim.'}</p>{prepInsight.length > 0 && <div className="today-chip-row">{prepInsight.map((item) => <span key={item.id}>{item.emoji} {item.name}</span>)}</div>}</div>
        </article>

        <article className="today-reuse-card">
          <span className="today-smart-icon">♻️</span>
          <div><small>Dolaptan değer</small><h3>{reusedToday.length} malzeme bugün tekrar kullanılıyor.</h3><p>Aynı paketi farklı öğünlerde değerlendirerek sepetin boşa gitmesini azaltmaya çalışıyoruz.</p>{reusedToday.length > 0 && <div className="today-chip-row">{reusedToday.map((item) => <span key={item.ingredientId}>{item.emoji} {item.name} × {item.usedInMeals}</span>)}</div>}</div>
        </article>
      </div>

      <div className="today-companion-grid"><MovementCard profile={profile} /><WeekRhythmPanel profile={profile} plan={plan} planStartedAt={planStartedAt} /></div>
      <MealPrepPanel plan={plan} profile={profile} startIndex={activeIndex} />

      <div className="today-bottom-actions">
        <button type="button" onClick={onGoShopping}>🛒 Bugünün alışverişine bak</button>
        <button type="button" onClick={onGoWeek}>📅 Haftayı düzenle</button>
      </div>
    </section>
  )
}
