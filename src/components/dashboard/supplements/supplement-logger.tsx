"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

type Product = { id: number; product_name: string; serving_size_unit: string; user_id?: string }

const fetcher = async (_key: string, q: string, uid: string | null): Promise<Product[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("supplement_products")
    .select("id, product_name, serving_size_unit")
    .ilike("product_name", `%${q}%`)
    .eq("user_id", uid as any)
    .order("product_name", { ascending: true })
    .limit(10)
  if (error) throw error
  return data
}

export type EditEntry = {
  id: number
  product_id: number
  product_name: string
  servings: number
  timestamp: string
  notes?: string | null
}

export function SupplementLogger({
  editEntry,
  onSaved,
}: {
  editEntry: EditEntry | null
  onSaved?: () => void
}) {
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [nameQuery, setNameQuery] = useState("")
  const [productId, setProductId] = useState<number | null>(null)
  const [productName, setProductName] = useState("")
  const [servings, setServings] = useState<string>("1")
  const [servingUnit, setServingUnit] = useState<string>("pill")
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().slice(0, 16)) // yyyy-MM-ddTHH:mm
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  useEffect(() => {
    if (editEntry) {
      setProductId(editEntry.product_id)
      setProductName(editEntry.product_name)
      setNameQuery(editEntry.product_name)
      setServings(String(editEntry.servings))
      // convert editEntry.timestamp (ISO) to local datetime-local format
      const dt = new Date(editEntry.timestamp)
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      setTimestamp(local.toISOString().slice(0, 16))
      setNotes(editEntry.notes ?? "")
    }
  }, [editEntry])

  const { data: suggestions, isLoading } = useSWR<Product[]>(
    nameQuery && userId ? ["supplement-search", nameQuery, userId] : null,
    ([, q, uid]) => fetcher("supplement-search", q as string, uid as string | null)
  )

  const canSubmit = !!productId && servings !== "" && timestamp && !!userId

  const handleSelectSuggestion = (p: Product) => {
    setProductId(p.id)
    setProductName(p.product_name)
    setServingUnit(p.serving_size_unit || "pill")
    setNameQuery(p.product_name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)

    try {
      const iso = new Date(timestamp)
      const payload = {
        user_id: userId!,
        product_id: productId!,
        servings: Number(servings),
        timestamp: iso.toISOString(),
        notes: notes || null,
      }

      if (editEntry) {
        const { error } = await supabase
          .from("supplement_logs")
          .update(payload)
          .eq("id", editEntry.id)
          .select()
        if (error) throw error
        toast({ title: "Updated", description: "Supplement log updated." })
      } else {
        const { error } = await supabase
          .from("supplement_logs")
          .insert([payload])
          .select()
        if (error) throw error
        toast({ title: "Logged", description: "Supplement logged successfully." })
      }

      // Invalidate SWR caches for history and stats
      globalMutate((key: unknown) => typeof key === "string" && key.startsWith("supplement-history"))
      globalMutate((key: unknown) => typeof key === "string" && key.startsWith("supplement-stats"))

      // Clear form
      if (!editEntry) {
        setServings("1")
        setTimestamp(new Date().toISOString().slice(0, 16))
        setNotes("")
      }
      onSaved?.()
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message ?? "Failed to save.", variant: "destructive" as any })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">Log Your Intake</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Product</Label>
          <Input
            placeholder="Start typing, e.g. Doctor's Best Lutein"
            value={nameQuery}
            onChange={(e) => {
              const v = e.target.value
              setNameQuery(v)
              setProductId(null)
              setProductName("")
            }}
          />
          {nameQuery && (
            <div className="border rounded-md max-h-56 overflow-auto bg-background">
              {isLoading && <div className="p-2 text-sm text-muted-foreground">Searching…</div>}
              {suggestions?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(p)}
                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-center justify-between">
                    <span>{p.product_name}</span>
                    <span className="text-xs text-muted-foreground">{p.serving_size_unit}</span>
                  </div>
                </button>
              ))}
              {suggestions && suggestions.length === 0 && !isLoading && (
                <div className="p-2 text-sm text-muted-foreground">No matches</div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Servings{servingUnit ? ` (${servingUnit})` : ""}</Label>
            <Input type="number" inputMode="decimal" min="0" step="0.5" value={servings} onChange={(e) => setServings(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Timestamp</Label>
            <Input type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., with meal" />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {editEntry ? (isSubmitting ? "Saving…" : "Save Changes") : isSubmitting ? "Logging…" : "Log"}
          </Button>
          {editEntry && (
            <Button type="button" variant="secondary" onClick={() => onSaved?.()}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
