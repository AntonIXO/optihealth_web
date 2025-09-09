import { createClient } from "@/utils/supabase/server";
import { Activity, Brain } from "lucide-react";
import Link from "next/link";
import { DailyTimeline } from "@/components/dashboard/daily-timeline";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.user_metadata?.full_name || "there"}!
        </h1>
        <p className="mt-2 text-white/70">
          Here's your health overview for today
        </p>
      </div>

      {/* Daily Timeline with Stats */}
      <DailyTimeline />

      {/* Quick Actions */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/dashboard/data" className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white transition hover:bg-white/20">
            <Activity className="h-5 w-5" />
            Log Activity
          </Link>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white transition hover:bg-white/20">
            <Brain className="h-5 w-5" />
            Add Journal Entry
          </button>
        </div>
      </div>
    </div>
  );
}
