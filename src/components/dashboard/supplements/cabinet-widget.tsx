"use client"

import React, { useState, useEffect } from "react"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuickLogModal } from "@/components/supplements/quick-log-modal"
import { Pill, Plus } from "lucide-react"
import Link from "next/link"

type Product = {
  id: string
  name_on_bottle: string
  form_factor: string
  unit_dosage: number
  unit_measure: string
  compounds?: { full_name: string }[]
  vendors?: { name: string }[]
}

const fetchCabinetProducts = async (): Promise<Product[]> => {
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
    .eq("is_archived", false)
    .order("name_on_bottle", { ascending: true })
    .limit(10)
  if (error) throw error
  return data as Product[]
}

export function CabinetWidget() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showQuickLog, setShowQuickLog] = useState(false)

  const { data: products, isLoading } = useSWR<Product[]>(
    "cabinet-widget-products",
    fetchCabinetProducts
  )

  const handleQuickLog = (product: Product) => {
    setSelectedProduct(product)
    setShowQuickLog(true)
  }

  return (
    <>
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Log</h2>
          <Link href="/dashboard/supplements/cabinet">
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}

        {!isLoading && (!products || products.length === 0) && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">
              No products in your cabinet yet.
            </p>
            <Link href="/dashboard/supplements/cabinet">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {products?.map((product) => {
            const vendor = Array.isArray(product.vendors)
              ? product.vendors[0]
              : product.vendors

            return (
              <button
                key={product.id}
                onClick={() => handleQuickLog(product)}
                className="flex flex-col items-start gap-1 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <div className="flex items-center gap-2 w-full">
                  <Pill className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {product.name_on_bottle}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground truncate w-full">
                  {vendor?.name}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <QuickLogModal
        open={showQuickLog}
        onOpenChange={setShowQuickLog}
        product={selectedProduct}
        onLogged={() => {
          setShowQuickLog(false)
        }}
      />
    </>
  )
}
