"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { QuickLogModal } from "@/components/supplements/quick-log-modal"
import { Pill } from "lucide-react"

type Product = {
  id: string
  name_on_bottle: string
  form_factor: string
  unit_dosage: number
  unit_measure: string
  default_intake_form?: string
  compounds?: { full_name: string }[]
  vendors?: { name: string }[]
}

const fetchCabinetProducts = async (uid: string | null): Promise<Product[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name_on_bottle,
      form_factor,
      unit_dosage,
      unit_measure,
      default_intake_form,
      compounds(full_name),
      vendors(name)
    `)
    .eq("is_archived", false)
    .order("name_on_bottle", { ascending: true })
    .limit(20)
  if (error) throw error
  return data as Product[]
}

const searchProducts = async (q: string, uid: string | null): Promise<Product[]> => {
  if (!q) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name_on_bottle,
      form_factor,
      unit_dosage,
      unit_measure,
      compounds(full_name),
      vendors(name)
    `)
    .ilike("name_on_bottle", `%${q}%`)
    .eq("is_archived", false)
    .order("name_on_bottle", { ascending: true })
    .limit(10)
  if (error) throw error
  return data as Product[]
}

export function SupplementLogger({ onSaved }: { onSaved?: () => void }) {
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const [userId, setUserId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showQuickLog, setShowQuickLog] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  // Fetch cabinet products
  const { data: cabinetProducts, mutate: mutateCabinet } = useSWR<Product[]>(
    userId ? ["cabinet-products", userId] : null,
    ([, uid]: [string, string]) => fetchCabinetProducts(uid)
  )

  const handleQuickLog = (product: Product) => {
    setSelectedProduct(product)
    setShowQuickLog(true)
  }

  const handleLogged = () => {
    // Invalidate SWR caches for history and stats
    globalMutate((key: unknown) => typeof key === "string" && key.startsWith("supplement-history"))
    globalMutate((key: unknown) => typeof key === "string" && key.startsWith("supplement-stats"))
    globalMutate((key: unknown) => typeof key === "string" && key.startsWith("today-logs"))
    onSaved?.()
  }

  return (
    <>
      <Card className="p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">My Cabinet</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Quick log: Tap a product below for 3-tap logging
        </p>

        {!cabinetProducts && (
          <div className="text-sm text-muted-foreground">Loading your cabinet...</div>
        )}

        {cabinetProducts && cabinetProducts.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No products in your cabinet yet. Add products from the Cabinet page.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {cabinetProducts?.map((product) => {
            const compound = Array.isArray(product.compounds) ? product.compounds[0] : product.compounds
            const vendor = Array.isArray(product.vendors) ? product.vendors[0] : product.vendors
            
            return (
              <button
                key={product.id}
                onClick={() => handleQuickLog(product)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Pill className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{product.name_on_bottle}</div>
                  <div className="text-xs text-muted-foreground">
                    {vendor?.name}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <QuickLogModal
        open={showQuickLog}
        onOpenChange={setShowQuickLog}
        product={selectedProduct}
        onLogged={handleLogged}
      />
    </>
  )
}
