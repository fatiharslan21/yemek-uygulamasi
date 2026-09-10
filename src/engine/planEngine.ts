import { loadAppPreferences } from '../services/appPreferences'
import { profileForCatalogSafety } from '../services/catalogSafety'
import { loadFavoriteRecipeIds } from '../services/favoritesStorage'
import { calculateNutritionTargets } from '../services/nutritionTargets'
import { generatePersonalizedPlan } from './personalizedPlan'
import { generateWeeklyPlan as generateBaseWeeklyPlan } from './basePlanEngine'
import type { UserPlanProfile } from '../types'

export { calculateNutritionTargets } from '../services/nutritionTargets'

export function generateWeeklyPlan(profile: UserPlanProfile, seed = 1) {
  const safeProfile = profileForCatalogSafety(profile)
  const preferences = loadAppPreferences()
  const plan = preferences.favoriteBiasEnabled
    ? generatePersonalizedPlan(safeProfile, seed, loadFavoriteRecipeIds())
    : generateBaseWeeklyPlan(safeProfile, seed)

  return {
    ...plan,
    nutritionTargets: calculateNutritionTargets(safeProfile),
  }
}
