import type { ShoppingListItem } from '../types'

const STORAGE_PREFIX = 'lokma.shopping-checklist.v2:'
const LEGACY_STORAGE_PREFIX = 'lokma.shopping-checklist.v1:'

export type ShoppingChecklistState = {
  pantryQuantities: Record<string, number>
  purchasedIngredientIds: string[]
}

export function shoppingListSignature(items: ShoppingListItem[]) {
  return items
    .map((item) => `${item.ingredientId}:${item.packages}:${Math.round(item.requiredQuantity)}`)
    .sort()
    .join('|')
}

function cleanQuantities(value: unknown) {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, quantity]) => typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0)
      .map(([id, quantity]) => [id, Math.max(0, Number(quantity))]),
  )
}

export function loadShoppingChecklist(signature: string): ShoppingChecklistState {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${signature}`)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ShoppingChecklistState>
      return {
        pantryQuantities: cleanQuantities(parsed.pantryQuantities),
        purchasedIngredientIds: Array.isArray(parsed.purchasedIngredientIds)
          ? parsed.purchasedIngredientIds.filter((item): item is string => typeof item === 'string')
          : [],
      }
    }

    // v1 yalnızca "evde var" bilgisini tutuyordu; miktarı bilinmediği için stok miktarı uydurmuyoruz.
    // Sadece kesin olan "aldım" işaretlerini taşıyoruz ve eski kaydı yeni formata bir kez dönüştürüyoruz.
    const legacyRaw = window.localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${signature}`)
    if (!legacyRaw) return { pantryQuantities: {}, purchasedIngredientIds: [] }

    const legacy = JSON.parse(legacyRaw) as { purchasedIngredientIds?: string[] }
    const migrated: ShoppingChecklistState = {
      pantryQuantities: {},
      purchasedIngredientIds: Array.isArray(legacy.purchasedIngredientIds)
        ? legacy.purchasedIngredientIds.filter((item): item is string => typeof item === 'string')
        : [],
    }
    window.localStorage.setItem(`${STORAGE_PREFIX}${signature}`, JSON.stringify(migrated))
    return migrated
  } catch {
    return { pantryQuantities: {}, purchasedIngredientIds: [] }
  }
}

export function saveShoppingChecklist(signature: string, state: ShoppingChecklistState) {
  if (!signature) return
  window.localStorage.setItem(`${STORAGE_PREFIX}${signature}`, JSON.stringify(state))
}
