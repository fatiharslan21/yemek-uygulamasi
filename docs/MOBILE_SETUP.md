# Lokma — iOS / Android Paketleme Temeli

Lokma web arayüzünü çöpe atmadan Capacitor ile native shell içine alınacak şekilde hazırlanmıştır.

Kullanılan temel sürüm: Capacitor 8.5.1.

## İlk kurulum

```bash
npm install
npm run build
```

### Android kabuğunu oluştur

```bash
npm run mobile:add:android
npm run mobile:sync
npm run mobile:open:android
```

Bu işlem Android Studio projesini oluşturur/açar.

### iOS kabuğunu oluştur

macOS + Xcode gerekir:

```bash
npm run mobile:add:ios
npm run mobile:sync
npm run mobile:open:ios
```

## Günlük geliştirme

Web tarafında değişiklik yaptıktan sonra native projeye aktarmak için:

```bash
npm run mobile:sync
```

Bu komut önce Vite build alır, sonra `dist` çıktısını native platformlara senkronize eder.

## App ID

Şu an `capacitor.config.ts` içinde geçici kimlik:

```text
com.lokma.app
```

Store signing başlamadan önce nihai bundle/application ID kesinleştirilmeli. İmzalama başladıktan sonra ID değiştirmek daha zahmetlidir.

## Store fazında eklenecekler

- gerçek app icon seti
- splash screen
- iOS entitlements / Android permissions
- Apple Sign In ve Google Sign In
- deep link / auth callback
- push notification
- production analytics ve crash reporting
- reklam SDK'sı (ürün politikasına bağlı ve varsayılan düşük yoğunlukta)
- App Store / Play Store ekran görüntüleri ve açıklamaları

Bu dosya yayın talimatı değildir; local/native hazırlık rehberidir.
