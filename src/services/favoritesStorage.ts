const STORAGE_KEY = 'lokma.favorite-recipes.v1'

export function loadFavoriteRecipeIds() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

export function saveFavoriteRecipeIds(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function clearFavoriteRecipeIds() {
  window.localStorage.removeItem(STORAGE_KEY)
}
