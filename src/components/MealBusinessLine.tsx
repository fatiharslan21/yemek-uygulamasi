import { useNearbyData } from '../context/NearbyDataContext'
import type { PlannedMeal } from '../types'
import '../business-link.css'

function distanceText(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

export function MealBusinessLine({ meal }: { meal: PlannedMeal }) {
  const { restaurantAssignments } = useNearbyData()
  if (meal.source === 'Evde') return null

  const place = restaurantAssignments[meal.id]
  if (!place) return null

  return (
    <div className="meal-business-line" title={`${place.name} • ${distanceText(place.distanceMeters)}`}>
      📍 <span>{place.name} • {distanceText(place.distanceMeters)}</span>
    </div>
  )
}
