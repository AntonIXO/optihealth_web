"use client"

import React, { useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Pencil } from "lucide-react"

const PAGE_SIZE = 20

type HistoryRow = {
  id: number
  timestamp: string
  amount: number
  unit: string
  notes: string | null
  supplement_id: number
  supplement_name: string
}

const fetchHistory = async (page: number, search: string): Promise<{ rows: HistoryRow[]; hasMore: boolean }> => {
  const supabase = createClient()

  let filterIds: number[] | null = null
  if (search) {
    const { data: defs, error: defErr } = await supabase
      .from("supplement_definitions")
      .select("id")
      .ilike("supplement_name", `%${search}%`)
      .limit(50)
    if (defErr) throw defErr
    filterIds = (defs ?? []).map((d: { id: number }) => d.id)
    if (filterIds.length === 0) {
      return { rows: [], hasMore: false }
    }
  }

  let query = supabase
    .from("supplement_logs")
    .select(
      `id, timestamp, amount, unit, notes, supplement_id,
       supplement_definitions:supplement_id(id, supplement_name)`
    )
    .order("timestamp", { ascending: false })

  if (filterIds) {
    query = query.in("supplement_id", filterIds)
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error, count } = await query.range(from, to)
  if (error) throw error

  const rows: HistoryRow[] = (data ?? []).map((r: any): HistoryRow => ({
    id: r.id,
    timestamp: r.timestamp,
    amount: r.amount,
    unit: r.unit,
    notes: r.notes,
    supplement_id: r.supplement_id,
    supplement_name: r.supplement_definitions?.supplement_name ?? "",
  }))

  return { rows, hasMore: (data ?? []).length === PAGE_SIZE }
}

export function SupplementHistory({
  onEdit,
}: {
  onEdit?: (entry: {
    id: number
    supplement_id: number
    supplement_name: string
    amount: number
    unit: string
    timestamp: string
    notes?: string | null
  }) => void
}) {
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const { data, isLoading, mutate } = useSWR<{ rows: HistoryRow[]; hasMore: boolean}>(
    `supplement-history?page=${page}&q=${search}`,
    () => fetchHistory(page, search),
    { keepPreviousData: true }
  )

  const rows = data?.rows ?? []
  const hasMore = data?.hasMore ?? false

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this entry?")
    if (!confirmed) return

    const prev = rows
    // Optimistic UI
    mutate({ rows: rows.filter((r: HistoryRow) => r.id !== id), hasMore }, { revalidate: false })
    const { error } = await supabase.from("supplement_logs").delete().eq("id", id)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" as any })
      // revert
      mutate({ rows: prev, hasMore }, { revalidate: false })
    } else {
      toast({ title: "Deleted", description: "Entry removed." })
      // revalidate to reflect pagination correctly
      mutate()
    }
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Log History</h2>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Filter by supplement name"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
        />
      </div>

      <div className="space-y-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No logs yet.</div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-start justify-between border rounded-md p-3"
          >
            <div className="space-y-1">
              <div className="text-sm text-foreground">
                {new Date(r.timestamp).toLocaleString()} — Logged {r.amount}
                {r.unit ? r.unit : ""} of {r.supplement_name}
              </div>
              {r.notes && (
                <div className="text-xs text-muted-foreground">{r.notes}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  onEdit?.({
                    id: r.id,
                    supplement_id: r.supplement_id,
                    supplement_name: r.supplement_name,
                    amount: r.amount,
                    unit: r.unit,
                    timestamp: r.timestamp,
                    notes: r.notes,
                  })
                }
                aria-label="Edit"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(r.id)}
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
          Load More
        </Button>
      </div>
    </Card>
  )
}
