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

function HistoryCard({ item }: { item: PlanHistoryEntry }) {
  const [open, setOpen] = useState(false)
  const sampleMeals = item.daySummaries.flatMap((day) => day.meals).slice(0, 6)

  return (
    <article className="history-card">
      <button type="button" className="history-card-main" onClick={() => setOpen((value) => !value)}>
        <div className="history-date-block"><span>📅</span><div><strong>{dateText(item.startedAt)}</strong><small>{item.profileSummary.days} gün • {item.profileSummary.diet} • {item.profileSummary.goal}</small></div></div>
        <div className="history-score"><strong>%{item.completionPct}</strong><small>takip</small></div>
        <span className="history-expand">{open ? '−' : '+'}</span>
      </button>

      <div className="history-stats">
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

  if (history.length === 0) {
    return (
      <section className="plan-history-panel shell">
        <div className="history-heading"><span>🕰️</span><div><small>Geçmiş planlar</small><h2>İlk plan döngün bitince burada göreceksin.</h2><p>Yeni plan başlatıldığında önceki plan otomatik arşivlenir.</p></div></div>
      </section>
    )
  }

  return (
    <section className="plan-history-panel shell">
      <div className="history-heading-row">
        <div className="history-heading"><span>🕰️</span><div><small>Geçmiş planlar</small><h2>Lokma geçmişin</h2><p>Son {history.length} plan döngüsünün yerel özeti.</p></div></div>
        <button type="button" onClick={() => { clearPlanHistory(); setRevision((value) => value + 1) }}>Geçmişi temizle</button>
      </div>
      <div className="history-list">{history.map((item) => <HistoryCard key={item.id} item={item} />)}</div>
    </section>
  )
}
