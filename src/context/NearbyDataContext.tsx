import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { NearbyPlace } from '../services/nearbyPlaces'

type NearbyDataContextValue = {
  places: NearbyPlace[]
  setPlaces: (places: NearbyPlace[]) => void
  restaurantAssignments: Record<string, NearbyPlace>
  assignRestaurant: (mealId: string, place?: NearbyPlace) => void
  preferredMarket?: NearbyPlace
  setPreferredMarket: (place?: NearbyPlace) => void
}

const NearbyDataContext = createContext<NearbyDataContextValue | null>(null)

export function NearbyDataProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [restaurantAssignments, setRestaurantAssignments] = useState<Record<string, NearbyPlace>>({})
  const [preferredMarket, setPreferredMarket] = useState<NearbyPlace | undefined>()

  const assignRestaurant = (mealId: string, place?: NearbyPlace) => {
    setRestaurantAssignments((current) => {
      const next = { ...current }
      if (place) next[mealId] = place
      else delete next[mealId]
      return next
    })
  }

  const value = useMemo<NearbyDataContextValue>(() => ({
    places,
    setPlaces,
    restaurantAssignments,
    assignRestaurant,
    preferredMarket,
    setPreferredMarket,
  }), [places, restaurantAssignments, preferredMarket])

  return <NearbyDataContext.Provider value={value}>{children}</NearbyDataContext.Provider>
}

export function useNearbyData() {
  const context = useContext(NearbyDataContext)
  if (!context) throw new Error('useNearbyData must be used inside NearbyDataProvider')
  return context
}
