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
  id: string
  timestamp: string
  dosage_amount: number
  dosage_unit: string
  intake_form: string
  calculated_dosage_mg: number | null
  notes: string | null
  product_id: string
  product_name: string
  vendor_name: string
  compound_name: string
  form_factor: string
}

const fetchHistory = async (page: number, search: string): Promise<{ rows: HistoryRow[]; hasMore: boolean }> => {
  const supabase = createClient()

  let query = supabase
    .from("supplement_logs")
    .select(`
      id,
      timestamp,
      dosage_amount,
      dosage_unit,
      intake_form,
      calculated_dosage_mg,
      notes,
      product_id,
      products!inner(
        id,
        name_on_bottle,
        form_factor,
        vendors(name),
        compounds(full_name)
      )
    `)
    .order("timestamp", { ascending: false })

  if (search) {
    query = query.ilike("products.name_on_bottle", `%${search}%`)
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error } = await query.range(from, to)
  if (error) throw error

  const rows: HistoryRow[] = (data ?? []).map((r: any): HistoryRow => {
    const product = Array.isArray(r.products) ? r.products[0] : r.products
    const vendor = product?.vendors ? (Array.isArray(product.vendors) ? product.vendors[0] : product.vendors) : null
    const compound = product?.compounds ? (Array.isArray(product.compounds) ? product.compounds[0] : product.compounds) : null
    
    return {
      id: r.id,
      timestamp: r.timestamp,
      dosage_amount: r.dosage_amount,
      dosage_unit: r.dosage_unit,
      intake_form: r.intake_form,
      calculated_dosage_mg: r.calculated_dosage_mg,
      notes: r.notes,
      product_id: r.product_id,
      product_name: product?.name_on_bottle ?? "",
      vendor_name: vendor?.name ?? "",
      compound_name: compound?.full_name ?? "",
      form_factor: product?.form_factor ?? "capsule",
    }
  })

  return { rows, hasMore: (data ?? []).length === PAGE_SIZE }
}

export function SupplementHistory() {
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

  const handleDelete = async (id: string) => {
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
            <div className="space-y-1 flex-1">
              <div className="text-sm font-medium text-foreground">
                {r.product_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {r.vendor_name} · {r.compound_name}
              </div>
              <div className="text-sm text-foreground mt-1">
                {new Date(r.timestamp).toLocaleString()} — {r.dosage_amount} {r.dosage_unit}
                {r.dosage_amount !== 1 ? "s" : ""}
              </div>
              {r.calculated_dosage_mg && (
                <div className="text-xs text-muted-foreground">
                  Total: {r.calculated_dosage_mg} mg · {r.intake_form}
                </div>
              )}
              {r.notes && (
                <div className="text-xs text-muted-foreground italic mt-1">"{r.notes}"</div>
              )}
            </div>
            <div className="flex gap-2">
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
        <Button variant="glass" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button variant="glass" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
          Load More
        </Button>
      </div>
    </Card>
  )
}
