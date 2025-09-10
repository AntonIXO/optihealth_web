"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ProductForm } from "@/components/supplements/product-form"
import { Plus, RefreshCcw } from "lucide-react"

export default function CabinetPage() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  const fetcher = async (key: string, q: string, uid: string | null) => {
    const qb = supabase
      .from("supplement_products")
      .select("id, product_name, serving_size_unit, barcode, is_public, created_at, user_id")
      .order("created_at", { ascending: false })

    if (uid) qb.eq("user_id", uid)
    if (q) qb.ilike("product_name", `%${q}%`)

    const { data, error } = await qb
    if (error) throw error
    return data
  }

  const { data, isLoading, mutate } = useSWR(
    ["cabinet", search, userId],
    ([, q, uid]) => fetcher("cabinet", q as string, uid as string | null),
    { keepPreviousData: true }
  )

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">My Supplement Cabinet</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add New Supplement
          </Button>
        </div>
      </div>

      <div>
        <Input
          placeholder="Search your products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && (!data || data.length === 0) && (
          <div className="text-sm text-muted-foreground">No products yet.</div>
        )}
        {data?.map((p: any) => (
          <Card key={p.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.product_name}</div>
              {p.is_public ? (
                <span className="text-xs rounded px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">Public</span>
              ) : (
                <span className="text-xs rounded px-2 py-0.5 bg-muted text-muted-foreground border">Private</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Serving unit: {p.serving_size_unit}</div>
            {p.barcode && (
              <div className="text-xs text-muted-foreground">Barcode: {p.barcode}</div>
            )}
          </Card>
        ))}
      </div>

      {showForm && (
        <ProductForm
          open={showForm}
          onOpenChange={setShowForm}
          onSaved={() => {
            setShowForm(false)
            mutate()
          }}
        />
      )}
    </div>
  )
}
