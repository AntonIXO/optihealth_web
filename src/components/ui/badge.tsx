import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-white/10 text-white border border-white/20 backdrop-blur-sm",
        secondary:
          "bg-white/5 text-white/70 border border-white/10",
        destructive:
          "bg-[#e25555]/20 text-[#e25555] border border-[#e25555]/30",
        outline: "text-white border border-white/20",
        success: "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
