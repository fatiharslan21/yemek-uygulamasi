import { useMemo, useState } from 'react'
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

export function MenuApproval({ profile, onApprove, onEdit }: MenuApprovalProps) {
  const [seed, setSeed] = useState(1)
  const plan = useMemo(() => generateWeeklyPlan(profile, seed), [profile, seed])
  const budgetOkay = plan.remainingBudget >= 0

  return (
    <main className="menu-approval-page">
      <header className="menu-approval-top shell">
        <div className="brand"><span className="brand-mark">🍋</span><span>lokma</span></div>
        <span>Son kontrol</span>
      </header>

      <section className="menu-approval-hero shell">
        <span className="eyebrow">🍽️ Önce menünü gör</span>
        <h1>İşte {profile.days} günlük yemek menün.</h1>
        <p>Planın başlamadan önce tamamını incele. Beğenmediysen yeniden oluşturabilir veya tercihlerini düzenleyebilirsin.</p>
        <div className="menu-approval-metrics">
          <article><span>💸 Haftalık tahmin</span><strong>{money(plan.totalCost)} ₺</strong><small>{money(profile.budget)} ₺ bütçe</small></article>
          <article><span>🔥 Günlük ortalama</span><strong>{plan.averageCalories} kcal</strong><small>hedef ≈ {plan.nutritionTargets.calories}</small></article>
          <article><span>💪 Protein</span><strong>{plan.averageProtein} g</strong><small>hedef ≈ {plan.nutritionTargets.protein} g</small></article>
          <article className={budgetOkay ? 'is-good' : 'is-warning'}><span>{budgetOkay ? '✓ Bütçe durumu' : '⚠️ Bütçe durumu'}</span><strong>{budgetOkay ? `${money(plan.remainingBudget)} ₺ pay` : `${money(Math.abs(plan.remainingBudget))} ₺ aşım`}</strong><small>{budgetOkay ? 'limit içinde' : 'tercihleri düzenleyebilirsin'}</small></article>
        </div>
      </section>

      <section className="menu-approval-days shell">
        {plan.days.map((day) => (
          <article className="menu-approval-day" key={day.index}>
            <header><div><span>{String(day.index + 1).padStart(2, '0')}</span><h2>{day.name}</h2></div><small>≈ {money(day.totalEstimatedPrice)} ₺</small></header>
            <div className="menu-approval-meals">
              {day.meals.map((meal) => (
                <div className="menu-approval-meal" key={meal.id}>
                  <span className="menu-approval-meal-emoji">{meal.emoji}</span>
                  <div><small>{meal.slot} • {sourceEmoji(meal.source)} {meal.source}</small><strong>{meal.title}</strong><p>{meal.calories} kcal • {meal.protein} g protein</p></div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="menu-approval-bottom shell">
        <div><strong>Bu menü hoşuna gitti mi?</strong><p>Onayladığında plan bugünden başlar ve cihazında otomatik olarak açık kalır.</p></div>
        <div className="menu-approval-actions">
          <button type="button" className="menu-edit" onClick={onEdit}>← Tercihleri düzenle</button>
          <button type="button" className="menu-regenerate" onClick={() => setSeed((value) => value + 1)}>🎲 Başka menü oluştur</button>
          <button type="button" className="menu-approve" onClick={() => onApprove(plan, seed)}>✓ Bu menüyü onayla</button>
        </div>
      </section>
    </main>
  )
}
