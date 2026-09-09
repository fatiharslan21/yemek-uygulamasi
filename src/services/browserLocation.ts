export type BrowserCoordinates = {
  latitude: number
  longitude: number
  accuracy: number
}

export type BrowserLocationErrorCode = 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'unknown'

export class BrowserLocationError extends Error {
  code: BrowserLocationErrorCode

  constructor(code: BrowserLocationErrorCode, message: string) {
    super(message)
    this.name = 'BrowserLocationError'
    this.code = code
  }
}

function mapGeolocationError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return new BrowserLocationError('denied', 'Konum izni verilmedi. İstersen il / ilçe / mahalle bilgisiyle devam edebilirsin.')
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return new BrowserLocationError('unavailable', 'Cihaz şu anda konumunu belirleyemedi. Biraz sonra tekrar deneyebilirsin.')
  }
  if (error.code === error.TIMEOUT) {
    return new BrowserLocationError('timeout', 'Konum isteği zaman aşımına uğradı. Tekrar deneyebilirsin.')
  }
  return new BrowserLocationError('unknown', 'Konum alınırken beklenmeyen bir sorun oluştu.')
}

export function requestBrowserLocation(): Promise<BrowserCoordinates> {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new BrowserLocationError('unsupported', 'Bu tarayıcı canlı konum özelliğini desteklemiyor.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => reject(mapGeolocationError(error)),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    )
  })
}
