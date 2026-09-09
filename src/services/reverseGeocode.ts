import type { BrowserCoordinates } from './browserLocation'

export type ResolvedLocation = {
  city: string
  district: string
  neighborhood: string
  country: string
  countryCode: string
  displayName: string
  provider: 'OpenStreetMap Nominatim'
}

type NominatimAddress = {
  neighbourhood?: string
  quarter?: string
  suburb?: string
  village?: string
  town?: string
  city_district?: string
  district?: string
  county?: string
  municipality?: string
  city?: string
  province?: string
  state?: string
  country?: string
  country_code?: string
}

type NominatimResponse = {
  display_name?: string
  address?: NominatimAddress
}

function first(...values: Array<string | undefined>) {
  return values.find((value) => Boolean(value?.trim()))?.trim() ?? ''
}

function distinct(value: string, ...others: string[]) {
  if (!value) return ''
  return others.some((other) => other && other.toLocaleLowerCase('tr-TR') === value.toLocaleLowerCase('tr-TR')) ? '' : value
}

export async function reverseGeocodeCoordinates(coords: BrowserCoordinates): Promise<ResolvedLocation> {
  const endpoint = new URL('https://nominatim.openstreetmap.org/reverse')
  endpoint.searchParams.set('format', 'jsonv2')
  endpoint.searchParams.set('lat', String(coords.latitude))
  endpoint.searchParams.set('lon', String(coords.longitude))
  endpoint.searchParams.set('zoom', '18')
  endpoint.searchParams.set('addressdetails', '1')
  endpoint.searchParams.set('accept-language', 'tr')

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Adres çözümleme servisi ${response.status} koduyla yanıt verdi.`)
  }

  const data = await response.json() as NominatimResponse
  const address = data.address ?? {}

  // Türkiye'de OSM adres yapısı bölgeden bölgeye değişebildiği için birkaç alanı sırayla deniyoruz.
  const city = first(address.province, address.state, address.city)
  const districtCandidate = first(address.town, address.city_district, address.district, address.county, address.municipality)
  const neighborhoodCandidate = first(address.neighbourhood, address.quarter, address.suburb, address.village)
  const district = distinct(districtCandidate, city)
  const neighborhood = distinct(neighborhoodCandidate, district, city)

  return {
    city,
    district,
    neighborhood,
    country: address.country ?? '',
    countryCode: (address.country_code ?? '').toUpperCase(),
    displayName: data.display_name ?? [neighborhood, district, city].filter(Boolean).join(', '),
    provider: 'OpenStreetMap Nominatim',
  }
}
