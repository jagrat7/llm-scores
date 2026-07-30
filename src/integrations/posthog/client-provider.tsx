import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'
import type { ReactNode } from 'react'

if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    defaults: '2025-11-30',
  })
}

export default function ClientPostHogProvider({
  children,
}: {
  children: ReactNode
}) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
