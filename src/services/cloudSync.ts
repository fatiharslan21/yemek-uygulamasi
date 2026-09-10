import { cloudClient, getCloudUser } from './cloudClient'

export type CloudSnapshot = {
  version: 1
  exportedAt: string
  records: Record<string, string>
}

export type CloudBackupInfo = {
  exists: boolean
  updatedAt?: string
  exportedAt?: string
  recordCount: number
}

const LOCAL_PREFIX = 'lokma.'
const SENSITIVE_KEYS = new Set(['latitude', 'longitude', 'locationAccuracy'])
const MAX_RECORDS = 2000
const MAX_RECORD_BYTES = 1_500_000

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEYS.has(key))
      .map(([key, nested]) => [key, sanitizeValue(nested)]),
  )
}

function sanitizeStoredValue(raw: string) {
  try {
    return JSON.stringify(sanitizeValue(JSON.parse(raw)))
  } catch {
    return raw
  }
}

function validateSnapshot(snapshot: CloudSnapshot) {
  if (!snapshot || snapshot.version !== 1 || !snapshot.records || typeof snapshot.records !== 'object') {
    throw new Error('Bulut yedeği bu uygulama sürümüyle uyumlu değil.')
  }

  const entries = Object.entries(snapshot.records)
  if (entries.length > MAX_RECORDS) throw new Error('Bulut yedeği beklenenden fazla kayıt içeriyor.')

  entries.forEach(([key, value]) => {
    if (!key.startsWith(LOCAL_PREFIX) || typeof value !== 'string') {
      throw new Error('Bulut yedeğinde geçersiz bir kayıt bulundu.')
    }
    if (new Blob([value]).size > MAX_RECORD_BYTES) {
      throw new Error('Bulut yedeğindeki bir kayıt güvenli boyut sınırını aşıyor.')
    }
  })
}

export function buildLocalCloudSnapshot(): CloudSnapshot {
  const records: Record<string, string> = {}
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith(LOCAL_PREFIX)) continue
    const raw = window.localStorage.getItem(key)
    if (raw == null) continue
    records[key] = sanitizeStoredValue(raw)
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  }
}

export function restoreLocalCloudSnapshot(snapshot: CloudSnapshot) {
  validateSnapshot(snapshot)

  const backup = new Map<string, string>()
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(LOCAL_PREFIX))
    .forEach((key) => {
      const value = window.localStorage.getItem(key)
      if (value != null) backup.set(key, value)
    })

  try {
    backup.forEach((_value, key) => window.localStorage.removeItem(key))
    Object.entries(snapshot.records).forEach(([key, value]) => window.localStorage.setItem(key, value))
  } catch (error) {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(LOCAL_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
    backup.forEach((value, key) => window.localStorage.setItem(key, value))
    throw error
  }
}

export function exportLocalSnapshotFile() {
  const snapshot = buildLocalCloudSnapshot()
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `lokma-yedek-${snapshot.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function pushCloudSnapshot() {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  const user = await getCloudUser()
  if (!user) throw new Error('Önce hesabına giriş yapmalısın.')

  const payload = buildLocalCloudSnapshot()
  const updatedAt = new Date().toISOString()
  const { error } = await cloudClient
    .from('user_state')
    .upsert({ user_id: user.id, payload, updated_at: updatedAt }, { onConflict: 'user_id' })

  if (error) throw error
  return { payload, updatedAt }
}

export async function pullCloudSnapshot(): Promise<CloudSnapshot> {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  const user = await getCloudUser()
  if (!user) throw new Error('Önce hesabına giriş yapmalısın.')

  const { data, error } = await cloudClient
    .from('user_state')
    .select('payload')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data?.payload) throw new Error('Bu hesapta henüz bir Lokma yedeği yok.')

  const snapshot = data.payload as CloudSnapshot
  validateSnapshot(snapshot)
  return snapshot
}

export async function getCloudBackupInfo(): Promise<CloudBackupInfo> {
  if (!cloudClient) return { exists: false, recordCount: 0 }
  const user = await getCloudUser()
  if (!user) return { exists: false, recordCount: 0 }

  const { data, error } = await cloudClient
    .from('user_state')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data?.payload) return { exists: false, recordCount: 0 }

  const snapshot = data.payload as CloudSnapshot
  validateSnapshot(snapshot)
  return {
    exists: true,
    updatedAt: typeof data.updated_at === 'string' ? data.updated_at : undefined,
    exportedAt: snapshot.exportedAt,
    recordCount: Object.keys(snapshot.records).length,
  }
}
