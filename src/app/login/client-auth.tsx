"use client"

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import GlassAuthModal from "@/components/ui/auth-model";
import { toast } from "@/components/ui/use-toast";

export default function ClientAuth() {
  const router = useRouter();
  const supabase = createClient();

  async function onLogin(payload: { email: string; password: string }) {
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    })
    if (error) {
      toast({
        variant: "destructive",
        title: "Invalid credentials",
        description: error.message || "Please check your email and password and try again.",
      })
      return
    }
    router.push("/")
    router.refresh()
  }

  async function onSignup(payload: { name: string; email: string; password: string }) {
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.name,
        },
      },
    })
    if (error) throw error
    router.push("/")
    router.refresh()
  }

  async function onSocial(provider: "google" | "github" | "x") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  async function onResetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password/confirm`,
    })
    if (error) throw error
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-white/70">Sign in to your account or create a new one</p>
        </div>
        
        <div className="flex justify-center">
          <GlassAuthModal
            triggerLabel="Get Started"
            onLogin={onLogin}
            onSignup={onSignup}
            onSocial={onSocial}
            onResetPassword={onResetPassword}
          />
        </div>
      </div>
    </div>
  );
}
