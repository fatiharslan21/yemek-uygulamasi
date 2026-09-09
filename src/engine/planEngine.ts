import { loadAppPreferences } from '../services/appPreferences'
import { profileForCatalogSafety } from '../services/catalogSafety'
import { loadFavoriteRecipeIds } from '../services/favoritesStorage'
import { generatePersonalizedPlan } from './personalizedPlan'
import { generateWeeklyPlan as generateBaseWeeklyPlan } from './basePlanEngine'
import type { UserPlanProfile } from '../types'

export { calculateNutritionTargets } from './basePlanEngine'

export function generateWeeklyPlan(profile: UserPlanProfile, seed = 1) {
  const safeProfile = profileForCatalogSafety(profile)
  const preferences = loadAppPreferences()
  if (!preferences.favoriteBiasEnabled) return generateBaseWeeklyPlan(safeProfile, seed)
  return generatePersonalizedPlan(safeProfile, seed, loadFavoriteRecipeIds())
}
