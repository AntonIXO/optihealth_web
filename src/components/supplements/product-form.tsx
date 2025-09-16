"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ComponentRequestModal } from "@/components/supplements/component-request-modal"
import { Plus, X } from "lucide-react"

const UNIT_OPTIONS = ["pill", "softgel", "scoop", "ml", "tsp", "tbsp"]
const SUPPLEMENT_UNITS = ["mg", "mcg", "g", "iu", "tsp", "tbsp", "pill"]

type ComponentRow = {
  id?: number
  component_id: number | null
  component_name: string
  amount: string
  unit: string
}

type RowEditorProps = {
  row: ComponentRow
  onChange: (patch: Partial<ComponentRow>) => void
  onRemove: () => void
  onRequestNew: () => void
  searchFetcher: (_key: string, query: string) => Promise<Array<{ id: number; supplement_name: string }>>
}

function ComponentRowEditor({ row, onChange, onRemove, onRequestNew, searchFetcher }: RowEditorProps) {
  const [query, setQuery] = useState("")
  const { data: suggestions } = useSWR(query ? ["comp", query] : null, ([, q]) => searchFetcher("comp", q as string))

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
      <div className="md:col-span-5 space-y-1">
        <Label>Component</Label>
        <Input
          placeholder="Search component"
          value={row.component_name || query}
          onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            // Keep row in sync to allow typed-only submissions
            onChange({ component_name: v })
          }}
        />
        {query && (
          <div className="border rounded-md max-h-40 overflow-auto bg-background">
            {suggestions?.map((s: any) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange({ component_id: s.id, component_name: s.supplement_name })
                  setQuery("")
                }}
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                {s.supplement_name}
              </button>
            ))}
            {suggestions && suggestions.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                No matches. <button type="button" className="underline" onClick={onRequestNew}>Request new</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="md:col-span-3 space-y-1">
        <Label>Amount</Label>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          value={row.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
        />
      </div>
      <div className="md:col-span-3 space-y-1">
        <Label>Unit</Label>
        <Select value={row.unit} onValueChange={(v) => onChange({ unit: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPLEMENT_UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-1 pt-6">
        <Button type="button" variant="ghost" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ProductForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [productName, setProductName] = useState("")
  const [servingUnit, setServingUnit] = useState("pill")
  const [barcode, setBarcode] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [rows, setRows] = useState<ComponentRow[]>([{ component_id: null, component_name: "", amount: "", unit: "mg" }])
  const [showReqModal, setShowReqModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setProductName("")
      setServingUnit("pill")
      setBarcode("")
      setIsPublic(true)
      setRows([{ component_id: null, component_name: "", amount: "", unit: "mg" }])
    }
  }, [open])

  const componentSearchFetcher = async (_key: string, query: string) => {
    if (!query) return []
    const { data, error } = await supabase
      .from("supplement_components")
      .select("id, supplement_name:component_name")
      .ilike("component_name", `%${query}%`)
      .limit(10)
    if (error) throw error
    return data as Array<{ id: number; supplement_name: string }>
  }

  const hasName = productName.trim().length > 0
  const hasAnyValidRow = rows.some(r => {
    const amt = parseFloat(String(r.amount))
    if (!Number.isFinite(amt) || amt <= 0) return false
    return Boolean(r.component_id) || r.component_name.trim().length > 0
  })
  const canSave = hasName && hasAnyValidRow

  const addRow = () => setRows(prev => [...prev, { component_id: null, component_name: "", amount: "", unit: "mg" }])
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx))

  const updateRow = (idx: number, patch: Partial<ComponentRow>) =>
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      // Get current user ID
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        throw new Error("Not authenticated")
      }

      // 1) Create product
      const { data: prodIns, error: prodErr } = await supabase
        .from("supplement_products")
        .insert([{ 
          user_id: user.id,
          product_name: productName.trim(), 
          serving_size_unit: servingUnit, 
          barcode: barcode || null, 
          is_public: isPublic 
        }])
        .select("id")
        .single()
      if (prodErr) throw prodErr
      const productId = prodIns.id as number

      // 2) Insert links for selected components only
      const selectedLinks = rows
        .filter(r => r.component_id && parseFloat(String(r.amount)) > 0)
        .map(r => ({ product_id: productId, component_id: r.component_id!, amount: parseFloat(String(r.amount)), unit: r.unit }))
      if (selectedLinks.length > 0) {
        const { error: linkErr } = await supabase.from("product_component_link").insert(selectedLinks)
        if (linkErr) throw linkErr
      }

      // 3) Auto-submit requests for typed-only components (no component_id yet)
      const pendingRequests = rows.filter(r => !r.component_id && r.component_name.trim().length > 0 && parseFloat(String(r.amount)) > 0)
      if (pendingRequests.length > 0) {
        const submissions = pendingRequests.map(r => ({ submitted_name: r.component_name.trim(), category_suggestion: null as string | null, notes: `Auto-submitted from product '${productName.trim()}'` }))
        const { error: subErr } = await supabase.from("component_submissions").insert(submissions)
        if (subErr) {
          // Non-fatal; product is already created
          console.warn("component_submissions failed", subErr)
        }
      }

      const summaryParts: string[] = []
      if (selectedLinks.length > 0) summaryParts.push(`${selectedLinks.length} component${selectedLinks.length > 1 ? 's' : ''} linked`)
      if (pendingRequests.length > 0) summaryParts.push(`${pendingRequests.length} request${pendingRequests.length > 1 ? 's' : ''} submitted`)
      const description = summaryParts.length ? summaryParts.join(" · ") : "Product created."

      toast({ title: "Saved", description })
      onSaved?.()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to save product.", variant: "destructive" as any })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60">
      <Card className="w-full max-w-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Add New Supplement Product</div>
          <button className="p-1" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Product name</Label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., Jarrow Lutein+Zeaxanthin" />
          </div>
          <div className="space-y-2">
            <Label>Serving size unit</Label>
            <Select value={servingUnit} onValueChange={setServingUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Barcode (optional)</Label>
            <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="GTIN/UPC" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} id="is_public" />
            <Label htmlFor="is_public">Share as public</Label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Components per serving</div>
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <ComponentRowEditor
                key={idx}
                row={row}
                onChange={(patch) => updateRow(idx, patch)}
                onRemove={() => removeRow(idx)}
                onRequestNew={() => setShowReqModal(true)}
                searchFetcher={componentSearchFetcher}
              />
            ))}
          </div>
          <Button type="button" variant="secondary" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> Add Component
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>{saving ? "Saving…" : "Save Product"}</Button>
        </div>

        {!canSave && (
          <div className="text-xs text-muted-foreground">
            Enter a product name and add at least one component with a positive amount. You can either select a component from the list or type a name to submit it for approval automatically.
          </div>
        )}
      </Card>

      <ComponentRequestModal open={showReqModal} onOpenChange={setShowReqModal} />
    </div>
  )
}
