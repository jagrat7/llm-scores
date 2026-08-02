import { cn } from "#/lib/utils"

export function DataState({
  children,
  className,
  tone = "muted",
}: {
  children: React.ReactNode
  className?: string
  tone?: "muted" | "error"
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 border-y border-border px-4 text-center text-sm",
        tone === "error" ? "text-destructive" : "text-muted-foreground",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  )
}
