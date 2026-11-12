import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from '@/context/AppContext'
import { ToastProvider } from '@/components/ui/toast'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root-Element #root nicht gefunden')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
