import { useMemo, useState } from 'react'
import { clearPlanHistory, loadPlanHistory, type PlanHistoryEntry } from '../services/planHistoryStorage'
import '../plan-history.css'

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function dateText(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date)
}

function adherencePct(item: PlanHistoryEntry) {
  return Math.round(item.eatenMeals / Math.max(1, item.totalMeals) * 100)
}

function HistoryCard({ item }: { item: PlanHistoryEntry }) {
  const [open, setOpen] = useState(false)
  const sampleMeals = item.daySummaries.flatMap((day) => day.meals).slice(0, 6)
  const adherence = adherencePct(item)

  return (
    <article className="history-card">
      <button type="button" className="history-card-main" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <div className="history-date-block"><span aria-hidden="true">📅</span><div><strong>{dateText(item.startedAt)}</strong><small>{item.profileSummary.days} gün • {item.profileSummary.diet} • {item.profileSummary.goal}</small></div></div>
        <div className="history-score"><strong>%{adherence}</strong><small>uyum</small></div>
        <span className="history-expand" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>

      <div className="history-stats">
        <span>📝 %{item.completionPct} takip</span>
        <span>💸 {money(item.totalCost)} ₺</span>
        <span>🔥 {item.averageCalories} kcal</span>
        <span>💪 {item.averageProtein} g</span>
        <span>✅ {item.eatenMeals} yedim</span>
        <span>⏭ {item.skippedMeals} atladım</span>
      </div>

      {sampleMeals.length > 0 && <div className="history-meal-chips">{sampleMeals.map((meal, index) => <span key={`${meal}-${index}`}>{meal}</span>)}</div>}

      {open && (
        <div className="history-detail">
          <p>📍 {item.profileSummary.location || 'Konum kaydı yok'} • 👥 {item.profileSummary.people} kişi • haftalık limit {money(item.profileSummary.budget)} ₺</p>
          <div className="history-days">
            {item.daySummaries.map((day, index) => (
              <div key={`${day.name}-${index}`}><strong>{day.name}</strong><span>{day.meals.join(' • ')}</span></div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export function PlanHistoryPanel() {
  const [revision, setRevision] = useState(0)
  const history = useMemo(() => loadPlanHistory(), [revision])

  const insights = useMemo(() => {
    if (history.length === 0) return null
    const avgAdherence = Math.round(history.reduce((sum, item) => sum + adherencePct(item), 0) / history.length)
    const avgTracking = Math.round(history.reduce((sum, item) => sum + item.completionPct, 0) / history.length)
    const avgBudget = Math.round(history.reduce((sum, item) => sum + item.totalCost, 0) / history.length)
    const best = history.reduce((bestItem, item) => adherencePct(item) > adherencePct(bestItem) ? item : bestItem, history[0])
    const recent = history.slice(0, 8).reverse()
    let strongStreak = 0
    for (const item of history) {
      if (adherencePct(item) >= 70) strongStreak += 1
      else break
    }
    return { avgAdherence, avgTracking, avgBudget, best, recent, strongStreak }
  }, [history])

  if (history.length === 0) {
    return (
      <section className="plan-history-panel shell">
        <div className="history-heading"><span aria-hidden="true">🕰️</span><div><small>Geçmiş planlar</small><h2>İlk plan döngün bitince burada göreceksin.</h2><p>Yeni plan başlatıldığında önceki plan otomatik arşivlenir.</p></div></div>
      </section>
    )
  }

  return (
    <section className="plan-history-panel shell" aria-labelledby="plan-history-title">
      <div className="history-heading-row">
        <div className="history-heading"><span aria-hidden="true">🕰️</span><div><small>Geçmiş planlar</small><h2 id="plan-history-title">Lokma geçmişin</h2><p>Son {history.length} plan döngüsünün yerel özeti ve devamlılık görünümü.</p></div></div>
        <button type="button" onClick={() => { if (window.confirm('Geçmiş plan özetlerinin tamamı silinsin mi? Aktif planın etkilenmez.')) { clearPlanHistory(); setRevision((value) => value + 1) } }}>Geçmişi temizle</button>
      </div>

      {insights && (
        <div className="history-insights">
          <div className="history-insight-cards">
            <article><span>✓ Ortalama uyum</span><strong>%{insights.avgAdherence}</strong><small>yenilen / planlanan öğün</small></article>
            <article><span>📝 Ortalama takip</span><strong>%{insights.avgTracking}</strong><small>işaretlenen öğünler</small></article>
            <article><span>💸 Ortalama plan</span><strong>{money(insights.avgBudget)} ₺</strong><small>haftalık tahmin</small></article>
            <article><span>🔥 Güçlü seri</span><strong>{insights.strongStreak}</strong><small>%70+ uyumlu ardışık plan</small></article>
          </div>
          <div className="history-trend" aria-label={`Son ${insights.recent.length} planda uyum oranı grafiği`}>
            <div className="history-trend-head"><div><strong>Uyum trendin</strong><small>Son planlarda yediğin öğünlerin planlanana oranı</small></div><span>En iyi: %{adherencePct(insights.best)}</span></div>
            <div className="history-trend-bars">
              {insights.recent.map((item) => {
                const value = adherencePct(item)
                return <div className="history-trend-item" key={item.id} title={`${shortDate(item.startedAt)} • %${value}`}><div><i style={{ height: `${Math.max(5, value)}%` }} /></div><span>{shortDate(item.startedAt)}</span><b>%{value}</b></div>
              })}
            </div>
          </div>
        </div>
      )}

      <div className="history-list">{history.map((item) => <HistoryCard key={item.id} item={item} />)}</div>
    </section>
  )
}
