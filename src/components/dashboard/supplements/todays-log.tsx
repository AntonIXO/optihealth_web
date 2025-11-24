"use client"

import React from "react"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

type TodayLog = {
  id: string
  timestamp: string
  dosage_amount: number
  dosage_unit: string
  product_name: string
  vendor_name: string
  calculated_dosage_mg: number | null
}

const fetchTodayLogs = async (): Promise<TodayLog[]> => {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("supplement_logs")
    .select(`
      id,
      timestamp,
      dosage_amount,
      dosage_unit,
      calculated_dosage_mg,
      products!inner(
        name_on_bottle,
        vendors(name)
      )
    `)
    .gte("timestamp", today.toISOString())
    .order("timestamp", { ascending: false })

  if (error) throw error

  return (data ?? []).map((log: any) => {
    const product = Array.isArray(log.products) ? log.products[0] : log.products
    const vendor = product?.vendors ? (Array.isArray(product.vendors) ? product.vendors[0] : product.vendors) : null

    return {
      id: log.id,
      timestamp: log.timestamp,
      dosage_amount: log.dosage_amount,
      dosage_unit: log.dosage_unit,
      calculated_dosage_mg: log.calculated_dosage_mg,
      product_name: product?.name_on_bottle ?? "",
      vendor_name: vendor?.name ?? "",
    }
  })
}

export function TodaysLog() {
  const { data: logs, isLoading } = useSWR<TodayLog[]>("today-logs", fetchTodayLogs, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">Today's Log</h2>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading...</div>
      )}

      {!isLoading && (!logs || logs.length === 0) && (
        <div className="text-sm text-muted-foreground">
          No supplements logged today yet.
        </div>
      )}

      <div className="space-y-2">
        {logs?.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 rounded-md border bg-card/50"
          >
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">
                  {formatTime(log.timestamp)}
                </span>
                <span className="text-sm text-foreground">
                  {log.product_name}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {log.dosage_amount} {log.dosage_unit}
                {log.dosage_amount !== 1 ? "s" : ""}
                {log.calculated_dosage_mg && ` (${log.calculated_dosage_mg} mg)`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
