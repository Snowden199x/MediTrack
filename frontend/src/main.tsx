import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './styles/base.css'
import './shared/shared.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('The app root element is missing.')
}

const root = createRoot(rootElement)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
const appModule = import.meta.env.VITE_APP_MODE === 'admin'
  ? import('./admin/AdminApp')
  : import('./public/PublicApp')

appModule.then(({ default: App }) => {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
})
