import { getCookingGuides, guideIsAvailable } from './cookingGuides'
import type { CookingEquipment, PlannedMeal, Recipe } from '../types'

export function recipeSupportsEquipment(recipe: Recipe, equipment: CookingEquipment[]) {
  if (recipe.source !== 'Evde' || equipment.length === 0) return true

  const sampleMeal: PlannedMeal = {
    id: `compat-${recipe.id}`,
    recipeId: recipe.id,
    slot: recipe.mealSlots[0] ?? 'Öğle',
    title: recipe.title,
    subtitle: recipe.subtitle,
    emoji: recipe.emoji,
    source: recipe.source,
    calories: recipe.calories,
    protein: recipe.protein,
    estimatedPrice: recipe.estimatedPrice,
    tags: recipe.tags,
  }

  return getCookingGuides(recipe, sampleMeal, 1)
    .some((guide) => guideIsAvailable(guide, equipment))
}
