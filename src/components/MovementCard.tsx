import { useMemo, useState } from 'react'
import { loadCompletedMovement, movementSuggestions, saveCompletedMovement } from '../services/movementSuggestions'
import { localDateKey } from '../services/planCalendar'
import type { UserPlanProfile } from '../types'
import '../daily-companion.css'

export function MovementCard({ profile }: { profile: UserPlanProfile }) {
  const dateKey = localDateKey()
  const suggestions = useMemo(() => movementSuggestions(profile), [profile])
  const [completed, setCompleted] = useState<Set<string>>(() => loadCompletedMovement(dateKey))
  const [expanded, setExpanded] = useState(false)
  const primary = suggestions[0]

  const toggle = (id: string) => {
    setCompleted((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveCompletedMovement(dateKey, next)
      return next
    })
  }

  return (
    <section className="daily-mini-card movement-card" aria-label="Günlük hareket önerileri">
      <div className="daily-mini-head">
        <div><span>🏃</span><div><small>Bugünün hareketi</small><h3>{completed.has(primary.id) ? 'Hareket tamam ✓' : `${primary.minutes} dakikalık küçük mola`}</h3></div></div>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? 'Kapat' : 'Seçenekler'}</button>
      </div>
      {!expanded ? (
        <div className="movement-primary"><div><strong>{primary.emoji} {primary.title}</strong><p>{primary.description}</p></div><button type="button" className={completed.has(primary.id) ? 'done' : ''} onClick={() => toggle(primary.id)}>{completed.has(primary.id) ? '✓ Yaptım' : 'Yaptım'}</button></div>
      ) : (
        <div className="movement-options">
          {suggestions.map((item) => <button type="button" key={item.id} className={completed.has(item.id) ? 'done' : ''} onClick={() => toggle(item.id)}><span>{item.emoji}</span><div><strong>{item.title}</strong><small>{item.minutes} dk • {item.intensity}</small><p>{item.description}</p></div><b>{completed.has(item.id) ? '✓' : '○'}</b></button>)}
          <p className="movement-safety">Hareket önerileri genel amaçlıdır. Ağrı, baş dönmesi veya olağandışı rahatsızlık olursa bırak; sağlık durumuna uygun egzersiz için gerektiğinde bir sağlık profesyoneline danış.</p>
        </div>
      )}
    </section>
  )
}
