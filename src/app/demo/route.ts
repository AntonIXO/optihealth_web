import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getOriginFromRequest } from "@/lib/origin";

const DEMO_EMAIL = "aivanovmailru@gmail.com";
const DEMO_PASSWORD = "123123q~E";

export async function GET(request: Request) {
  const supabase = await createClient();
  const origin = getOriginFromRequest(request);

  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}
