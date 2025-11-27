import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { Web3Provider } from './contexts/Web3Context'
import { initAnalytics } from './lib/analytics'
import { initMonitoring, ErrorBoundary } from './lib/monitoring'
import './index.css'

// Initialize analytics and monitoring
if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  initAnalytics()
}

if (import.meta.env.VITE_ENABLE_MONITORING === 'true') {
  initMonitoring()
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div className="p-8 text-center">Something went wrong. Please refresh the page.</div>}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Web3Provider>
            <App />
            <Toaster position="top-right" />
          </Web3Provider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
