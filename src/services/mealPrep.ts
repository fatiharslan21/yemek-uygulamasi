import { INGREDIENT_BY_ID, RECIPE_CATALOG } from '../data/recipeCatalog'
import type { IngredientDefinition, PlannedMeal, UserPlanProfile, WeeklyPlan } from '../types'

export type MealPrepTask = {
  id: string
  ingredientId: string
  emoji: string
  title: string
  detail: string
  quantity: number
  unit: IngredientDefinition['unit']
  usedInMeals: number
  minutes: number
  equipment?: string
  mealNames: string[]
}

function actionForCategory(category: IngredientDefinition['category']) {
  if (category === 'Protein') return { action: 'Porsiyonla / ön hazırlığını yap', minutes: 10 }
  if (category === 'Sebze & meyve') return { action: 'Yıka, ayıkla ve gerekiyorsa doğra', minutes: 12 }
  if (category === 'Kuru gıda') return { action: 'Ölç, gerekiyorsa toplu haşla/pişir', minutes: 18 }
  if (category === 'Kahvaltılık') return { action: 'Porsiyonları ayır ve erişilebilir tut', minutes: 5 }
  return { action: 'Ön hazırlığını tamamla', minutes: 7 }
}

function preferredEquipment(profile: UserPlanProfile, category: IngredientDefinition['category']) {
  if (category === 'Protein') {
    if (profile.cookingEquipment.includes('Airfryer')) return 'Airfryer'
    if (profile.cookingEquipment.includes('Fırın')) return 'Fırın'
    if (profile.cookingEquipment.includes('Ocak')) return 'Ocak'
  }
  if (category === 'Kuru gıda' && profile.cookingEquipment.includes('Ocak')) return 'Ocak'
  return undefined
}

function mealsForWindow(plan: WeeklyPlan, startIndex: number, dayCount: number) {
  return plan.days
    .slice(startIndex, startIndex + dayCount)
    .flatMap((day) => day.meals.map((meal) => ({ dayIndex: day.index, meal })))
}

function recipeForMeal(meal: PlannedMeal) {
  return RECIPE_CATALOG.find((recipe) => recipe.id === meal.recipeId)
}

export function buildMealPrepTasks(
  plan: WeeklyPlan,
  profile: UserPlanProfile,
  startIndex: number,
  dayCount = 3,
): MealPrepTask[] {
  const totals = new Map<string, { quantity: number; meals: string[] }>()

  mealsForWindow(plan, startIndex, dayCount)
    .filter(({ meal }) => meal.source === 'Evde')
    .forEach(({ meal }) => {
      const recipe = recipeForMeal(meal)
      recipe?.ingredients.forEach((ingredient) => {
        const previous = totals.get(ingredient.ingredientId) ?? { quantity: 0, meals: [] }
        totals.set(ingredient.ingredientId, {
          quantity: previous.quantity + (ingredient.quantity * profile.people),
          meals: previous.meals.includes(meal.title) ? previous.meals : [...previous.meals, meal.title],
        })
      })
    })

  return [...totals.entries()]
    .map(([ingredientId, total]) => {
      const definition = INGREDIENT_BY_ID[ingredientId]
      if (!definition || total.meals.length < 2) return null
      const action = actionForCategory(definition.category)
      const mealBonus = Math.max(0, total.meals.length - 2) * 2
      return {
        id: `prep-${ingredientId}`,
        ingredientId,
        emoji: definition.emoji,
        title: `${definition.name}: ${action.action}`,
        detail: `${total.meals.length} öğünde kullanılacak. Tek seferde hazırlayıp porsiyonlara ayırabilirsin.`,
        quantity: Math.round(total.quantity),
        unit: definition.unit,
        usedInMeals: total.meals.length,
        minutes: action.minutes + mealBonus,
        equipment: preferredEquipment(profile, definition.category),
        mealNames: total.meals,
      } satisfies MealPrepTask
    })
    .filter((task): task is MealPrepTask => Boolean(task))
    .sort((left, right) => {
      if (left.usedInMeals !== right.usedInMeals) return right.usedInMeals - left.usedInMeals
      return right.minutes - left.minutes
    })
    .slice(0, 6)
}

export function mealPrepSummary(tasks: MealPrepTask[]) {
  return {
    totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
    coveredMeals: new Set(tasks.flatMap((task) => task.mealNames)).size,
    taskCount: tasks.length,
  }
}
