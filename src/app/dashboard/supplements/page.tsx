"use client"

import React from "react"
import { SupplementLogger } from "@/components/dashboard/supplements/supplement-logger"
import { SupplementStats } from "@/components/dashboard/supplements/supplement-stats"
import { SupplementHistory } from "@/components/dashboard/supplements/supplement-history"
import { Toaster } from "@/components/ui/toaster"

export default function SupplementsPage() {
  const [editEntry, setEditEntry] = React.useState<null | {
    id: number
    supplement_id: number
    supplement_name: string
    amount: number
    unit: string
    timestamp: string
    notes?: string | null
  }>(null)

  const onSaved = () => {
    // Clear edit state after a successful save
    setEditEntry(null)
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SupplementLogger editEntry={editEntry} onSaved={onSaved} />
          <SupplementStats />
        </div>
        <div>
          <SupplementHistory onEdit={setEditEntry} />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
