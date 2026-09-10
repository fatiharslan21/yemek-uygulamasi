import { useMemo, useState } from 'react'
import { formatPlanDate } from '../services/planCalendar'
import { applyWeekRhythm, loadWeekRhythm, saveWeekRhythm, type RhythmMode, type RhythmSlot, type WeekRhythmEntry } from '../services/weekRhythm'
import type { UserPlanProfile, WeeklyPlan } from '../types'
import '../daily-companion.css'

const MODES: Array<{ value: RhythmMode; emoji: string; label: string; detail: string }> = [
  { value: 'outside', emoji: '🍽️', label: 'Dışarıdayım', detail: 'Bu öğünü dışarı seçeneğine çevir.' },
  { value: 'quick', emoji: '⚡', label: 'Vaktim yok', detail: 'Hızlı ev yemeği veya sipariş seç.' },
  { value: 'home', emoji: '🏠', label: 'Evdeyim', detail: 'Bu öğünü ev yemeği yap.' },
  { value: 'office', emoji: '🏢', label: 'Yemek hazır', detail: 'Ofis/okul/davet öğününü market listesinden çıkar.' },
]

export function WeekRhythmPanel({ profile, plan, planStartedAt }: { profile: UserPlanProfile; plan: WeeklyPlan; planStartedAt: string }) {
  const [expanded, setExpanded] = useState(false)
  const [entries, setEntries] = useState<WeekRhythmEntry[]>(() => loadWeekRhythm(planStartedAt))
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState<RhythmSlot>('Akşam')
  const [mode, setMode] = useState<RhythmMode>('outside')
  const [message, setMessage] = useState<string | null>(null)

  const dayOptions = useMemo(() => plan.days.map((day) => ({ value: day.index, label: formatPlanDate(planStartedAt, day.index, true) })), [plan.days, planStartedAt])

  const addOrReplace = () => {
    const next = [...entries.filter((entry) => !(entry.dayIndex === dayIndex && entry.slot === slot)), { dayIndex, slot, mode }]
      .sort((a, b) => a.dayIndex - b.dayIndex || a.slot.localeCompare(b.slot, 'tr'))
    setEntries(next)
    saveWeekRhythm(planStartedAt, next)
    setMessage('Hafta ritmine eklendi. Planı güncelle dediğinde uygulanacak.')
  }

  const remove = (target: WeekRhythmEntry) => {
    const next = entries.filter((entry) => !(entry.dayIndex === target.dayIndex && entry.slot === target.slot))
    setEntries(next)
    saveWeekRhythm(planStartedAt, next)
  }

  const apply = () => {
    const okay = applyWeekRhythm(profile, planStartedAt, entries)
    if (!okay) {
      setMessage('Aktif plan oturumu bulunamadı. Sayfayı yenileyip tekrar dene.')
      return
    }
    window.location.reload()
  }

  return (
    <section className="daily-mini-card rhythm-card">
      <div className="daily-mini-head">
        <div><span>🗓️</span><div><small>Hafta ritmi</small><h3>{entries.length ? `${entries.length} özel durum planlandı` : 'Haftanı gerçek hayatına uydur'}</h3></div></div>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? 'Kapat' : 'Düzenle'}</button>
      </div>
      {!expanded ? <p className="rhythm-summary">Dışarıda olacağın, zamanın olmayacağı veya yemeğin hazır olduğu öğünleri işaretle; Lokma planı ve sepeti buna göre düzenlesin.</p> : (
        <div className="rhythm-editor">
          <div className="rhythm-select-grid">
            <label><span>Gün</span><select value={dayIndex} onChange={(event) => setDayIndex(Number(event.target.value))}>{dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
            <label><span>Öğün</span><select value={slot} onChange={(event) => setSlot(event.target.value as RhythmSlot)}><option value="Öğle">Öğle</option><option value="Akşam">Akşam</option></select></label>
          </div>
          <div className="rhythm-mode-grid">{MODES.map((item) => <button type="button" key={item.value} className={mode === item.value ? 'active' : ''} onClick={() => setMode(item.value)}><span>{item.emoji}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></button>)}</div>
          <button type="button" className="rhythm-add" onClick={addOrReplace}>＋ Bu durumu ekle</button>
          {entries.length > 0 && <div className="rhythm-entry-list">{entries.map((entry) => { const meta = MODES.find((item) => item.value === entry.mode); return <div key={`${entry.dayIndex}-${entry.slot}`}><span>{meta?.emoji}</span><div><strong>{formatPlanDate(planStartedAt, entry.dayIndex, true)} • {entry.slot}</strong><small>{meta?.label}</small></div><button type="button" onClick={() => remove(entry)} aria-label="Özel durumu kaldır">×</button></div> })}</div>}
          {entries.length > 0 && <button type="button" className="rhythm-apply" onClick={apply}>✨ Bu ritmi haftama uygula</button>}
          {message && <p className="rhythm-message" role="status">{message}</p>}
        </div>
      )}
    </section>
  )
}
