"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/40 light:border-blue-200/50 light:bg-white/80 light:shadow-lg">
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 light:bg-green-100">
                <svg
                  className="h-6 w-6 text-green-400 light:text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-white/90 light:text-blue-900">
                Password Updated
              </h2>
              <p className="text-sm text-white/70 light:text-blue-700">
                Your password has been successfully updated. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/40 light:border-blue-200/50 light:bg-white/80 light:shadow-lg">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 light:via-blue-300/40" />
          
          <div className="px-6 py-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-white/90 light:text-blue-900">
              Set New Password
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 light:border-red-300/50 light:bg-red-50/50 light:text-red-700">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/90 light:text-blue-900">
                  New Password
                </label>
                <div className="flex items-stretch rounded-xl border border-white/20 bg-white/10 backdrop-blur-md focus-within:border-white/40 dark:border-white/10 dark:bg-white/5 light:border-blue-200/50 light:bg-blue-50/50 light:focus-within:border-blue-400/70">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl bg-transparent px-3 py-2.5 text-white placeholder-white/50 outline-none [color-scheme:dark] light:text-blue-950 light:placeholder-blue-400/70 light:[color-scheme:light]"
                  />
                  <div className="flex items-center pr-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded-md px-2 py-1 text-xs text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 light:text-blue-700 light:hover:bg-blue-100/50 light:hover:text-blue-900 light:focus:ring-blue-300"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white/90 light:text-blue-900">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder-white/50 outline-none backdrop-blur-md focus:border-white/40 dark:border-white/10 dark:bg-white/5 light:border-blue-200/50 light:bg-blue-50/50 light:text-blue-950 light:placeholder-blue-400/70 light:focus:border-blue-400/70 [color-scheme:dark] light:[color-scheme:light]"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/80 px-4 py-2.5 font-semibold text-black shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white dark:hover:bg-white/90 light:border-blue-400/50 light:bg-blue-600 light:text-white light:hover:bg-blue-700"
              >
                {loading && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                    />
                  </svg>
                )}
                Update Password
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-white/80 underline-offset-4 hover:underline light:text-blue-800 light:hover:text-blue-950"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
