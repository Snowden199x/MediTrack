import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './shared/shared.css'

const root = createRoot(document.getElementById('root'))
const appModule = import.meta.env.VITE_APP_MODE === 'admin'
  ? import('./admin/AdminApp.jsx')
  : import('./public/PublicApp.jsx')

appModule.then(({ default: App }) => {
  root.render(<StrictMode><App /></StrictMode>)
})
