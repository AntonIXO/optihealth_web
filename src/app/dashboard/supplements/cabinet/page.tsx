"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ProductForm } from "@/components/supplements/product-form"
import { Plus, RefreshCcw, Trash2 } from "lucide-react"

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

  const handleDelete = async (id: number) => {
    const ok = window.confirm("Remove this product from your cabinet? This cannot be undone.")
    if (!ok) return
    const prev = data ?? []
    try {
      // optimistic update
      await mutate(prev.filter((p: any) => p.id !== id), { revalidate: false })
      const { error } = await supabase.from("supplement_products").delete().eq("id", id)
      if (error) throw error
      toast({ title: "Removed", description: "Product removed from your cabinet." })
      await mutate()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to remove.", variant: "destructive" as any })
      await mutate(prev, { revalidate: false })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Supplement Cabinet</h1>
          <p className="mt-2 text-white/70">
            Manage your supplement products and formulas
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
          >
            <Plus className="h-4 w-4" />
            Add New Supplement
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <Input
          placeholder="Search your products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          <div className="col-span-full rounded-xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
            <div className="text-center text-white/70">Loading your products...</div>
          </div>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <div className="col-span-full rounded-xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
            <div className="text-center text-white/70">
              No products in your cabinet yet. Add your first supplement to get started!
            </div>
          </div>
        )}
        {data?.map((p: any) => (
          <Card key={p.id} className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-lg truncate">{p.product_name}</div>
                <div className="text-sm text-white/70 mt-1">
                  Serving: {p.serving_size_unit}
                </div>
                {p.barcode && (
                  <div className="text-xs text-white/50 mt-1 font-mono">
                    {p.barcode}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                {p.is_public ? (
                  <span className="text-xs rounded-full px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30">
                    Public
                  </span>
                ) : (
                  <span className="text-xs rounded-full px-2 py-1 bg-white/10 text-white/60 border border-white/20">
                    Private
                  </span>
                )}
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="p-2 rounded-lg border border-white/20 bg-white/10 text-white/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                  aria-label="Delete product"
                  title="Remove from cabinet"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
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
