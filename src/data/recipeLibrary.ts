import { INGREDIENTS as BASE_INGREDIENTS, RECIPE_CATALOG as BASE_RECIPES } from './recipeCatalog'
import { EXTRA_INGREDIENTS, EXTRA_RECIPES } from './extraRecipes'
import type { IngredientDefinition, Recipe } from '../types'

export const INGREDIENTS: IngredientDefinition[] = [...BASE_INGREDIENTS, ...EXTRA_INGREDIENTS]

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((item) => [item.id, item]),
) as Record<string, IngredientDefinition>

export const RECIPE_CATALOG: Recipe[] = [...BASE_RECIPES, ...EXTRA_RECIPES]

export const RECIPE_LIBRARY_STATS = {
  recipes: RECIPE_CATALOG.length,
  ingredients: INGREDIENTS.length,
  homeRecipes: RECIPE_CATALOG.filter((recipe) => recipe.source === 'Evde').length,
  outsideRecipes: RECIPE_CATALOG.filter((recipe) => recipe.source !== 'Evde').length,
} as const
