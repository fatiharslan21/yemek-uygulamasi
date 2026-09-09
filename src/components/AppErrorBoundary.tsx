import { Component, type ErrorInfo, type ReactNode } from 'react'
import '../error-boundary.css'

type Props = { children: ReactNode }
type State = { hasError: boolean; message?: string }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Beklenmeyen bir uygulama hatası oluştu.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Şimdilik yalnızca local geliştirme konsoluna bırakıyoruz.
    // Canlı sürümde bu nokta anonim crash-reporting sağlayıcısına bağlanacak.
    console.error('[Lokma] Uygulama hatası', error, info.componentStack)
  }

  private retry = () => {
    this.setState({ hasError: false, message: undefined })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="app-error-page">
        <section className="app-error-card">
          <div className="app-error-logo">🍋</div>
          <span>Lokma bir şeye takıldı</span>
          <h1>Planın kaybolmadı.</h1>
          <p>Beklenmeyen bir ekran hatası oluştu. Profilin ve kayıtlı planın cihazında duruyor; önce ekranı yeniden kurmayı deneyebiliriz.</p>
          <div className="app-error-actions">
            <button type="button" onClick={this.retry}>↻ Tekrar dene</button>
            <button type="button" onClick={() => window.location.reload()}>Uygulamayı yenile</button>
          </div>
          {this.state.message && <details><summary>Teknik ayrıntı</summary><code>{this.state.message}</code></details>}
        </section>
      </main>
    )
  }
}
