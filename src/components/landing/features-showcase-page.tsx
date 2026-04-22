"use client";

import GlassAuthModal from "@/components/ui/auth-model";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Activity, Brain, Heart, Shield, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FeaturesShowcasePage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  async function onLogin(payload: { email: string; password: string }) {
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Invalid credentials",
        description: error.message || "Please check your email and password and try again.",
      });
      return;
    }
    router.push("/dashboard");
    router.refresh();
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
    });
    if (error) throw error;
    router.push("/dashboard");
    router.refresh();
  }

  useEffect(() => {
    let unsub: (() => void) | undefined;
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthed(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
    });
    unsub = () => sub.subscription.unsubscribe();
    return () => {
      if (unsub) unsub();
    };
  }, [supabase]);

  async function onSocial(provider: "google" | "github" | "x") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  async function onResetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password/confirm`,
    });
    if (error) throw error;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl" />
        <div className="relative px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Transform Your Health Data Into
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {" "}
                  Actionable Insights
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80">
                optiHealth empowers you to collect, visualize, and analyze your personal health
                data. Discover patterns, track progress, and unlock personalized insights with
                AI-powered analysis.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {isAuthed ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-black shadow-sm backdrop-blur-md transition hover:bg-white/15 active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 light:border-blue-300/50 light:bg-blue-100/30 light:text-blue-900 light:hover:bg-blue-100/50"
                    >
                      To Dashboard
                    </Link>
                  ) : (
                    <>
                      <GlassAuthModal
                        triggerLabel="Login / Sign up"
                        triggerClassName="px-8 py-3 text-base font-semibold bg-white/90 text-blue-950 border-white/70 hover:bg-white shadow-xl ring-2 ring-white/40"
                        onLogin={onLogin}
                        onSignup={onSignup}
                        onSocial={onSocial}
                        onResetPassword={onResetPassword}
                      />

                      <a
                        href="/demo"
                        className="inline-flex items-center gap-2 rounded-xl border border-yellow-200/60 bg-yellow-200/95 px-6 py-3 text-sm font-semibold text-yellow-950 shadow-xl transition hover:bg-yellow-100"
                      >
                        Demo login
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to optimize your health
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/70">
              From data collection to AI-powered insights, optiHealth provides a comprehensive
              platform for health optimization.
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
                    Track everything from sleep patterns and heart rate to nutrition and mental
                    health. Seamlessly integrate data from wearables, apps, and manual logs.
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
                    Ask natural language questions about your health data and get personalized
                    insights. Discover correlations and patterns you never knew existed.
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
                    Visualize trends, compare metrics, and track your progress over time. Export
                    data and generate detailed reports for deeper analysis.
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
                    Connect physical metrics with mental health, environmental factors, and
                    lifestyle choices. Get a complete picture of your wellness journey.
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
                    Your health data is encrypted and secure. With row-level security and
                    privacy-first design, you maintain complete control over your information.
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
                    Automatic data synchronization from your devices and apps. Always have the
                    latest information at your fingertips.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="relative isolate px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to optimize your health?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
            Join thousands of users who are already transforming their health data into actionable
            insights.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {isAuthed ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-black shadow-sm backdrop-blur-md transition hover:bg-white/15 active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 light:border-blue-300/50 light:bg-blue-100/30 light:text-blue-900 light:hover:bg-blue-100/50"
              >
                To Dashboard
              </Link>
            ) : (
              <GlassAuthModal
                triggerLabel="Start Your Journey"
                onLogin={onLogin}
                onSignup={onSignup}
                onSocial={onSocial}
                onResetPassword={onResetPassword}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
