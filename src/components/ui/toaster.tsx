"use client"

import * as React from "react"
import { useToast } from "./use-toast"
import { Toast, ToastClose, ToastDescription, ToastTitle, ToastViewport } from "./toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastViewport>
      {toasts.map(function ({ id, title, description, action, variant }) {
        return (
          <Toast key={id} variant={variant}>
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            {action}
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        )
      })}
    </ToastViewport>
  )
}
