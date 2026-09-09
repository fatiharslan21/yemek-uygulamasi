import type { UserPlanProfile } from '../types'

type StarterPlanDashboardProps = {
  profile: UserPlanProfile
  onEdit: () => void
  onHome: () => void
}

const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

function mealSamples(profile: UserPlanProfile) {
  const vegan = profile.diet === 'Vegan'
  const vegetarian = profile.diet === 'Vejetaryen'
  return [
    {
      breakfast: vegan ? ['🥣', 'Yulaf, muz & fıstık ezmesi'] : ['🍳', 'Yumurta, peynir & tam tahıl'],
      lunch: vegan ? ['🥙', 'Nohutlu Akdeniz bowl'] : vegetarian ? ['🥙', 'Hellimli bulgur bowl'] : ['🍗', 'Tavuklu bulgur bowl'],
      dinner: vegan ? ['🍝', 'Sebzeli mercimek makarna'] : vegetarian ? ['🍕', 'Sebzeli ince pizza'] : ['🌯', 'Tavuk dürüm & ayran'],
    },
    {
      breakfast: vegan ? ['🍓', 'Meyveli chia kasesi'] : ['🥣', 'Yoğurt, yulaf & meyve'],
      lunch: vegan ? ['🍛', 'Yeşil mercimek & pilav'] : vegetarian ? ['🍲', 'Mercimek çorbası & salata'] : ['🥩', 'Izgara köfte & salata'],
      dinner: vegan ? ['🥗', 'Falafel salata'] : vegetarian ? ['🍜', 'Sebzeli noodle'] : ['🍜', 'Tavuklu noodle'],
    },
    {
      breakfast: vegan ? ['🥑', 'Avokadolu tost'] : ['🥪', 'Peynirli tost & domates'],
      lunch: vegan ? ['🌯', 'Fasulyeli dürüm'] : vegetarian ? ['🍝', 'Pesto makarna'] : ['🐟', 'Fırın balık & roka'],
      dinner: vegan ? ['🍲', 'Sebzeli güveç'] : vegetarian ? ['🥘', 'Sebzeli omlet'] : ['🍛', 'Etli nohut & pilav'],
    },
  ]
}

