import type { ActivityLevel, UserPlanProfile } from '../types'

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  Hareketsiz: 1.2,
  'Az aktif': 1.375,
  Aktif: 1.55,
  'Çok aktif': 1.725,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function calculateNutritionTargets(profile: UserPlanProfile) {
  const sexOffset = profile.sex === 'Erkek' ? 5 : -161
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexOffset
  const maintenance = bmr * ACTIVITY_FACTORS[profile.activity]
  const goalDelta = profile.goal === 'Kilo ver' ? -400 : profile.goal === 'Bulk' ? 300 : 0
  const calories = Math.round(clamp(maintenance + goalDelta, 1200, 4200) / 50) * 50
  const proteinMultiplier = profile.goal === 'Kilo ver' || profile.goal === 'Bulk' ? 1.8 : 1.5

  return {
    calories,
    protein: Math.round(profile.weight * proteinMultiplier),
  }
}
