"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flame } from "lucide-react"

type RangeKey = "7d" | "30d" | "month"

function rangeToDates(range: RangeKey) {
  const now = new Date()
  let start: Date
  if (range === "7d") {
    start = new Date(now)
    start.setDate(start.getDate() - 6) // include today
  } else if (range === "30d") {
    start = new Date(now)
    start.setDate(start.getDate() - 29)
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return { start, end: now }
}

type StatRow = {
  supplement_name: string
  unit: string
  total: number
  daysTaken: number
  totalDays: number
  currentStreak: number
}

async function fetchStats(range: RangeKey): Promise<StatRow[]> {
  const { start, end } = rangeToDates(range)
  const supabase = createClient()

  // Fetch logs within range with supplement names
  const { data, error } = await supabase
    .from("supplement_logs")
    .select(
      `timestamp, amount, unit, supplement_id, supplement_definitions:supplement_id(id, supplement_name)`
    )
    .gte("timestamp", start.toISOString())
    .lte("timestamp", end.toISOString())
  if (error) throw error

  const bySupp: Record<string, { name: string; unit: string; totals: number; days: Set<string>; dates: string[] }> = {}

  for (const r of data ?? []) {
    const name = r.supplement_definitions?.supplement_name ?? ""
    const unit = r.unit as string
    const key = `${name}__${unit}`
    const dayKey = new Date(r.timestamp).toISOString().slice(0, 10)
    if (!bySupp[key]) {
      bySupp[key] = { name, unit, totals: 0, days: new Set(), dates: [] }
    }
    bySupp[key].totals += Number(r.amount) || 0
    bySupp[key].days.add(dayKey)
    bySupp[key].dates.push(dayKey)
  }

  const totalDays = Math.ceil((rangeToDates(range).end.getTime() - rangeToDates(range).start.getTime()) / (24 * 3600 * 1000))

  // Compute current streak per supplement based on consecutive days up to today
  const todayStr = new Date().toISOString().slice(0, 10)
  const results: StatRow[] = Object.values(bySupp).map((v) => {
    const uniqueDays = Array.from(v.days).sort()
    let streak = 0
    // Walk backward from today
    let cursor = new Date(todayStr)
    const hasDay = (d: string) => v.days.has(d)
    while (true) {
      const dStr = cursor.toISOString().slice(0, 10)
      if (hasDay(dStr)) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    return {
      supplement_name: v.name,
      unit: v.unit,
      total: v.totals,
      daysTaken: uniqueDays.length,
      totalDays,
      currentStreak: streak,
    }
  })

  // Sort by most frequent in range
  results.sort((a, b) => b.daysTaken - a.daysTaken)
  return results
}

export function SupplementStats() {
  const [range, setRange] = useState<RangeKey>("7d")
  const { data, isLoading } = useSWR<StatRow[]>(`supplement-stats?range=${range}`, () => fetchStats(range))

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Adherence</h2>
        <Select value={range} onValueChange={(v: any) => setRange(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!isLoading && (!data || data.length === 0) && (
        <div className="text-sm text-muted-foreground">No stats in this period.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data?.map((s: StatRow) => {
          const percent = s.totalDays ? Math.round((s.daysTaken / s.totalDays) * 100) : 0
          return (
            <div key={`${s.supplement_name}-${s.unit}`} className="border rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{s.supplement_name}</div>
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm">{s.currentStreak} day streak</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Taken {s.daysTaken} of {s.totalDays} days
                </div>
              </div>
              <div className="mt-2 text-sm">Total this period: {s.total} {s.unit}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
