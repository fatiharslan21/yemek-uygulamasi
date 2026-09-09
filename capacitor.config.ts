import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.lokma.app',
  appName: 'Lokma',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
