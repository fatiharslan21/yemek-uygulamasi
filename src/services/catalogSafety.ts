import type { Recipe, UserPlanProfile } from '../types'

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
}

export function profileForCatalogSafety(profile: UserPlanProfile): UserPlanProfile {
  const selected = new Set(profile.allergies.map(normalize))
  const allergies = [...profile.allergies]
  if (selected.has('deniz ürünü') && !selected.has('balık')) allergies.push('Balık')

  const dislikeParts = [profile.dislikes.trim()]
  if (selected.has('soya')) dislikeParts.push('tofu')

  return {
    ...profile,
    allergies,
    dislikes: dislikeParts.filter(Boolean).join(', '),
  }
}

export function recipePassesCatalogSafety(recipe: Recipe, profile: UserPlanProfile) {
  const selected = new Set(profile.allergies.map(normalize))
  const ingredientIds = new Set(recipe.ingredients.map((item) => item.ingredientId))
  const title = normalize(recipe.title)

  if (selected.has('deniz ürünü') && (ingredientIds.has('fish') || title.includes('balık'))) return false
  if (selected.has('soya') && (ingredientIds.has('tofu') || title.includes('tofu'))) return false
  return true
}
