import { rebuildEditedPlan } from '../engine/planEditor'
import { loadPlanSession, savePlanSession } from './planSessionStorage'
import type { Recipe, UserPlanProfile } from '../types'

export function replaceMealInStoredPlan(
  profile: UserPlanProfile,
  startedAt: string,
  dayIndex: number,
  mealIndex: number,
  recipe: Recipe,
) {
  const session = loadPlanSession(profile)
  if (!session || session.startedAt !== startedAt) return false
  const current = session.plan.days[dayIndex]?.meals[mealIndex]
  if (!current) return false

  const days = session.plan.days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
  days[dayIndex].meals[mealIndex] = {
    id: `${dayIndex}-${mealIndex}-${recipe.id}-quick-${Date.now()}`,
    recipeId: recipe.id,
    slot: current.slot,
    title: recipe.title,
    subtitle: recipe.subtitle,
    emoji: recipe.emoji,
    source: recipe.source,
    calories: recipe.calories,
    protein: recipe.protein,
    estimatedPrice: recipe.estimatedPrice * profile.people,
    tags: [...recipe.tags, 'günlük uyarlama'],
  }

  const nextPlan = rebuildEditedPlan(profile, days, {
    adjustedForBudget: session.plan.adjustedForBudget,
    convertedOutsideMeals: session.plan.convertedOutsideMeals,
  })
  const mealStatuses = { ...session.mealStatuses }
  delete mealStatuses[current.id]
  savePlanSession(profile, nextPlan, session.lockedMealKeys, mealStatuses, session.seed, session.swapSeed + 1, session.tab, session.startedAt)
  return true
}
