import * as React from "react"
import { cn } from "@/lib/utils"

const PageWash = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("page-wash", className)} {...props} />
  )
)
PageWash.displayName = "PageWash"

const Glass = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass", className)} {...props} />
  )
)
Glass.displayName = "Glass"

const GlassSubtle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass-subtle", className)} {...props} />
  )
)
GlassSubtle.displayName = "GlassSubtle"

const GlassStrong = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass-strong", className)} {...props} />
  )
)
GlassStrong.displayName = "GlassStrong"

export { PageWash, Glass, GlassSubtle, GlassStrong }
