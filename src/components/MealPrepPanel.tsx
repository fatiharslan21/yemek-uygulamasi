import { useMemo, useState } from 'react'
import { buildMealPrepTasks, mealPrepSummary } from '../services/mealPrep'
import type { UserPlanProfile, WeeklyPlan } from '../types'
import '../meal-prep.css'

type MealPrepPanelProps = {
  plan: WeeklyPlan
  profile: UserPlanProfile
  startIndex: number
}

function quantityText(value: number, unit: 'g' | 'ml' | 'adet') {
  if (unit === 'g' && value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')} kg`
  if (unit === 'ml' && value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')} L`
  return `${Math.round(value)} ${unit}`
}

export function MealPrepPanel({ plan, profile, startIndex }: MealPrepPanelProps) {
  const tasks = useMemo(() => buildMealPrepTasks(plan, profile, startIndex, 3), [plan, profile, startIndex])
  const summary = useMemo(() => mealPrepSummary(tasks), [tasks])
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set())

  if (tasks.length === 0) return null

  const completed = tasks.filter((task) => doneIds.has(task.id)).length
  const progress = Math.round(completed / Math.max(1, tasks.length) * 100)

  const toggleDone = (id: string) => {
    setDoneIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="meal-prep-panel">
      <header className="meal-prep-head">
        <div>
          <span className="eyebrow">🔪 3 günlük meal prep</span>
          <h2>Biraz şimdi hazırla, sonra rahat et.</h2>
          <p>Önündeki üç günde tekrar kullanılacak malzemeleri topluyoruz. Amaç bütün haftayı pazar günü pişirmek değil; tekrar eden işi azaltmak.</p>
        </div>
        <div className="meal-prep-score"><strong>≈ {summary.totalMinutes} dk</strong><small>{summary.coveredMeals} öğünü rahatlatır</small></div>
      </header>

      <div className="meal-prep-progress"><div><i style={{ width: `${progress}%` }} /></div><span>{completed}/{tasks.length}</span></div>

      <div className="meal-prep-list">
        {tasks.map((task) => {
          const done = doneIds.has(task.id)
          return (
            <article key={task.id} className={done ? 'done' : ''}>
              <button type="button" className="meal-prep-check" onClick={() => toggleDone(task.id)}>{done ? '✓' : ''}</button>
              <span className="meal-prep-emoji">{task.emoji}</span>
              <div className="meal-prep-copy">
                <strong>{task.title}</strong>
                <p>{task.detail}</p>
                <div><span>⚖️ {quantityText(task.quantity, task.unit)}</span><span>⏱️ ≈ {task.minutes} dk</span>{task.equipment && <span>👨‍🍳 {task.equipment}</span>}</div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="meal-prep-footnote">💡 Hazırlık süreleri yaklaşık değerlerdir. Çiğ proteinlerde gıda güvenliği ve soğuk zincir kurallarına uygun saklama gerekir.</div>
    </section>
  )
}
