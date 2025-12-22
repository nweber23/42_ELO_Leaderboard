import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTheme } from './state/theme'

// Import styles in correct order: tokens first, then global, then components
import './styles/tokens.css'
import './styles/global.css'
import './ui/spinner.css'
import './App.css'

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
