"use client"

import GlassAuthModal from "@/components/ui/auth-model";

export default function DemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">GlassAuth Demo</h1>
        <GlassAuthModal
          triggerLabel="Open Auth Modal"
          onLogin={async (payload) => console.log("Login:", payload)}
          onSignup={async (payload) => console.log("Signup:", payload)}
          onSocial={async (provider) => console.log("Social:", provider)}
          onResetPassword={async (email) => console.log("Reset:", email)}
        />
      </div>
    </div>
  );
}
