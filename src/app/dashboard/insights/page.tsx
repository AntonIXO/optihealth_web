import { Brain, TrendingUp, AlertCircle, Lightbulb, RefreshCw } from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Insights</h1>
          <p className="mt-2 text-white/70">
            Discover patterns and correlations in your health data
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20">
          <RefreshCw className="h-4 w-4" />
          Generate New Insights
        </button>
      </div>

      {/* Insight Categories */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">Trends</span>
          </div>
          <p className="text-sm text-white/70">Long-term patterns in your data</p>
        </div>
        <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Brain className="h-5 w-5" />
            <span className="font-medium">Correlations</span>
          </div>
          <p className="text-sm text-white/70">Relationships between metrics</p>
        </div>
        <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Anomalies</span>
          </div>
          <p className="text-sm text-white/70">Unusual patterns detected</p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Placeholder Insight Card */}
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              <span className="font-medium text-white">Sleep & Activity Correlation</span>
            </div>
            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">Trend</span>
          </div>
          <p className="text-white/80 mb-4">
            Your sleep quality improves by 15% on days when you take more than 8,000 steps.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Confidence: High</span>
            <span className="text-white/60">Based on 30 days of data</span>
          </div>
        </div>

        {/* Placeholder Insight Card */}
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-white">Heart Rate Variability</span>
            </div>
            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">Correlation</span>
          </div>
          <p className="text-white/80 mb-4">
            Your HRV tends to be higher on days when you journal about feeling calm or relaxed.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Confidence: Medium</span>
            <span className="text-white/60">Based on 15 entries</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-12 backdrop-blur-md text-center">
        <Brain className="h-16 w-16 mx-auto mb-4 text-white/30" />
        <h3 className="text-lg font-medium text-white mb-2">No insights available yet</h3>
        <p className="text-white/70 mb-6 max-w-md mx-auto">
          Start logging your health data to unlock personalized insights and discover patterns in your wellness journey.
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20">
          <RefreshCw className="h-4 w-4" />
          Check for Insights
        </button>
      </div>
    </div>
  );
}
