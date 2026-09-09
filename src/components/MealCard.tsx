import type { MealSuggestion } from '../types'

type MealCardProps = { meal: MealSuggestion }

export function MealCard({ meal }: MealCardProps) {
  return (
    <article className="meal-card">
      <div className="meal-art" aria-hidden="true"><span>{meal.emoji}</span></div>
      <div className="meal-content">
        <div className="meal-topline">
          <span className={`source-badge ${meal.source === 'Ev' ? 'home' : 'restaurant'}`}>{meal.source}</span>
          <span className="tag-badge">{meal.tag}</span>
        </div>
        <h3>{meal.title}</h3>
        <p>{meal.subtitle}</p>
        <div className="meal-stats"><span>🔥 {meal.calories} kcal</span><span>💪 {meal.protein}g protein</span></div>
        <div className="meal-footer"><strong>{meal.price} ₺</strong><button type="button">Detayları gör</button></div>
      </div>
    </article>
  )
}
