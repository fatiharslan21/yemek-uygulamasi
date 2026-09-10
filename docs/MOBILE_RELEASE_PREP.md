# Lokma — Mobil Yayın Hazırlığı

## Sabit kimlik

- Uygulama adı: `Lokma`
- Android applicationId / iOS bundle id: `com.fatiharslan.lokma`
- Web build klasörü: `dist`
- Marka ana rengi: `#315f49`
- Açılış zemini: `#f7f4eb`
- Ana ikon kaynağı: `public/icons/lokma-icon.svg`
- Splash kaynağı: `public/icons/lokma-splash.svg`

> Bundle/package ID ilk gerçek mağaza kaydından önce son kez doğrulanmalı; yayınlandıktan sonra değiştirilmemeli.

## Android shell

İlk platform üretimi:

```bash
npm install
npm run qa:release
npm run mobile:add:android
npm run mobile:sync:android
npm run mobile:open:android
```

Android Studio içinde release öncesi:

- `ACCESS_COARSE_LOCATION` ve `ACCESS_FINE_LOCATION` yalnızca restoran konumu özelliği için gerekliyse eklenir.
- Konum izni kullanıcı özelliği kullanana kadar istenmez.
- Uygulama açılışında bildirim izni istenmez.
- Network Security Config yalnızca HTTPS bağlantılara izin verecek şekilde kontrol edilir.
- `targetSdk`, signing ve Play App Signing gerçek release aşamasında doğrulanır.
- Debug APK manuel `Android Shell Smoke` workflow'u ile de derlenebilir.

## iOS shell

macOS + Xcode üzerinde:

```bash
npm install
npm run qa:release
npm run mobile:add:ios
npm run mobile:sync:ios
npm run mobile:open:ios
```

Xcode içinde:

- Bundle ID `com.fatiharslan.lokma`.
- `NSLocationWhenInUseUsageDescription`: restoran önerileri için yakın çevre konumu açıklaması.
- Konum izni yalnızca kullanıcı “Canlı konumu kullan” dediğinde istenir.
- Push notification ilk sürümde zorunlu değildir ve onboarding sırasında istenmez.
- App Transport Security istisnası açılmadan önce bütün servislerin HTTPS olduğu doğrulanır.

## Hesap / şifre sıfırlama

Supabase yayın ortamında şu redirect URL'ler izinli listeye alınır:

- Web production URL
- Web preview URL yalnızca test süresince
- Native deep-link URL (native auth akışı kesinleşince)

`.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_PASSWORD_RESET_REDIRECT_URL=...
```

Şifre recovery akışı: `Şifremi unuttum → e-posta → recovery linki → Yeni şifre → yeniden giriş/aktif oturum`.

## İkon / splash

SVG kaynakları marka master'ıdır. Store submission öncesi Android adaptive icon ve iOS AppIcon PNG setleri bu master kaynaklardan rasterize edilir. Store ikonlarında metin kullanılmaz; safe-area içinde limon markası korunur.

## Kullanıcı deneyimi kuralları

- İlk indirmede hesap zorunlu değil.
- İlk 3 gün reklam yok.
- Onboarding, menü onayı, tarif adımları, alerji/hassasiyet ve kilo takibi reklam dışı.
- Konum izni uygulama açılır açılmaz sorulmaz.
- Kullanıcı hesabını uygulama içinden silebilir.
- Bulut geri yükleme mevcut cihaz verisini ezmeden önce açık onay ister.
- Kesin GPS koordinatı bulut snapshot'ına yazılmaz.
