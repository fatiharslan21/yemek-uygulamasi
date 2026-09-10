import { useMemo, useState } from 'react'
import { getMealAlternatives } from '../services/mealAlternatives'
import { loadPantry } from '../services/pantryStorage'
import { replaceMealInStoredPlan } from '../services/sessionPlanActions'
import type { PlannedMeal, Recipe, UserPlanProfile } from '../types'
import '../daily-companion.css'

type RescueMode = 'quick' | 'budget' | 'pantry' | 'outside'

const MODES: Array<{ id: RescueMode; label: string; emoji: string }> = [
  { id: 'quick', label: '15 dakikam var', emoji: '⚡' },
  { id: 'budget', label: 'Bütçeyi koru', emoji: '💸' },
  { id: 'pantry', label: 'Dolaptakilerle', emoji: '🧺' },
  { id: 'outside', label: 'Dışarıdayım', emoji: '📍' },
]

function pantryCoverage(recipe: Recipe) {
  const pantry = loadPantry()
  if (!recipe.ingredients.length) return 0
  const ratios = recipe.ingredients.map((item) => Math.min(1, (pantry[item.ingredientId] ?? 0) / Math.max(1, item.quantity)))
  return ratios.reduce((sum, value) => sum + value, 0) / ratios.length
}

function choose(mode: RescueMode, alternatives: Recipe[]) {
  if (mode === 'outside') return alternatives.find((recipe) => recipe.source === 'Dışarı') ?? alternatives.find((recipe) => recipe.source === 'Sipariş')
  if (mode === 'budget') return [...alternatives].sort((a, b) => a.estimatedPrice - b.estimatedPrice)[0]
  if (mode === 'pantry') return [...alternatives].filter((recipe) => recipe.source === 'Evde').sort((a, b) => pantryCoverage(b) - pantryCoverage(a) || a.estimatedPrice - b.estimatedPrice)[0]
  const words = ['15 dakika', 'hızlı', 'pratik', '5 dakika', 'az bulaşık', 'tek tava', 'tek tencere', 'airfryer']
  return alternatives.find((recipe) => recipe.source === 'Evde' && recipe.tags.some((tag) => words.some((word) => tag.toLocaleLowerCase('tr-TR').includes(word))))
    ?? alternatives.find((recipe) => recipe.source === 'Sipariş')
    ?? alternatives[0]
}

export function QuickRescueCard({ profile, meal, planStartedAt, dayIndex, mealIndex }: { profile: UserPlanProfile; meal?: PlannedMeal; planStartedAt: string; dayIndex: number; mealIndex: number }) {
  const [mode, setMode] = useState<RescueMode | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const alternatives = useMemo(() => meal ? getMealAlternatives(meal, profile, 48) : [], [meal, profile])
  const suggestion = mode ? choose(mode, alternatives) : undefined

  if (!meal) return null

  const apply = () => {
    if (!suggestion) return
    const okay = replaceMealInStoredPlan(profile, planStartedAt, dayIndex, mealIndex, suggestion)
    if (!okay) {
      setMessage('Aktif plan güncellenemedi. Sayfayı yenileyip tekrar dene.')
      return
    }
    window.location.reload()
  }

  return (
    <section className="daily-mini-card rescue-card">
      <div className="daily-mini-head"><div><span>🛟</span><div><small>Günü kurtar</small><h3>Sıradaki öğün planına uymadı mı?</h3></div></div></div>
      <div className="rescue-mode-row">{MODES.map((item) => <button type="button" key={item.id} className={mode === item.id ? 'active' : ''} onClick={() => { setMode(item.id); setMessage(null) }}><span>{item.emoji}</span>{item.label}</button>)}</div>
      {mode && suggestion && <div className="rescue-suggestion"><span>{suggestion.emoji}</span><div><small>{MODES.find((item) => item.id === mode)?.label}</small><strong>{suggestion.title}</strong><p>{suggestion.calories} kcal • {suggestion.protein} g protein • ≈ {Math.round(suggestion.estimatedPrice * profile.people)} ₺ • {suggestion.source}</p></div><button type="button" onClick={apply}>Bunu yap</button></div>}
      {mode && !suggestion && <p className="rescue-empty">Bu koşula uyan güvenli bir alternatif bulamadım; diğer seçeneği deneyebilirsin.</p>}
      {message && <p className="rhythm-message" role="status">{message}</p>}
    </section>
  )
}
