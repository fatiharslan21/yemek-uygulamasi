import type { BrowserCoordinates } from './browserLocation'

export type NearbyPlaceCategory = 'Market' | 'Restoran'

export type NearbyPlace = {
  id: string
  name: string
  category: NearbyPlaceCategory
  subtype: string
  latitude: number
  longitude: number
  distanceMeters: number
  address: string
  cuisine?: string
  openingHours?: string
  brand?: string
  website?: string
  phone?: string
  delivery?: boolean
  takeaway?: boolean
  provider: 'OpenStreetMap'
}

type OverpassElement = {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat?: number; lon?: number }
  tags?: Record<string, string>
}

type OverpassResponse = {
  elements?: OverpassElement[]
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

function toRadians(value: number) {
  return value * Math.PI / 180
}

function distanceMeters(origin: BrowserCoordinates, latitude: number, longitude: number) {
  const earthRadius = 6371000
  const lat1 = toRadians(origin.latitude)
  const lat2 = toRadians(latitude)
  const deltaLat = toRadians(latitude - origin.latitude)
  const deltaLon = toRadians(longitude - origin.longitude)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function addressFromTags(tags: Record<string, string>) {
  const street = tags['addr:street'] ?? tags['addr:place'] ?? ''
  const house = tags['addr:housenumber'] ?? ''
  const suburb = tags['addr:neighbourhood'] ?? tags['addr:quarter'] ?? tags['addr:suburb'] ?? ''
  return [house && street ? `${street} ${house}` : street || house, suburb].filter(Boolean).join(', ')
}

function marketSubtype(tags: Record<string, string>) {
  if (tags.shop === 'supermarket') return 'Süpermarket'
  if (tags.shop === 'convenience') return 'Market / bakkal'
  if (tags.shop === 'greengrocer') return 'Manav'
  return 'Market'
}

function restaurantSubtype(tags: Record<string, string>) {
  if (tags.amenity === 'fast_food') return 'Hızlı yemek'
  if (tags.amenity === 'cafe') return 'Kafe'
  return 'Restoran'
}

function yesNo(value?: string) {
  if (!value) return undefined
  const normalized = value.toLocaleLowerCase('en-US')
  if (['yes', 'only', 'designated'].includes(normalized)) return true
  if (['no', 'none'].includes(normalized)) return false
  return undefined
}

function firstTag(tags: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = tags[key]?.trim()
    if (value) return value
  }
  return undefined
}

function buildQuery(coords: BrowserCoordinates, radius: number) {
  const around = `(around:${radius},${coords.latitude},${coords.longitude})`
  return `[out:json][timeout:18];(
    node["shop"~"^(supermarket|convenience|greengrocer)$"]${around};
    way["shop"~"^(supermarket|convenience|greengrocer)$"]${around};
    relation["shop"~"^(supermarket|convenience|greengrocer)$"]${around};
    node["amenity"~"^(restaurant|fast_food|cafe)$"]${around};
    way["amenity"~"^(restaurant|fast_food|cafe)$"]${around};
    relation["amenity"~"^(restaurant|fast_food|cafe)$"]${around};
  );out center tags;`
}

async function requestEndpoint(endpoint: string, query: string) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 16000)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({ data: query }).toString(),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Nearby servisi ${response.status} koduyla yanıt verdi.`)
    return await response.json() as OverpassResponse
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function searchNearbyPlaces(coords: BrowserCoordinates, radius = 1800): Promise<NearbyPlace[]> {
  const query = buildQuery(coords, radius)
  let lastError: unknown
  let data: OverpassResponse | null = null

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      data = await requestEndpoint(endpoint, query)
      break
    } catch (error) {
      lastError = error
    }
  }

  if (!data) {
    if (lastError instanceof Error && lastError.name === 'AbortError') {
      throw new Error('Yakındaki işletme araması zaman aşımına uğradı. Biraz sonra tekrar deneyebilirsin.')
    }
    throw lastError instanceof Error ? lastError : new Error('Yakındaki işletmeler alınamadı.')
  }

  const places = (data.elements ?? []).flatMap((element): NearbyPlace[] => {
    const tags = element.tags ?? {}
    const latitude = element.lat ?? element.center?.lat
    const longitude = element.lon ?? element.center?.lon
    const name = tags.name ?? tags.brand
    if (!name || latitude == null || longitude == null) return []

    const isMarket = Boolean(tags.shop)
    const category: NearbyPlaceCategory = isMarket ? 'Market' : 'Restoran'

    return [{
      id: `${element.type}-${element.id}`,
      name,
      category,
      subtype: isMarket ? marketSubtype(tags) : restaurantSubtype(tags),
      latitude,
      longitude,
      distanceMeters: distanceMeters(coords, latitude, longitude),
      address: addressFromTags(tags),
      cuisine: tags.cuisine,
      openingHours: tags.opening_hours,
      brand: tags.brand,
      website: firstTag(tags, 'website', 'contact:website', 'url'),
      phone: firstTag(tags, 'phone', 'contact:phone'),
      delivery: yesNo(tags.delivery),
      takeaway: yesNo(tags.takeaway),
      provider: 'OpenStreetMap',
    }]
  })

  const deduped = new Map<string, NearbyPlace>()
  places
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .forEach((place) => {
      const key = `${place.category}-${place.name.toLocaleLowerCase('tr-TR')}-${Math.round(place.distanceMeters / 40)}`
      if (!deduped.has(key)) deduped.set(key, place)
    })

  const all = [...deduped.values()]
  const markets = all.filter((place) => place.category === 'Market').slice(0, 12)
  const restaurants = all.filter((place) => place.category === 'Restoran').slice(0, 16)
  return [...markets, ...restaurants]
}
