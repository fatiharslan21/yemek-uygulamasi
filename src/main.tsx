import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { NearbyDataProvider } from './context/NearbyDataContext'
import { initializeNativeAuthLinks } from './services/nativeAuthLinks'
import './styles.css'
import './mobile-dashboard-v18.css'
import './product-cleanup.css'
import './accessibility.css'

void initializeNativeAuthLinks()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <a className="skip-link" href="#lokma-app-content">Ana içeriğe geç</a>
    <div id="lokma-app-content" tabIndex={-1}>
      <AppErrorBoundary>
        <NearbyDataProvider>
          <App />
        </NearbyDataProvider>
      </AppErrorBoundary>
    </div>
  </React.StrictMode>,
)
