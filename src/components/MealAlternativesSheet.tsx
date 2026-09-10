import { getMealAlternatives } from '../services/mealAlternatives'
import type { PlannedMeal, Recipe, UserPlanProfile } from '../types'
import '../meal-alternatives.css'

type Props = {
  meal: PlannedMeal
  profile: UserPlanProfile
  onClose: () => void
  onSelect: (recipe: Recipe) => void
}

function money(value: number) {
  return Math.round(value).toLocaleString('tr-TR')
}

function sourceEmoji(source: Recipe['source']) {
  if (source === 'Evde') return '🏠'
  if (source === 'Sipariş') return '🛵'
  return '🍽️'
}

export function MealAlternativesSheet({ meal, profile, onClose, onSelect }: Props) {
  const options = getMealAlternatives(meal, profile, 12)

  return (
    <div className="meal-options-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose()
    }}>
      <section className="meal-options-sheet" role="dialog" aria-modal="true" aria-labelledby="meal-options-title">
        <div className="meal-options-handle" aria-hidden="true" />
        <header className="meal-options-head">
          <div><span>✨ Alternatifler</span><h2 id="meal-options-title">{meal.slot} için başka ne yiyebilirsin?</h2><p>{meal.title} yerine tercihlerine, ekipmanına ve hassasiyetlerine uyan seçenekler.</p></div>
          <button type="button" onClick={onClose} aria-label="Alternatifleri kapat">×</button>
        </header>

        {options.length ? (
          <div className="meal-options-list">
            {options.map((recipe) => (
              <button className="meal-option-card" type="button" key={recipe.id} onClick={() => onSelect(recipe)}>
                <span className="meal-option-emoji" aria-hidden="true">{recipe.emoji}</span>
                <div className="meal-option-copy">
                  <small>{sourceEmoji(recipe.source)} {recipe.source}</small>
                  <strong>{recipe.title}</strong>
                  <p>{recipe.subtitle}</p>
                  <div><span>🔥 {recipe.calories} kcal</span><span>💪 {recipe.protein} g</span><span>💸 ≈ {money(recipe.estimatedPrice * profile.people)} ₺</span></div>
                </div>
                <b>Seç →</b>
              </button>
            ))}
          </div>
        ) : (
          <div className="meal-options-empty">Bu öğün için mevcut filtrelerinle başka seçenek bulunamadı. Tercihlerini biraz genişletmeyi deneyebilirsin.</div>
        )}
      </section>
    </div>
  )
}
