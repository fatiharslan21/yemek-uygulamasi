import { loadAppPreferences } from '../services/appPreferences'
import { loadFavoriteRecipeIds } from '../services/favoritesStorage'
import { generatePersonalizedPlan } from './personalizedPlan'
import { generateWeeklyPlan as generateBaseWeeklyPlan } from './basePlanEngine'
import type { UserPlanProfile } from '../types'

export { calculateNutritionTargets } from './basePlanEngine'

export function generateWeeklyPlan(profile: UserPlanProfile, seed = 1) {
  const preferences = loadAppPreferences()
  if (!preferences.favoriteBiasEnabled) return generateBaseWeeklyPlan(profile, seed)
  return generatePersonalizedPlan(profile, seed, loadFavoriteRecipeIds())
}
