const STORAGE_KEY = 'lokma.app-preferences.v1'

export type AppPreferences = {
  favoriteBiasEnabled: boolean
  reducedMotion: boolean
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  favoriteBiasEnabled: true,
  reducedMotion: false,
}

export function loadAppPreferences(): AppPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_APP_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<AppPreferences>
    return {
      favoriteBiasEnabled: typeof parsed.favoriteBiasEnabled === 'boolean' ? parsed.favoriteBiasEnabled : true,
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : false,
    }
  } catch {
    return DEFAULT_APP_PREFERENCES
  }
}

export function saveAppPreferences(preferences: AppPreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new CustomEvent('lokma:preferences-changed', { detail: preferences }))
}

export function clearAppPreferences() {
  window.localStorage.removeItem(STORAGE_KEY)
}
