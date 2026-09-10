import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { recipePassesCatalogSafety } from './catalogSafety'
import { recipeSupportsEquipment } from './cookingCompatibility'
import type { PlannedMeal, Recipe, UserPlanProfile } from '../types'

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
}

function matchesProfile(recipe: Recipe, profile: UserPlanProfile) {
  if (!recipe.allowedDiets.includes(profile.diet)) return false
  if (!recipeSupportsEquipment(recipe, profile.cookingEquipment)) return false
  if (!recipePassesCatalogSafety(recipe, profile)) return false

  const selectedAllergies = new Set(profile.allergies.map(normalize))
  if (recipe.allergens.some((allergen) => selectedAllergies.has(normalize(allergen)))) return false

  const dislikeTokens = profile.dislikes
    .split(/[,;\n]/)
    .map(normalize)
    .filter((token) => token.length >= 2)
  if (!dislikeTokens.length) return true

  const searchable = normalize([
    recipe.title,
    recipe.subtitle,
    ...recipe.tags,
    ...recipe.ingredients.map((item) => INGREDIENT_BY_ID[item.ingredientId]?.name ?? ''),
  ].join(' '))

  return !dislikeTokens.some((token) => searchable.includes(token))
}

function score(recipe: Recipe, current: PlannedMeal, profile: UserPlanProfile) {
  const calorieGap = Math.abs(recipe.calories - current.calories) / Math.max(1, current.calories)
  const proteinGap = Math.abs(recipe.protein - current.protein) / Math.max(1, current.protein)
  const price = recipe.estimatedPrice * profile.people
  const priceGap = Math.abs(price - current.estimatedPrice) / Math.max(1, current.estimatedPrice)
  const sourcePenalty = recipe.source === current.source ? 0 : 0.55
  const overlap = recipe.tags.filter((tag) => current.tags.includes(tag)).length
  return calorieGap * .55 + proteinGap * .65 + priceGap * .4 + sourcePenalty - overlap * .08
}

export function getMealAlternatives(current: PlannedMeal, profile: UserPlanProfile, limit = 12) {
  return RECIPE_CATALOG
    .filter((recipe) => recipe.id !== current.recipeId)
    .filter((recipe) => recipe.mealSlots.includes(current.slot))
    .filter((recipe) => matchesProfile(recipe, profile))
    .sort((left, right) => score(left, current, profile) - score(right, current, profile))
    .slice(0, limit)
}
