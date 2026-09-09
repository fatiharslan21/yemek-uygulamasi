import type { UserPlanProfile, WeeklyPlan } from '../types'

const STORAGE_KEY = 'lokma.plan-session.v1'

export type SavedPlanSession = {
  version: 1
  profileFingerprint: string
  plan: WeeklyPlan
  lockedMealKeys: string[]
  seed: number
  swapSeed: number
  tab: 'week' | 'shopping'
  savedAt: string
}

function profileFingerprint(profile: UserPlanProfile) {
  return JSON.stringify(profile)
}

export function loadPlanSession(profile: UserPlanProfile): SavedPlanSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedPlanSession>
    if (parsed.version !== 1 || parsed.profileFingerprint !== profileFingerprint(profile) || !parsed.plan) return null

    return {
      version: 1,
      profileFingerprint: parsed.profileFingerprint,
      plan: parsed.plan,
      lockedMealKeys: Array.isArray(parsed.lockedMealKeys) ? parsed.lockedMealKeys : [],
      seed: typeof parsed.seed === 'number' ? parsed.seed : 1,
      swapSeed: typeof parsed.swapSeed === 'number' ? parsed.swapSeed : 10,
      tab: parsed.tab === 'shopping' ? 'shopping' : 'week',
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function savePlanSession(
  profile: UserPlanProfile,
  plan: WeeklyPlan,
  lockedMealKeys: string[],
  seed: number,
  swapSeed: number,
  tab: 'week' | 'shopping',
) {
  const session: SavedPlanSession = {
    version: 1,
    profileFingerprint: profileFingerprint(profile),
    plan,
    lockedMealKeys,
    seed,
    swapSeed,
    tab,
    savedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearPlanSession() {
  window.localStorage.removeItem(STORAGE_KEY)
}
