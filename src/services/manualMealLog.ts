const STORAGE_PREFIX = 'lokma.manual-meals.v1:'

export type ManualMealEntry = {
  id: string
  title: string
  calories: number
  protein: number
  estimatedPrice: number
  createdAt: string
}

function key(dateKey: string) {
  return `${STORAGE_PREFIX}${dateKey}`
}

export function loadManualMeals(dateKey: string): ManualMealEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key(dateKey)) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is ManualMealEntry => Boolean(
      item && typeof item === 'object' &&
      typeof (item as ManualMealEntry).id === 'string' &&
      typeof (item as ManualMealEntry).title === 'string',
    ))
  } catch {
    return []
  }
}

export function saveManualMeals(dateKey: string, entries: ManualMealEntry[]) {
  window.localStorage.setItem(key(dateKey), JSON.stringify(entries.slice(-20)))
}

export function createManualMeal(title: string, calories: number, protein: number, estimatedPrice: number): ManualMealEntry {
  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim() || 'Plan dışı öğün',
    calories: Math.max(0, Math.round(Number.isFinite(calories) ? calories : 0)),
    protein: Math.max(0, Math.round(Number.isFinite(protein) ? protein : 0)),
    estimatedPrice: Math.max(0, Math.round(Number.isFinite(estimatedPrice) ? estimatedPrice : 0)),
    createdAt: new Date().toISOString(),
  }
}
