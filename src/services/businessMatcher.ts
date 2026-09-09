import type { NearbyPlace } from './nearbyPlaces'
import type { PlannedMeal } from '../types'

function normalize(value: string) {
  return value.toLocaleLowerCase('tr-TR')
}

const KEYWORD_GROUPS: Array<{ meal: string[]; business: string[] }> = [
  { meal: ['tavuk', 'chicken'], business: ['chicken', 'tavuk', 'grill', 'ızgara', 'kebab', 'kebap'] },
  { meal: ['köfte', 'et', 'beef'], business: ['meat', 'beef', 'köfte', 'kebab', 'kebap', 'grill', 'steak'] },
  { meal: ['balık', 'fish', 'somon'], business: ['fish', 'seafood', 'balık', 'deniz'] },
  { meal: ['makarna', 'pasta'], business: ['italian', 'pasta', 'pizza', 'italyan'] },
  { meal: ['pizza'], business: ['pizza', 'italian', 'italyan'] },
  { meal: ['burger'], business: ['burger', 'hamburger', 'fast_food'] },
  { meal: ['dürüm', 'wrap'], business: ['kebab', 'kebap', 'dürüm', 'turkish', 'fast_food'] },
  { meal: ['vegan', 'vejetaryen', 'sebze', 'nohut', 'mercimek'], business: ['vegan', 'vegetarian', 'salad', 'healthy', 'vejetaryen'] },
  { meal: ['kahve', 'kahvaltı', 'tost'], business: ['cafe', 'coffee', 'breakfast', 'kahvaltı'] },
]

export function restaurantMatchScore(place: NearbyPlace, meal: PlannedMeal) {
  if (place.category !== 'Restoran') return -999

  const mealText = normalize([meal.title, meal.subtitle, ...meal.tags].join(' '))
  const businessText = normalize([place.name, place.subtype, place.cuisine ?? ''].join(' '))
  let keywordScore = 0

  KEYWORD_GROUPS.forEach((group) => {
    if (!group.meal.some((word) => mealText.includes(word))) return
    if (group.business.some((word) => businessText.includes(word))) keywordScore += 3
  })

  if (place.cuisine) keywordScore += 0.35
  if (place.subtype === 'Restoran') keywordScore += 0.2
  if (place.subtype === 'Hızlı yemek' && meal.source === 'Sipariş') keywordScore += 0.3

  const distancePenalty = Math.min(4, place.distanceMeters / 700)
  return keywordScore - distancePenalty
}

export function rankRestaurantsForMeal(places: NearbyPlace[], meal: PlannedMeal) {
  return places
    .filter((place) => place.category === 'Restoran')
    .map((place) => ({ place, score: restaurantMatchScore(place, meal) }))
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score
      return left.place.distanceMeters - right.place.distanceMeters
    })
    .map((item) => item.place)
}
