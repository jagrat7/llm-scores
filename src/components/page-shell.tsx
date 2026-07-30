import { cn } from '#/lib/utils'
import { CONTENT_WIDTH_CLASS } from '#/lib/layout-styles'

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        `mx-auto px-4 sm:px-6 ${CONTENT_WIDTH_CLASS}`,
        className,
      )}
    >
      {children}
    </main>
  )
}
