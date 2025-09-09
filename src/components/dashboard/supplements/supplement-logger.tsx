"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const UNITS = ["mg", "mcg", "g", "iu", "tsp", "tbsp", "pill"] as const

const fetcher = async (_key: string, q: string): Promise<Array<{ id: number; supplement_name: string }>> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("supplement_definitions")
    .select("id, supplement_name")
    .ilike("supplement_name", `%${q}%`)
    .order("supplement_name", { ascending: true })
    .limit(10)
  if (error) throw error
  return data
}

export type EditEntry = {
  id: number
  supplement_id: number
  supplement_name: string
  amount: number
  unit: string
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
  const [supplementId, setSupplementId] = useState<number | null>(null)
  const [supplementName, setSupplementName] = useState("")
  const [amount, setAmount] = useState<string>("")
  const [unit, setUnit] = useState<string>(UNITS[0])
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().slice(0, 16)) // yyyy-MM-ddTHH:mm
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editEntry) {
      setSupplementId(editEntry.supplement_id)
      setSupplementName(editEntry.supplement_name)
      setNameQuery(editEntry.supplement_name)
      setAmount(String(editEntry.amount))
      setUnit(editEntry.unit)
      // convert editEntry.timestamp (ISO) to local datetime-local format
      const dt = new Date(editEntry.timestamp)
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      setTimestamp(local.toISOString().slice(0, 16))
      setNotes(editEntry.notes ?? "")
    }
  }, [editEntry])

  const { data: suggestions, isLoading } = useSWR<Array<{ id: number; supplement_name: string }>>(
    nameQuery ? ["supplement-search", nameQuery] : null,
    ([, q]) => fetcher("supplement-search", q as string)
  )

  const canSubmit = !!supplementId && amount !== "" && unit && timestamp

  const handleSelectSuggestion = (id: number, name: string) => {
    setSupplementId(id)
    setSupplementName(name)
    setNameQuery(name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)

    try {
      const iso = new Date(timestamp)
      const payload = {
        supplement_id: supplementId!,
        amount: Number(amount),
        unit: unit as (typeof UNITS)[number],
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
        setAmount("")
        setUnit(UNITS[0])
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
          <Label>Supplement</Label>
          <Input
            placeholder="Start typing, e.g. Magnesium Glycinate"
            value={nameQuery}
            onChange={(e) => {
              const v = e.target.value
              setNameQuery(v)
              setSupplementId(null)
              setSupplementName("")
            }}
          />
          {nameQuery && (
            <div className="border rounded-md max-h-56 overflow-auto bg-background">
              {isLoading && <div className="p-2 text-sm text-muted-foreground">Searching…</div>}
              {suggestions?.map((s: any) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(s.id, s.supplement_name)}
                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                >
                  {s.supplement_name}
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
            <Label>Amount</Label>
            <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
