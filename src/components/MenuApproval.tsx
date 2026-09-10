import { useState } from 'react'
import { RECIPE_LIBRARY_STATS } from '../data/recipeCatalog'
import { rebuildEditedPlan, swapMealInEditedPlan } from '../engine/planEditor'
import { generateWeeklyPlan } from '../engine/planEngine'
import { MealAlternativesSheet } from './MealAlternativesSheet'
import type { Recipe, UserPlanProfile, WeeklyPlan } from '../types'
import '../menu-approval.css'

type MenuApprovalProps = {
  profile: UserPlanProfile
  onApprove: (plan: WeeklyPlan, seed: number) => void
  onEdit: () => void
}

type OptionTarget = { dayIndex: number; mealIndex: number } | null

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
  const [optionTarget, setOptionTarget] = useState<OptionTarget>(null)
  const budgetOkay = plan.remainingBudget >= 0
  const placeholderCount = plan.days.flatMap((day) => day.meals).filter((meal) => isPlaceholderRecipe(meal.recipeId)).length
  const optionMeal = optionTarget ? plan.days[optionTarget.dayIndex]?.meals[optionTarget.mealIndex] : undefined

  const regenerate = () => {
    const nextSeed = seed + 1
    setSeed(nextSeed)
    setPlan(generateWeeklyPlan(profile, nextSeed))
    setChangedMeals(new Set())
    setOptionTarget(null)
    setMessage('Hafta yeni bir kombinasyonla hazırlandı. Tüm menüyü yeniden inceleyebilirsin. ✨')
  }

  const markChanged = (mealId?: string) => {
    if (!mealId) return
    setChangedMeals((currentSet) => {
      const next = new Set(currentSet)
      next.add(mealId)
      return next
    })
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
    markChanged(nextMeal?.id)
    setMessage(`${current.title} yerine ${nextMeal?.title ?? 'yeni bir alternatif'} koydum. Bütçe ve alışveriş listesi de yeniden hesaplandı.`)
  }

  const selectAlternative = (recipe: Recipe) => {
    if (!optionTarget) return
    const current = plan.days[optionTarget.dayIndex]?.meals[optionTarget.mealIndex]
    if (!current) return

    const days = plan.days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
    const replacementId = `${optionTarget.dayIndex}-${optionTarget.mealIndex}-${recipe.id}-selected-${swapSeed + 1}`
    days[optionTarget.dayIndex].meals[optionTarget.mealIndex] = {
      id: replacementId,
      recipeId: recipe.id,
      slot: current.slot,
      title: recipe.title,
      subtitle: recipe.subtitle,
      emoji: recipe.emoji,
      source: recipe.source,
      calories: recipe.calories,
      protein: recipe.protein,
      estimatedPrice: recipe.estimatedPrice * profile.people,
      tags: recipe.tags,
    }

    const nextPlan = rebuildEditedPlan(profile, days, {
      adjustedForBudget: plan.adjustedForBudget,
      convertedOutsideMeals: plan.convertedOutsideMeals,
    })
    setSwapSeed((value) => value + 1)
    setPlan(nextPlan)
    markChanged(replacementId)
    setOptionTarget(null)
    setMessage(`${recipe.title} menüne eklendi. Bütçe ve alışveriş listesi yeniden hesaplandı. ✓`)
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
        <p>Plan başlamadan önce tamamını incele. Tek bir öğünü sevmediysen rastgele değiştirebilir veya “Seçenekler”den alternatifleri kendin seçebilirsin.</p>
        <div className="menu-variety-note">✨ {RECIPE_LIBRARY_STATS.recipes} farklı yemek seçeneğinden sana uyanlar arasından hazırlandı. Her öğünde 12’ye kadar uygun alternatifi açıp karşılaştırabilirsin.</div>
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
                    <div className="menu-meal-actions">
                      <button type="button" className="menu-meal-swap" onClick={() => swapMeal(dayIndex, mealIndex)} aria-label={`${meal.title} öğününü rastgele değiştir`}>↻<span>Rastgele</span></button>
                      <button type="button" className="menu-meal-options-button" onClick={() => setOptionTarget({ dayIndex, mealIndex })} aria-label={`${meal.title} için alternatifleri aç`}>☰<span>Seçenekler</span></button>
                    </div>
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

      {optionMeal && optionTarget && (
        <MealAlternativesSheet meal={optionMeal} profile={profile} onClose={() => setOptionTarget(null)} onSelect={selectAlternative} />
      )}
    </main>
  )
}
