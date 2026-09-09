import { useMemo, useState } from 'react'
import { geocodePlanLocation } from '../services/forwardGeocode'
import { searchNearbyPlaces, type NearbyPlace, type NearbyPlaceCategory } from '../services/nearbyPlaces'
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

function categoryEmoji(category: NearbyPlaceCategory) {
  return category === 'Market' ? '🛒' : '🍽️'
}

export function NearbyPlacesPanel({ profile, coords, locationLabel }: NearbyPlacesPanelProps) {
  const [status, setStatus] = useState<SearchState>('idle')
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [activeCategory, setActiveCategory] = useState<NearbyPlaceCategory>('Market')
  const [message, setMessage] = useState<string | null>(null)
  const [searchCenter, setSearchCenter] = useState<BrowserCoordinates | undefined>(coords)

  const visiblePlaces = useMemo(
    () => places.filter((place) => place.category === activeCategory),
    [places, activeCategory],
  )

  const marketCount = places.filter((place) => place.category === 'Market').length
  const restaurantCount = places.filter((place) => place.category === 'Restoran').length

  const runSearch = async () => {
    setStatus('loading')
    setMessage(null)
    try {
      let center = coords
      let sourceText = 'canlı koordinatın'
      if (!center) {
        const geocoded = await geocodePlanLocation(profile.city, profile.district, profile.neighborhood)
        center = geocoded.coords
        sourceText = 'il / ilçe / mahalle bilgin'
      }

      setSearchCenter(center)
      const result = await searchNearbyPlaces(center, 1800)
      setPlaces(result)
      setStatus('success')
      setMessage(result.length
        ? `Yaklaşık 1,8 km çevrede ${result.length} isimli işletme bulundu. Arama merkezi ${sourceText} üzerinden belirlendi.`
        : 'Bu yarıçapta isim bilgisi bulunan market veya restoran bulunamadı. OSM kapsaması bölgeye göre değişebilir.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Çevredeki işletmeler aranırken bir sorun oluştu.')
    }
  }

  return (
    <section className="shell nearby-section">
      <div className="nearby-heading">
        <div>
          <span className="eyebrow">📍 Nearby v0.1 • gerçek çevre verisi</span>
          <h2>Mahallende neler var?</h2>
          <p>Şimdilik OpenStreetMap verisiyle gerçek işletme adı, türü ve kuş uçuşu mesafeyi gösteriyoruz. Menü ve ürün fiyatları henüz bu katmanda yok.</p>
        </div>
        <button type="button" className="nearby-search-button" disabled={status === 'loading'} onClick={runSearch}>
          {status === 'loading' ? 'Çevre taranıyor…' : status === 'success' ? '↻ Yeniden tara' : '⌖ Çevremi tara'}
        </button>
      </div>

      <div className="nearby-location-strip">
        <span>📌</span>
        <div><strong>{locationLabel || [profile.neighborhood, profile.district, profile.city].filter(Boolean).join(', ')}</strong><small>{coords ? 'Canlı koordinat üzerinden aramaya hazır' : 'Manuel konum harita noktasına çevrilerek aranacak'}</small></div>
        {searchCenter && <code>{searchCenter.latitude.toFixed(5)}, {searchCenter.longitude.toFixed(5)}</code>}
      </div>

      {message && <div className={`nearby-message ${status}`}><span>{status === 'error' ? '⚠️' : status === 'loading' ? '⏳' : '✨'}</span><p>{message}</p></div>}

      {status === 'idle' && (
        <div className="nearby-empty-state">
          <div className="nearby-radar"><span>📍</span><i /><i /><i /></div>
          <div><strong>Gerçek işletmeleri görmek için çevreni tara.</strong><p>Market, süpermarket, bakkal, manav, restoran, fast-food ve kafeleri yaklaşık 1,8 km yarıçapta arayacağız.</p></div>
        </div>
      )}

      {status === 'success' && places.length > 0 && (
        <>
          <div className="nearby-tabs">
            <button type="button" className={activeCategory === 'Market' ? 'active' : ''} onClick={() => setActiveCategory('Market')}>🛒 Marketler <b>{marketCount}</b></button>
            <button type="button" className={activeCategory === 'Restoran' ? 'active' : ''} onClick={() => setActiveCategory('Restoran')}>🍽️ Restoranlar <b>{restaurantCount}</b></button>
          </div>

          <div className="nearby-grid">
            {visiblePlaces.map((place, index) => (
              <article className="nearby-place-card" key={place.id}>
                <div className="nearby-place-rank">{String(index + 1).padStart(2, '0')}</div>
                <div className="nearby-place-icon">{categoryEmoji(place.category)}</div>
                <div className="nearby-place-main">
                  <div className="nearby-place-title"><strong>{place.name}</strong><span>{place.subtype}</span></div>
                  <p>{place.address || (place.cuisine ? `Mutfak: ${place.cuisine.replaceAll(';', ', ')}` : 'Adres etiketi OpenStreetMap kaydında yok.')}</p>
                  <div className="nearby-place-meta">
                    <span>📏 {distanceText(place.distanceMeters)}</span>
                    {place.cuisine && <span>🍴 {place.cuisine.replaceAll(';', ', ')}</span>}
                    {place.openingHours && <span>🕒 Saat bilgisi var</span>}
                  </div>
                </div>
                <a className="nearby-map-link" href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=18/${place.latitude}/${place.longitude}`} target="_blank" rel="noreferrer">Haritada aç ↗</a>
              </article>
            ))}
          </div>
        </>
      )}

      <div className="nearby-footnote">🗺️ İşletme verisi © OpenStreetMap katkıcıları. Mesafe şu an kuş uçuşudur; yürüyüş/sürüş mesafesi sonraki rota katmanında hesaplanacak.</div>
    </section>
  )
}
