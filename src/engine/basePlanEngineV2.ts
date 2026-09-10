import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import { recipePassesCatalogSafety } from '../services/catalogSafety'
import { recipeSupportsEquipment } from '../services/cookingCompatibility'
import { calculateNutritionTargets } from '../services/nutritionTargets'
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

const SLOT_WEIGHTS: Record<MealSlot, number> = {
  Kahvaltı: 0.24,
  Öğle: 0.31,
  'Ara öğün': 0.12,
  Akşam: 0.33,
  'Gece öğünü': 0.1,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
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

function normalizedSlotWeight(slot: MealSlot, slots: MealSlot[]) {
  const total = slots.reduce((sum, item) => sum + SLOT_WEIGHTS[item], 0)
  return SLOT_WEIGHTS[slot] / Math.max(total, 0.01)
}

function hashText(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items]
  let state = (seed || 1) >>> 0
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = ((state * 1664525) + 1013904223) >>> 0
    const target = state % (index + 1)
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function buildSourceSchedule(profile: UserPlanProfile, totalMeals: number, seed: number): MealSource[] {
  let homeCount = Math.round(totalMeals * profile.mealSplit.home / 100)
  let deliveryCount = Math.round(totalMeals * profile.mealSplit.delivery / 100)
  homeCount = clamp(homeCount, 0, totalMeals)
  deliveryCount = clamp(deliveryCount, 0, totalMeals - homeCount)
  const dineOutCount = Math.max(0, totalMeals - homeCount - deliveryCount)
  return seededShuffle([
    ...Array.from({ length: homeCount }, () => 'Evde' as const),
    ...Array.from({ length: deliveryCount }, () => 'Sipariş' as const),
    ...Array.from({ length: dineOutCount }, () => 'Dışarı' as const),
  ], seed + 97)
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
  if (!dislikeTokens.length) return true

  const searchable = normalize([
    recipe.title,
    recipe.subtitle,
    ...recipe.tags,
    ...recipe.ingredients.map((item) => INGREDIENT_BY_ID[item.ingredientId]?.name ?? ''),
  ].join(' '))
  return !dislikeTokens.some((token) => searchable.includes(token))
}

function recipeFamily(recipe: Recipe) {
  const title = normalize(recipe.title)
  const tags = recipe.tags.map(normalize)
  if (title.includes('tavuk')) return 'tavuk'
  if (title.includes('köfte') || title.includes('kıyma')) return 'kırmızı-et'
  if (title.includes('balık') || title.includes('ton ')) return 'balık'
  if (title.includes('tofu')) return 'tofu'
  if (title.includes('nohut')) return 'nohut'
  if (title.includes('mercimek')) return 'mercimek'
  if (title.includes('fasulye')) return 'fasulye'
  if (title.includes('yumurta') || title.includes('omlet') || title.includes('menemen')) return 'yumurta'
  if (title.includes('makarna')) return 'makarna'
  if (title.includes('tost') || title.includes('dürüm') || title.includes('tortilla')) return 'wrap-tost'
  if (title.includes('yulaf') || title.includes('smoothie')) return 'kahvalti-kase'
  if (tags.includes('vegan')) return 'bitkisel'
  return recipe.id.split('-')[0]
}

function candidateScore(args: {
  recipe: Recipe
  slot: MealSlot
  slots: MealSlot[]
  profile: UserPlanProfile
  targets: NutritionTargets
  usedIngredients: Map<string, number>
  usedRecipes: Map<string, number>
  usedFamilies: Map<string, number>
  recentRecipeIds: string[]
  dayIndex: number
  seed: number
}) {
  const { recipe, slot, slots, profile, targets, usedIngredients, usedRecipes, usedFamilies, recentRecipeIds, dayIndex, seed } = args
  const share = normalizedSlotWeight(slot, slots)
  const calorieTarget = targets.calories * share
  const proteinTarget = targets.protein * share
  const totalMeals = slots.length * profile.days
  const perMealBudget = profile.budget / Math.max(1, totalMeals)
  const householdPrice = recipe.estimatedPrice * profile.people

  const calorieGap = Math.abs(recipe.calories - calorieTarget) / Math.max(1, calorieTarget)
  const proteinGap = Math.abs(recipe.protein - proteinTarget) / Math.max(1, proteinTarget)
  const budgetGap = Math.max(0, householdPrice - perMealBudget) / Math.max(1, perMealBudget)
  const reuseMatches = recipe.ingredients.reduce((sum, ingredient) => sum + (usedIngredients.has(ingredient.ingredientId) ? 1 : 0), 0)

  const repeatCount = usedRecipes.get(recipe.id) ?? 0
  const familyCount = usedFamilies.get(recipeFamily(recipe)) ?? 0
  const immediateRepeat = recentRecipeIds.includes(recipe.id) ? 1 : 0
  const reuseWeight = profile.stylePreset === 'Ekonomik' ? 0.24 : 0.12
  const repeatWeight = profile.stylePreset === 'Ekonomik' ? 0.85 : 1.2
  const familyWeight = profile.stylePreset === 'Ekonomik' ? 0.13 : 0.2
  const costWeight = profile.stylePreset === 'Ekonomik' ? 1.65 : profile.stylePreset === 'Rahat' ? 0.62 : 1.02
  const proteinWeight = profile.goal === 'Bulk' || profile.goal === 'Kilo ver' ? 1.08 : 0.82
  const tinyTieBreaker = (hashText(`${recipe.id}-${slot}-${dayIndex}-${seed}`) % 100) / 10000

  return (calorieGap * 0.78)
    + (proteinGap * proteinWeight)
    + (budgetGap * costWeight)
    + (repeatCount * repeatWeight)
    + (familyCount * familyWeight)
    + (immediateRepeat * 2.4)
    - (reuseMatches * reuseWeight)
    + tinyTieBreaker
}

function pickRecipe(args: {
  slot: MealSlot
  desiredSource: MealSource
  slots: MealSlot[]
  profile: UserPlanProfile
  targets: NutritionTargets
  usedIngredients: Map<string, number>
  usedRecipes: Map<string, number>
  usedFamilies: Map<string, number>
  recentRecipeIds: string[]
  dayIndex: number
  slotIndex: number
  seed: number
}): Recipe {
  const { slot, desiredSource, profile, dayIndex, slotIndex, seed } = args
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

    if (candidates.length) {
      const choiceWindow = Math.min(source === desiredSource ? 6 : 4, candidates.length)
      const choiceIndex = hashText(`${seed}-${dayIndex}-${slotIndex}-${slot}-${source}`) % choiceWindow
      return candidates[choiceIndex]
    }
  }

  const anySafeCandidate = RECIPE_CATALOG
    .filter((recipe) => recipe.mealSlots.includes(slot))
    .filter((recipe) => recipeMatchesProfile(recipe, profile))
  if (anySafeCandidate.length) return anySafeCandidate[hashText(`${seed}-${slot}`) % anySafeCandidate.length]

  return {
    id: `safe-fallback-${slot}`,
    title: 'Tercihlerine uygun öğün bulunamadı',
    subtitle: 'Bu öğünü onaylamadan önce tercihlerini genişlet veya alternatif seç',
    emoji: '🍽️',
    mealSlots: [slot],
    source: 'Evde',
    allowedDiets: [profile.diet],
    allergens: [],
    calories: slot === 'Ara öğün' || slot === 'Gece öğünü' ? 250 : 550,
    protein: slot === 'Ara öğün' || slot === 'Gece öğünü' ? 12 : 28,
    estimatedPrice: 85,
    ingredients: [],
    tags: ['düzenleme gerekli'],
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
        totals.set(ingredientUse.ingredientId, { quantity: previous.quantity + quantity, uses: previous.uses + 1 })
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
    .sort((left, right) => left.usedInMeals !== right.usedInMeals ? right.usedInMeals - left.usedInMeals : right.estimatedCost - left.estimatedCost)

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
  const outsideCost = days.reduce((sum, day) => sum + day.meals.filter((meal) => meal.source !== 'Evde').reduce((mealSum, meal) => mealSum + meal.estimatedPrice, 0), 0)
  return { shoppingList, marketCost, estimatedWasteSaving, outsideCost, totalCost: marketCost + outsideCost }
}

function mealFromRecipe(recipe: Recipe, slot: MealSlot, profile: UserPlanProfile, id: string, extraTags: string[] = []): PlannedMeal {
  return {
    id,
    recipeId: recipe.id,
    slot,
    title: recipe.title,
    subtitle: recipe.subtitle,
    emoji: recipe.emoji,
    source: recipe.source,
    calories: recipe.calories,
    protein: recipe.protein,
    estimatedPrice: recipe.estimatedPrice * profile.people,
    tags: [...recipe.tags, ...extraTags],
  }
}

function fitDaysToBudget(inputDays: PlannedDay[], profile: UserPlanProfile) {
  let days = inputDays.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
  let snapshot = costSnapshot(days, profile)
  let convertedOutsideMeals = 0
  if (snapshot.totalCost <= profile.budget) return { days, snapshot, convertedOutsideMeals }

  const outsidePositions = days
    .flatMap((day, dayIndex) => day.meals.map((meal, mealIndex) => ({ meal, dayIndex, mealIndex })))
    .filter((item) => item.meal.source !== 'Evde')
    .sort((left, right) => right.meal.estimatedPrice - left.meal.estimatedPrice)

  for (const position of outsidePositions) {
    if (snapshot.totalCost <= profile.budget) break
    const currentMeal = days[position.dayIndex].meals[position.mealIndex]
    const homeCandidates = RECIPE_CATALOG
      .filter((recipe) => recipe.source === 'Evde' && recipe.mealSlots.includes(currentMeal.slot))
      .filter((recipe) => recipeMatchesProfile(recipe, profile))

    let bestDays: PlannedDay[] | null = null
    let bestSnapshot = snapshot
    homeCandidates.forEach((recipe) => {
      const candidateDays = days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))
      candidateDays[position.dayIndex].meals[position.mealIndex] = mealFromRecipe(recipe, currentMeal.slot, profile, `${position.dayIndex}-${position.mealIndex}-${recipe.id}-budget`, ['bütçe dengesi'])
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
  const usedFamilies = new Map<string, number>()
  const recentRecipeIds: string[] = []
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
        usedFamilies,
        recentRecipeIds,
        dayIndex,
        slotIndex,
        seed: seed + 13,
      })

      usedRecipes.set(recipe.id, (usedRecipes.get(recipe.id) ?? 0) + 1)
      usedFamilies.set(recipeFamily(recipe), (usedFamilies.get(recipeFamily(recipe)) ?? 0) + 1)
      recipe.ingredients.forEach((ingredient) => usedIngredients.set(ingredient.ingredientId, (usedIngredients.get(ingredient.ingredientId) ?? 0) + 1))
      recentRecipeIds.push(recipe.id)
      if (recentRecipeIds.length > Math.max(4, slots.length + 1)) recentRecipeIds.shift()
      meals.push(mealFromRecipe(recipe, slot, profile, `${dayIndex}-${slotIndex}-${recipe.id}`))
    })

    days.push(refreshDay({ index: dayIndex, name: DAY_NAMES[dayIndex] ?? `Gün ${dayIndex + 1}`, meals, totalCalories: 0, totalProtein: 0, totalEstimatedPrice: 0 }))
  }

  const budgetFit = fitDaysToBudget(days, profile)
  const finalDays = budgetFit.days.map(refreshDay)
  const { shoppingList, marketCost, outsideCost, totalCost, estimatedWasteSaving } = budgetFit.snapshot
  const totalCalories = finalDays.reduce((sum, day) => sum + day.totalCalories, 0)
  const totalProtein = finalDays.reduce((sum, day) => sum + day.totalProtein, 0)
  const reusedIngredientCount = shoppingList.filter((item) => item.usedInMeals >= 2).length
  const reuseScore = shoppingList.length ? Math.round((reusedIngredientCount / shoppingList.length) * 100) : 0

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
