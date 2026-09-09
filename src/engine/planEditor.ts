import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { recipePassesCatalogSafety } from '../services/catalogSafety'
import { recipeSupportsEquipment } from '../services/cookingCompatibility'
import { calculateNutritionTargets } from './basePlanEngine'
import type { PlannedDay, PlannedMeal, Recipe, ShoppingListItem, UserPlanProfile, WeeklyPlan } from '../types'

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
}

function recipeMatchesProfile(recipe: Recipe, profile: UserPlanProfile) {
  if (!recipe.allowedDiets.includes(profile.diet)) return false
  if (!recipeSupportsEquipment(recipe, profile.cookingEquipment)) return false
  if (!recipePassesCatalogSafety(recipe, profile)) return false

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

function refreshDay(day: PlannedDay): PlannedDay {
  return {
    ...day,
    totalCalories: day.meals.reduce((sum, meal) => sum + meal.calories, 0),
    totalProtein: day.meals.reduce((sum, meal) => sum + meal.protein, 0),
    totalEstimatedPrice: day.meals.reduce((sum, meal) => sum + meal.estimatedPrice, 0),
  }
}

function buildShoppingList(days: PlannedDay[], profile: UserPlanProfile) {
  const totals = new Map<string, { quantity: number; uses: number }>()
  let naivePackageSpend = 0

  days.forEach((day) => {
    day.meals.forEach((meal) => {
      if (meal.source !== 'Evde') return
      const recipe = RECIPE_CATALOG.find((item) => item.id === meal.recipeId)
      if (!recipe) return

      recipe.ingredients.forEach((ingredientUse) => {
        const definition = INGREDIENT_BY_ID[ingredientUse.ingredientId]
        if (!definition) return
        const quantity = ingredientUse.quantity * profile.people
        const previous = totals.get(ingredientUse.ingredientId) ?? { quantity: 0, uses: 0 }
        totals.set(ingredientUse.ingredientId, {
          quantity: previous.quantity + quantity,
          uses: previous.uses + 1,
        })
        naivePackageSpend += Math.ceil(quantity / definition.packageSize) * definition.packagePrice
      })
    })
  })

  const shoppingList: ShoppingListItem[] = [...totals.entries()]
    .map(([ingredientId, total]) => {
      const definition = INGREDIENT_BY_ID[ingredientId]
      const packages = Math.max(1, Math.ceil(total.quantity / definition.packageSize))
      return {
        ingredientId,
        name: definition.name,
        emoji: definition.emoji,
        category: definition.category,
        requiredQuantity: Math.round(total.quantity),
        unit: definition.unit,
        packageSize: definition.packageSize,
        packageLabel: definition.packageLabel,
        packages,
        estimatedCost: packages * definition.packagePrice,
        usedInMeals: total.uses,
      }
    })
    .sort((left, right) => {
      if (left.usedInMeals !== right.usedInMeals) return right.usedInMeals - left.usedInMeals
      return right.estimatedCost - left.estimatedCost
    })

  const marketCost = shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0)
  const outsideCost = days.reduce(
    (sum, day) => sum + day.meals
      .filter((meal) => meal.source !== 'Evde')
      .reduce((mealSum, meal) => mealSum + meal.estimatedPrice, 0),
    0,
  )
  const estimatedWasteSaving = Math.round(Math.min(Math.max(0, naivePackageSpend - marketCost), marketCost * 0.28))

  return { shoppingList, marketCost, outsideCost, estimatedWasteSaving }
}

type RebuildOptions = {
  adjustedForBudget?: boolean
  convertedOutsideMeals?: number
}

