import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './router'
import Fallback from './components/ui/fallback'
import NetworkStatusOverlay from './components/ui/NetworkStatusOverlay'

function App() {
  return (
    <>
      <NetworkStatusOverlay />
      <Suspense fallback={<Fallback />}>
        <RouterProvider router={appRouter} />
      </Suspense>
    </>
  )
}

export default App
