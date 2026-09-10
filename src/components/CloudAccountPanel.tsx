import { useEffect, useState } from 'react'
import {
  cloudConfigured,
  deleteCloudAccount,
  getCloudUser,
  requestPasswordReset,
  signInWithEmail,
  signOutCloud,
  signUpWithEmail,
  subscribeCloudAuth,
  updateCloudPassword,
} from '../services/cloudClient'
import {
  exportLocalSnapshotFile,
  getCloudBackupInfo,
  pullCloudSnapshot,
  pushCloudSnapshot,
  restoreLocalCloudSnapshot,
  type CloudBackupInfo,
} from '../services/cloudSync'
import '../cloud-account.css'

type AuthMode = 'signin' | 'signup'

function formatBackupDate(value?: string) {
  if (!value) return 'Henüz yok'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Bilinmiyor'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function CloudAccountPanel() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [backupInfo, setBackupInfo] = useState<CloudBackupInfo>({ exists: false, recordCount: 0 })
  const [busy, setBusy] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [message, setMessage] = useState<string | null>(null)

  const refreshBackupInfo = async () => {
    if (!cloudConfigured || !navigator.onLine) return
    try {
      setBackupInfo(await getCloudBackupInfo())
    } catch {
      setBackupInfo({ exists: false, recordCount: 0 })
    }
  }

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (!cloudConfigured) {
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    getCloudUser()
      .then((user) => {
        setUserEmail(user?.email ?? null)
        if (user) void refreshBackupInfo()
      })
      .catch(() => undefined)

    const unsubscribe = subscribeCloudAuth((user, event) => {
      setUserEmail(user?.email ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setMessage('Şifre yenileme bağlantın doğrulandı. Şimdi yeni şifreni belirleyebilirsin.')
      }
      if (user) void refreshBackupInfo()
      else setBackupInfo({ exists: false, recordCount: 0 })
    })

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (online && userEmail) void refreshBackupInfo()
  }, [online, userEmail])

  const run = async (action: () => Promise<void>) => {
    if (!online) {
      setMessage('İnternet bağlantın yok. Yerel planın çalışmaya devam ediyor; bulut işlemi için bağlantı gerekli.')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await action()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'İşlem sırasında beklenmeyen bir sorun oluştu.')
    } finally {
      setBusy(false)
    }
  }

  const cleanEmail = () => email.trim().toLocaleLowerCase('tr-TR')

  const submitAuth = () => run(async () => {
    const normalizedEmail = cleanEmail()
    if (!normalizedEmail.includes('@')) throw new Error('Geçerli bir e-posta adresi gir.')
    if (password.length < 8) throw new Error('Şifre en az 8 karakter olmalı.')

    if (mode === 'signup') {
      const result = await signUpWithEmail(normalizedEmail, password)
      if (result.session) {
        setMessage('Hesabın hazır. İstersen bu cihazı şimdi buluta yedekleyebilirsin. ☁️')
      } else {
        setMessage('Hesabın oluşturuldu. E-posta doğrulaması açıksa gelen kutundaki bağlantıyı onayla.')
      }
    } else {
      await signInWithEmail(normalizedEmail, password)
      setMessage('Hesabına giriş yaptın. ☁️')
    }
    setPassword('')
  })

  const sendReset = () => run(async () => {
    const normalizedEmail = cleanEmail()
    if (!normalizedEmail.includes('@')) throw new Error('Şifre yenileme bağlantısı için e-posta adresini gir.')
    await requestPasswordReset(normalizedEmail)
    setMessage('Şifre yenileme bağlantısını e-posta adresine gönderdik. Gelen kutunu ve spam klasörünü kontrol et.')
  })

  const saveNewPassword = () => run(async () => {
    if (newPassword.length < 8) throw new Error('Yeni şifre en az 8 karakter olmalı.')
    if (newPassword !== confirmPassword) throw new Error('Yeni şifreler birbiriyle eşleşmiyor.')
    await updateCloudPassword(newPassword)
    setNewPassword('')
    setConfirmPassword('')
    setRecoveryMode(false)
    setMessage('Şifren güncellendi. Hesabını kullanmaya devam edebilirsin. ✓')
  })

  const backup = () => run(async () => {
    const result = await pushCloudSnapshot()
    setBackupInfo({
      exists: true,
      updatedAt: result.updatedAt,
      exportedAt: result.payload.exportedAt,
      recordCount: Object.keys(result.payload.records).length,
    })
    setMessage('Bu cihazdaki Lokma verileri buluta yedeklendi. Kesin GPS koordinatı yedeğe dahil edilmedi. ✓')
  })

  const restore = () => run(async () => {
    const backupDate = backupInfo.exists ? formatBackupDate(backupInfo.updatedAt) : 'bilinmeyen tarih'
    const confirmed = window.confirm(`Buluttaki ${backupDate} tarihli yedek bu cihazdaki mevcut Lokma verilerinin yerine geçecek. Devam edilsin mi?`)
    if (!confirmed) return
    const snapshot = await pullCloudSnapshot()
    restoreLocalCloudSnapshot(snapshot)
    window.location.reload()
  })

  const logout = () => run(async () => {
    await signOutCloud()
    setMessage('Hesaptan çıkış yapıldı. Bu cihazdaki yerel veriler silinmedi.')
  })

  const deleteAccount = () => run(async () => {
    const confirmed = window.confirm('Bulut hesabın ve buluttaki Lokma yedeğin kalıcı olarak silinecek. Bu cihazdaki yerel planın kalacak. Hesabı silmek istiyor musun?')
    if (!confirmed) return
    await deleteCloudAccount()
    setUserEmail(null)
    setBackupInfo({ exists: false, recordCount: 0 })
    setMessage('Bulut hesabın silindi. Bu cihazdaki yerel Lokma verileri korunuyor.')
  })

  return (
    <section className="profile-section shell cloud-account-card" aria-labelledby="cloud-account-title">
      <div className="profile-section-head">
        <div><span>☁️</span><div><small>Hesap & yedek</small><h2 id="cloud-account-title">Planını güvenceye al</h2><p>Lokma hesapsız da çalışır. Hesap açarsan plan, favoriler, kilo geçmişi ve diğer yerel kayıtlarını cihazlar arasında taşıyabilirsin.</p></div></div>
        <b>{userEmail ? 'Bağlı' : 'İsteğe bağlı'}</b>
      </div>

      {!online && <div className="cloud-offline-note" role="status">📴 Çevrimdışısın. Planın cihazda çalışmaya devam eder; hesap ve yedek işlemleri bağlantı gelince açılır.</div>}

      <div className="cloud-privacy-note"><span>📍</span><p><strong>Kesin konum buluta gitmez.</strong> İl / ilçe / mahalle kullanılabilir; cihazdan alınan enlem, boylam ve konum doğruluğu yedekten çıkarılır.</p></div>

      {!cloudConfigured ? (
        <div className="cloud-not-configured">
          <span>🔌</span>
          <div><strong>Bulut bağlantısı henüz bu kurulumda etkin değil.</strong><p>Uygulama local-first çalışmaya devam ediyor. Supabase proje anahtarları eklendiğinde hesap ve senkronizasyon bu kartta otomatik açılacak.</p></div>
        </div>
      ) : recoveryMode ? (
        <div className="cloud-auth-box cloud-recovery-box">
          <div><span className="cloud-recovery-icon">🔐</span><h3>Yeni şifreni belirle</h3><p>E-posta bağlantısı doğrulandı. En az 8 karakterli yeni bir şifre seç.</p></div>
          <div className="cloud-auth-fields recovery-fields">
            <label><span>Yeni şifre</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
            <label><span>Yeni şifre tekrar</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
            <button type="button" disabled={busy || !online} onClick={saveNewPassword}>{busy ? 'Kaydediliyor…' : 'Şifremi güncelle'}</button>
          </div>
        </div>
      ) : userEmail ? (
        <div className="cloud-signed-in">
          <div className="cloud-user-line"><span>✓</span><div><small>Bağlı hesap</small><strong>{userEmail}</strong></div></div>
          <div className="cloud-backup-status">
            <div><small>Bulut yedeği</small><strong>{backupInfo.exists ? formatBackupDate(backupInfo.updatedAt) : 'Henüz oluşturulmadı'}</strong></div>
            <span>{backupInfo.exists ? `${backupInfo.recordCount} yerel kayıt` : 'İlk yedeğini alabilirsin'}</span>
          </div>
          <div className="cloud-action-grid">
            <button type="button" disabled={busy || !online} onClick={backup}>☁️ Bu cihazı buluta yedekle</button>
            <button type="button" disabled={busy || !online || !backupInfo.exists} onClick={restore}>↙ Buluttaki yedeği getir</button>
            <button type="button" disabled={busy || !online} className="quiet" onClick={logout}>Çıkış yap</button>
          </div>
          <p className="cloud-sync-rule">↔️ Otomatik çakışma çözümü yok: hangi cihazın verisinin kullanılacağını sen seçersin. Böylece eski bir telefon yeni planını sessizce ezmez.</p>
          <button type="button" className="cloud-delete-account" disabled={busy || !online} onClick={deleteAccount}>Hesabımı kalıcı olarak sil</button>
        </div>
      ) : (
        <div className="cloud-auth-box">
          <div className="cloud-auth-tabs" role="tablist" aria-label="Hesap işlemi">
            <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Giriş yap</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Hesap aç</button>
          </div>
          <div className="cloud-auth-fields">
            <label><span>E-posta</span><input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@mail.com" /></label>
            <label><span>Şifre</span><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 8 karakter" /></label>
            <button type="button" disabled={busy || !online} onClick={submitAuth}>{busy ? 'İşleniyor…' : mode === 'signup' ? 'Hesabımı oluştur' : 'Giriş yap'}</button>
          </div>
          {mode === 'signin' && <button type="button" className="cloud-forgot-password" disabled={busy || !online} onClick={sendReset}>Şifremi unuttum</button>}
        </div>
      )}

      <div className="cloud-local-export">
        <div><strong>Yerel yedek de alabilirsin</strong><p>Hesap açmadan cihazındaki Lokma verilerini JSON dosyası olarak dışarı aktar.</p></div>
        <button type="button" onClick={exportLocalSnapshotFile}>↓ Yedeği indir</button>
      </div>

      {message && <div className="cloud-message" role="status" aria-live="polite">{message}</div>}
    </section>
  )
}
