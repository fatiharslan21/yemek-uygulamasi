export type AdSurface = 'onboarding' | 'menu-approval' | 'today' | 'week' | 'shopping' | 'recipe' | 'weight' | 'profile'

const STORAGE_KEY = 'lokma.ad-policy.v1'
const AD_FREE_DAYS = 3
const NEVER_AD_SURFACES = new Set<AdSurface>(['onboarding', 'menu-approval', 'recipe', 'weight'])

type AdPolicyState = {
  firstSeenAt: string
}

function loadState(): AdPolicyState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AdPolicyState>
      if (typeof parsed.firstSeenAt === 'string') return { firstSeenAt: parsed.firstSeenAt }
    }
  } catch {
    // Reklam politikası hiçbir zaman uygulama kullanımını engellememeli.
  }

  const created = { firstSeenAt: new Date().toISOString() }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(created))
  return created
}

export function initializeAdPolicy() {
  loadState()
}

export function canShowSponsoredCard(surface: AdSurface, now = new Date()) {
  if (NEVER_AD_SURFACES.has(surface)) return false
  const state = loadState()
  const firstSeen = new Date(state.firstSeenAt)
  const eligibleAt = new Date(firstSeen.getTime() + AD_FREE_DAYS * 24 * 60 * 60 * 1000)
  if (now < eligibleAt) return false
  return surface === 'shopping' || surface === 'week'
}

export const AD_POLICY_SUMMARY = {
  adFreeDays: AD_FREE_DAYS,
  never: [...NEVER_AD_SURFACES],
  eligible: ['shopping', 'week'] as AdSurface[],
  maxNativeCardsPerScreen: 1,
} as const
