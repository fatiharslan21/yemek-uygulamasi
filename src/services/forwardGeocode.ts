import type { BrowserCoordinates } from './browserLocation'

type NominatimSearchItem = {
  lat: string
  lon: string
  display_name?: string
}

export type GeocodedLocation = {
  coords: BrowserCoordinates
  displayName: string
  provider: 'OpenStreetMap Nominatim'
}

export async function geocodePlanLocation(city: string, district: string, neighborhood: string): Promise<GeocodedLocation> {
  const query = [neighborhood, district, city, 'Türkiye'].filter(Boolean).join(', ')
  if (!query.trim()) throw new Error('Konum metni boş.')

  const endpoint = new URL('https://nominatim.openstreetmap.org/search')
  endpoint.searchParams.set('format', 'jsonv2')
  endpoint.searchParams.set('limit', '1')
  endpoint.searchParams.set('countrycodes', 'tr')
  endpoint.searchParams.set('accept-language', 'tr')
  endpoint.searchParams.set('q', query)

  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Konum arama servisi ${response.status} koduyla yanıt verdi.`)

  const data = await response.json() as NominatimSearchItem[]
  const first = data[0]
  if (!first) throw new Error('Bu il / ilçe / mahalle için harita noktası bulunamadı.')

  const latitude = Number(first.lat)
  const longitude = Number(first.lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Konum koordinatı geçersiz döndü.')

  return {
    coords: { latitude, longitude, accuracy: 0 },
    displayName: first.display_name ?? query,
    provider: 'OpenStreetMap Nominatim',
  }
}
