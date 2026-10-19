import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))
const appModule = import.meta.env.VITE_APP_MODE === 'admin'
  ? import('./AdminApp.jsx')
  : import('./App.jsx')

appModule.then(({ default: App }) => {
  root.render(<StrictMode><App /></StrictMode>)
})
