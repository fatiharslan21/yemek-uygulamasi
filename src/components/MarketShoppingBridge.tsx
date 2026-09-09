import { useMemo } from 'react'
import { useNearbyData } from '../context/NearbyDataContext'
import '../business-link.css'

function distanceText(meters: number) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

export function MarketShoppingBridge() {
  const { places, preferredMarket, setPreferredMarket } = useNearbyData()
  const markets = useMemo(
    () => places.filter((place) => place.category === 'Market').sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 4),
    [places],
  )

  if (markets.length === 0) {
    return (
      <div className="market-bridge-card">
        <span className="market-bridge-icon">🛒</span>
        <div><strong>Sepeti gerçek bir markete bağlayabiliriz.</strong><p>Önce üstteki Nearby bölümünden “Çevremi tara”yı çalıştır. Bulduğumuz marketler burada sepet adayı olarak görünecek.</p></div>
      </div>
    )
  }

  const active = preferredMarket ?? markets[0]

  return (
    <div className="market-bridge-card">
      <span className="market-bridge-icon">🛒</span>
      <div>
        <strong>{preferredMarket ? `${preferredMarket.name} seçili` : `${active.name} en yakın aday`}</strong>
        <p>Gerçek işletme • {distanceText(active.distanceMeters)}. Ürün bazlı gerçek fiyat/stok henüz bağlı değil; sepet toplamı şimdilik demo katalog maliyetidir.</p>
        <div className="market-alternatives">
          {markets.map((market) => (
            <button key={market.id} type="button" className={preferredMarket?.id === market.id ? 'active' : ''} onClick={() => setPreferredMarket(market)}>
              {market.name} • {distanceText(market.distanceMeters)}
            </button>
          ))}
        </div>
      </div>
      {preferredMarket && <button type="button" onClick={() => setPreferredMarket(undefined)}>Seçimi kaldır</button>}
    </div>
  )
}
