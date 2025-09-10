import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const barcode = searchParams.get("barcode")
    if (!barcode) {
      return NextResponse.json({ error: "barcode is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // RLS ensures the caller can read: public products or their own.
    const { data, error } = await supabase
      .from("supplement_products")
      .select("id, product_name, serving_size_unit, barcode, is_public, user_id")
      .eq("barcode", barcode)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ found: false, products: [] }, { status: 200 })
    }

    return NextResponse.json({ found: true, products: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 })
  }
}
