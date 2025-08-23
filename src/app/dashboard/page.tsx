import { createClient } from "@/utils/supabase/server";
import { Activity, Heart, Brain, TrendingUp } from "lucide-react";

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-white/70 truncate">
                  Steps Today
                </dt>
                <dd className="text-2xl font-semibold text-white">
                  --
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Heart className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-white/70 truncate">
                  Resting HR
                </dt>
                <dd className="text-2xl font-semibold text-white">
                  --
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-white/70 truncate">
                  Sleep Score
                </dt>
                <dd className="text-2xl font-semibold text-white">
                  --
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-white/70 truncate">
                  Weekly Trend
                </dt>
                <dd className="text-2xl font-semibold text-white">
                  --
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-white mb-4">Today's Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              <span className="text-white/70">No data logged yet</span>
            </div>
            <span className="text-sm text-white/50">--:--</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white transition hover:bg-white/20">
            <Activity className="h-5 w-5" />
            Log Activity
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white transition hover:bg-white/20">
            <Brain className="h-5 w-5" />
            Add Journal Entry
          </button>
        </div>
      </div>
    </div>
  );
}
