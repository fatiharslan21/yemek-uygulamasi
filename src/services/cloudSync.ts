import { cloudClient, getCloudUser } from './cloudClient'

export type CloudSnapshot = {
  version: 1
  exportedAt: string
  records: Record<string, string>
}

const LOCAL_PREFIX = 'lokma.'
const SENSITIVE_KEYS = new Set(['latitude', 'longitude', 'locationAccuracy'])

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
  if (snapshot.version !== 1 || !snapshot.records) throw new Error('Bulut yedeği bu uygulama sürümüyle uyumlu değil.')

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(LOCAL_PREFIX))
    .forEach((key) => window.localStorage.removeItem(key))

  Object.entries(snapshot.records).forEach(([key, value]) => {
    if (key.startsWith(LOCAL_PREFIX)) window.localStorage.setItem(key, value)
  })
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
  URL.revokeObjectURL(url)
}

export async function pushCloudSnapshot() {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  const user = await getCloudUser()
  if (!user) throw new Error('Önce hesabına giriş yapmalısın.')

  const payload = buildLocalCloudSnapshot()
  const { error } = await cloudClient
    .from('user_state')
    .upsert({ user_id: user.id, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) throw error
  return payload
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

  return data.payload as CloudSnapshot
}
