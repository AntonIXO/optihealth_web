import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Legacy API endpoint - barcode lookup is not supported in the new supplement schema.
 * This endpoint returns "not found" for all requests to maintain backward compatibility.
 * The new supplement system uses the 5-table ontology (substances/compounds/vendors/products).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const barcode = searchParams.get("barcode")
    if (!barcode) {
      return NextResponse.json({ error: "barcode is required" }, { status: 400 })
    }

    // New schema doesn't support barcode lookups
    // Return "not found" gracefully for backward compatibility
    return NextResponse.json({ 
      found: false, 
      products: [],
      message: "Barcode lookup not supported in new supplement system. Please use the Add Product Wizard."
    }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 })
  }
}
