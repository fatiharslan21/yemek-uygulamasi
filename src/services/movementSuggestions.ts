import type { UserPlanProfile } from '../types'

export type MovementSuggestion = {
  id: string
  emoji: string
  title: string
  minutes: number
  intensity: 'Hafif' | 'Orta'
  description: string
}

const STORAGE_PREFIX = 'lokma.movement-done.v1:'

export function movementSuggestions(profile: UserPlanProfile): MovementSuggestion[] {
  const base: MovementSuggestion[] = [
    { id: 'walk-10', emoji: '🚶', title: 'Kısa yürüyüş', minutes: profile.activity === 'Hareketsiz' ? 10 : 15, intensity: 'Hafif', description: 'Konuşabilecek tempoda kısa bir yürüyüş.' },
    { id: 'mobility-8', emoji: '🧘', title: 'Mobilite molası', minutes: 8, intensity: 'Hafif', description: 'Boyun, omuz, kalça ve ayak bileğine nazik hareket açıklığı.' },
    { id: 'strength-15', emoji: '🏋️', title: 'Ekipmansız güç', minutes: profile.activity === 'Çok aktif' ? 20 : 15, intensity: 'Orta', description: 'Kontrollü squat, duvar şınavı ve köprü gibi temel hareketler.' },
  ]

  if (profile.goal === 'Bulk') return [base[2], base[0], base[1]]
  if (profile.goal === 'Kilo ver') return [base[0], base[2], base[1]]
  return base
}

function storageKey(dateKey: string) {
  return `${STORAGE_PREFIX}${dateKey}`
}

export function loadCompletedMovement(dateKey: string) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(dateKey)) ?? '[]') as unknown
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

export function saveCompletedMovement(dateKey: string, ids: Set<string>) {
  window.localStorage.setItem(storageKey(dateKey), JSON.stringify([...ids]))
}
