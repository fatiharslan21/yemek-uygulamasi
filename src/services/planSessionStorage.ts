import { localDateKey } from './planCalendar'
import { archivePlan } from './planHistoryStorage'
import type { UserPlanProfile, WeeklyPlan } from '../types'

const STORAGE_KEY = 'lokma.plan-session.v3'
const V2_STORAGE_KEY = 'lokma.plan-session.v2'
const LEGACY_STORAGE_KEY = 'lokma.plan-session.v1'

export type DashboardTab = 'today' | 'week' | 'shopping'
export type MealActivityStatus = 'planned' | 'eaten' | 'skipped'

export type SavedPlanSession = {
  version: 3
  profileFingerprint: string
  profileSnapshot: UserPlanProfile
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

function resumeTab(value: unknown, savedAt: string): DashboardTab {
  return savedAt.slice(0, 10) === localDateKey() ? parseTab(value) : 'today'
}

function writeSession(session: SavedPlanSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.localStorage.removeItem(V2_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export function loadPlanSession(profile: UserPlanProfile): SavedPlanSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedPlanSession>
      if (parsed.version !== 3 || parsed.profileFingerprint !== profileFingerprint(profile) || !parsed.plan || !parsed.profileSnapshot) return null
      const savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString()
      return {
        version: 3,
        profileFingerprint: parsed.profileFingerprint,
        profileSnapshot: parsed.profileSnapshot,
        plan: parsed.plan,
        lockedMealKeys: Array.isArray(parsed.lockedMealKeys) ? parsed.lockedMealKeys : [],
        mealStatuses: parsed.mealStatuses && typeof parsed.mealStatuses === 'object' ? parsed.mealStatuses : {},
        seed: typeof parsed.seed === 'number' ? parsed.seed : 1,
        swapSeed: typeof parsed.swapSeed === 'number' ? parsed.swapSeed : 10,
        tab: resumeTab(parsed.tab, savedAt),
        startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : localDateKey(),
        savedAt,
      }
    }

    const v2Raw = window.localStorage.getItem(V2_STORAGE_KEY)
    if (v2Raw) {
      const v2 = JSON.parse(v2Raw) as {
        version?: number
        profileFingerprint?: string
        plan?: WeeklyPlan
        lockedMealKeys?: string[]
        mealStatuses?: Record<string, MealActivityStatus>
        seed?: number
        swapSeed?: number
        tab?: DashboardTab
        startedAt?: string
        savedAt?: string
      }
      if (v2.version === 2 && v2.profileFingerprint === profileFingerprint(profile) && v2.plan) {
        const savedAt = v2.savedAt ?? new Date().toISOString()
        const migrated: SavedPlanSession = {
          version: 3,
          profileFingerprint: v2.profileFingerprint,
          profileSnapshot: profile,
          plan: v2.plan,
          lockedMealKeys: Array.isArray(v2.lockedMealKeys) ? v2.lockedMealKeys : [],
          mealStatuses: v2.mealStatuses && typeof v2.mealStatuses === 'object' ? v2.mealStatuses : {},
          seed: typeof v2.seed === 'number' ? v2.seed : 1,
          swapSeed: typeof v2.swapSeed === 'number' ? v2.swapSeed : 10,
          tab: resumeTab(v2.tab, savedAt),
          startedAt: typeof v2.startedAt === 'string' ? v2.startedAt : localDateKey(),
          savedAt,
        }
        writeSession(migrated)
        return migrated
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
      savedAt?: string
    }
    if (legacy.version !== 1 || legacy.profileFingerprint !== profileFingerprint(profile) || !legacy.plan) return null
    const migrated: SavedPlanSession = {
      version: 3,
      profileFingerprint: legacy.profileFingerprint,
      profileSnapshot: profile,
      plan: legacy.plan,
      lockedMealKeys: Array.isArray(legacy.lockedMealKeys) ? legacy.lockedMealKeys : [],
      mealStatuses: {},
      seed: typeof legacy.seed === 'number' ? legacy.seed : 1,
      swapSeed: typeof legacy.swapSeed === 'number' ? legacy.swapSeed : 10,
      tab: 'today',
      startedAt: legacy.savedAt ? legacy.savedAt.slice(0, 10) : localDateKey(),
      savedAt: legacy.savedAt ?? new Date().toISOString(),
    }
    writeSession(migrated)
    return migrated
  } catch {
    return null
  }
}

function archivePreviousSession(nextProfile: UserPlanProfile, nextStartedAt: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const previous = JSON.parse(raw) as Partial<SavedPlanSession>
    if (previous.version !== 3 || !previous.plan || !previous.profileSnapshot || typeof previous.startedAt !== 'string') return

    const changedPlanCycle = previous.startedAt !== nextStartedAt
    const changedProfile = previous.profileFingerprint !== profileFingerprint(nextProfile)
    if (!changedPlanCycle && !changedProfile) return

    archivePlan({
      profile: previous.profileSnapshot,
      plan: previous.plan,
      startedAt: previous.startedAt,
      mealStatuses: previous.mealStatuses && typeof previous.mealStatuses === 'object' ? previous.mealStatuses : {},
    })
  } catch {
    // Geçmiş arşivi hiçbir zaman aktif planın kaydedilmesini engellememeli.
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
  archivePreviousSession(profile, startedAt)

  const session: SavedPlanSession = {
    version: 3,
    profileFingerprint: profileFingerprint(profile),
    profileSnapshot: profile,
    plan,
    lockedMealKeys,
    mealStatuses,
    seed,
    swapSeed,
    tab,
    startedAt,
    savedAt: new Date().toISOString(),
  }
  writeSession(session)
}

export function clearPlanSession() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(V2_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}
