import { useMemo, useState } from 'react'
import { generateWeeklyPlan } from '../engine/planEngine'
import type { IngredientDefinition, PlannedMeal, ShoppingListItem, UserPlanProfile } from '../types'
import '../plan-engine.css'

type StarterPlanDashboardProps = {
  profile: UserPlanProfile
  onEdit: () => void
  onHome: () => void
}

type DashboardTab = 'week' | 'shopping'

const CATEGORY_ORDER: IngredientDefinition['category'][] = [
  'Protein',
  'Sebze & meyve',
  'Kahvaltılık',
  'Kuru gıda',
  'Diğer',
]

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
  if (item.unit === 'g' && item.requiredQuantity >= 1000) {
    return `${(item.requiredQuantity / 1000).toFixed(1).replace('.', ',')} kg`
  }
  if (item.unit === 'ml' && item.requiredQuantity >= 1000) {
    return `${(item.requiredQuantity / 1000).toFixed(1).replace('.', ',')} L`
  }
  return `${item.requiredQuantity} ${item.unit}`
}

export function StarterPlanDashboard({ profile, onEdit, onHome }: StarterPlanDashboardProps) {
  const [seed, setSeed] = useState(1)
  const [tab, setTab] = useState<DashboardTab>('week')
  const plan = useMemo(() => generateWeeklyPlan(profile, seed), [profile, seed])

  const shoppingGroups = useMemo(() => CATEGORY_ORDER
    .map((category) => ({
      category,
      items: plan.shoppingList.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0), [plan.shoppingList])

  const budgetOkay = plan.remainingBudget >= 0
  const calorieDelta = plan.averageCalories - plan.nutritionTargets.calories
  const proteinDelta = plan.averageProtein - plan.nutritionTargets.protein

  return (
    <main className="dashboard-page plan-v1-page">
      <nav className="topbar shell dashboard-nav">
        <button className="brand brand-button" type="button" onClick={onHome}>
          <span className="brand-mark">🍋</span><span>lokma</span>
        </button>
        <div className="nav-links dashboard-tabs">
          <button type="button" className={`dashboard-nav-button ${tab === 'week' ? 'active' : ''}`} onClick={() => setTab('week')}>📅 Haftam</button>
          <button type="button" className={`dashboard-nav-button ${tab === 'shopping' ? 'active' : ''}`} onClick={() => setTab('shopping')}>🛒 Alışveriş <span className="nav-count">{plan.shoppingList.length}</span></button>
          <button type="button" className="profile-pill" onClick={onEdit}>👤 {profile.name || 'Profil'} <span>⚙️</span></button>
        </div>
      </nav>

      <section className="dashboard-hero shell plan-engine-hero">
        <div>
          <span className="hero-badge">🧠 Plan motoru v1 çalışıyor</span>
          <h1>{profile.name ? `${profile.name}, ` : ''}haftanı <em>Lokma hesapladı.</em></h1>
          <p>{profile.days} gün • {profile.diet} • {profile.goal} • {profile.people} kişi • {profile.neighborhood || profile.district || profile.city}</p>
          <div className="engine-status-row">
            <span>🎯 ≈ {plan.nutritionTargets.calories} kcal hedef</span>
            <span>💪 ≈ {plan.nutritionTargets.protein} g protein</span>
            <span>♻️ %{plan.reuseScore} malzeme yeniden kullanım</span>
          </div>
        </div>
        <div className="dashboard-hero-actions">
          <button type="button" className="shuffle-plan-button" onClick={() => setSeed((current) => current + 1)}>🎲 Planı yeniden karıştır</button>
          <button type="button" className="edit-plan-button" onClick={onEdit}>⚙️ Tercihleri düzenle</button>
        </div>
      </section>

      {plan.adjustedForBudget && (
        <section className="shell budget-smart-note">
          <span className="budget-smart-icon">🪄</span>
          <div>
            <strong>Bütçeyi korumak için planı akıllıca dengeledik.</strong>
            <p>Seçtiğin ev/sipariş oranını başlangıç kabul ettik; tahmini toplam bütçeyi aşınca {plan.convertedOutsideMeals} dışarı öğününü daha ekonomik ev yemeğine çevirdik.</p>
          </div>
          <span className="budget-note-pill">{budgetOkay ? `+${money(plan.remainingBudget)} ₺ pay` : `${money(Math.abs(plan.remainingBudget))} ₺ aşım`}</span>
        </section>
      )}

      <section className="plan-metrics shell engine-metrics">
        <article className={budgetOkay ? '' : 'metric-warning'}>
          <span>💸 Gerçek plan bütçesi</span>
          <strong>{money(plan.totalCost)} ₺</strong>
          <small>{money(profile.budget)} ₺ haftalık limitin</small>
          <div className="metric-progress"><i style={{ width: `${Math.min(100, plan.budgetUsagePct)}%` }} /></div>
        </article>
        <article className={budgetOkay ? 'metric-good' : 'metric-warning'}>
          <span>{budgetOkay ? '💚 Tahmini kalan' : '⚠️ Bütçe farkı'}</span>
          <strong>{money(Math.abs(plan.remainingBudget))} ₺</strong>
          <small>{budgetOkay ? 'Limit içinde kaldık' : 'Bu tercihlerle tam sığmıyor'}</small>
        </article>
        <article>
          <span>🔥 Günlük ortalama</span>
          <strong>{plan.averageCalories} kcal</strong>
          <small>{calorieDelta === 0 ? 'Hedefle aynı' : `${calorieDelta > 0 ? '+' : ''}${calorieDelta} kcal hedef farkı`}</small>
        </article>
        <article>
          <span>💪 Protein ortalaması</span>
          <strong>{plan.averageProtein} g</strong>
          <small>{proteinDelta === 0 ? 'Hedefle aynı' : `${proteinDelta > 0 ? '+' : ''}${proteinDelta} g hedef farkı`}</small>
        </article>
      </section>

      <section className="shell split-cost-strip">
        <div><span>🛒 Market paketleri</span><strong>{money(plan.marketCost)} ₺</strong></div>
        <span className="split-plus">+</span>
        <div><span>🛵 Sipariş / dışarı</span><strong>{money(plan.outsideCost)} ₺</strong></div>
        <span className="split-equals">=</span>
        <div className="split-total"><span>Haftalık tahmin</span><strong>{money(plan.totalCost)} ₺</strong></div>
        <small>Fiyatlar şu anda demo katalog fiyatlarıdır; gerçek market/restoran entegrasyonu sonraki veri katmanında bağlanacak.</small>
      </section>

      {tab === 'week' ? (
        <WeekView profile={profile} plan={plan} onShopping={() => setTab('shopping')} />
      ) : (
        <ShoppingView groups={shoppingGroups} plan={plan} onWeek={() => setTab('week')} />
      )}
    </main>
  )
}

type WeekViewProps = {
  profile: UserPlanProfile
  plan: ReturnType<typeof generateWeeklyPlan>
  onShopping: () => void
}

function WeekView({ profile, plan, onShopping }: WeekViewProps) {
  return (
    <>
      <section className="week-section shell engine-week-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">📅 {plan.days.length} günlük gerçek taslak</span>
            <h2>Gün gün yemek planın</h2>
            <p>Her seçim bütçe, beslenme hedefi, diyet tipi ve önceki günlerde kullanılan malzemeler birlikte puanlanarak seçildi.</p>
          </div>
          <button className="shopping-jump-button" type="button" onClick={onShopping}>🛒 Listeye geç →</button>
        </div>

        <div className="engine-day-grid">
          {plan.days.map((day) => {
            const caloriePct = Math.round(day.totalCalories / Math.max(1, plan.nutritionTargets.calories) * 100)
            const proteinPct = Math.round(day.totalProtein / Math.max(1, plan.nutritionTargets.protein) * 100)
            return (
              <article className="engine-day-card" key={day.index}>
                <div className="engine-day-header">
                  <div><span className="day-number">{String(day.index + 1).padStart(2, '0')}</span><div><h3>{day.name}</h3><small>≈ {money(day.totalEstimatedPrice)} ₺ marjinal öğün değeri</small></div></div>
                  <span className="day-goal-chip">{day.index === 0 ? 'Başlangıç' : day.index === plan.days.length - 1 ? 'Hafta sonu' : 'Dengeli gün'}</span>
                </div>

                <div className="engine-meal-list">
                  {day.meals.map((meal) => <MealRow key={meal.id} meal={meal} />)}
                </div>

                <div className="day-targets">
                  <div><span>🔥 {day.totalCalories} / {plan.nutritionTargets.calories} kcal</span><div><i style={{ width: `${Math.min(100, caloriePct)}%` }} /></div></div>
                  <div><span>💪 {day.totalProtein} / {plan.nutritionTargets.protein} g</span><div><i style={{ width: `${Math.min(100, proteinPct)}%` }} /></div></div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="reuse-insight shell">
        <div className="reuse-insight-copy">
          <span className="step-kicker">♻️ Lokma'nın maliyet numarası</span>
          <h2>{plan.reusedIngredientCount} malzemeyi haftada birden fazla öğünde kullanıyoruz.</h2>
          <p>Alışverişi tarif tarif değil, haftanın tamamı üzerinden topluyoruz. Böylece aynı paket tavuk, bulgur, yoğurt veya sebze birden fazla öğüne paylaştırılabiliyor.</p>
          <div className="reuse-stats">
            <span><b>%{plan.reuseScore}</b> tekrar kullanım kapsaması</span>
            <span><b>≈ {money(plan.estimatedWasteSaving)} ₺</b> paket birleştirme avantajı</span>
            <span><b>{profile.people} kişi</b> için miktarlandı</span>
          </div>
        </div>
        <button type="button" onClick={onShopping}>Alışveriş listesini aç <span>→</span></button>
      </section>
    </>
  )
}

function MealRow({ meal }: { meal: PlannedMeal }) {
  return (
    <div className="engine-meal-row">
      <span className="meal-slot">{meal.slot}</span>
      <div className="engine-meal-emoji">{meal.emoji}</div>
      <div className="engine-meal-main">
        <div><strong>{meal.title}</strong><span className={`source-chip ${sourceClass(meal.source)}`}>{sourceEmoji(meal.source)} {meal.source}</span></div>
        <p>{meal.subtitle}</p>
        <div className="meal-nutrition"><span>🔥 {meal.calories} kcal</span><span>💪 {meal.protein} g</span><span>💸 ≈ {money(meal.estimatedPrice)} ₺</span></div>
      </div>
      <div className="meal-tags">{meal.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
    </div>
  )
}

type ShoppingViewProps = {
  groups: Array<{ category: IngredientDefinition['category']; items: ShoppingListItem[] }>
  plan: ReturnType<typeof generateWeeklyPlan>
  onWeek: () => void
}

function ShoppingView({ groups, plan, onWeek }: ShoppingViewProps) {
  return (
    <section className="shopping-page-section shell">
      <div className="section-title-row shopping-title-row">
        <div>
          <span className="eyebrow">🛒 Paket bazlı alışveriş listesi</span>
          <h2>Markete girdiğinde ne alacağını biliyorsun.</h2>
          <p>İhtiyaç miktarını markette satılan paket boyuna yuvarlıyoruz. Böylece “tarifte 180 g tavuk yazıyor” ile “markette 1 kg paket var” farkını plan hesaba katıyor.</p>
        </div>
        <button className="shopping-jump-button" type="button" onClick={onWeek}>← Haftaya dön</button>
      </div>

      <div className="shopping-overview-grid">
        <article><span>🛍️ Toplam ürün</span><strong>{plan.shoppingList.length}</strong><small>farklı market kalemi</small></article>
        <article><span>💸 Market tahmini</span><strong>{money(plan.marketCost)} ₺</strong><small>paket fiyatları üzerinden</small></article>
        <article><span>♻️ Tekrar kullanılan</span><strong>{plan.reusedIngredientCount}</strong><small>birden fazla öğünde</small></article>
        <article><span>✨ Paket avantajı</span><strong>≈ {money(plan.estimatedWasteSaving)} ₺</strong><small>ayrı ayrı alıma kıyasla tahmini</small></article>
      </div>

      <div className="shopping-groups">
        {groups.map((group) => (
          <section className="shopping-group" key={group.category}>
            <div className="shopping-group-heading"><h3>{group.category}</h3><span>{group.items.length} ürün</span></div>
            <div className="shopping-item-list">
              {group.items.map((item) => (
                <article className="shopping-item" key={item.ingredientId}>
                  <div className="shopping-item-emoji">{item.emoji}</div>
                  <div className="shopping-item-main">
                    <strong>{item.name}</strong>
                    <small>İhtiyaç: {quantityText(item)}</small>
                  </div>
                  <div className="shopping-package">
                    <span>{item.packages} × {item.packageLabel}</span>
                    <strong>{money(item.estimatedCost)} ₺</strong>
                  </div>
                  <div className={`reuse-badge ${item.usedInMeals >= 2 ? 'is-reused' : ''}`}>{item.usedInMeals >= 2 ? `♻️ ${item.usedInMeals} öğünde` : '1 öğünde'}</div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="shopping-demo-note"><span>ℹ️</span><p><strong>Şimdilik demo fiyat.</strong> Bir sonraki veri fazında bu paketlerin yanına gerçek market, güncel fiyat, mesafe ve “en ucuz sepet” seçeneğini bağlayacağız.</p></div>
    </section>
  )
}
