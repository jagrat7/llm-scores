import { lazy, Suspense } from 'react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env.local file')
}

const ClerkProvider = lazy(() =>
  import('@clerk/clerk-react').then((module) => ({
    default: module.ClerkProvider,
  })),
)

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={children}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        {children}
      </ClerkProvider>
    </Suspense>
  )
}
