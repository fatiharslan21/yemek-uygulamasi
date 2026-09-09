import { useEffect, useState } from 'react'
import {
  cloudConfigured,
  deleteCloudAccount,
  getCloudUser,
  signInWithEmail,
  signOutCloud,
  signUpWithEmail,
  subscribeCloudAuth,
} from '../services/cloudClient'
import {
  exportLocalSnapshotFile,
  pullCloudSnapshot,
  pushCloudSnapshot,
  restoreLocalCloudSnapshot,
} from '../services/cloudSync'
import '../cloud-account.css'

type AuthMode = 'signin' | 'signup'

export function CloudAccountPanel() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!cloudConfigured) return
    getCloudUser().then((user) => setUserEmail(user?.email ?? null)).catch(() => undefined)
    return subscribeCloudAuth((user) => setUserEmail(user?.email ?? null))
  }, [])

  const run = async (action: () => Promise<void>) => {
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

  const submitAuth = () => run(async () => {
    const cleanEmail = email.trim().toLocaleLowerCase('tr-TR')
    if (!cleanEmail.includes('@')) throw new Error('Geçerli bir e-posta adresi gir.')
    if (password.length < 8) throw new Error('Şifre en az 8 karakter olmalı.')

    if (mode === 'signup') {
      const result = await signUpWithEmail(cleanEmail, password)
      if (result.session) {
        setMessage('Hesabın hazır. İstersen bu cihazı şimdi buluta yedekleyebilirsin. ☁️')
      } else {
        setMessage('Hesabın oluşturuldu. E-posta doğrulaması açıksa gelen kutundaki bağlantıyı onayla.')
      }
    } else {
      await signInWithEmail(cleanEmail, password)
      setMessage('Hesabına giriş yaptın. ☁️')
    }
    setPassword('')
  })

  const backup = () => run(async () => {
    await pushCloudSnapshot()
    setMessage('Bu cihazdaki Lokma verileri buluta yedeklendi. Kesin GPS koordinatı yedeğe dahil edilmedi. ✓')
  })

  const restore = () => run(async () => {
    const confirmed = window.confirm('Buluttaki yedek bu cihazdaki mevcut Lokma verilerinin yerine geçecek. Devam edilsin mi?')
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
    setMessage('Bulut hesabın silindi. Bu cihazdaki yerel Lokma verileri korunuyor.')
  })

  return (
    <section className="profile-section shell cloud-account-card">
      <div className="profile-section-head">
        <div><span>☁️</span><div><small>Hesap & yedek</small><h2>Planını güvenceye al</h2><p>Lokma hesapsız da çalışır. Hesap açarsan plan, favoriler, kilo geçmişi ve diğer yerel kayıtlarını cihazlar arasında taşıyabilirsin.</p></div></div>
        <b>{userEmail ? 'Bağlı' : 'İsteğe bağlı'}</b>
      </div>

      <div className="cloud-privacy-note"><span>📍</span><p><strong>Kesin konum buluta gitmez.</strong> İl / ilçe / mahalle kullanılabilir; cihazdan alınan enlem, boylam ve konum doğruluğu yedekten çıkarılır.</p></div>

      {!cloudConfigured ? (
        <div className="cloud-not-configured">
          <span>🔌</span>
          <div><strong>Bulut bağlantısı henüz bu local kurulumda etkin değil.</strong><p>Uygulama local-first çalışmaya devam ediyor. Supabase proje anahtarları eklendiğinde hesap ve senkronizasyon bu kartta otomatik açılacak.</p></div>
        </div>
      ) : userEmail ? (
        <div className="cloud-signed-in">
          <div className="cloud-user-line"><span>✓</span><div><small>Bağlı hesap</small><strong>{userEmail}</strong></div></div>
          <div className="cloud-action-grid">
            <button type="button" disabled={busy} onClick={backup}>☁️ Bu cihazı buluta yedekle</button>
            <button type="button" disabled={busy} onClick={restore}>↙ Buluttaki yedeği getir</button>
            <button type="button" disabled={busy} className="quiet" onClick={logout}>Çıkış yap</button>
          </div>
          <button type="button" className="cloud-delete-account" disabled={busy} onClick={deleteAccount}>Hesabımı kalıcı olarak sil</button>
        </div>
      ) : (
        <div className="cloud-auth-box">
          <div className="cloud-auth-tabs">
            <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Giriş yap</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Hesap aç</button>
          </div>
          <div className="cloud-auth-fields">
            <label><span>E-posta</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ornek@mail.com" /></label>
            <label><span>Şifre</span><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="En az 8 karakter" /></label>
            <button type="button" disabled={busy} onClick={submitAuth}>{busy ? 'İşleniyor…' : mode === 'signup' ? 'Hesabımı oluştur' : 'Giriş yap'}</button>
          </div>
        </div>
      )}

      <div className="cloud-local-export">
        <div><strong>Yerel yedek de alabilirsin</strong><p>Hesap açmadan cihazındaki Lokma verilerini JSON dosyası olarak dışarı aktar.</p></div>
        <button type="button" onClick={exportLocalSnapshotFile}>↓ Yedeği indir</button>
      </div>

      {message && <div className="cloud-message" role="status">{message}</div>}
    </section>
  )
}
