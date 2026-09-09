import { useState } from 'react'
import { BrowserLocationError, requestBrowserLocation, type BrowserCoordinates } from '../services/browserLocation'
import { reverseGeocodeCoordinates, type ResolvedLocation } from '../services/reverseGeocode'
import type { UserPlanProfile } from '../types'
import '../location-ui.css'

type PlanLocationGateProps = {
  profile: UserPlanProfile
  onContinue: (profile: UserPlanProfile) => void
  onBack: () => void
}

type LocationStatus = {
  status: 'idle' | 'loading' | 'success' | 'error'
  coords?: BrowserCoordinates
  resolved?: ResolvedLocation
  message?: string
}

const citySuggestions = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Kocaeli', 'Sakarya', 'Eskişehir']

export function PlanLocationGate({ profile, onContinue, onBack }: PlanLocationGateProps) {
  const [draft, setDraft] = useState<UserPlanProfile>(profile)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => {
    if (profile.locationSource === 'device' && profile.latitude != null && profile.longitude != null) {
      return {
        status: 'success',
        coords: {
          latitude: profile.latitude,
          longitude: profile.longitude,
          accuracy: profile.locationAccuracy ?? 0,
        },
        message: 'Daha önce seçtiğin canlı konum hazır.',
      }
    }
    return { status: 'idle' }
  })

  const patchManualLocation = (key: 'city' | 'district' | 'neighborhood', value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
      latitude: undefined,
      longitude: undefined,
      locationAccuracy: undefined,
      locationSource: 'manual',
    }))
    setLocationStatus({ status: 'idle' })
  }

  const useLiveLocation = async () => {
    setLocationStatus({ status: 'loading', message: 'Cihazından konum alınıyor…' })
    try {
      const coords = await requestBrowserLocation()
      try {
        const resolved = await reverseGeocodeCoordinates(coords)
        setDraft((current) => ({
          ...current,
          city: resolved.city || current.city,
          district: resolved.district || current.district,
          neighborhood: resolved.neighborhood || current.neighborhood,
          latitude: coords.latitude,
          longitude: coords.longitude,
          locationAccuracy: coords.accuracy,
          locationSource: 'device',
        }))
        setLocationStatus({
          status: 'success',
          coords,
          resolved,
          message: 'Konum bulundu ve plan alanlarına aktarıldı.',
        })
      } catch {
        setDraft((current) => ({
          ...current,
          latitude: coords.latitude,
          longitude: coords.longitude,
          locationAccuracy: coords.accuracy,
          locationSource: 'device',
        }))
        setLocationStatus({
          status: 'success',
          coords,
          message: 'Koordinat alındı fakat il / ilçe / mahalle otomatik çözülemedi. Alanları elle kontrol edebilirsin.',
        })
      }
    } catch (error) {
      const message = error instanceof BrowserLocationError
        ? error.message
        : 'Konum alınırken beklenmeyen bir sorun oluştu.'
      setLocationStatus({ status: 'error', message })
    }
  }

  const continueFlow = () => {
    if (!draft.city.trim()) {
      setLocationStatus({ status: 'error', message: 'Planı oluşturmak için en azından il bilgisini girelim.' })
      return
    }
    onContinue(draft)
  }

  const locationTitle = [draft.neighborhood, draft.district, draft.city].filter(Boolean).join(', ')

  return (
    <main className="plan-location-page">
      <div className="location-bg-orb location-bg-a" />
      <div className="location-bg-orb location-bg-b" />

      <header className="plan-location-nav shell">
        <button className="brand brand-button" type="button" onClick={onBack}>
          <span className="brand-mark">🍋</span><span>lokma</span>
        </button>
        <span>Planın ilk girdisi • Konum</span>
        <button type="button" className="ghost-action" onClick={onBack}>← Ana sayfa</button>
      </header>

      <section className="plan-location-shell shell">
        <div className="plan-location-card">
          <div className="plan-location-copy">
            <span className="step-kicker">📍 Önce çevreni seçelim</span>
            <h1>Bu yemek planını <em>nerede</em> kullanacaksın?</h1>
            <p>Lokma marketleri, restoranları ve fiyat seçeneklerini bu bölgeye göre eşleştirecek. İstersen canlı konumdan otomatik doldur, istersen elle yaz.</p>
          </div>

          <div className="location-mode-grid">
            <button
              type="button"
              className={`live-location-choice ${locationStatus.status === 'success' ? 'active' : ''}`}
              disabled={locationStatus.status === 'loading'}
              onClick={useLiveLocation}
            >
              <span className="location-choice-icon">⌖</span>
              <div>
                <strong>{locationStatus.status === 'loading' ? 'Konum alınıyor…' : 'Canlı konumdan doldur'}</strong>
                <small>Tarayıcı izin verirse il, ilçe ve mahalleyi otomatik buluruz.</small>
              </div>
              <b>{locationStatus.status === 'success' ? '✓' : '→'}</b>
            </button>

            <div className="manual-location-label"><span>veya</span></div>

            <div className="plan-location-form">
              <label className="input-field">
                <span>İl</span>
                <input list="plan-city-options" value={draft.city} onChange={(e) => patchManualLocation('city', e.target.value)} placeholder="İstanbul" />
                <datalist id="plan-city-options">{citySuggestions.map((city) => <option key={city} value={city} />)}</datalist>
              </label>
              <label className="input-field">
                <span>İlçe</span>
                <input value={draft.district} onChange={(e) => patchManualLocation('district', e.target.value)} placeholder="Kadıköy" />
              </label>
              <label className="input-field">
                <span>Mahalle</span>
                <input value={draft.neighborhood} onChange={(e) => patchManualLocation('neighborhood', e.target.value)} placeholder="Caddebostan" />
              </label>
            </div>
          </div>

          {locationStatus.status !== 'idle' && (
            <div className={`location-status-card ${locationStatus.status}`}>
              <span>{locationStatus.status === 'success' ? '📍' : locationStatus.status === 'loading' ? '⏳' : '⚠️'}</span>
              <div>
                <strong>{locationStatus.status === 'success' ? (locationTitle || 'Konum hazır') : locationStatus.status === 'loading' ? 'Konum aranıyor' : 'Konumu kontrol edelim'}</strong>
                <p>{locationStatus.message}</p>
                {locationStatus.status === 'success' && (
                  <div className="resolved-location-grid">
                    <span><small>İl</small><b>{draft.city || '—'}</b></span>
                    <span><small>İlçe</small><b>{draft.district || '—'}</b></span>
                    <span><small>Mahalle</small><b>{draft.neighborhood || '—'}</b></span>
                  </div>
                )}
                {locationStatus.coords && (
                  <code>{locationStatus.coords.latitude.toFixed(5)}, {locationStatus.coords.longitude.toFixed(5)} • ±{Math.round(locationStatus.coords.accuracy)} m</code>
                )}
              </div>
            </div>
          )}

          <div className="location-plan-preview">
            <span>🧠</span>
            <div>
              <strong>Bu konum plan boyunca kullanılacak.</strong>
              <p>Onboarding’de tekrar görebilir ve değiştirebilirsin. Yakındaki market/restoran katmanı geldiğinde aynı konumu doğrudan oraya bağlayacağız.</p>
            </div>
          </div>

          <div className="plan-location-actions">
            <button type="button" className="back-button" onClick={onBack}>← Geri</button>
            <button type="button" className="next-button location-next" onClick={continueFlow}>Planı kurmaya devam et <span>→</span></button>
          </div>
        </div>
      </section>
    </main>
  )
}
