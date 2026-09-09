import { useMemo, type CSSProperties } from 'react'
import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { MealBusinessLine } from './MealBusinessLine'
import { MealPrepPanel } from './MealPrepPanel'
import { formatPlanDate, greetingForNow, planDayIndex } from '../services/planCalendar'
import type { MealActivityStatus } from '../services/planSessionStorage'
import type { PlannedMeal, UserPlanProfile, WeeklyPlan } from '../types'
import '../today.css'

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

  const activity = useMemo(() => {
    if (!day) return { eaten: [] as PlannedMeal[], skipped: [] as PlannedMeal[], planned: [] as PlannedMeal[] }
    return day.meals.reduce((result, meal) => {
      const status = statusFor(meal.id, mealStatuses)
      result[status].push(meal)
      return result
    }, { eaten: [] as PlannedMeal[], skipped: [] as PlannedMeal[], planned: [] as PlannedMeal[] })
  }, [day, mealStatuses])

  const consumedCalories = activity.eaten.reduce((sum, meal) => sum + meal.calories, 0)
  const consumedProtein = activity.eaten.reduce((sum, meal) => sum + meal.protein, 0)
  const trackedSpend = activity.eaten.reduce((sum, meal) => sum + meal.estimatedPrice, 0)
  const completionPct = day ? Math.round((activity.eaten.length + activity.skipped.length) / Math.max(1, day.meals.length) * 100) : 0
  const nextMeal = activity.planned[0]

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

  if (planExpired) {
    return (
      <section className="today-page shell">
        <div className="today-expired-card">
          <div className="today-expired-emoji">🌱</div>
          <span className="eyebrow">Plan döngüsü tamamlandı</span>
          <h1>{profile.name ? `${profile.name}, ` : ''}bu planın {plan.days.length} günü bitti.</h1>
          <p>Eski haftanı geçmişe kaydedip mevcut tercihlerinle yeni bir menü hazırlayacağız. Yeni hafta, sen menüyü görüp onayladıktan sonra başlayacak.</p>
          <button type="button" onClick={requestFreshPlan}>🍽️ Yeni haftanın menüsünü gör</button>
        </div>
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
          <p>{nextMeal ? `Sıradaki: ${nextMeal.slot} • ${nextMeal.title}` : 'Bugünkü öğünlerin tamamını işaretledin. ✨'}</p>
        </div>
        <div className="today-completion-ring" style={{ '--today-progress': `${completionPct * 3.6}deg` } as CSSProperties}>
          <div><strong>%{completionPct}</strong><small>gün</small></div>
        </div>
      </header>

      <div className="today-progress-grid">
        <article><span>🔥 Yedim</span><strong>{consumedCalories}</strong><small>/ {plan.nutritionTargets.calories} kcal</small><div><i style={{ width: `${Math.min(100, consumedCalories / Math.max(1, plan.nutritionTargets.calories) * 100)}%` }} /></div></article>
        <article><span>💪 Protein</span><strong>{consumedProtein} g</strong><small>/ {plan.nutritionTargets.protein} g</small><div><i style={{ width: `${Math.min(100, consumedProtein / Math.max(1, plan.nutritionTargets.protein) * 100)}%` }} /></div></article>
        <article><span>💸 İşaretlenen öğün</span><strong>{money(trackedSpend)} ₺</strong><small>tahmini değer</small></article>
        <article><span>✅ Gün durumu</span><strong>{activity.eaten.length}/{day.meals.length}</strong><small>{activity.skipped.length ? `${activity.skipped.length} öğün atlandı` : 'yenilen öğün'}</small></article>
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

              {status !== 'planned' && <div className={`today-status-banner ${status}`}>{status === 'eaten' ? '✅ Yedim olarak işaretlendi' : '⏭ Bu öğünü atladın'} <button type="button" onClick={() => onMealStatus(meal.id, 'planned')}>Geri al</button></div>}

              <div className="today-meal-actions">
                <button type="button" className="today-detail" onClick={() => onOpenDetail(activeIndex, mealIndex)}>👁 Detay</button>
                <button type="button" className="today-swap" disabled={status !== 'planned'} onClick={() => onSwap(activeIndex, mealIndex)}>↻ Değiştir</button>
                <button type="button" className={`today-eaten ${status === 'eaten' ? 'active' : ''}`} onClick={() => onMealStatus(meal.id, status === 'eaten' ? 'planned' : 'eaten')}>✓ Yedim</button>
                <button type="button" className={`today-skipped ${status === 'skipped' ? 'active' : ''}`} onClick={() => onMealStatus(meal.id, status === 'skipped' ? 'planned' : 'skipped')}>Atladım</button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="today-smart-grid">
        <article className="today-prep-card">
          <span className="today-smart-icon">🔪</span>
          <div><small>Yarın için 10 dakika kazan</small><h3>{prepInsight.length ? 'Bugünden biraz hazırlayabilirsin.' : 'Yarın için ekstra hazırlık gerekmiyor.'}</h3><p>{prepInsight.length ? 'Bugün ve yarın ortak kullanılan malzemeleri tek seferde hazırlamak işi azaltır.' : 'Mevcut iki gün arasında güçlü bir ortak hazırlık fırsatı görmedim.'}</p>{prepInsight.length > 0 && <div className="today-chip-row">{prepInsight.map((item) => <span key={item.id}>{item.emoji} {item.name}</span>)}</div>}</div>
        </article>

        <article className="today-reuse-card">
          <span className="today-smart-icon">♻️</span>
          <div><small>Dolaptan değer</small><h3>{reusedToday.length} malzeme bugün tekrar kullanılıyor.</h3><p>Lokma aynı paketi farklı öğünlerde değerlendirerek sepetin boşa gitmesini azaltmaya çalışıyor.</p>{reusedToday.length > 0 && <div className="today-chip-row">{reusedToday.map((item) => <span key={item.ingredientId}>{item.emoji} {item.name} × {item.usedInMeals}</span>)}</div>}</div>
        </article>
      </div>

      <MealPrepPanel plan={plan} profile={profile} startIndex={activeIndex} />

      <div className="today-bottom-actions">
        <button type="button" onClick={onGoShopping}>🛒 Bugünün alışverişine bak</button>
        <button type="button" onClick={onGoWeek}>📅 Haftayı düzenle</button>
      </div>
    </section>
  )
}
