import { useState } from 'react'
import { RECIPE_LIBRARY_STATS } from '../data/recipeCatalog'
import { swapMealInEditedPlan } from '../engine/planEditor'
import { generateWeeklyPlan } from '../engine/planEngine'
import type { UserPlanProfile, WeeklyPlan } from '../types'
import '../menu-approval.css'

type MenuApprovalProps = {
  profile: UserPlanProfile
  onApprove: (plan: WeeklyPlan, seed: number) => void
  onEdit: () => void
}

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function sourceEmoji(source: string) {
  if (source === 'Evde') return '🏠'
  if (source === 'Sipariş') return '🛵'
  return '🍽️'
}

function isPlaceholderRecipe(recipeId: string) {
  return recipeId.startsWith('safe-fallback-')
}

export function MenuApproval({ profile, onApprove, onEdit }: MenuApprovalProps) {
  const [seed, setSeed] = useState(1)
  const [swapSeed, setSwapSeed] = useState(50)
  const [plan, setPlan] = useState<WeeklyPlan>(() => generateWeeklyPlan(profile, 1))
  const [changedMeals, setChangedMeals] = useState<Set<string>>(() => new Set())
  const [message, setMessage] = useState<string | null>(null)
  const budgetOkay = plan.remainingBudget >= 0
  const placeholderCount = plan.days.flatMap((day) => day.meals).filter((meal) => isPlaceholderRecipe(meal.recipeId)).length

  const regenerate = () => {
    const nextSeed = seed + 1
    setSeed(nextSeed)
    setPlan(generateWeeklyPlan(profile, nextSeed))
    setChangedMeals(new Set())
    setMessage('Hafta yeni bir kombinasyonla hazırlandı. Tüm menüyü yeniden inceleyebilirsin. ✨')
  }

  const swapMeal = (dayIndex: number, mealIndex: number) => {
    const current = plan.days[dayIndex]?.meals[mealIndex]
    if (!current) return
    const nextSwapSeed = swapSeed + 1
    const nextPlan = swapMealInEditedPlan(plan, profile, dayIndex, mealIndex, nextSwapSeed)
    setSwapSeed(nextSwapSeed)
    if (nextPlan === plan) {
      setMessage('Bu öğün için tercihlerine uyan başka bir alternatif bulamadım.')
      return
    }
    const nextMeal = nextPlan.days[dayIndex]?.meals[mealIndex]
    setPlan(nextPlan)
    setChangedMeals((currentSet) => {
      const next = new Set(currentSet)
      if (nextMeal) next.add(nextMeal.id)
      return next
    })
    setMessage(`${current.title} yerine ${nextMeal?.title ?? 'yeni bir alternatif'} koydum. Bütçe ve alışveriş listesi de yeniden hesaplandı.`)
  }

  const approve = () => {
    if (placeholderCount > 0) {
      setMessage('Bu menüde gerçek tarifle doldurulamayan öğün var. Güvenli bir menü başlatmak için tercihlerini biraz genişlet veya o öğünü değiştir.')
      return
    }
    if (!budgetOkay) {
      const confirmed = window.confirm(`Bu menü haftalık bütçeni yaklaşık ${money(Math.abs(plan.remainingBudget))} ₺ aşıyor. Yine de bu menüyü başlatmak istiyor musun?`)
      if (!confirmed) return
    }
    onApprove(plan, seed)
  }

  return (
    <main className="menu-approval-page">
      <header className="menu-approval-top shell">
        <div className="brand"><span className="brand-mark">🍋</span><span>lokma</span></div>
        <span>Son kontrol</span>
      </header>

      <section className="menu-approval-hero shell">
        <span className="eyebrow">🍽️ Önce menünü gör</span>
        <h1>İşte {profile.days} günlük yemek menün.</h1>
        <p>Plan başlamadan önce tamamını incele. Tek bir öğünü sevmediysen yalnızca onu değiştirebilir, istersen bütün menüyü yeniden oluşturabilirsin.</p>
        <div className="menu-variety-note">✨ {RECIPE_LIBRARY_STATS.recipes} farklı yemek seçeneğinden sana uyanlar arasından hazırlandı. “Değiştir” dedikçe uygun alternatifler arasında dolaşabilirsin.</div>
        <div className="menu-approval-metrics">
          <article><span>💸 Haftalık tahmin</span><strong>{money(plan.totalCost)} ₺</strong><small>{money(profile.budget)} ₺ bütçe</small></article>
          <article><span>🔥 Günlük ortalama</span><strong>{plan.averageCalories} kcal</strong><small>hedef ≈ {plan.nutritionTargets.calories}</small></article>
          <article><span>💪 Protein</span><strong>{plan.averageProtein} g</strong><small>hedef ≈ {plan.nutritionTargets.protein} g</small></article>
          <article className={budgetOkay ? 'is-good' : 'is-warning'}><span>{budgetOkay ? '✓ Bütçe durumu' : '⚠️ Bütçe durumu'}</span><strong>{budgetOkay ? `${money(plan.remainingBudget)} ₺ pay` : `${money(Math.abs(plan.remainingBudget))} ₺ aşım`}</strong><small>{budgetOkay ? 'limit içinde' : 'onaydan önce uyaracağız'}</small></article>
        </div>
        {placeholderCount > 0 && <div className="menu-approval-blocker" role="alert">⚠️ {placeholderCount} öğün mevcut filtrelerle gerçek bir tarifle eşleşmedi. Bu menü bu haliyle başlatılamaz; ilgili öğünü değiştir veya tercihlerini düzenle.</div>}
        {message && <div className="menu-approval-message" role="status" aria-live="polite">{message}</div>}
      </section>

      <section className="menu-approval-days shell" aria-label="Haftalık menü">
        {plan.days.map((day, dayIndex) => (
          <article className="menu-approval-day" key={day.index}>
            <header><div><span>{String(day.index + 1).padStart(2, '0')}</span><h2>{day.name}</h2></div><small>≈ {money(day.totalEstimatedPrice)} ₺</small></header>
            <div className="menu-approval-meals">
              {day.meals.map((meal, mealIndex) => {
                const placeholder = isPlaceholderRecipe(meal.recipeId)
                return (
                  <div className={`menu-approval-meal ${changedMeals.has(meal.id) ? 'was-changed' : ''} ${placeholder ? 'needs-attention' : ''}`} key={meal.id}>
                    <span className="menu-approval-meal-emoji" aria-hidden="true">{meal.emoji}</span>
                    <div><small>{meal.slot} • {sourceEmoji(meal.source)} {meal.source}</small><strong>{meal.title}</strong><p>{placeholder ? 'Bu öğün için uygun gerçek tarif bulunamadı.' : `${meal.calories} kcal • ${meal.protein} g protein`}</p>{changedMeals.has(meal.id) && <em>✓ senin değişikliğin</em>}{placeholder && <em className="needs-attention-label">⚠️ düzenleme gerekli</em>}</div>
                    <button type="button" className="menu-meal-swap" onClick={() => swapMeal(dayIndex, mealIndex)} aria-label={`${meal.title} öğününü değiştir`}>↻<span>Değiştir</span></button>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </section>

      <section className="menu-approval-bottom shell">
        <div><strong>Bu menü hoşuna gitti mi?</strong><p>Onayladığında plan bugünden başlar ve cihazında otomatik olarak açık kalır.</p></div>
        <div className="menu-approval-actions">
          <button type="button" className="menu-edit" onClick={onEdit}>← Tercihleri düzenle</button>
          <button type="button" className="menu-regenerate" onClick={regenerate}>🎲 Baştan oluştur</button>
          <button type="button" className="menu-approve" disabled={placeholderCount > 0} onClick={approve}>✓ Bu menüyü onayla</button>
        </div>
      </section>
    </main>
  )
}
