const STORAGE_KEY = 'lokma.pantry.v1'

export type PantryInventory = Record<string, number>

function clean(value: unknown): PantryInventory {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, amount]) => typeof amount === 'number' && Number.isFinite(amount) && amount > 0)
      .map(([id, amount]) => [id, Math.max(0, Number(amount))]),
  )
}

export function loadPantry(): PantryInventory {
  try {
    return clean(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}'))
  } catch {
    return {}
  }
}

export function savePantry(inventory: PantryInventory) {
  const cleaned = clean(inventory)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  window.dispatchEvent(new CustomEvent('lokma:pantry-changed'))
}

export function setPantryAmount(ingredientId: string, amount: number) {
  const next = loadPantry()
  if (!Number.isFinite(amount) || amount <= 0) delete next[ingredientId]
  else next[ingredientId] = Math.max(0, amount)
  savePantry(next)
  return next
}

export function addToPantry(ingredientId: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return loadPantry()
  const next = loadPantry()
  next[ingredientId] = Math.max(0, (next[ingredientId] ?? 0) + amount)
  savePantry(next)
  return next
}

export function consumeFromPantry(ingredientId: string, amount: number) {
  const next = loadPantry()
  const current = next[ingredientId] ?? 0
  const remaining = Math.max(0, current - Math.max(0, amount))
  if (remaining <= 0) delete next[ingredientId]
  else next[ingredientId] = remaining
  savePantry(next)
  return next
}
