import { markets, suggestions } from '../data/mock'
import type { PlannerState } from '../types'
import { MealCard } from './MealCard'

type PlanPreviewProps = {
  state: PlannerState
  generated: boolean
}

export function PlanPreview({ state, generated }: PlanPreviewProps) {
  const dailyBudget = Math.max(1, Math.round(state.budget / state.days))
  const safeBudget = Math.max(1, state.budget || 1)
  const estimated = Math.min(safeBudget, state.days * 188)
  const left = Math.max(0, safeBudget - estimated)

  return (
    <section className={`preview-section ${generated ? 'is-generated' : ''}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">🧠 Akıllı önizleme</span>
          <h2>Planın şimdiden şekilleniyor</h2>
          <p>{state.location || 'Konum seçilmedi'} • {state.days} gün • {state.diet} • {state.goal}</p>
        </div>
        <div className="budget-orb"><small>Günlük hedef</small><strong>{dailyBudget} ₺</strong></div>
      </div>

      <div className="summary-grid">
        <article className="summary-card coral"><span className="summary-icon">💰</span><div><small>Tahmini harcama</small><strong>{estimated.toLocaleString('tr-TR')} ₺</strong></div><span className="summary-note">Bütçenin %{Math.round((estimated / safeBudget) * 100)}</span></article>
        <article className="summary-card mint"><span className="summary-icon">🪙</span><div><small>Kalan esneklik</small><strong>{left.toLocaleString('tr-TR')} ₺</strong></div><span className="summary-note">Sürpriz öğün payı</span></article>
        <article className="summary-card lilac"><span className="summary-icon">⚖️</span><div><small>Plan modu</small><strong>{state.mode}</strong></div><span className="summary-note">Esnek değiştirilebilir</span></article>
      </div>

      <div className="content-grid">
        <div>
          <div className="subheading-row"><div><span className="eyebrow">🍽️ Bugünden örnekler</span><h2>Sana uygun öğünler</h2></div><button className="ghost-button" type="button">Tüm haftayı gör →</button></div>
          <div className="meal-list">{suggestions.map((meal) => <MealCard key={meal.id} meal={meal} />)}</div>
        </div>

        <aside className="market-panel glass-panel">
          <div className="market-map-art" aria-hidden="true"><div className="map-dot dot-one">🛒</div><div className="map-dot dot-two">🥬</div><div className="map-dot dot-three">🥕</div><div className="you-dot">📍</div></div>
          <div className="market-panel-content">
            <span className="eyebrow">🗺️ Çevrendeki marketler</span>
            <h3>Alışverişi nereden yapalım?</h3>
            <p>Gerçek konum ve fiyat verisi API katmanında bağlanacak.</p>
            <div className="market-list">{markets.map((market) => <div className="market-row" key={market.name}><span className="market-logo">{market.emoji}</span><div><strong>{market.name}</strong><small>{market.distance}</small></div><span>{market.estimate}</span></div>)}</div>
          </div>
        </aside>
      </div>
    </section>
  )
}
