import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { PlayerProvider } from '../features/player/PlayerProvider'
import { persistCache, restoreCache } from './persist'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

restoreCache(queryClient)

export function App() {
  useEffect(() => persistCache(queryClient), [])
  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        <RouterProvider router={router} />
      </PlayerProvider>
    </QueryClientProvider>
  )
}
