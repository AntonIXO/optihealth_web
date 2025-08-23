"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ResetPasswordModal from "@/components/ui/reset-password-modal";

export default function ResetPasswordPage() {
  const [showModal, setShowModal] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  async function onResetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password/confirm`,
    });
    if (error) throw error;
  }

  const handleClose = () => {
    setShowModal(false);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-white/70 mb-8">
          Enter your email address to receive a password reset link
        </p>

        {showModal ? (
          <ResetPasswordModal
            triggerLabel="Reset Password"
            onResetPassword={onResetPassword}
            onClose={handleClose}
          />
        ) : (
          <div className="text-center">
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md transition hover:bg-white/15"
            >
              ← Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
