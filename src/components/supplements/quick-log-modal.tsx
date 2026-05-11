"use client"

import React, { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

interface Product {
  id: string
  name_on_bottle: string
  form_factor: string
  unit_dosage: number
  unit_measure: string
  default_intake_form?: string
  vendor_name?: string
  compound_name?: string
}

interface QuickLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onLogged?: () => void
}

export function QuickLogModal({ open, onOpenChange, product, onLogged }: QuickLogModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [dosageAmount, setDosageAmount] = useState("1")
  const [intakeForm, setIntakeForm] = useState<string>("oral")
  const [timestamp, setTimestamp] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check if mounted (for portal)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  // Reset form when modal opens with a new product
  useEffect(() => {
    if (open && product) {
      setDosageAmount("1")
      // Use product's default intake form, fallback to 'oral'
      setIntakeForm(product.default_intake_form || "oral")
      setTimestamp(new Date().toISOString().slice(0, 16))
    }
  }, [open, product])

  const handleLog = async () => {
    if (!product || !userId) return

    setIsSubmitting(true)
    try {
      const amount = parseFloat(dosageAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid dosage amount")
      }

      const timestampISO = new Date(timestamp).toISOString()

      const { error } = await supabase.from("supplement_logs").insert({
        user_id: userId,
        product_id: product.id,
        dosage_amount: amount,
        dosage_unit: product.form_factor, // e.g., 'capsule', 'tablet'
        intake_form: intakeForm,
        timestamp: timestampISO,
      })

      if (error) throw error

      toast({
        title: "Logged",
        description: `${amount} ${product.form_factor}${amount !== 1 ? "s" : ""} of ${product.name_on_bottle}`,
      })

      onLogged?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error",
        description: err.message ?? "Failed to log supplement.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !product || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => onOpenChange(false)}>
      <Card className="w-full max-w-md p-6 space-y-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{product.name_on_bottle}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {product.vendor_name && `${product.vendor_name} · `}
              {product.unit_dosage} {product.unit_measure} per {product.form_factor}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-accent rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dosage</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={dosageAmount}
                onChange={(e) => setDosageAmount(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <span className="text-sm text-muted-foreground min-w-20">
                {product.form_factor}
                {parseFloat(dosageAmount) !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {(parseFloat(dosageAmount) || 0) * product.unit_dosage} {product.unit_measure} · {intakeForm}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleLog} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Logging..." : "Log Now"}
          </Button>
          <Button variant="glass" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )

  return createPortal(modalContent, document.body)
}
