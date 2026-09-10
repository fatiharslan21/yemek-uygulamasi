import type { PlannedMeal, Recipe } from '../types'

const STORAGE_KEY = 'lokma.meal-preference-signals.v1'

export type MealSignal = {
  eaten: number
  skipped: number
  swapped: number
  updatedAt: string
}

type SignalStore = {
  recipes: Record<string, MealSignal>
  tags: Record<string, MealSignal>
}

const EMPTY: MealSignal = { eaten: 0, skipped: 0, swapped: 0, updatedAt: '' }

function loadStore(): SignalStore {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SignalStore>
    return {
      recipes: parsed.recipes && typeof parsed.recipes === 'object' ? parsed.recipes : {},
      tags: parsed.tags && typeof parsed.tags === 'object' ? parsed.tags : {},
    }
  } catch {
    return { recipes: {}, tags: {} }
  }
}

function saveStore(store: SignalStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function add(signal: MealSignal | undefined, kind: 'eaten' | 'skipped' | 'swapped'): MealSignal {
  const next = { ...(signal ?? EMPTY), updatedAt: new Date().toISOString() }
  next[kind] += 1
  return next
}

function usefulTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.toLocaleLowerCase('tr-TR').trim()).filter((tag) => tag.length >= 3))].slice(0, 5)
}

export function recordMealSignal(meal: Pick<PlannedMeal, 'recipeId' | 'tags'>, kind: 'eaten' | 'skipped' | 'swapped') {
  if (meal.recipeId.startsWith('safe-fallback-')) return
  const store = loadStore()
  store.recipes[meal.recipeId] = add(store.recipes[meal.recipeId], kind)
  usefulTags(meal.tags).forEach((tag) => {
    store.tags[tag] = add(store.tags[tag], kind)
  })
  saveStore(store)
}

function signalScore(signal?: MealSignal) {
  if (!signal) return 0
  return (signal.eaten * 0.24) - (signal.skipped * 0.62) - (signal.swapped * 0.78)
}

export function getRecipePreferenceScore(recipe: Pick<Recipe, 'id' | 'tags'>) {
  const store = loadStore()
  const direct = signalScore(store.recipes[recipe.id])
  const tagScores = usefulTags(recipe.tags).map((tag) => signalScore(store.tags[tag]))
  const tagAverage = tagScores.length ? tagScores.reduce((sum, value) => sum + value, 0) / tagScores.length : 0
  return direct + tagAverage * 0.45
}

export function getPreferenceSummary() {
  const store = loadStore()
  const recipeEntries = Object.entries(store.recipes)
  return {
    learnedRecipes: recipeEntries.length,
    positiveRecipes: recipeEntries.filter(([, signal]) => signalScore(signal) > 0.4).length,
    avoidedRecipes: recipeEntries.filter(([, signal]) => signalScore(signal) < -1).length,
  }
}
