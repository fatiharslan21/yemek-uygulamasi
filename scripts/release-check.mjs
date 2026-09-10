import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function walk(directory) {
  const absolute = path.join(root, directory)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(relative) : [relative]
  })
}

assert(exists('dist/index.html'), 'dist/index.html bulunamadı; önce build alınmalı.')
assert(exists('dist/manifest.webmanifest'), 'PWA manifest build çıktısında yok.')
assert(exists('dist/icons/lokma-icon.svg'), 'Lokma uygulama ikonu build çıktısında yok.')
assert(exists('public/icons/lokma-splash.svg'), 'Lokma splash kaynak dosyası yok.')

if (exists('public/manifest.webmanifest')) {
  const manifest = JSON.parse(read('public/manifest.webmanifest'))
  assert(manifest.name?.startsWith('Lokma'), 'Manifest uygulama adı Lokma değil.')
  assert(manifest.short_name === 'Lokma', 'Manifest kısa adı Lokma değil.')
  assert(manifest.display === 'standalone', 'Manifest standalone uygulama modunda değil.')
  assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'Manifest ikon tanımı içermiyor.')
}

if (exists('capacitor.config.ts')) {
  const capacitorConfig = read('capacitor.config.ts')
  assert(capacitorConfig.includes("appId: 'com.fatiharslan.lokma'"), 'Native package ID beklenen değer değil.')
  assert(capacitorConfig.includes("appName: 'Lokma'"), 'Native uygulama adı Lokma değil.')
}

const textFiles = walk('dist').filter((file) => /\.(html|js|css|webmanifest|svg)$/i.test(file))
const bundleText = textFiles.map((file) => read(file)).join('\n')

const forbiddenVisibleTraces = [
  { pattern: /OpenAI/i, label: 'OpenAI' },
  { pattern: /ChatGPT/i, label: 'ChatGPT' },
  { pattern: /Plan motoru v\d/i, label: 'teknik plan motoru sürüm rozeti' },
  { pattern: /\bNearby\b/i, label: 'Nearby geliştirme terimi' },
  { pattern: /Lokma demo tahmini/i, label: 'demo tahmin ifadesi' },
]

forbiddenVisibleTraces.forEach(({ pattern, label }) => {
  assert(!pattern.test(bundleText), `Derlenmiş kullanıcı paketinde ${label} bulundu.`)
})

assert(bundleText.includes('Ana içeriğe geç'), 'Erişilebilirlik skip-link build çıktısında bulunamadı.')
assert(bundleText.includes('Şifremi unuttum'), 'Şifre sıfırlama akışı build çıktısında bulunamadı.')

if (failures.length > 0) {
  console.error('\nLokma release-check başarısız:')
  failures.forEach((failure) => console.error(`  ✗ ${failure}`))
  process.exit(1)
}

console.log('✓ Lokma release-check başarılı')
console.log(`✓ ${textFiles.length} build dosyası tarandı`)
console.log('✓ Manifest, ikon, package ID, erişilebilirlik ve kullanıcı metni kontrolleri temiz')
