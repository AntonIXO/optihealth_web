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
  servings: number
  notes: string | null
  product_id: number
  product_name: string
  serving_size_unit: string
}

const fetchHistory = async (page: number, search: string): Promise<{ rows: HistoryRow[]; hasMore: boolean }> => {
  const supabase = createClient()

  let filterIds: number[] | null = null
  if (search) {
    const { data: prods, error: prodErr } = await supabase
      .from("supplement_products")
      .select("id")
      .ilike("product_name", `%${search}%`)
      .limit(50)
    if (prodErr) throw prodErr
    filterIds = (prods ?? []).map((d: { id: number }) => d.id)
    if (filterIds.length === 0) {
      return { rows: [], hasMore: false }
    }
  }

  let query = supabase
    .from("supplement_logs")
    .select(
      `id, timestamp, servings, notes, product_id,
       supplement_products:product_id(id, product_name, serving_size_unit)`
    )
    .order("timestamp", { ascending: false })

  if (filterIds) {
    query = query.in("product_id", filterIds)
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error, count } = await query.range(from, to)
  if (error) throw error

  const rows: HistoryRow[] = (data ?? []).map((r: any): HistoryRow => ({
    id: r.id,
    timestamp: r.timestamp,
    servings: r.servings,
    notes: r.notes,
    product_id: r.product_id,
    product_name: r.supplement_products?.product_name ?? "",
    serving_size_unit: r.supplement_products?.serving_size_unit ?? "pill",
  }))

  return { rows, hasMore: (data ?? []).length === PAGE_SIZE }
}

export function SupplementHistory({
  onEdit,
}: {
  onEdit?: (entry: {
    id: number
    product_id: number
    product_name: string
    servings: number
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
          placeholder="Filter by product name"
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
                {new Date(r.timestamp).toLocaleString()} — Logged {r.servings} {r.serving_size_unit}
                {r.servings !== 1 ? "s" : ""} of {r.product_name}
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
                    product_id: r.product_id,
                    product_name: r.product_name,
                    servings: r.servings,
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
