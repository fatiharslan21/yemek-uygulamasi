export type AdPlacement = 'today-feed' | 'week-transition' | 'shopping-complete'

export type MonetizationConfig = {
  adsEnabled: boolean
  premiumEnabled: boolean
  allowedPlacements: AdPlacement[]
  blockedSurfaces: string[]
}

// Local MVP'de reklam/premium kapalıdır. Bu dosya yalnızca gelecekteki SDK entegrasyonunun
// ürün kurallarına uymasını sağlamak için var; hiçbir reklam sağlayıcısı bağlı değildir.
export const MONETIZATION: MonetizationConfig = {
  adsEnabled: false,
  premiumEnabled: false,
  allowedPlacements: ['today-feed', 'week-transition', 'shopping-complete'],
  blockedSurfaces: [
    'first-run-onboarding',
    'location-permission',
    'allergy-and-sensitivity-input',
    'recipe-cooking-steps',
    'error-recovery',
  ],
}
