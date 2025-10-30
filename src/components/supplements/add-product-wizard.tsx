"use client"

import React, { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react"

const FORM_FACTORS = ["capsule", "tablet", "powder", "liquid", "softgel", "sublingual_strip", "other"] as const
const INTAKE_FORMS = ["oral", "sublingual", "transdermal", "intravenous", "intramuscular", "nasal", "other"] as const

type Compound = {
  id: string
  full_name: string
  name: string
}

type Vendor = {
  id: string
  name: string
}

type WizardStep = 1 | 2 | 3

interface AddProductWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function AddProductWizard({ open, onOpenChange, onSaved }: AddProductWizardProps) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [step, setStep] = useState<WizardStep>(1)
  const [userId, setUserId] = useState<string | null>(null)

  // Step 1: Compound selection
  const [compoundQuery, setCompoundQuery] = useState("")
  const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null)

  // Step 2: Vendor selection
  const [vendorQuery, setVendorQuery] = useState("")
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [newVendorName, setNewVendorName] = useState("")
  const [isCreatingVendor, setIsCreatingVendor] = useState(false)

  // Step 3: Product details
  const [nameOnBottle, setNameOnBottle] = useState("")
  const [formFactor, setFormFactor] = useState<typeof FORM_FACTORS[number]>("capsule")
  const [intakeForm, setIntakeForm] = useState<typeof INTAKE_FORMS[number]>("oral")
  const [unitDosage, setUnitDosage] = useState("")
  const [unitMeasure, setUnitMeasure] = useState("mg")

  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check if mounted (for portal)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Fetch user on mount
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [supabase])

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setStep(1)
      setCompoundQuery("")
      setSelectedCompound(null)
      setVendorQuery("")
      setSelectedVendor(null)
      setNewVendorName("")
      setIsCreatingVendor(false)
      setNameOnBottle("")
      setFormFactor("capsule")
      setIntakeForm("oral")
      setUnitDosage("")
      setUnitMeasure("mg")
    }
  }, [open])

  // Step 1: Search compounds
  const { data: compounds, isLoading: loadingCompounds } = useSWR<Compound[]>(
    compoundQuery && step === 1 ? ["compounds", compoundQuery] : null,
    async () => {
      const { data, error } = await supabase
        .from("compounds")
        .select("id, full_name, name")
        .ilike("full_name", `%${compoundQuery}%`)
        .limit(10)
      if (error) throw error
      return data
    }
  )

  // Step 2: Search vendors
  const { data: vendors, isLoading: loadingVendors } = useSWR<Vendor[]>(
    vendorQuery && step === 2 ? ["vendors", vendorQuery] : null,
    async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name")
        .ilike("name", `%${vendorQuery}%`)
        .limit(10)
      if (error) throw error
      return data
    }
  )

  const handleSelectCompound = (compound: Compound) => {
    setSelectedCompound(compound)
    setCompoundQuery(compound.full_name)
  }

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setVendorQuery(vendor.name)
    setIsCreatingVendor(false)
  }

  const handleCreateVendor = () => {
    setIsCreatingVendor(true)
    setSelectedVendor(null)
  }

  const canProceedStep1 = !!selectedCompound
  const canProceedStep2 = !!selectedVendor || (isCreatingVendor && newVendorName.trim().length > 0)
  const canSave = nameOnBottle.trim().length > 0 && parseFloat(unitDosage) > 0

  const handleSave = async () => {
    if (!canSave || !selectedCompound || !userId) return

    setIsSaving(true)
    try {
      const vendorNameToUse = isCreatingVendor ? newVendorName.trim() : selectedVendor?.name
      if (!vendorNameToUse) throw new Error("Vendor name is required")

      const { data, error } = await supabase.rpc("add_new_product", {
        p_user_id: userId,
        p_compound_id: selectedCompound.id,
        p_vendor_name: vendorNameToUse,
        p_name_on_bottle: nameOnBottle.trim(),
        p_form_factor: formFactor,
        p_unit_dosage: parseFloat(unitDosage),
        p_unit_measure: unitMeasure,
        p_default_intake_form: intakeForm,
      })

      if (error) throw error

      toast({
        title: "Product Added",
        description: `${nameOnBottle} has been added to your cabinet.`,
      })

      onSaved?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error",
        description: err.message ?? "Failed to add product.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!open || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto" onClick={() => onOpenChange(false)}>
      <Card className="w-full max-w-2xl p-6 space-y-6 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Add New Product</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step} of 3: {step === 1 ? "Select Compound" : step === 2 ? "Select Vendor" : "Product Details"}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-accent rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Compound Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search for a compound</Label>
              <Input
                placeholder="Type 'magnesium' or 'caffeine'..."
                value={compoundQuery}
                onChange={(e) => {
                  setCompoundQuery(e.target.value)
                  setSelectedCompound(null)
                }}
                autoFocus
              />
            </div>

            {selectedCompound && (
              <div className="p-3 border border-primary rounded-md bg-primary/10">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedCompound.full_name}</span>
                </div>
              </div>
            )}

            {compoundQuery && !selectedCompound && (
              <div className="border rounded-md max-h-64 overflow-auto">
                {loadingCompounds && (
                  <div className="p-4 text-sm text-muted-foreground">Searching...</div>
                )}
                {compounds?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCompound(c)}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                  >
                    <div className="font-medium">{c.full_name}</div>
                  </button>
                ))}
                {compounds && compounds.length === 0 && !loadingCompounds && (
                  <div className="p-4 text-sm text-muted-foreground">
                    No compounds found. Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Vendor Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search for a vendor or create new</Label>
              <Input
                placeholder="Type 'thorne' or 'nootropics depot'..."
                value={vendorQuery}
                onChange={(e) => {
                  setVendorQuery(e.target.value)
                  setSelectedVendor(null)
                  setIsCreatingVendor(false)
                }}
                autoFocus
              />
            </div>

            {selectedVendor && (
              <div className="p-3 border border-primary rounded-md bg-primary/10">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedVendor.name}</span>
                </div>
              </div>
            )}

            {isCreatingVendor && (
              <div className="space-y-2">
                <Label>New Vendor Name</Label>
                <Input
                  placeholder="Enter vendor name"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                />
              </div>
            )}

            {vendorQuery && !selectedVendor && !isCreatingVendor && (
              <div className="border rounded-md max-h-64 overflow-auto">
                {loadingVendors && (
                  <div className="p-4 text-sm text-muted-foreground">Searching...</div>
                )}
                {vendors?.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVendor(v)}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                  >
                    <div className="font-medium">{v.name}</div>
                  </button>
                ))}
                {vendors && vendors.length === 0 && !loadingVendors && (
                  <div className="p-4 space-y-3">
                    <div className="text-sm text-muted-foreground">
                      No vendors found matching "{vendorQuery}"
                    </div>
                    <Button onClick={handleCreateVendor} variant="secondary" className="w-full">
                      Create New Vendor: "{vendorQuery}"
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Product Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name on Bottle</Label>
              <Input
                placeholder='e.g., "Magtein"'
                value={nameOnBottle}
                onChange={(e) => setNameOnBottle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form Factor</Label>
                <Select value={formFactor} onValueChange={(v: any) => setFormFactor(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {FORM_FACTORS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Intake Method</Label>
                <Select value={intakeForm} onValueChange={(v: any) => setIntakeForm(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {INTAKE_FORMS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Measure</Label>
                <Select value={unitMeasure} onValueChange={setUnitMeasure}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="iu">IU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2" />
            </div>

            <div className="space-y-2">
              <Label>Dosage per Unit</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 144"
                  value={unitDosage}
                  onChange={(e) => setUnitDosage(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">{unitMeasure} per {formFactor}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="font-medium">Summary:</div>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Compound:</span> {selectedCompound?.full_name}</div>
                <div><span className="text-muted-foreground">Vendor:</span> {isCreatingVendor ? newVendorName : selectedVendor?.name}</div>
                <div><span className="text-muted-foreground">Product:</span> {nameOnBottle || "(not set)"}</div>
                <div><span className="text-muted-foreground">Dosage:</span> {unitDosage || "0"} {unitMeasure} per {formFactor}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(1, s - 1) as WizardStep)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => Math.min(3, s + 1) as WizardStep)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!canSave || isSaving}>
              {isSaving ? "Saving..." : "Save to Cabinet"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )

  return createPortal(modalContent, document.body)
}
