import type { Recipe, UserPlanProfile } from '../types'

function normalize(text: string) {
  return text.toLocaleLowerCase('tr-TR').trim()
}

const INGREDIENT_GUARDS: Array<{ allergy: string; ingredientIds: string[] }> = [
  { allergy: 'laktoz', ingredientIds: ['cheese', 'yogurt', 'milk', 'kefir', 'labneh', 'mozzarella'] },
  { allergy: 'yumurta', ingredientIds: ['egg'] },
  { allergy: 'kuruyemiş', ingredientIds: ['peanut_butter', 'nuts'] },
  { allergy: 'gluten', ingredientIds: ['bread', 'pasta', 'tortilla', 'couscous'] },
  { allergy: 'soya', ingredientIds: ['tofu'] },
  { allergy: 'deniz ürünü', ingredientIds: ['fish', 'tuna'] },
]

export function profileForCatalogSafety(profile: UserPlanProfile): UserPlanProfile {
  const selected = new Set(profile.allergies.map(normalize))
  const allergies = [...profile.allergies]
  if (selected.has('deniz ürünü') && !selected.has('balık')) allergies.push('Balık')

  const dislikeParts = [profile.dislikes.trim()]
  if (selected.has('soya')) dislikeParts.push('tofu')
  if (selected.has('deniz ürünü')) dislikeParts.push('ton balığı')

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

  for (const guard of INGREDIENT_GUARDS) {
    if (selected.has(guard.allergy) && guard.ingredientIds.some((ingredientId) => ingredientIds.has(ingredientId))) {
      return false
    }
  }

  if (selected.has('deniz ürünü') && (title.includes('balık') || title.includes('ton '))) return false
  if (selected.has('soya') && title.includes('tofu')) return false
  return true
}
