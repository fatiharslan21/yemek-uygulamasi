import { BASE_INGREDIENTS, BASE_RECIPES } from './baseRecipeCatalog'
import { EXTRA_INGREDIENTS, EXTRA_RECIPES } from './extraRecipes'
import { EXPANDED_RECIPES } from './expandedRecipes'
import type { IngredientDefinition, Recipe } from '../types'

export const INGREDIENTS: IngredientDefinition[] = [...BASE_INGREDIENTS, ...EXTRA_INGREDIENTS]

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((item) => [item.id, item]),
) as Record<string, IngredientDefinition>

const CORE_RECIPE_IDS = new Set([...BASE_RECIPES, ...EXTRA_RECIPES].map((recipe) => recipe.id))
const NORMALIZED_EXPANDED_RECIPES: Recipe[] = EXPANDED_RECIPES.map((recipe) => ({
  ...recipe,
  id: CORE_RECIPE_IDS.has(recipe.id) ? `${recipe.id}-alt` : recipe.id,
  ingredients: recipe.ingredients.filter((ingredient) => ingredient.quantity > 0),
}))

export const RECIPE_CATALOG: Recipe[] = [...BASE_RECIPES, ...EXTRA_RECIPES, ...NORMALIZED_EXPANDED_RECIPES]

export const RECIPE_LIBRARY_STATS = {
  recipes: RECIPE_CATALOG.length,
  ingredients: INGREDIENTS.length,
  homeRecipes: RECIPE_CATALOG.filter((recipe) => recipe.source === 'Evde').length,
  outsideRecipes: RECIPE_CATALOG.filter((recipe) => recipe.source !== 'Evde').length,
} as const
