import type { UserPlanProfile } from '../types'

const STORAGE_KEY = 'lokma.app.v1'

type SavedAppState = {
  version: 1
  onboardingCompleted: boolean
  profile: UserPlanProfile
  savedAt: string
}

export function loadSavedAppState(): SavedAppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedAppState>
    if (parsed.version !== 1 || !parsed.onboardingCompleted || !parsed.profile) return null

    const profile = parsed.profile as UserPlanProfile
    return {
      version: 1,
      onboardingCompleted: true,
      profile: {
        ...profile,
        cookingEquipment: Array.isArray(profile.cookingEquipment) ? profile.cookingEquipment : ['Ocak', 'Fırın'],
        allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
        mealSplit: profile.mealSplit ?? { home: 60, delivery: 30, dineOut: 10 },
      },
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveAppState(profile: UserPlanProfile) {
  const state: SavedAppState = {
    version: 1,
    onboardingCompleted: true,
    profile,
    savedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearAppState() {
  window.localStorage.removeItem(STORAGE_KEY)
}
