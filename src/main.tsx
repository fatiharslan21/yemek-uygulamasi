import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { NearbyDataProvider } from './context/NearbyDataContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NearbyDataProvider>
      <App />
    </NearbyDataProvider>
  </React.StrictMode>,
)
