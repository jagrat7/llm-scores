import type { ReactNode } from 'react'

import { lazy, Suspense } from 'react'

const ClientPostHogProvider = lazy(() => import('./client-provider'))

export default function PostHogProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <ClientPostHogProvider>{children}</ClientPostHogProvider>
    </Suspense>
  )
}
