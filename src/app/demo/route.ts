import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const DEMO_EMAIL = "aivanovmailru@gmail.com";
const DEMO_PASSWORD = "123123q~E";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "demo-login-failed");
    return NextResponse.redirect(loginUrl);
  }

  const dashboardUrl = new URL("/dashboard", request.url);
  return NextResponse.redirect(dashboardUrl);
}
