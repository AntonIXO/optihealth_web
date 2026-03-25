"use client";

import { Brain, TrendingUp, AlertCircle, Lightbulb, RefreshCw, Target, Plus, Coffee } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InsightCard from "@/components/insights/InsightCard";
import { InsightCardProps } from "@/types/insight";

interface Insight {
  id: number;
  insight_type: string;
  title: string;
  summary: string;
  generated_at: string;
  result_data: any;
}

interface Goal {
  goal_id: number;
  goal_name: string;
  metric_name: string;
  metric_beautiful_name: string;
  target_value: number;
  operator: string;
  is_active: boolean;
  created_at: string;
}

interface Metric {
  metric_name: string;
  category: string;
  beautiful_name: string;
  default_unit: string;
}

// Demo insight card showing how insights should look
const coffeeInsightData: InsightCardProps = {
  icon: Coffee,
  title: "Caffeine Works Differently",
  keyFinding: "How your morning cup of coffee affects productivity strongly depends on sleep quality.",
  scenarios: [
    {
      context: "When you slept well: Days when your sleep score > 85",
      action: "You drink morning coffee",
      result: "Productivity +1.5 points",
      resultType: "positive",
    },
    {
      context: "When you didn't sleep well: Days when your sleep score < 65",
      action: "You drink morning coffee to \"perk up\"",
      result: "Productivity unchanged, but evening HRV -10%",
      resultType: "negative",
    },
  ],
  verdict: "Your body is smart. When you have enough resources after good sleep, coffee works as an effective productivity stimulant. However, when you haven't slept well, your body appears to spend more resources processing caffeine, leading to additional stress on your nervous system (HRV decline) without real productivity gains.",
  recommendation: "On days of poor sleep, it's worth skipping morning coffee or replacing it with something gentler, like green tea or simply a walk in fresh air.",
  howWeFoundIt: "This insight was discovered using vector analysis, which compared days with similar 'digital signatures' (stress level, activity) but different sleep quality.",
};

export default function InsightsPage() {
  const supabase = createClient();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedMetric, setSelectedMetric] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [chartType, setChartType] = useState<string>("correlation");

  useEffect(() => {
    fetchInsights();
    fetchGoals();
    fetchMetrics();
  }, []);

  const fetchInsights = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) return;

    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.user.id)
      .order('generated_at', { ascending: false })
      .limit(10);

    if (data && !error) {
      setInsights(data);
    }
    setLoading(false);
  };

  const fetchGoals = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) return;

    const { data, error } = await supabase
      .from('user_goals')
      .select(`
        id,
        goal_name,
        target_value,
        operator,
        is_active,
        created_at,
        metric_definitions!inner (
          metric_name,
          beautiful_name
        )
      `)
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const formattedGoals = data.map(goal => ({
        goal_id: goal.id,
        goal_name: goal.goal_name,
        metric_name: (goal.metric_definitions as any).metric_name,
        metric_beautiful_name: (goal.metric_definitions as any).beautiful_name,
        target_value: goal.target_value,
        operator: goal.operator,
        is_active: goal.is_active,
        created_at: goal.created_at
      }));
      setGoals(formattedGoals);
    }
  };

  const fetchMetrics = async () => {
    const { data } = await supabase
      .from('metric_definitions')
      .select('metric_name, category, beautiful_name, default_unit')
      .order('category, metric_name');
    if (data) setMetrics(data);
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) return;

    try {
      // Queue insight generation job
      // Queue insight generation job - insert and ignore duplicate pending
      const { error } = await supabase
        .from('analysis_jobs')
        .insert({ user_id: user.user.id, status: 'pending' });

      if (error) {
        // Postgres unique violation => an existing pending job already exists. Treat as success.
        // PostgREST typically maps this to 409; error.code might be '23505'
        const code = (error as any).code;
        const status = (error as any).status;
        if (code !== '23505' && status !== 409) {
          throw error;
        }
      }
      
      // Refresh insights
      await fetchInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

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
        <div className="flex gap-3">
          <Button
            onClick={generateInsights}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate New Insights'}
          </Button>
        </div>
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

      {/* Filters */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Primary Metric</label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metrics</SelectItem>
                {metrics.map((metric) => (
                  <SelectItem key={metric.metric_name} value={metric.metric_name}>
                    {metric.beautiful_name || metric.metric_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Insight Type</label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="correlation">Correlations</SelectItem>
                <SelectItem value="trend">Trends</SelectItem>
                <SelectItem value="anomaly">Anomalies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      {goals.length > 0 && (
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Goals
            </h2>
            <Button
              onClick={() => window.location.href = '/dashboard/goals'}
              className="text-sm text-white/70 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Manage Goals
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.goal_id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-white font-medium mb-1">{goal.goal_name}</div>
                <div className="text-white/70 text-sm mb-2">
                  {goal.metric_beautiful_name || goal.metric_name}
                </div>
                <div className="text-white/60 text-xs">
                  Target: {goal.operator} {goal.target_value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Insight Card - Demo */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white">Example Insight</h2>
          <span className="text-xs text-white/50 bg-purple-500/30 px-2 py-1 rounded border border-purple-400/50">
            DEMO
          </span>
        </div>
        <InsightCard {...coffeeInsightData} />
      </div>

      {/* Insights Count */}
      {!loading && insights.length > 0 && (
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>
            Showing {insights.filter((insight) => {
              if (chartType !== 'all' && insight.insight_type !== chartType) return false;
              if (selectedMetric !== 'all' && insight.result_data?.primary_metric !== selectedMetric) return false;
              if (dateRange !== 'all') {
                const daysAgo = parseInt(dateRange);
                const insightDate = new Date(insight.generated_at);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
                if (insightDate < cutoffDate) return false;
              }
              return true;
            }).length} of {insights.length} insights
          </span>
        </div>
      )}

      {/* Insights Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-white/50" />
            <p className="text-white/70">Loading insights...</p>
          </div>
        ) : insights.length > 0 ? (
          insights
            .filter((insight) => {
              // Filter by insight type
              if (chartType !== 'all' && insight.insight_type !== chartType) return false;
              // Filter by metric (if metadata includes metric info)
              if (selectedMetric !== 'all' && insight.result_data?.primary_metric !== selectedMetric) return false;
              // Filter by date range
              if (dateRange !== 'all') {
                const daysAgo = parseInt(dateRange);
                const insightDate = new Date(insight.generated_at);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
                if (insightDate < cutoffDate) return false;
              }
              return true;
            })
            .map((insight) => {
            const getInsightIcon = (type: string) => {
              switch (type) {
                case 'correlation': return <Brain className="h-5 w-5 text-purple-400" />;
                case 'trend': return <TrendingUp className="h-5 w-5 text-blue-400" />;
                case 'anomaly': return <AlertCircle className="h-5 w-5 text-yellow-400" />;
                default: return <Lightbulb className="h-5 w-5 text-yellow-400" />;
              }
            };

            return (
              <div key={insight.id} className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.insight_type)}
                    <span className="font-medium text-white">{insight.title}</span>
                  </div>
                  <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded capitalize">
                    {insight.insight_type}
                  </span>
                </div>
                <p className="text-white/80 mb-4">{insight.summary}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    Confidence: {insight.result_data?.confidence || 'Medium'}
                  </span>
                  <span className="text-white/60">
                    {new Date(insight.generated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border border-white/20 bg-white/10 p-12 backdrop-blur-md text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-white/30" />
            <h3 className="text-lg font-medium text-white mb-2">No insights available yet</h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Start logging your health data to unlock personalized insights and discover patterns in your wellness journey.
            </p>
            <Button
              onClick={generateInsights}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Insights'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
