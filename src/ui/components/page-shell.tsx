import { CONTENT_WIDTH_CLASS } from "#/ui/lib/layout-styles"
import { cn } from "#/ui/lib/utils"

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main className={cn(`mx-auto px-4 sm:px-6 ${CONTENT_WIDTH_CLASS}`, className)}>{children}</main>
  )
}
