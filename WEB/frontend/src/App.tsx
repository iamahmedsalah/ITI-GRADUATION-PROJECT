import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './router'
import Fallback from './components/ui/fallback'

function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={appRouter} />
    </Suspense>
  )
}

export default App
