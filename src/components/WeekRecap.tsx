import { useMemo } from 'react'
import { loadAppPreferences } from '../services/appPreferences'
import { addDaysToKey } from '../services/planCalendar'
import type { MealActivityStatus } from '../services/planSessionStorage'
import { loadWeightHistory } from '../services/weightTrackingStorage'
import type { UserPlanProfile, WeeklyPlan } from '../types'
import '../week-recap.css'

type WeekRecapProps = {
  profile: UserPlanProfile
  plan: WeeklyPlan
  planStartedAt: string
  mealStatuses: Record<string, MealActivityStatus>
  onNewWeek: () => void
}

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function formatWeight(value: number) {
  return value.toFixed(1).replace('.', ',')
}

export function WeekRecap({ profile, plan, planStartedAt, mealStatuses, onNewWeek }: WeekRecapProps) {
  const summary = useMemo(() => {
    const meals = plan.days.flatMap((day) => day.meals)
    const eaten = meals.filter((meal) => mealStatuses[meal.id] === 'eaten')
    const skipped = meals.filter((meal) => mealStatuses[meal.id] === 'skipped')
    const tracked = eaten.length + skipped.length
    const total = meals.length
    const adherencePct = Math.round(eaten.length / Math.max(1, total) * 100)
    const trackingPct = Math.round(tracked / Math.max(1, total) * 100)
    const eatenValue = eaten.reduce((sum, meal) => sum + meal.estimatedPrice, 0)
    const homeEaten = eaten.filter((meal) => meal.source === 'Evde').length
    const outsideEaten = eaten.length - homeEaten
    const endDate = addDaysToKey(planStartedAt, Math.max(0, plan.days.length - 1))
    const weights = loadWeightHistory().filter((entry) => entry.date >= planStartedAt && entry.date <= endDate)
    const firstWeight = weights[0]
    const lastWeight = weights[weights.length - 1]
    const weightChange = firstWeight && lastWeight && firstWeight.id !== lastWeight.id
      ? Number((lastWeight.weight - firstWeight.weight).toFixed(1))
      : null
    return {
      eaten: eaten.length,
      skipped: skipped.length,
      untracked: Math.max(0, total - tracked),
      total,
      adherencePct,
      trackingPct,
      eatenValue,
      homeEaten,
      outsideEaten,
      firstWeight,
      lastWeight,
      weightChange,
      weightsCount: weights.length,
    }
  }, [mealStatuses, plan, planStartedAt])

  const preferences = loadAppPreferences()
  const rhythmTitle = summary.adherencePct >= 80
    ? 'Ritmi bayağı iyi tutturdun.'
    : summary.adherencePct >= 55
      ? 'İyi bir temel oluşturdun.'
      : 'Bu hafta bize neyin zorlandığını gösterdi.'

  return (
    <section className="week-recap" aria-labelledby="week-recap-title">
      <header className="week-recap-hero">
        <div className="week-recap-icon" aria-hidden="true">🌿</div>
        <div>
          <span className="eyebrow">Hafta tamamlandı</span>
          <h1 id="week-recap-title">{profile.name ? `${profile.name}, ` : ''}{rhythmTitle}</h1>
          <p>Yeni haftaya geçmeden önce bu planın nasıl geçtiğine bakalım. Sonraki menü yine sen onayladıktan sonra başlayacak.</p>
        </div>
      </header>

      <div className="week-recap-score-grid" aria-label="Haftalık özet">
        <article className="week-recap-primary"><span>✓ Plana uyum</span><strong>%{summary.adherencePct}</strong><small>{summary.eaten} / {summary.total} öğün yenildi</small><div><i style={{ width: `${summary.adherencePct}%` }} /></div></article>
        <article><span>📝 Takip oranı</span><strong>%{summary.trackingPct}</strong><small>{summary.untracked ? `${summary.untracked} öğün işaretlenmedi` : 'tüm öğünler işlendi'}</small></article>
        <article><span>⏭ Atlanan</span><strong>{summary.skipped}</strong><small>öğün</small></article>
        <article><span>♻️ Tekrar kullanım</span><strong>%{plan.reuseScore}</strong><small>{plan.reusedIngredientCount} ortak malzeme</small></article>
      </div>

      <div className="week-recap-detail-grid">
        <article>
          <span className="week-recap-detail-icon" aria-hidden="true">💸</span>
          <div><small>Bütçe görünümü</small><h3>{money(plan.totalCost)} ₺ planlandı</h3><p>Haftalık sınırın {money(profile.budget)} ₺ idi. “Yedim” işaretlediğin öğünlerin tekil tahmini değeri ≈ {money(summary.eatenValue)} ₺.</p></div>
        </article>
        <article>
          <span className="week-recap-detail-icon" aria-hidden="true">🏠</span>
          <div><small>Yeme düzenin</small><h3>{summary.homeEaten} evde • {summary.outsideEaten} dışarı/sipariş</h3><p>Bu dağılım yeni planı otomatik değiştirmez; ama tercihlerini düzenlerken sana fikir verir.</p></div>
        </article>
        <article>
          <span className="week-recap-detail-icon" aria-hidden="true">⚖️</span>
          <div><small>Kilo takibi</small>{summary.weightsCount >= 2 && summary.weightChange != null ? <><h3>{summary.weightChange > 0 ? '+' : ''}{formatWeight(summary.weightChange)} kg</h3><p>{formatWeight(summary.firstWeight!.weight)} kg → {formatWeight(summary.lastWeight!.weight)} kg. Günlük dalgalanmalar normal olabilir; tek haftayı tek başına sonuç gibi yorumlama.</p></> : summary.lastWeight ? <><h3>{formatWeight(summary.lastWeight.weight)} kg</h3><p>Bu plan döneminde tek tartım kaydın var. Trend için birkaç farklı gün kaydetmek daha anlamlı.</p></> : <><h3>Kayıt yok</h3><p>Bu hafta tartım eklemedin; yeni haftaya yine mevcut plan kilonla devam edebiliriz.</p></>}</div>
        </article>
      </div>

      <div className="week-recap-next">
        <div><span>🍽️</span><div><strong>Yeni hafta hazır olduğunda önce menüyü göreceksin.</strong><p>{preferences.useLatestWeightForRenewal && summary.lastWeight ? `Son tartımın (${formatWeight(summary.lastWeight.weight)} kg) yeni haftanın hedef hesabında kullanılacak.` : 'Mevcut tercihlerin korunacak; istersen menü önizlemesinden önce tercihlerini düzenleyebilirsin.'}</p></div></div>
        <button type="button" onClick={onNewWeek}>Yeni haftanın menüsünü gör →</button>
      </div>
    </section>
  )
}
