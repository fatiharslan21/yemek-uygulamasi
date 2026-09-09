import { useState } from 'react'
import { useNearbyData } from '../context/NearbyDataContext'
import { geocodePlanLocation } from '../services/forwardGeocode'
import { searchNearbyPlaces, type NearbyPlace } from '../services/nearbyPlaces'
import type { BrowserCoordinates } from '../services/browserLocation'
import type { UserPlanProfile } from '../types'
import '../nearby.css'

type NearbyPlacesPanelProps = {
  profile: UserPlanProfile
  coords?: BrowserCoordinates
  locationLabel: string
}

type SearchState = 'idle' | 'loading' | 'success' | 'error'

function distanceText(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

function cuisineText(value: string) {
  return value.split(';').join(', ')
}

function externalWebsite(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export function NearbyPlacesPanel({ profile, coords, locationLabel }: NearbyPlacesPanelProps) {
  const { setPlaces: setSharedPlaces } = useNearbyData()
  const [status, setStatus] = useState<SearchState>('idle')
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [searchCenter, setSearchCenter] = useState<BrowserCoordinates | undefined>(coords)

  const runSearch = async () => {
    setStatus('loading')
    setMessage(null)
    try {
      let center = coords
      let sourceText = 'canlı konumun'
      if (!center) {
        const geocoded = await geocodePlanLocation(profile.city, profile.district, profile.neighborhood)
        center = geocoded.coords
        sourceText = 'il / ilçe / mahalle bilgin'
      }

      setSearchCenter(center)
      const result = await searchNearbyPlaces(center, 1800)
      const restaurants = result.filter((place) => place.category === 'Restoran')
      setPlaces(restaurants)
      setSharedPlaces(restaurants)
      setStatus('success')
      setMessage(restaurants.length
        ? `Yaklaşık 1,8 km çevrede ${restaurants.length} restoran bulundu. Arama merkezi ${sourceText} üzerinden belirlendi.`
        : 'Bu yarıçapta isim bilgisi bulunan restoran bulunamadı. Bölgedeki açık veri kapsamı eksik olabilir.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Restoranlar aranırken bir sorun oluştu.')
    }
  }

  return (
    <section className="shell nearby-section">
      <div className="nearby-heading">
        <div>
          <span className="eyebrow">📍 Yakındaki restoranlar</span>
          <h2>Dışarıda veya siparişte nereden yiyebilirsin?</h2>
          <p>Konumuna göre yakındaki restoranları listeliyoruz. İşletme kaydında varsa mutfak türü, açılış saati, web sitesi, telefon ve servis bilgilerini de gösteriyoruz.</p>
        </div>
        <button type="button" className="nearby-search-button" disabled={status === 'loading'} onClick={runSearch}>
          {status === 'loading' ? 'Restoranlar aranıyor…' : status === 'success' ? '↻ Yeniden ara' : '⌖ Restoranları bul'}
        </button>
      </div>

      <div className="nearby-location-strip">
        <span>📌</span>
        <div><strong>{locationLabel || [profile.neighborhood, profile.district, profile.city].filter(Boolean).join(', ')}</strong><small>{coords ? 'Canlı koordinat üzerinden aramaya hazır' : 'Seçtiğin konum harita noktasına çevrilerek aranacak'}</small></div>
        {searchCenter && <code>{searchCenter.latitude.toFixed(5)}, {searchCenter.longitude.toFixed(5)}</code>}
      </div>

      {message && <div className={`nearby-message ${status}`}><span>{status === 'error' ? '⚠️' : status === 'loading' ? '⏳' : '✨'}</span><p>{message}</p></div>}

      {status === 'idle' && (
        <div className="nearby-empty-state">
          <div className="nearby-radar"><span>🍽️</span><i /><i /><i /></div>
          <div><strong>İstersen çevrendeki restoranları bul.</strong><p>Yaklaşık 1,8 km yarıçaptaki restoran, fast-food ve yemek hizmeti veren işletmeleri arayacağız.</p></div>
        </div>
      )}

      {status === 'success' && places.length > 0 && (
        <div className="nearby-grid">
          {places.map((place, index) => (
            <article className="nearby-place-card" key={place.id}>
              <div className="nearby-place-rank">{String(index + 1).padStart(2, '0')}</div>
              <div className="nearby-place-icon">🍽️</div>
              <div className="nearby-place-main">
                <div className="nearby-place-title"><strong>{place.name}</strong><span>{place.subtype}</span></div>
                <p>{place.address || (place.cuisine ? `Mutfak: ${cuisineText(place.cuisine)}` : 'Adres bilgisi kayıtta bulunmuyor.')}</p>
                <div className="nearby-place-meta">
                  <span>📏 {distanceText(place.distanceMeters)}</span>
                  {place.cuisine && <span>🍴 {cuisineText(place.cuisine)}</span>}
                  {place.openingHours && <span title={place.openingHours}>🕒 {place.openingHours}</span>}
                  {place.delivery === true && <span>🛵 Paket servis</span>}
                  {place.takeaway === true && <span>🥡 Gel-al</span>}
                  {place.website && <span>🌐 Web</span>}
                  {place.phone && <span>☎ Telefon</span>}
                </div>
              </div>
              <div className="nearby-place-actions">
                {place.website && <a className="nearby-map-link" href={externalWebsite(place.website)} target="_blank" rel="noreferrer">Web sitesi ↗</a>}
                {place.phone && <a className="nearby-map-link" href={`tel:${place.phone}`}>Ara ☎</a>}
                <a className="nearby-map-link" href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=18/${place.latitude}/${place.longitude}`} target="_blank" rel="noreferrer">Haritada aç ↗</a>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="nearby-footnote">🗺️ Restoran bilgileri OpenStreetMap kayıtlarından gelir. Kayıtlar eksik veya güncel olmayabilir; mesafe şu an kuş uçuşudur.</div>
    </section>
  )
}
