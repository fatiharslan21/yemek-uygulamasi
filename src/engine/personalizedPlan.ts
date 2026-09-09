import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { recipeSupportsEquipment } from '../services/cookingCompatibility'
import { generateWeeklyPlan } from './planEngine'
import { rebuildEditedPlan, swapMealInEditedPlan } from './planEditor'
import type { PlannedMeal, Recipe, UserPlanProfile, WeeklyPlan } from '../types'

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
}

function recipeMatchesProfile(recipe: Recipe, profile: UserPlanProfile) {
  if (!recipe.allowedDiets.includes(profile.diet)) return false
  if (!recipeSupportsEquipment(recipe, profile.cookingEquipment)) return false

  const selectedAllergies = new Set(profile.allergies.map(normalize))
  if (recipe.allergens.some((allergen) => selectedAllergies.has(normalize(allergen)))) return false

  const dislikeTokens = profile.dislikes
    .split(/[,;\n]/)
    .map(normalize)
    .filter((token) => token.length >= 2)

  if (dislikeTokens.length === 0) return true

  const searchable = normalize([
    recipe.title,
    recipe.subtitle,
    ...recipe.tags,
    ...recipe.ingredients.map((item) => INGREDIENT_BY_ID[item.ingredientId]?.name ?? ''),
  ].join(' '))

  return !dislikeTokens.some((token) => searchable.includes(token))
}

function compatibleFavoriteScore(recipe: Recipe, meal: PlannedMeal, profile: UserPlanProfile) {
  const calorieGap = Math.abs(recipe.calories - meal.calories) / Math.max(1, meal.calories)
  const proteinGap = Math.abs(recipe.protein - meal.protein) / Math.max(1, meal.protein)
  const nextPrice = recipe.estimatedPrice * profile.people
  const priceGap = Math.abs(nextPrice - meal.estimatedPrice) / Math.max(1, meal.estimatedPrice)
  const sourcePenalty = recipe.source === meal.source ? 0 : 0.35
  return (calorieGap * 0.55) + (proteinGap * 0.65) + (priceGap * 0.5) + sourcePenalty
}

function mealFromRecipe(recipe: Recipe, meal: PlannedMeal, profile: UserPlanProfile, suffix: string): PlannedMeal {
  return {
    id: `${meal.id}-${recipe.id}-${suffix}`,
    recipeId: recipe.id,
    slot: meal.slot,
    title: recipe.title,
    subtitle: recipe.subtitle,
    emoji: recipe.emoji,
    source: recipe.source,
    calories: recipe.calories,
    protein: recipe.protein,
    estimatedPrice: recipe.estimatedPrice * profile.people,
    tags: [...recipe.tags, 'favori dokunuşu'],
  }
}

export function applyFavoriteBias(
  basePlan: WeeklyPlan,
  profile: UserPlanProfile,
  favoriteRecipeIds: Set<string>,
  seed = 1,
) {
  if (favoriteRecipeIds.size === 0) return basePlan

  const favoriteRecipes = RECIPE_CATALOG.filter((recipe) => favoriteRecipeIds.has(recipe.id) && recipeMatchesProfile(recipe, profile))
  if (favoriteRecipes.length === 0) return basePlan

  let currentPlan = basePlan
  const desiredFavoriteSlots = Math.min(
    Math.max(1, Math.ceil(profile.days / 3)),
    favoriteRecipes.length + 1,
  )
  let inserted = currentPlan.days.flatMap((day) => day.meals).filter((meal) => favoriteRecipeIds.has(meal.recipeId)).length

  const positions = currentPlan.days
    .flatMap((day, dayIndex) => day.meals.map((meal, mealIndex) => ({ dayIndex, mealIndex, meal })))
    .filter(({ meal }) => !favoriteRecipeIds.has(meal.recipeId))
    .sort((a, b) => ((a.dayIndex * 17 + a.mealIndex * 7 + seed) % 23) - ((b.dayIndex * 17 + b.mealIndex * 7 + seed) % 23))

  for (const position of positions) {
    if (inserted >= desiredFavoriteSlots) break

    const candidates = favoriteRecipes
      .filter((recipe) => recipe.mealSlots.includes(position.meal.slot))
      .sort((a, b) => compatibleFavoriteScore(a, position.meal, profile) - compatibleFavoriteScore(b, position.meal, profile))

    const recipe = candidates[0]
    if (!recipe) continue

    const days = currentPlan.days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
    days[position.dayIndex].meals[position.mealIndex] = mealFromRecipe(recipe, position.meal, profile, `fav-${seed}`)
    const candidatePlan = rebuildEditedPlan(profile, days, {
      adjustedForBudget: currentPlan.adjustedForBudget,
      convertedOutsideMeals: currentPlan.convertedOutsideMeals,
    })

    const budgetTolerance = Math.max(profile.budget, currentPlan.totalCost) * 1.03
    if (candidatePlan.totalCost <= budgetTolerance) {
      currentPlan = candidatePlan
      inserted += 1
    }
  }

  return currentPlan
}

export function generatePersonalizedPlan(
  profile: UserPlanProfile,
  seed = 1,
  favoriteRecipeIds: Set<string> = new Set(),
) {
  return applyFavoriteBias(generateWeeklyPlan(profile, seed), profile, favoriteRecipeIds, seed)
}

export function swapMealWithPreference(
  plan: WeeklyPlan,
  profile: UserPlanProfile,
  dayIndex: number,
  mealIndex: number,
  seed: number,
  favoriteRecipeIds: Set<string>,
) {
  const currentMeal = plan.days[dayIndex]?.meals[mealIndex]
  if (!currentMeal) return plan

  const favoriteCandidates = RECIPE_CATALOG
    .filter((recipe) => favoriteRecipeIds.has(recipe.id))
    .filter((recipe) => recipe.id !== currentMeal.recipeId)
    .filter((recipe) => recipe.mealSlots.includes(currentMeal.slot))
    .filter((recipe) => recipeMatchesProfile(recipe, profile))
    .sort((a, b) => compatibleFavoriteScore(a, currentMeal, profile) - compatibleFavoriteScore(b, currentMeal, profile))

  // Her değişimde favoriyi zorlamıyoruz. Yaklaşık her üç değişimden birinde uygun favori varsa öne alıyoruz.
  if (favoriteCandidates.length > 0 && Math.abs(seed) % 3 === 0) {
    const recipe = favoriteCandidates[Math.abs(seed) % Math.min(2, favoriteCandidates.length)]
    const days = plan.days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
    days[dayIndex].meals[mealIndex] = mealFromRecipe(recipe, currentMeal, profile, `swap-fav-${seed}`)
    return rebuildEditedPlan(profile, days, {
      adjustedForBudget: plan.adjustedForBudget,
      convertedOutsideMeals: plan.convertedOutsideMeals,
    })
  }

  return swapMealInEditedPlan(plan, profile, dayIndex, mealIndex, seed)
}
