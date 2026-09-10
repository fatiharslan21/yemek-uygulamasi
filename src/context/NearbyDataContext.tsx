import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { NearbyPlace } from '../services/nearbyPlaces'

type NearbyDataContextValue = {
  places: NearbyPlace[]
  setPlaces: (places: NearbyPlace[]) => void
  restaurantAssignments: Record<string, NearbyPlace>
  assignRestaurant: (mealId: string, place?: NearbyPlace) => void
  preferredMarket?: NearbyPlace
  setPreferredMarket: (place?: NearbyPlace) => void
}

const ASSIGNMENTS_KEY = 'lokma.restaurant-assignments.v1'
const MARKET_KEY = 'lokma.preferred-market.v1'
const NearbyDataContext = createContext<NearbyDataContextValue | null>(null)

function loadAssignments() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSIGNMENTS_KEY) ?? '{}') as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {} as Record<string, NearbyPlace>
    return parsed as Record<string, NearbyPlace>
  } catch {
    return {} as Record<string, NearbyPlace>
  }
}

function loadPreferredMarket() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MARKET_KEY) ?? 'null') as NearbyPlace | null
    return parsed && typeof parsed === 'object' && parsed.category === 'Market' ? parsed : undefined
  } catch {
    return undefined
  }
}

export function NearbyDataProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [restaurantAssignments, setRestaurantAssignments] = useState<Record<string, NearbyPlace>>(() => loadAssignments())
  const [preferredMarket, setPreferredMarket] = useState<NearbyPlace | undefined>(() => loadPreferredMarket())

  useEffect(() => {
    window.localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(restaurantAssignments))
  }, [restaurantAssignments])

  useEffect(() => {
    if (preferredMarket) window.localStorage.setItem(MARKET_KEY, JSON.stringify(preferredMarket))
    else window.localStorage.removeItem(MARKET_KEY)
  }, [preferredMarket])

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
