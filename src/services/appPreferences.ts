const STORAGE_KEY = 'lokma.app-preferences.v1'

export type AppPreferences = {
  favoriteBiasEnabled: boolean
  reducedMotion: boolean
  largerText: boolean
  highContrast: boolean
  useLatestWeightForRenewal: boolean
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  favoriteBiasEnabled: true,
  reducedMotion: false,
  largerText: false,
  highContrast: false,
  useLatestWeightForRenewal: true,
}

export function loadAppPreferences(): AppPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APP_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<AppPreferences>
    return {
      favoriteBiasEnabled: typeof parsed.favoriteBiasEnabled === 'boolean' ? parsed.favoriteBiasEnabled : true,
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : false,
      largerText: typeof parsed.largerText === 'boolean' ? parsed.largerText : false,
      highContrast: typeof parsed.highContrast === 'boolean' ? parsed.highContrast : false,
      useLatestWeightForRenewal: typeof parsed.useLatestWeightForRenewal === 'boolean' ? parsed.useLatestWeightForRenewal : true,
    }
  } catch {
    return DEFAULT_APP_PREFERENCES
  }
}

export function saveAppPreferences(preferences: AppPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } finally {
    window.dispatchEvent(new CustomEvent('lokma:preferences-changed', { detail: preferences }))
  }
}

export function clearAppPreferences() {
  window.localStorage.removeItem(STORAGE_KEY)
}
