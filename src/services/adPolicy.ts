export type AdSurface = 'onboarding' | 'menu-approval' | 'today' | 'week' | 'shopping' | 'recipe' | 'weight' | 'profile'

const STORAGE_KEY = 'lokma.ad-policy.v2'
const LEGACY_STORAGE_KEY = 'lokma.ad-policy.v1'
const AD_FREE_DAYS = 7
const MIN_HOURS_BETWEEN_SPONSORED_CARDS = 24
const NEVER_AD_SURFACES = new Set<AdSurface>(['onboarding', 'menu-approval', 'today', 'recipe', 'weight', 'profile'])

type AdPolicyState = {
  firstSeenAt: string
  lastSponsoredAt?: string
}

function validDate(value: unknown) {
  if (typeof value !== 'string') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : value
}

function loadState(): AdPolicyState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AdPolicyState>
      const firstSeenAt = validDate(parsed.firstSeenAt)
      if (firstSeenAt) return { firstSeenAt, lastSponsoredAt: validDate(parsed.lastSponsoredAt) }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Partial<AdPolicyState>
      const firstSeenAt = validDate(legacy.firstSeenAt)
      if (firstSeenAt) {
        const migrated = { firstSeenAt, lastSponsoredAt: undefined }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        window.localStorage.removeItem(LEGACY_STORAGE_KEY)
        return migrated
      }
    }
  } catch {
    // Reklam politikası hiçbir zaman uygulama kullanımını engellememeli.
  }

  const created: AdPolicyState = { firstSeenAt: new Date().toISOString() }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(created))
  return created
}

function saveState(state: AdPolicyState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Reklam kaydı başarısız olsa bile ürün deneyimi bozulmamalı.
  }
}

export function initializeAdPolicy() {
  loadState()
}

export function canShowSponsoredCard(surface: AdSurface, now = new Date()) {
  if (NEVER_AD_SURFACES.has(surface)) return false
  if (surface !== 'shopping' && surface !== 'week') return false

  const state = loadState()
  const firstSeen = new Date(state.firstSeenAt)
  const eligibleAt = new Date(firstSeen.getTime() + AD_FREE_DAYS * 24 * 60 * 60 * 1000)
  if (now < eligibleAt) return false

  if (state.lastSponsoredAt) {
    const lastSponsored = new Date(state.lastSponsoredAt)
    const nextEligible = new Date(lastSponsored.getTime() + MIN_HOURS_BETWEEN_SPONSORED_CARDS * 60 * 60 * 1000)
    if (now < nextEligible) return false
  }

  return true
}

export function recordSponsoredCardImpression(now = new Date()) {
  const state = loadState()
  saveState({ ...state, lastSponsoredAt: now.toISOString() })
}

export const AD_POLICY_SUMMARY = {
  adFreeDays: AD_FREE_DAYS,
  never: [...NEVER_AD_SURFACES],
  eligible: ['shopping', 'week'] as AdSurface[],
  maxNativeCardsPerScreen: 1,
  minHoursBetweenSponsoredCards: MIN_HOURS_BETWEEN_SPONSORED_CARDS,
} as const
