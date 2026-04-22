"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Command } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { GlassStrong } from "./glass";

type AuthMode = "signin" | "signup";

interface GlassAuthModalProps {
  triggerLabel?: string;
  triggerClassName?: string;
  onLogin: (payload: any) => Promise<void>;
  onSignup: (payload: any) => Promise<void>;
  onSocial?: (provider: "google" | "github" | "x") => Promise<void>;
  onResetPassword?: (email: string) => Promise<void>;
}

export default function GlassAuthModal({
  triggerLabel = "Sign in",
  triggerClassName,
  onLogin,
  onSignup,
  onSocial,
  onResetPassword,
}: GlassAuthModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") {
        await onLogin({ email, password });
      } else {
        await onSignup({ name, email, password });
      }
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={triggerClassName}
        variant={triggerClassName ? "default" : "glass"}
      >
        {triggerLabel}
      </Button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ stiffness: 260, damping: 24, type: "spring" }}
              className="relative w-full max-w-md"
            >
              <GlassStrong className="p-8">
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                {/* Pill Switcher */}
                <div className="mx-auto mb-8 flex w-full max-w-[240px] rounded-full bg-white/10 p-1">
                  <button
                    onClick={() => setMode("signin")}
                    className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-all ${
                      mode === "signin"
                        ? "bg-white/90 text-[#0a0a0a] shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-all ${
                      mode === "signup"
                        ? "bg-white/90 text-[#0a0a0a] shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Create account
                  </button>
                </div>

                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {mode === "signin" ? "Welcome back" : "Join optiHealth"}
                  </h2>
                  <p className="mt-2 text-sm text-white/70">
                    {mode === "signin"
                      ? "Enter your details to access your dashboard"
                      : "Start turning your health data into insights"}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg bg-[#e25555]/20 p-3 text-sm text-[#e25555] border border-[#e25555]/30">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-white/40" />
                        <Input
                          type="text"
                          placeholder="Full name"
                          className="pl-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-white/40" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/40" />
                      <Input
                        type="password"
                        placeholder="Password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </form>

                {onSocial && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-transparent px-2 text-white/50">Or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="glass" onClick={() => onSocial("google")}>
                        Google
                      </Button>
                      <Button variant="glass" onClick={() => onSocial("github")}>
                        <Command className="w-4 h-4 mr-2" /> GitHub
                      </Button>
                    </div>
                  </>
                )}
              </GlassStrong>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