export function rebuildEditedPlan(
  profile: UserPlanProfile,
  inputDays: PlannedDay[],
  options: RebuildOptions = {},
): WeeklyPlan {
  const days = inputDays.map((day) => refreshDay({
    ...day,
    meals: day.meals.map((meal) => ({ ...meal })),
  }))
  const { shoppingList, marketCost, outsideCost, estimatedWasteSaving } = buildShoppingList(days, profile)
  const totalCost = marketCost + outsideCost
  const nutritionTargets = calculateNutritionTargets(profile)
  const totalCalories = days.reduce((sum, day) => sum + day.totalCalories, 0)
  const totalProtein = days.reduce((sum, day) => sum + day.totalProtein, 0)
  const reusedIngredientCount = shoppingList.filter((item) => item.usedInMeals >= 2).length
  const reuseScore = shoppingList.length === 0 ? 0 : Math.round((reusedIngredientCount / shoppingList.length) * 100)

  return {
    days,
    shoppingList,
    nutritionTargets,
    averageCalories: Math.round(totalCalories / Math.max(1, days.length)),
    averageProtein: Math.round(totalProtein / Math.max(1, days.length)),
    marketCost,
    outsideCost,
    totalCost,
    remainingBudget: profile.budget - totalCost,
    budgetUsagePct: Math.round((totalCost / Math.max(1, profile.budget)) * 100),
    reuseScore,
    reusedIngredientCount,
    estimatedWasteSaving,
    adjustedForBudget: options.adjustedForBudget ?? false,
    convertedOutsideMeals: options.convertedOutsideMeals ?? 0,
  }
}

function alternativeScore(recipe: Recipe, currentMeal: PlannedMeal, profile: UserPlanProfile, plan: WeeklyPlan) {
  const calorieGap = Math.abs(recipe.calories - currentMeal.calories) / Math.max(1, currentMeal.calories)
  const proteinGap = Math.abs(recipe.protein - currentMeal.protein) / Math.max(1, currentMeal.protein)
  const nextPrice = recipe.estimatedPrice * profile.people
  const priceGap = Math.abs(nextPrice - currentMeal.estimatedPrice) / Math.max(1, currentMeal.estimatedPrice)
  const sourcePenalty = recipe.source === currentMeal.source ? 0 : 0.24
  const usagePenalty = plan.days.flatMap((day) => day.meals).filter((meal) => meal.recipeId === recipe.id).length * 0.18
  const shoppingIngredientIds = new Set(plan.shoppingList.map((item) => item.ingredientId))
  const reuseMatches = recipe.ingredients.filter((ingredient) => shoppingIngredientIds.has(ingredient.ingredientId)).length
  const reuseBonus = Math.min(0.22, reuseMatches * 0.055)
  const costWeight = profile.stylePreset === 'Ekonomik' ? 0.72 : 0.38

  return (calorieGap * 0.48) + (proteinGap * 0.62) + (priceGap * costWeight) + sourcePenalty + usagePenalty - reuseBonus
}

export function swapMealInEditedPlan(
  plan: WeeklyPlan,
  profile: UserPlanProfile,
  dayIndex: number,
  mealIndex: number,
  seed = 1,
): WeeklyPlan {
  const currentMeal = plan.days[dayIndex]?.meals[mealIndex]
  if (!currentMeal) return plan

  const candidates = RECIPE_CATALOG
    .filter((recipe) => recipe.id !== currentMeal.recipeId)
    .filter((recipe) => recipe.mealSlots.includes(currentMeal.slot))
    .filter((recipe) => recipeMatchesProfile(recipe, profile))
    .sort((left, right) => alternativeScore(left, currentMeal, profile, plan) - alternativeScore(right, currentMeal, profile, plan))

  if (candidates.length === 0) return plan

  const shortlist = candidates.slice(0, Math.min(5, candidates.length))
  const recipe = shortlist[Math.abs(seed) % shortlist.length]
  const days = plan.days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))

  days[dayIndex].meals[mealIndex] = {
    id: `${dayIndex}-${mealIndex}-${recipe.id}-swap-${seed}`,
    recipeId: recipe.id,
    slot: currentMeal.slot,
    title: recipe.title,
    subtitle: recipe.subtitle,
    emoji: recipe.emoji,
    source: recipe.source,
    calories: recipe.calories,
    protein: recipe.protein,
    estimatedPrice: recipe.estimatedPrice * profile.people,
    tags: [...recipe.tags, 'senin değişikliğin'],
  }

  return rebuildEditedPlan(profile, days, {
    adjustedForBudget: plan.adjustedForBudget,
    convertedOutsideMeals: plan.convertedOutsideMeals,
  })
}
