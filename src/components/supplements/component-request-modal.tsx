"use client"

import React, { useMemo, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function ComponentRequestModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [submittedName, setSubmittedName] = useState("")
  const [category, setCategory] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submittedName) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from("component_submissions")
        .insert([{ submitted_name: submittedName, category_suggestion: category || null, notes: notes || null }])
        .select()
      if (error) throw error
      toast({ title: "Submitted", description: "Your request has been sent for review." })
      setSubmittedName("")
      setCategory("")
      setNotes("")
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to submit.", variant: "destructive" as any })
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60">
      <Card className="w-full max-w-lg p-4 space-y-4">
        <div className="text-lg font-semibold">Request New Component</div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Component name</Label>
            <Input value={submittedName} onChange={(e) => setSubmittedName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Category (optional)</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Links or context" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="glass" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !submittedName}>{loading ? "Submitting…" : "Submit"}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
