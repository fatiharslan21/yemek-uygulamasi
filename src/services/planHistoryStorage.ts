import type { UserPlanProfile, WeeklyPlan } from '../types'

const STORAGE_KEY = 'lokma.plan-history.v1'
const MAX_HISTORY = 16

type ArchivedMealStatus = 'planned' | 'eaten' | 'skipped'

export type PlanHistoryEntry = {
  id: string
  startedAt: string
  archivedAt: string
  profileSummary: {
    goal: UserPlanProfile['goal']
    diet: UserPlanProfile['diet']
    days: number
    budget: number
    people: number
    location: string
  }
  totalCost: number
  averageCalories: number
  averageProtein: number
  eatenMeals: number
  skippedMeals: number
  totalMeals: number
  completionPct: number
  daySummaries: Array<{
    name: string
    meals: string[]
  }>
}

export function loadPlanHistory(): PlanHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, MAX_HISTORY) : []
  } catch {
    return []
  }
}

export function archivePlan(args: {
  profile: UserPlanProfile
  plan: WeeklyPlan
  startedAt: string
  mealStatuses: Record<string, ArchivedMealStatus>
}) {
  const { profile, plan, startedAt, mealStatuses } = args
  const meals = plan.days.flatMap((day) => day.meals)
  const totalMeals = meals.length
  const eatenMeals = meals.filter((meal) => mealStatuses[meal.id] === 'eaten').length
  const skippedMeals = meals.filter((meal) => mealStatuses[meal.id] === 'skipped').length
  const handledMeals = eatenMeals + skippedMeals

  const entry: PlanHistoryEntry = {
    id: `${startedAt}-${Date.now()}`,
    startedAt,
    archivedAt: new Date().toISOString(),
    profileSummary: {
      goal: profile.goal,
      diet: profile.diet,
      days: profile.days,
      budget: profile.budget,
      people: profile.people,
      location: [profile.neighborhood, profile.district, profile.city].filter(Boolean).join(', '),
    },
    totalCost: plan.totalCost,
    averageCalories: plan.averageCalories,
    averageProtein: plan.averageProtein,
    eatenMeals,
    skippedMeals,
    totalMeals,
    completionPct: Math.round(handledMeals / Math.max(1, totalMeals) * 100),
    daySummaries: plan.days.map((day) => ({
      name: day.name,
      meals: day.meals.map((meal) => meal.title),
    })),
  }

  const current = loadPlanHistory().filter((item) => item.startedAt !== startedAt)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current].slice(0, MAX_HISTORY)))
}

export function clearPlanHistory() {
  window.localStorage.removeItem(STORAGE_KEY)
}
