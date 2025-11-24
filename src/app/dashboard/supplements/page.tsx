"use client"

import React from "react"
import { SupplementLogger } from "@/components/dashboard/supplements/supplement-logger"
import { SupplementHistory } from "@/components/dashboard/supplements/supplement-history"
import { SupplementStats } from "@/components/dashboard/supplements/supplement-stats"
import { TodaysLog } from "@/components/dashboard/supplements/todays-log"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Toaster } from "@/components/ui/toaster"

export default function SupplementsPage() {

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Supplements</h1>
          <p className="mt-2 text-white/70">
            Track your daily supplement intake and adherence
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/dashboard/supplements/cabinet"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
          >
            <Plus className="h-4 w-4" />
            Manage Cabinet
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <SupplementLogger />
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <TodaysLog />
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <SupplementStats />
          </div>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <SupplementHistory />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
