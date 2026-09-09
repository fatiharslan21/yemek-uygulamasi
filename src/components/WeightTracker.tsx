import { useMemo, useState } from 'react'
import { addWeightEntry, loadWeightHistory, removeWeightEntry, type WeightEntry } from '../services/weightTrackingStorage'
import '../weight-tracker.css'

function todayKey() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
}

export function WeightTracker({ startingWeight }: { startingWeight: number }) {
  const [entries, setEntries] = useState<WeightEntry[]>(() => loadWeightHistory())
  const [date, setDate] = useState(todayKey())
  const [weight, setWeight] = useState(String(entries.length ? entries[entries.length - 1].weight : startingWeight))
  const parsedWeight = Number(weight.replace(',', '.'))

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    const first = entries[0]
    const last = entries[entries.length - 1]
    return { first, last, change: Number((last.weight - first.weight).toFixed(1)) }
  }, [entries])

  const points = useMemo(() => {
    const visible = entries.slice(-12)
    if (visible.length === 0) return ''
    const values = visible.map((item) => item.weight)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = Math.max(1, max - min)
    return visible.map((item, index) => {
      const x = visible.length === 1 ? 50 : (index / (visible.length - 1)) * 100
      const y = 90 - ((item.weight - min) / span) * 70
      return `${x},${y}`
    }).join(' ')
  }, [entries])

  const save = () => {
    if (!date || !Number.isFinite(parsedWeight) || parsedWeight < 30 || parsedWeight > 300) return
    setEntries(addWeightEntry(date, Math.round(parsedWeight * 10) / 10))
  }

  return (
    <section className="profile-section shell weight-tracker-card">
      <div className="profile-section-head"><div><span>⚖️</span><div><small>İlerleme</small><h2>Kilo takibi</h2><p>Tartıldığın günleri kaydet. Kayıtlar bu cihazda saklanır ve mevcut haftalık planı otomatik değiştirmez.</p></div></div>{stats && <b>{stats.last.weight.toFixed(1)} kg</b>}</div>

      <div className="weight-entry-form">
        <label><span>Tarih</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label><span>Kilo</span><div><input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} /><b>kg</b></div></label>
        <button type="button" onClick={save}>+ Kaydet</button>
      </div>

      {stats ? (
        <>
          <div className="weight-stats-row"><span><small>İlk kayıt</small><strong>{stats.first.weight.toFixed(1)} kg</strong></span><span><small>Son kayıt</small><strong>{stats.last.weight.toFixed(1)} kg</strong></span><span className={stats.change <= 0 ? 'good' : ''}><small>Değişim</small><strong>{stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)} kg</strong></span></div>
          <div className="weight-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Kilo trendi"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg></div>
          <div className="weight-history-list">{[...entries].reverse().slice(0, 8).map((entry) => <div key={entry.id}><span>{formatDate(entry.date)}</span><strong>{entry.weight.toFixed(1)} kg</strong><button type="button" onClick={() => setEntries(removeWeightEntry(entry.id))} aria-label="Kilo kaydını sil">×</button></div>)}</div>
        </>
      ) : <div className="profile-empty">⚖️ İlk tartımını eklediğinde trend burada oluşacak.</div>}

      <div className="weight-plan-note">💡 Plan hesabındaki kilo değerini değiştirmek istersen “Tercihleri düzenle” bölümünden güncelle. Böylece yeni menüyü görüp onayladıktan sonra hedefler yeniden hesaplanır.</div>
    </section>
  )
}
