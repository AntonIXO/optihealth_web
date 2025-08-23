"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const ToastViewport = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:top-auto sm:flex-col sm:p-6",
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

export type ToastProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive"
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-variant={variant}
        className={cn(
          "pointer-events-auto relative w-full rounded-lg border bg-background p-4 text-foreground shadow-lg sm:max-w-[420px]",
          variant === "destructive" &&
            "border-destructive text-destructive-foreground",
          className,
        )}
        {...props}
      />
    )
  },
)
Toast.displayName = "Toast"

export const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref as any} className={cn("font-semibold", className)} {...props} />
))
ToastTitle.displayName = "ToastTitle"

export const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref as any} className={cn("text-sm opacity-90", className)} {...props} />
))
ToastDescription.displayName = "ToastDescription"

export const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/70 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
      className,
    )}
    aria-label="Close"
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  </button>
))
ToastClose.displayName = "ToastClose"
