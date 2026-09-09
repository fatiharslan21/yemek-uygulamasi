import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { recipeSupportsEquipment } from '../services/cookingCompatibility'
import type {
  MealSlot,
  MealSource,
  NutritionTargets,
  PlannedDay,
  PlannedMeal,
  Recipe,
  ShoppingListItem,
  UserPlanProfile,
  WeeklyPlan,
} from '../types'

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const ACTIVITY_MULTIPLIERS: Record<UserPlanProfile['activity'], number> = {
  Hareketsiz: 1.2,
  'Az aktif': 1.375,
  Aktif: 1.55,
  'Çok aktif': 1.725,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
}

export function calculateNutritionTargets(profile: UserPlanProfile): NutritionTargets {
  const sexOffset = profile.sex === 'Erkek' ? 5 : -161
  const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + sexOffset
  const maintenance = bmr * ACTIVITY_MULTIPLIERS[profile.activity]
  const goalDelta = profile.goal === 'Kilo ver' ? -350 : profile.goal === 'Bulk' ? 300 : 0
  const minCalories = profile.sex === 'Erkek' ? 1500 : 1200
  const calories = Math.round(clamp(maintenance + goalDelta, minCalories, 4200) / 10) * 10

  const proteinMultiplier = profile.goal === 'Kilo ver'
    ? 1.8
    : profile.goal === 'Bulk'
      ? 1.9
      : profile.goal === 'Koru'
        ? 1.6
        : 1.5

  return {
    calories,
    protein: Math.round(profile.weight * proteinMultiplier),
  }
}

function slotsForProfile(profile: UserPlanProfile): MealSlot[] {
  if (profile.breakfast) {
    if (profile.mealsPerDay === 2) return ['Kahvaltı', 'Akşam']
    if (profile.mealsPerDay === 3) return ['Kahvaltı', 'Öğle', 'Akşam']
    return ['Kahvaltı', 'Öğle', 'Ara öğün', 'Akşam']
  }

  if (profile.mealsPerDay === 2) return ['Öğle', 'Akşam']
  if (profile.mealsPerDay === 3) return ['Öğle', 'Ara öğün', 'Akşam']
  return ['Öğle', 'Ara öğün', 'Akşam', 'Gece öğünü']
}

const SLOT_WEIGHTS: Record<MealSlot, number> = {
  Kahvaltı: 0.24,
  Öğle: 0.31,
  'Ara öğün': 0.12,
  Akşam: 0.33,
  'Gece öğünü': 0.1,
}

