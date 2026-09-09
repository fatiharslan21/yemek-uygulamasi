import { localDateKey } from './planCalendar'
import type { UserPlanProfile, WeeklyPlan } from '../types'

const STORAGE_KEY = 'lokma.plan-session.v2'
const LEGACY_STORAGE_KEY = 'lokma.plan-session.v1'

export type DashboardTab = 'today' | 'week' | 'shopping'
export type MealActivityStatus = 'planned' | 'eaten' | 'skipped'

export type SavedPlanSession = {
  version: 2
  profileFingerprint: string
  plan: WeeklyPlan
  lockedMealKeys: string[]
  mealStatuses: Record<string, MealActivityStatus>
  seed: number
  swapSeed: number
  tab: DashboardTab
  startedAt: string
  savedAt: string
}

function profileFingerprint(profile: UserPlanProfile) {
  return JSON.stringify(profile)
}

function parseTab(value: unknown): DashboardTab {
  if (value === 'shopping') return 'shopping'
  if (value === 'week') return 'week'
  return 'today'
}

export function loadPlanSession(profile: UserPlanProfile): SavedPlanSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedPlanSession>
      if (parsed.version !== 2 || parsed.profileFingerprint !== profileFingerprint(profile) || !parsed.plan) return null
      const savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString()
      const savedDay = savedAt.slice(0, 10)
      const resumeTab: DashboardTab = savedDay === localDateKey() ? parseTab(parsed.tab) : 'today'
      return {
        version: 2,
        profileFingerprint: parsed.profileFingerprint,
        plan: parsed.plan,
        lockedMealKeys: Array.isArray(parsed.lockedMealKeys) ? parsed.lockedMealKeys : [],
        mealStatuses: parsed.mealStatuses && typeof parsed.mealStatuses === 'object' ? parsed.mealStatuses : {},
        seed: typeof parsed.seed === 'number' ? parsed.seed : 1,
        swapSeed: typeof parsed.swapSeed === 'number' ? parsed.swapSeed : 10,
        tab: resumeTab,
        startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : localDateKey(),
        savedAt,
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacyRaw) return null
    const legacy = JSON.parse(legacyRaw) as {
      version?: number
      profileFingerprint?: string
      plan?: WeeklyPlan
      lockedMealKeys?: string[]
      seed?: number
      swapSeed?: number
      tab?: 'week' | 'shopping'
      savedAt?: string
    }
    if (legacy.version !== 1 || legacy.profileFingerprint !== profileFingerprint(profile) || !legacy.plan) return null
    const migrated: SavedPlanSession = {
      version: 2,
      profileFingerprint: legacy.profileFingerprint,
      plan: legacy.plan,
      lockedMealKeys: Array.isArray(legacy.lockedMealKeys) ? legacy.lockedMealKeys : [],
      mealStatuses: {},
      seed: typeof legacy.seed === 'number' ? legacy.seed : 1,
      swapSeed: typeof legacy.swapSeed === 'number' ? legacy.swapSeed : 10,
      tab: 'today',
      startedAt: legacy.savedAt ? legacy.savedAt.slice(0, 10) : localDateKey(),
      savedAt: legacy.savedAt ?? new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    return migrated
  } catch {
    return null
  }
}

export function savePlanSession(
  profile: UserPlanProfile,
  plan: WeeklyPlan,
  lockedMealKeys: string[],
  mealStatuses: Record<string, MealActivityStatus>,
  seed: number,
  swapSeed: number,
  tab: DashboardTab,
  startedAt: string,
) {
  const session: SavedPlanSession = {
    version: 2,
    profileFingerprint: profileFingerprint(profile),
    plan,
    lockedMealKeys,
    mealStatuses,
    seed,
    swapSeed,
    tab,
    startedAt,
    savedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearPlanSession() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}
