import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      submitted_name,
      category_suggestion = null,
      notes = null,
    }: { submitted_name?: string; category_suggestion?: string | null; notes?: string | null } = await req.json()

    if (!submitted_name || typeof submitted_name !== "string") {
      return NextResponse.json({ error: "submitted_name is required" }, { status: 400 })
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("component_submissions")
      .insert([
        {
          user_id: user.id,
          submitted_name,
          category_suggestion,
          notes,
        },
      ])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 })
  }
}
