import type { ShoppingListItem } from '../types'

const STORAGE_PREFIX = 'lokma.shopping-checklist.v1:'

export type ShoppingChecklistState = {
  pantryIngredientIds: string[]
  purchasedIngredientIds: string[]
}

export function shoppingListSignature(items: ShoppingListItem[]) {
  return items
    .map((item) => `${item.ingredientId}:${item.packages}:${Math.round(item.requiredQuantity)}`)
    .sort()
    .join('|')
}

export function loadShoppingChecklist(signature: string): ShoppingChecklistState {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${signature}`)
    if (!raw) return { pantryIngredientIds: [], purchasedIngredientIds: [] }
    const parsed = JSON.parse(raw) as Partial<ShoppingChecklistState>
    return {
      pantryIngredientIds: Array.isArray(parsed.pantryIngredientIds) ? parsed.pantryIngredientIds.filter((item): item is string => typeof item === 'string') : [],
      purchasedIngredientIds: Array.isArray(parsed.purchasedIngredientIds) ? parsed.purchasedIngredientIds.filter((item): item is string => typeof item === 'string') : [],
    }
  } catch {
    return { pantryIngredientIds: [], purchasedIngredientIds: [] }
  }
}

export function saveShoppingChecklist(signature: string, state: ShoppingChecklistState) {
  if (!signature) return
  window.localStorage.setItem(`${STORAGE_PREFIX}${signature}`, JSON.stringify(state))
}
