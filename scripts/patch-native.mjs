import fs from 'node:fs'
import path from 'node:path'

const platform = process.argv[2]
const root = process.cwd()

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function patchAndroid() {
  const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml')
  if (!fs.existsSync(manifestPath)) fail('AndroidManifest.xml bulunamadı. Önce `npm run mobile:add:android` çalıştır.')

  let xml = fs.readFileSync(manifestPath, 'utf8')

  const permissions = [
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  ]

  const missingPermissions = permissions.filter((permission) => !xml.includes(permission))
  if (missingPermissions.length > 0) {
    xml = xml.replace(/<manifest\b[^>]*>/, (match) => `${match}\n    ${missingPermissions.join('\n    ')}`)
  }

  if (!xml.includes('android:scheme="lokma"')) {
    const intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="lokma" android:host="auth" />
            </intent-filter>`
    xml = xml.replace('</activity>', `${intentFilter}\n        </activity>`)
  }

  fs.writeFileSync(manifestPath, xml)
  console.log('✓ Android konum izinleri ve lokma://auth deep-link ayarlandı')
}

function patchIos() {
  const plistPath = path.join(root, 'ios/App/App/Info.plist')
  if (!fs.existsSync(plistPath)) fail('Info.plist bulunamadı. Önce `npm run mobile:add:ios` çalıştır.')

  let plist = fs.readFileSync(plistPath, 'utf8')
  const entries = []

  if (!plist.includes('<key>NSLocationWhenInUseUsageDescription</key>')) {
    entries.push(`
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>Yakınındaki restoranları önerebilmek için konumunu yalnızca sen istediğinde kullanırız.</string>`)
  }

  if (!plist.includes('<string>lokma</string>')) {
    entries.push(`
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>com.fatiharslan.lokma</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>lokma</string>
			</array>
		</dict>
	</array>`)
  }

  if (entries.length > 0) plist = plist.replace('</dict>\n</plist>', `${entries.join('')}\n</dict>\n</plist>`)
  fs.writeFileSync(plistPath, plist)
  console.log('✓ iOS konum açıklaması ve lokma:// URL scheme ayarlandı')
}

if (platform === 'android') patchAndroid()
else if (platform === 'ios') patchIos()
else fail('Platform `android` veya `ios` olmalı.')
