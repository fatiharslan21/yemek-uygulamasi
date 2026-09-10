import { useMemo } from 'react'
import { useNearbyData } from '../context/NearbyDataContext'
import { rankRestaurantsForMeal } from '../services/businessMatcher'
import type { PlannedMeal } from '../types'
import '../daily-companion.css'

function distanceText(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

export function TodayRestaurantStrip({ meal, onOpenDetail }: { meal?: PlannedMeal; onOpenDetail: () => void }) {
  const { places, restaurantAssignments } = useNearbyData()
  const candidates = useMemo(() => meal ? rankRestaurantsForMeal(places, meal).slice(0, 3) : [], [places, meal])
  if (!meal || meal.source === 'Evde') return null
  const assigned = restaurantAssignments[meal.id]

  return (
    <section className="daily-mini-card today-restaurant-strip">
      <div className="daily-mini-head"><div><span>📍</span><div><small>{meal.slot} için yakın seçenek</small><h3>{assigned ? assigned.name : candidates.length ? 'Yakında uygun restoranlar var' : 'Restoranları çevrenden bul'}</h3></div></div><button type="button" onClick={onOpenDetail}>{assigned ? 'Değiştir' : 'Bak'}</button></div>
      {assigned ? <p>{assigned.subtype} • {distanceText(assigned.distanceMeters)}{assigned.cuisine ? ` • ${assigned.cuisine.split(';').join(', ')}` : ''}</p> : candidates.length ? <div className="restaurant-mini-list">{candidates.map((place) => <span key={place.id}>{place.name}<small>{distanceText(place.distanceMeters)}</small></span>)}</div> : <p>Konum iznin varsa restoran taramasını Hafta ekranından yapabilir, sonra bu öğüne bağlayabilirsin.</p>}
    </section>
  )
}
