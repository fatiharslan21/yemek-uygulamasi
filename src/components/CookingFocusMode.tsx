import { useEffect, useRef, useState } from 'react'
import type { CookingGuide } from '../services/cookingGuides'
import '../cooking-focus.css'

type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener?: (name: string, listener: () => void) => void }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } }

export function CookingFocusMode({ title, emoji, guide, onClose }: { title: string; emoji: string; guide: CookingGuide; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [keepAwake, setKeepAwake] = useState(false)
  const [wakeMessage, setWakeMessage] = useState<string | null>(null)
  const wakeRef = useRef<WakeLockSentinelLike | null>(null)
  const total = Math.max(1, guide.steps.length)
  const current = guide.steps[Math.min(step, total - 1)] ?? 'Tarif adımlarını takip et.'

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setStep((value) => Math.min(total - 1, value + 1))
      if (event.key === 'ArrowLeft') setStep((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, total])

  useEffect(() => () => { void wakeRef.current?.release().catch(() => undefined) }, [])

  const toggleWake = async () => {
    if (wakeRef.current) {
      await wakeRef.current.release().catch(() => undefined)
      wakeRef.current = null
      setKeepAwake(false)
      setWakeMessage('Ekranı açık tutma kapatıldı.')
      return
    }
    const wakeLock = (navigator as WakeLockNavigator).wakeLock
    if (!wakeLock) {
      setWakeMessage('Bu cihaz veya tarayıcı ekranı açık tutma özelliğini desteklemiyor.')
      return
    }
    try {
      wakeRef.current = await wakeLock.request('screen')
      setKeepAwake(true)
      setWakeMessage('Pişirme boyunca ekran açık tutulacak.')
      wakeRef.current.addEventListener?.('release', () => {
        wakeRef.current = null
        setKeepAwake(false)
      })
    } catch {
      setWakeMessage('Ekranı açık tutma izni alınamadı; tarif normal şekilde kullanılabilir.')
    }
  }

  return (
    <div className="cooking-focus-overlay" role="dialog" aria-modal="true" aria-label={`${title} pişirme modu`}>
      <section className="cooking-focus-shell">
        <header><div><span>{emoji}</span><div><small>{guide.emoji} {guide.label} • ≈ {guide.minutes} dk</small><h2>{title}</h2></div></div><button type="button" onClick={onClose} aria-label="Pişirme modunu kapat">×</button></header>
        <div className="cooking-focus-progress"><div><i style={{ width: `${((step + 1) / total) * 100}%` }} /></div><span>{step + 1} / {total}</span></div>
        <main><span className="cooking-focus-step-label">ADIM {step + 1}</span><p>{current}</p>{guide.note && step === total - 1 && <aside>⚠️ {guide.note}</aside>}</main>
        <footer><button type="button" className="focus-prev" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>← Önceki</button><button type="button" className="focus-awake" aria-pressed={keepAwake} onClick={() => void toggleWake()}>{keepAwake ? '☀️ Ekran açık' : '☀️ Ekranı açık tut'}</button>{step < total - 1 ? <button type="button" className="focus-next" onClick={() => setStep((value) => Math.min(total - 1, value + 1))}>Sonraki →</button> : <button type="button" className="focus-next" onClick={onClose}>✓ Bitti</button>}</footer>
        {wakeMessage && <div className="focus-wake-message" role="status">{wakeMessage}</div>}
      </section>
    </div>
  )
}
