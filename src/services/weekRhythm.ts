import { getMealAlternatives } from './mealAlternatives'
import { loadPlanSession, savePlanSession } from './planSessionStorage'
import { rebuildEditedPlan } from '../engine/planEditor'
import type { MealSlot, PlannedMeal, UserPlanProfile } from '../types'

const STORAGE_PREFIX = 'lokma.week-rhythm.v1:'

export type RhythmMode = 'outside' | 'quick' | 'home' | 'office'
export type RhythmSlot = Extract<MealSlot, 'Öğle' | 'Akşam'>

export type WeekRhythmEntry = {
  dayIndex: number
  slot: RhythmSlot
  mode: RhythmMode
}

function key(startedAt: string) {
  return `${STORAGE_PREFIX}${startedAt}`
}

export function loadWeekRhythm(startedAt: string): WeekRhythmEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key(startedAt)) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is WeekRhythmEntry => Boolean(
      item && typeof item === 'object' &&
      typeof (item as WeekRhythmEntry).dayIndex === 'number' &&
      ((item as WeekRhythmEntry).slot === 'Öğle' || (item as WeekRhythmEntry).slot === 'Akşam') &&
      ['outside', 'quick', 'home', 'office'].includes((item as WeekRhythmEntry).mode),
    ))
  } catch {
    return []
  }
}

export function saveWeekRhythm(startedAt: string, entries: WeekRhythmEntry[]) {
  window.localStorage.setItem(key(startedAt), JSON.stringify(entries.slice(0, 14)))
}

function officeMeal(current: PlannedMeal, dayIndex: number): PlannedMeal {
  return {
    ...current,
    id: `${dayIndex}-${current.slot}-office-meal`,
    recipeId: `routine-office-${dayIndex}-${current.slot}`,
    title: 'Ofis / okul öğünü',
    subtitle: 'İçerik değişken; kalori ve protein yalnızca bu öğünün günlük hedef payını yaklaşık temsil ediyor.',
    emoji: '🏢',
    source: 'Dışarı',
    estimatedPrice: 0,
    tags: ['ofis', 'plan dışı öğün'],
  }
}

function chooseReplacement(current: PlannedMeal, profile: UserPlanProfile, mode: Exclude<RhythmMode, 'office'>) {
  const candidates = getMealAlternatives(current, profile, 48)
  if (mode === 'outside') {
    return candidates.find((recipe) => recipe.source === 'Dışarı')
      ?? candidates.find((recipe) => recipe.source === 'Sipariş')
  }
  if (mode === 'home') return candidates.find((recipe) => recipe.source === 'Evde')

  const quickWords = ['15 dakika', 'hızlı', 'pratik', '5 dakika', 'az bulaşık', 'tek tava', 'tek tencere', 'airfryer']
  return candidates.find((recipe) => recipe.source === 'Evde' && recipe.tags.some((tag) => quickWords.some((word) => tag.toLocaleLowerCase('tr-TR').includes(word))))
    ?? candidates.find((recipe) => recipe.source === 'Sipariş')
    ?? candidates.find((recipe) => recipe.source === 'Evde')
}

export function applyWeekRhythm(profile: UserPlanProfile, startedAt: string, entries: WeekRhythmEntry[]) {
  const session = loadPlanSession(profile)
  if (!session || session.startedAt !== startedAt) return false

  const days = session.plan.days.map((day) => ({ ...day, meals: day.meals.map((meal) => ({ ...meal })) }))

  entries.forEach((entry) => {
    const day = days[entry.dayIndex]
    if (!day) return
    const mealIndex = day.meals.findIndex((meal) => meal.slot === entry.slot)
    if (mealIndex < 0) return
    const current = day.meals[mealIndex]

    if (entry.mode === 'office') {
      day.meals[mealIndex] = officeMeal(current, entry.dayIndex)
      return
    }

    const replacement = chooseReplacement(current, profile, entry.mode)
    if (!replacement) return
    day.meals[mealIndex] = {
      id: `${entry.dayIndex}-${mealIndex}-${replacement.id}-rhythm`,
      recipeId: replacement.id,
      slot: current.slot,
      title: replacement.title,
      subtitle: replacement.subtitle,
      emoji: replacement.emoji,
      source: replacement.source,
      calories: replacement.calories,
      protein: replacement.protein,
      estimatedPrice: replacement.estimatedPrice * profile.people,
      tags: [...replacement.tags, 'hafta ritmi'],
    }
  })

  const nextPlan = rebuildEditedPlan(profile, days, {
    adjustedForBudget: session.plan.adjustedForBudget,
    convertedOutsideMeals: session.plan.convertedOutsideMeals,
  })
  saveWeekRhythm(startedAt, entries)
  savePlanSession(profile, nextPlan, session.lockedMealKeys, session.mealStatuses, session.seed, session.swapSeed, session.tab, session.startedAt)
  return true
}
