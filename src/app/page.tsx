"use client"

import { Activity, Heart, Brain, TrendingUp, Shield, Zap } from "lucide-react";
import GlassAuthModal from "@/components/ui/auth-model";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function Home() {
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
    router.push("/dashboard")
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
    router.push("/dashboard")
    router.refresh()
  }

  async function onSocial(provider: "google" | "github" | "x") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl" />
        <div className="relative px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Transform Your Health Data Into 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> Actionable Insights</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/80 max-w-2xl mx-auto">
                OptiHealth empowers you to collect, visualize, and analyze your personal health data. 
                Discover patterns, track progress, and unlock personalized insights with AI-powered analysis.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <GlassAuthModal
                  triggerLabel="Get Started"
                  onLogin={onLogin}
                  onSignup={onSignup}
                  onSocial={onSocial}
                  onResetPassword={onResetPassword}
                />
                <a
                  href="#features"
                  className="text-sm font-semibold leading-6 text-white hover:text-white/80 transition-colors"
                >
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to optimize your health
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/70">
              From data collection to AI-powered insights, OptiHealth provides a comprehensive platform for health optimization.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <Activity className="h-5 w-5 flex-none text-blue-400" />
                  Comprehensive Tracking
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                  <p className="flex-auto">
                    Track everything from sleep patterns and heart rate to nutrition and mental health. 
                    Seamlessly integrate data from wearables, apps, and manual logs.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <Brain className="h-5 w-5 flex-none text-purple-400" />
                  AI-Powered Insights
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                  <p className="flex-auto">
                    Ask natural language questions about your health data and get personalized insights. 
                    Discover correlations and patterns you never knew existed.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <TrendingUp className="h-5 w-5 flex-none text-green-400" />
                  Advanced Analytics
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                  <p className="flex-auto">
                    Visualize trends, compare metrics, and track your progress over time. 
                    Export data and generate detailed reports for deeper analysis.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <Heart className="h-5 w-5 flex-none text-red-400" />
                  Holistic Health View
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                  <p className="flex-auto">
                    Connect physical metrics with mental health, environmental factors, and lifestyle choices. 
                    Get a complete picture of your wellness journey.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <Shield className="h-5 w-5 flex-none text-yellow-400" />
                  Privacy & Security
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                  <p className="flex-auto">
                    Your health data is encrypted and secure. With row-level security and privacy-first design, 
                    you maintain complete control over your information.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <Zap className="h-5 w-5 flex-none text-orange-400" />
                  Real-time Sync
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/70">
                  <p className="flex-auto">
                    Automatic data synchronization from your devices and apps. 
                    Always have the latest information at your fingertips.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative isolate px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to optimize your health?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
            Join thousands of users who are already transforming their health data into actionable insights.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <GlassAuthModal
              triggerLabel="Start Your Journey"
              onLogin={onLogin}
              onSignup={onSignup}
              onSocial={onSocial}
              onResetPassword={onResetPassword}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
