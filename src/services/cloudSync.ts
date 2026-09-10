import { cloudClient, getCloudUser } from './cloudClient'
import {
  buildLocalSnapshot,
  clearLocalSyncBaseline,
  getLocalSyncFreshness,
  markSnapshotSynced,
  restoreLocalSnapshot,
  validateLocalSnapshot,
  type LocalSnapshot,
  type LocalSyncFreshness,
} from './localBackup'

export type CloudSnapshot = LocalSnapshot
export type { LocalSyncFreshness }
export { getLocalSyncFreshness, markSnapshotSynced }
export { exportLocalSnapshotFile, parseLocalSnapshotFile } from './localBackup'
export { buildLocalSnapshot as buildLocalCloudSnapshot, restoreLocalSnapshot as restoreLocalCloudSnapshot }

export type CloudBackupInfo = {
  exists: boolean
  updatedAt?: string
  exportedAt?: string
  recordCount: number
}

export async function pushCloudSnapshot() {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  const user = await getCloudUser()
  if (!user) throw new Error('Önce hesabına giriş yapmalısın.')

  const payload = buildLocalSnapshot()
  const updatedAt = new Date().toISOString()
  const { error } = await cloudClient
    .from('user_state')
    .upsert({ user_id: user.id, payload, updated_at: updatedAt }, { onConflict: 'user_id' })

  if (error) throw error
  markSnapshotSynced(payload, updatedAt)
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
  validateLocalSnapshot(snapshot)
  return snapshot
}

export async function deleteCloudSnapshot() {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  const user = await getCloudUser()
  if (!user) throw new Error('Önce hesabına giriş yapmalısın.')

  const { error } = await cloudClient.from('user_state').delete().eq('user_id', user.id)
  if (error) throw error
  clearLocalSyncBaseline()
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
  validateLocalSnapshot(snapshot)
  return {
    exists: true,
    updatedAt: typeof data.updated_at === 'string' ? data.updated_at : undefined,
    exportedAt: snapshot.exportedAt,
    recordCount: Object.keys(snapshot.records).length,
  }
}
