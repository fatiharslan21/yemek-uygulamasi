import { useRef, useState } from 'react'
import { exportLocalSnapshotFile, parseLocalSnapshotFile, restoreLocalSnapshot } from '../services/localBackup'
import '../cloud-account.css'

export function LocalBackupPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const restore = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const snapshot = await parseLocalSnapshotFile(file)
      const confirmed = window.confirm('Bu yedek cihazındaki mevcut Lokma verilerinin yerine geçecek. Devam etmek istiyor musun?')
      if (!confirmed) return
      restoreLocalSnapshot(snapshot)
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Yedek dosyası geri yüklenemedi.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="profile-section shell cloud-account-card" aria-labelledby="local-backup-title">
      <div className="profile-section-head">
        <div><span>📱</span><div><small>Verilerin</small><h2 id="local-backup-title">Bu cihazda saklanıyor</h2><p>Lokma'yı kullanmak için hesap veya ayrı bir sunucu bağlantısı gerekmez. Planların, favorilerin, kilo geçmişin ve alışveriş işaretlerin cihazında kalır.</p></div></div>
        <b>Yerel</b>
      </div>

      <div className="cloud-privacy-note"><span>🔐</span><p><strong>Hesap açmak zorunda değilsin.</strong> Uygulamayı silmek veya uygulama verilerini temizlemek yerel kayıtları silebilir. İstersen aşağıdan tek dosyalık yedek alabilirsin.</p></div>

      <div className="cloud-local-export">
        <div><strong>Yedek dosyası</strong><p>Telefon değiştirmeden veya uygulamayı yeniden kurmadan önce indirip saklayabilirsin.</p></div>
        <div className="cloud-local-actions">
          <button type="button" onClick={exportLocalSnapshotFile}>↓ Yedeği indir</button>
          <button type="button" className="quiet" disabled={busy} onClick={() => inputRef.current?.click()}>↑ Yedeği geri yükle</button>
          <input ref={inputRef} className="cloud-backup-file-input" type="file" accept="application/json,.json" onChange={(event) => void restore(event.target.files?.[0])} />
        </div>
      </div>

      {message && <div className="cloud-message" role="status" aria-live="polite">{message}</div>}
    </section>
  )
}