export function StarterPlanDashboard({ profile, onEdit, onHome }: StarterPlanDashboardProps) {
  const dailyBudget = Math.round(profile.budget / Math.max(1, profile.days))
  const plannedSpend = Math.round(profile.budget * 0.88)
  const marketBudget = Math.round(plannedSpend * (profile.mealSplit.home / 100))
  const outsideBudget = plannedSpend - marketBudget
  const samples = mealSamples(profile)

  return (
    <main className="dashboard-page">
      <nav className="topbar shell dashboard-nav">
        <button className="brand brand-button" type="button" onClick={onHome}><span className="brand-mark">🍋</span><span>lokma</span></button>
        <div className="nav-links"><button type="button" className="dashboard-nav-button">Haftam</button><button type="button" className="dashboard-nav-button muted">Alışveriş</button><button type="button" className="profile-pill" onClick={onEdit}>👤 {profile.name || 'Profil'} <span>⚙️</span></button></div>
      </nav>

      <section className="dashboard-hero shell">
        <div><span className="hero-badge">✨ İlk taslak planın hazır</span><h1>{profile.name ? `${profile.name}, ` : ''}bu hafta <em>ne yiyeceğin belli.</em></h1><p>{profile.days} günlük plan • {profile.diet} • {profile.goal} • {profile.neighborhood || profile.district || profile.city}</p></div>
        <button type="button" className="edit-plan-button" onClick={onEdit}>⚙️ Tercihleri düzenle</button>
      </section>

      <section className="plan-metrics shell">
        <article><span>💸 Haftalık bütçe</span><strong>{profile.budget.toLocaleString('tr-TR')} ₺</strong><small>Planlanan {plannedSpend.toLocaleString('tr-TR')} ₺</small><div className="metric-progress"><i style={{ width: `${Math.round(plannedSpend / profile.budget * 100)}%` }} /></div></article>
        <article><span>💚 Tahmini kalan</span><strong>{(profile.budget - plannedSpend).toLocaleString('tr-TR')} ₺</strong><small>Günlük ≈ {dailyBudget.toLocaleString('tr-TR')} ₺ bütçe</small></article>
        <article><span>🛒 Market payı</span><strong>{marketBudget.toLocaleString('tr-TR')} ₺</strong><small>Evde yapılacak öğünler için</small></article>
        <article><span>🛵 Dışarı / sipariş</span><strong>{outsideBudget.toLocaleString('tr-TR')} ₺</strong><small>Planlanan dışarı bütçesi</small></article>
      </section>

      <section className="week-section shell">
        <div className="section-title-row"><div><span className="eyebrow">📅 Haftanın taslağı</span><h2>İlk 3 günü böyle kurguladık</h2><p>Şimdilik demo yemek ve fiyatları kullanıyoruz; plan motoru sonraki adımda gerçek optimizasyona bağlanacak.</p></div><div className="view-switch"><button className="active" type="button">Günler</button><button type="button">Liste</button></div></div>
        <div className="day-grid">
          {samples.map((sample, index) => (
            <article className="day-card" key={dayNames[index]}>
              <div className="day-card-header"><div><span>0{index + 1}</span><h3>{dayNames[index]}</h3></div><b>{index === 0 ? 'Bugün gibi düşün' : index === 1 ? 'Dengeli gün' : 'Protein odaklı'}</b></div>
              {profile.breakfast && <MealRow label="Kahvaltı" meal={sample.breakfast} source="Evde" price={Math.round(dailyBudget * .16)} />}
              <MealRow label="Öğle" meal={sample.lunch} source={index === 1 && profile.mealSplit.delivery >= 30 ? 'Sipariş' : 'Evde'} price={Math.round(dailyBudget * .34)} />
              <MealRow label="Akşam" meal={sample.dinner} source={index === 0 && profile.mealSplit.delivery >= 15 ? 'Sipariş' : 'Evde'} price={Math.round(dailyBudget * .4)} />
              <div className="day-footer"><span>≈ {Math.round(dailyBudget * .9)} ₺</span><span>🔥 hedefe yakın</span><button type="button">Günü düzenle →</button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="shopping-preview shell">
        <div className="shopping-copy"><span className="step-kicker">♻️ Lokma farkı</span><h2>Bir malzemeyi bir kez al, haftada birkaç kez akıllıca kullan.</h2><p>Örneğin 1 kg tavuk aldıysan sadece pazartesi için değil; salı öğle ve perşembe akşamına da planlayacağız. Böylece bütçe ve israf birlikte azalacak.</p><div className="reuse-example"><span>🍗 1 kg tavuk</span><b>→</b><span>🥙 Bowl</span><b>→</b><span>🌯 Dürüm</span><b>→</b><span>🍝 Makarna</span></div></div>
        <div className="shopping-card"><div className="shopping-card-top"><span>🛒</span><div><strong>Akıllı alışveriş listesi</strong><small>Sonraki geliştirme</small></div></div><ul><li><span>🍗 Protein grubu</span><b>yeniden kullanım</b></li><li><span>🥬 Sebze & yeşillik</span><b>mevsim + fiyat</b></li><li><span>🍚 Temel kuru gıda</span><b>stok optimizasyonu</b></li><li><span>🥛 Kahvaltılık</span><b>porsiyon hesabı</b></li></ul><button type="button" disabled>Yakında alışveriş listesi →</button></div>
      </section>
    </main>
  )
}

type MealRowProps = {
  label: string
  meal: string[]
  source: string
  price: number
}

function MealRow({ label, meal, source, price }: MealRowProps) {
  return <div className="dashboard-meal-row"><span className="meal-time-label">{label}</span><div className="dashboard-meal-icon">{meal[0]}</div><div className="dashboard-meal-copy"><strong>{meal[1]}</strong><small>{source} • ≈ {price} ₺</small></div><button type="button" title="Öğün değiştirme sonraki sürümde">↻</button></div>
}
