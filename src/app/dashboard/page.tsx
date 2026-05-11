import { createClient } from "@/utils/supabase/server";
import { Activity, Brain } from "lucide-react";
import Link from "next/link";
import { DailyTimeline } from "@/components/dashboard/daily-timeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-7">
        <div>
          <div className="text-[13px] font-medium text-white/70 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mt-1">
            Good morning, {user?.user_metadata?.full_name?.split(' ')[0] || "there"}
          </h1>
          <p className="mt-1.5 text-[15px] text-white/80">
            Your readiness is <span className="text-green-400 font-semibold">high</span> — a good day for harder training.
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-white/10 rounded-full">
          {['Today', '7d', '30d', '90d'].map((k, i) => (
            <button key={k} className={`px-3.5 py-1.5 rounded-full border-none cursor-pointer text-[13px] font-medium transition-colors ${
              i === 0 ? 'bg-white/80 text-[#0a0a0a]' : 'bg-transparent text-white/80 hover:text-white'
            }`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Timeline with Stats */}
      <DailyTimeline />

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/dashboard/data" className="w-full">
            <Button variant="glass" className="w-full py-6 text-base">
              <Activity className="h-5 w-5" />
              Log Activity
            </Button>
          </Link>
          <Button variant="glass" className="w-full py-6 text-base">
            <Brain className="h-5 w-5" />
            Add Journal Entry
          </Button>
        </div>
      </Card>
    </div>
  );
}
