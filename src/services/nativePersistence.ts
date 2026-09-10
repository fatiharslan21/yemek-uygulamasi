import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const NATIVE_SNAPSHOT_KEY = 'lokma.native-snapshot.v1'
const LOCAL_PREFIX = 'lokma.'

type NativeSnapshot = {
  version: 1
  savedAt: string
  records: Record<string, string>
}

function localRecords() {
  const records: Record<string, string> = {}
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith(LOCAL_PREFIX)) continue
    const value = window.localStorage.getItem(key)
    if (value != null) records[key] = value
  }
  return records
}

async function mirrorToNative() {
  if (!Capacitor.isNativePlatform()) return
  const snapshot: NativeSnapshot = { version: 1, savedAt: new Date().toISOString(), records: localRecords() }
  try {
    await Preferences.set({ key: NATIVE_SNAPSHOT_KEY, value: JSON.stringify(snapshot) })
  } catch {
    // Yerel web depolaması çalışmaya devam eder; native ayna yardımcı bir güvenlik katmanıdır.
  }
}

async function restoreIfNeeded() {
  if (!Capacitor.isNativePlatform()) return false
  const local = localRecords()
  if (Object.keys(local).length > 0) return false

  try {
    const { value } = await Preferences.get({ key: NATIVE_SNAPSHOT_KEY })
    if (!value) return false
    const parsed = JSON.parse(value) as Partial<NativeSnapshot>
    if (parsed.version !== 1 || !parsed.records || typeof parsed.records !== 'object') return false
    Object.entries(parsed.records).forEach(([key, record]) => {
      if (key.startsWith(LOCAL_PREFIX) && typeof record === 'string') window.localStorage.setItem(key, record)
    })
    return Object.keys(parsed.records).length > 0
  } catch {
    return false
  }
}

export async function initializeNativePersistence() {
  if (!Capacitor.isNativePlatform()) return
  await restoreIfNeeded()

  await App.addListener('pause', () => {
    void mirrorToNative()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void mirrorToNative()
  })

  window.addEventListener('beforeunload', () => {
    void mirrorToNative()
  })

  window.setInterval(() => {
    void mirrorToNative()
  }, 60_000)
}

export async function flushNativePersistence() {
  await mirrorToNative()
}