function normalizedSlotWeight(slot: MealSlot, slots: MealSlot[]) {
  const total = slots.reduce((sum, item) => sum + SLOT_WEIGHTS[item], 0)
  return SLOT_WEIGHTS[slot] / total
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items]
  let state = (seed || 1) >>> 0
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = ((state * 1664525) + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function buildSourceSchedule(profile: UserPlanProfile, totalMeals: number, seed: number): MealSource[] {
  let homeCount = Math.round(totalMeals * profile.mealSplit.home / 100)
  let deliveryCount = Math.round(totalMeals * profile.mealSplit.delivery / 100)
  homeCount = clamp(homeCount, 0, totalMeals)
  deliveryCount = clamp(deliveryCount, 0, totalMeals - homeCount)
  const dineOutCount = Math.max(0, totalMeals - homeCount - deliveryCount)

  const sources: MealSource[] = [
    ...Array.from({ length: homeCount }, () => 'Evde' as const),
    ...Array.from({ length: deliveryCount }, () => 'Sipariş' as const),
    ...Array.from({ length: dineOutCount }, () => 'Dışarı' as const),
  ]

  return seededShuffle(sources, seed + 97)
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

function hashText(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function candidateScore(args: {
  recipe: Recipe
  slot: MealSlot
  slots: MealSlot[]
  profile: UserPlanProfile
  targets: NutritionTargets
  usedIngredients: Map<string, number>
  usedRecipes: Map<string, number>
  dayIndex: number
  seed: number
}) {
  const { recipe, slot, slots, profile, targets, usedIngredients, usedRecipes, dayIndex, seed } = args
  const share = normalizedSlotWeight(slot, slots)
  const calorieTarget = targets.calories * share
  const proteinTarget = targets.protein * share
  const totalMeals = slots.length * profile.days
  const perMealBudget = profile.budget / Math.max(1, totalMeals)
  const householdPrice = recipe.estimatedPrice * profile.people

  const calorieGap = Math.abs(recipe.calories - calorieTarget) / Math.max(1, calorieTarget)
  const proteinGap = Math.abs(recipe.protein - proteinTarget) / Math.max(1, proteinTarget)
  const budgetGap = Math.max(0, householdPrice - perMealBudget) / Math.max(1, perMealBudget)

  const reuseMatches = recipe.ingredients.reduce(
    (sum, ingredient) => sum + (usedIngredients.has(ingredient.ingredientId) ? 1 : 0),
    0,
  )
  const reuseWeight = profile.stylePreset === 'Ekonomik' ? 0.3 : 0.16
  const repeatWeight = profile.stylePreset === 'Ekonomik' ? 0.14 : profile.stylePreset === 'Rahat' ? 0.4 : 0.3
  const reuseBonus = reuseMatches * reuseWeight
  const repeatPenalty = (usedRecipes.get(recipe.id) ?? 0) * repeatWeight

  const costWeight = profile.stylePreset === 'Ekonomik' ? 1.7 : profile.stylePreset === 'Rahat' ? 0.62 : 1.05
  const proteinWeight = profile.goal === 'Bulk' || profile.goal === 'Kilo ver' ? 1.12 : 0.85
  const tieBreaker = (hashText(`${recipe.id}-${slot}-${dayIndex}-${seed}`) % 100) / 10000

  return (calorieGap * 0.82)
    + (proteinGap * proteinWeight)
    + (budgetGap * costWeight)
    + repeatPenalty
    - reuseBonus
    + tieBreaker
}

function pickRecipe(args: {
  slot: MealSlot
  desiredSource: MealSource
  slots: MealSlot[]
  profile: UserPlanProfile
  targets: NutritionTargets
  usedIngredients: Map<string, number>
  usedRecipes: Map<string, number>
  dayIndex: number
  seed: number
}): Recipe {
  const { slot, desiredSource, profile } = args
  const sourceFallbacks: MealSource[] = desiredSource === 'Evde'
    ? ['Evde', 'Sipariş', 'Dışarı']
    : desiredSource === 'Sipariş'
      ? ['Sipariş', 'Evde', 'Dışarı']
      : ['Dışarı', 'Sipariş', 'Evde']

  for (const source of sourceFallbacks) {
    const candidates = RECIPE_CATALOG
      .filter((recipe) => recipe.source === source)
      .filter((recipe) => recipe.mealSlots.includes(slot))
      .filter((recipe) => recipeMatchesProfile(recipe, profile))
      .sort((left, right) => candidateScore({ ...args, recipe: left }) - candidateScore({ ...args, recipe: right }))

    if (candidates.length > 0) return candidates[0]
  }

  const anySafeCandidate = RECIPE_CATALOG
    .filter((recipe) => recipe.mealSlots.includes(slot))
    .find((recipe) => recipeMatchesProfile(recipe, profile))

  if (anySafeCandidate) return anySafeCandidate

  return {
    id: `safe-fallback-${slot}`,
    title: 'Tercihlerine uygun özel öğün',
    subtitle: 'Filtrelerin çok dar olduğu için güvenli bir yer tutucu oluşturduk',
    emoji: '🍽️',
    mealSlots: [slot],
    source: 'Evde',
    allowedDiets: [profile.diet],
    allergens: [],
    calories: slot === 'Ara öğün' || slot === 'Gece öğünü' ? 250 : 550,
    protein: slot === 'Ara öğün' || slot === 'Gece öğünü' ? 12 : 28,
    estimatedPrice: 85,
    ingredients: [],
    tags: ['özel alternatif'],
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
  const estimatedWasteSaving = Math.round(Math.min(Math.max(0, naivePackageSpend - marketCost), marketCost * 0.28))

  return { shoppingList, marketCost, estimatedWasteSaving }
}

function refreshDay(day: PlannedDay): PlannedDay {
  return {
    ...day,
    totalCalories: day.meals.reduce((sum, meal) => sum + meal.calories, 0),
    totalProtein: day.meals.reduce((sum, meal) => sum + meal.protein, 0),
    totalEstimatedPrice: day.meals.reduce((sum, meal) => sum + meal.estimatedPrice, 0),
  }
}

function costSnapshot(days: PlannedDay[], profile: UserPlanProfile) {
  const { shoppingList, marketCost, estimatedWasteSaving } = buildShoppingList(days, profile)
  const outsideCost = days.reduce(
    (sum, day) => sum + day.meals
      .filter((meal) => meal.source !== 'Evde')
      .reduce((mealSum, meal) => mealSum + meal.estimatedPrice, 0),
    0,
  )
  return {
    shoppingList,
    marketCost,
    estimatedWasteSaving,
    outsideCost,
    totalCost: marketCost + outsideCost,
  }
}

function fitDaysToBudget(inputDays: PlannedDay[], profile: UserPlanProfile) {
  let days = inputDays.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
  let snapshot = costSnapshot(days, profile)
  let convertedOutsideMeals = 0

  if (snapshot.totalCost <= profile.budget) {
    return { days, snapshot, convertedOutsideMeals }
  }

  const outsidePositions = days
    .flatMap((day, dayIndex) => day.meals.map((meal, mealIndex) => ({ meal, dayIndex, mealIndex })))
    .filter((item) => item.meal.source !== 'Evde')
    .sort((left, right) => right.meal.estimatedPrice - left.meal.estimatedPrice)

  for (const position of outsidePositions) {
    if (snapshot.totalCost <= profile.budget) break

    const currentMeal = days[position.dayIndex].meals[position.mealIndex]
    const homeCandidates = RECIPE_CATALOG
      .filter((recipe) => recipe.source === 'Evde')
      .filter((recipe) => recipe.mealSlots.includes(currentMeal.slot))
      .filter((recipe) => recipeMatchesProfile(recipe, profile))

    let bestDays: PlannedDay[] | null = null
    let bestSnapshot = snapshot

    homeCandidates.forEach((recipe) => {
      const candidateDays = days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
      candidateDays[position.dayIndex].meals[position.mealIndex] = {
        id: `${position.dayIndex}-${position.mealIndex}-${recipe.id}-budget`,
        recipeId: recipe.id,
        slot: currentMeal.slot,
        title: recipe.title,
        subtitle: recipe.subtitle,
        emoji: recipe.emoji,
        source: recipe.source,
        calories: recipe.calories,
        protein: recipe.protein,
        estimatedPrice: recipe.estimatedPrice * profile.people,
        tags: [...recipe.tags, 'bütçe dengesi'],
      }
      candidateDays[position.dayIndex] = refreshDay(candidateDays[position.dayIndex])
      const candidateSnapshot = costSnapshot(candidateDays, profile)
      if (candidateSnapshot.totalCost < bestSnapshot.totalCost) {
        bestDays = candidateDays
        bestSnapshot = candidateSnapshot
      }
    })

    if (bestDays) {
      days = bestDays
      snapshot = bestSnapshot
      convertedOutsideMeals += 1
    }
  }

  return { days, snapshot, convertedOutsideMeals }
}

export function generateWeeklyPlan(profile: UserPlanProfile, seed = 1): WeeklyPlan {
  const targets = calculateNutritionTargets(profile)
  const slots = slotsForProfile(profile)
  const totalMeals = slots.length * profile.days
  const sourceSchedule = buildSourceSchedule(profile, totalMeals, seed)
  const usedIngredients = new Map<string, number>()
  const usedRecipes = new Map<string, number>()
  const days: PlannedDay[] = []

  let sourceIndex = 0

  for (let dayIndex = 0; dayIndex < profile.days; dayIndex += 1) {
    const meals: PlannedMeal[] = []

    slots.forEach((slot, slotIndex) => {
      const desiredSource = sourceSchedule[sourceIndex] ?? 'Evde'
      sourceIndex += 1
      const recipe = pickRecipe({
        slot,
        desiredSource,
        slots,
        profile,
        targets,
        usedIngredients,
        usedRecipes,
        dayIndex,
        seed: seed + slotIndex,
      })

      usedRecipes.set(recipe.id, (usedRecipes.get(recipe.id) ?? 0) + 1)
      recipe.ingredients.forEach((ingredient) => {
        usedIngredients.set(ingredient.ingredientId, (usedIngredients.get(ingredient.ingredientId) ?? 0) + 1)
      })

      meals.push({
        id: `${dayIndex}-${slotIndex}-${recipe.id}`,
        recipeId: recipe.id,
        slot,
        title: recipe.title,
        subtitle: recipe.subtitle,
        emoji: recipe.emoji,
        source: recipe.source,
        calories: recipe.calories,
        protein: recipe.protein,
        estimatedPrice: recipe.estimatedPrice * profile.people,
        tags: recipe.tags,
      })
    })

    days.push({
      index: dayIndex,
      name: DAY_NAMES[dayIndex] ?? `Gün ${dayIndex + 1}`,
      meals,
      totalCalories: meals.reduce((sum, meal) => sum + meal.calories, 0),
      totalProtein: meals.reduce((sum, meal) => sum + meal.protein, 0),
      totalEstimatedPrice: meals.reduce((sum, meal) => sum + meal.estimatedPrice, 0),
    })
  }

  const budgetFit = fitDaysToBudget(days, profile)
  const finalDays = budgetFit.days
  const { shoppingList, marketCost, outsideCost, totalCost, estimatedWasteSaving } = budgetFit.snapshot
  const totalCalories = finalDays.reduce((sum, day) => sum + day.totalCalories, 0)
  const totalProtein = finalDays.reduce((sum, day) => sum + day.totalProtein, 0)
  const reusedIngredientCount = shoppingList.filter((item) => item.usedInMeals >= 2).length
  const reusableItems = shoppingList.length
  const reuseScore = reusableItems === 0 ? 0 : Math.round((reusedIngredientCount / reusableItems) * 100)

  return {
    days: finalDays,
    shoppingList,
    nutritionTargets: targets,
    averageCalories: Math.round(totalCalories / Math.max(1, finalDays.length)),
    averageProtein: Math.round(totalProtein / Math.max(1, finalDays.length)),
    marketCost,
    outsideCost,
    totalCost,
    remainingBudget: profile.budget - totalCost,
    budgetUsagePct: Math.round((totalCost / Math.max(1, profile.budget)) * 100),
    reuseScore,
    reusedIngredientCount,
    estimatedWasteSaving,
    adjustedForBudget: budgetFit.convertedOutsideMeals > 0,
    convertedOutsideMeals: budgetFit.convertedOutsideMeals,
  }
}
