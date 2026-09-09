import { loadFavoriteRecipeIds } from '../services/favoritesStorage'
import { generatePersonalizedPlan } from './personalizedPlan'
import type { UserPlanProfile } from '../types'

export { calculateNutritionTargets } from './basePlanEngine'

export function generateWeeklyPlan(profile: UserPlanProfile, seed = 1) {
  return generatePersonalizedPlan(profile, seed, loadFavoriteRecipeIds())
}
