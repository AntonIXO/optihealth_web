"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Activity, 
  Heart, 
  Brain, 
  Pill, 
  Smartphone, 
  Calendar,
  Clock,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { MiniChart } from "./mini-chart";

interface TimelineItem {
  item_type: string;
  timestamp_value: string;
  title: string;
  description: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  category: string;
  properties: any;
}

interface GroupedMetric {
  title: string;
  category: string;
  unit: string | null;
  item_type: string;
  data: Array<{
    timestamp: string;
    value: number;
  }>;
  firstTimestamp: string;
}

interface DailySummaryStats {
  steps_today: number;
  resting_hr: number | null;
  events_count: number;
  metrics_logged: number;
}

const isMinutesUnit = (unit: string | null | undefined) => {
  if (!unit) return false;
  const normalized = unit.toLowerCase();
  return normalized === "minutes" || normalized === "minute" || normalized === "min";
};

const minutesToHours = (minutes: number) => minutes / 60;

const formatHours = (hours: number) => `${hours.toFixed(2)} hr`;

const getIconForCategory = (itemType: string, category: string) => {
  switch (itemType) {
    case 'event':
      return <Calendar className="h-4 w-4" />;
    case 'supplement':
      return <Pill className="h-4 w-4" />;
    case 'app_usage':
      return <Smartphone className="h-4 w-4" />;
    case 'metric':
      switch (category) {
        case 'Trainings':
          return <Activity className="h-4 w-4" />;
        case 'Vitals & Heart':
          return <Heart className="h-4 w-4" />;
        case 'Sleep':
          return <Brain className="h-4 w-4" />;
        default:
          return <TrendingUp className="h-4 w-4" />;
      }
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getColorForCategory = (itemType: string, category: string) => {
  switch (itemType) {
    case 'event':
      return 'text-blue-400';
    case 'supplement':
      return 'text-green-400';
    case 'app_usage':
      return 'text-orange-400';
    case 'metric':
      switch (category) {
        case 'Trainings':
          return 'text-blue-400';
        case 'Vitals & Heart':
          return 'text-red-400';
        case 'Sleep':
          return 'text-purple-400';
        default:
          return 'text-gray-400';
      }
    default:
      return 'text-gray-400';
  }
};

export function DailyTimeline() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [groupedMetrics, setGroupedMetrics] = useState<GroupedMetric[]>([]);
  const [summaryStats, setSummaryStats] = useState<DailySummaryStats | null>(null);
  const [deepSleepHours, setDeepSleepHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const groupTimelineItems = (items: TimelineItem[]) => {
    // Group metrics by title (metric name) and count occurrences
    const metricGroups: { [key: string]: TimelineItem[] } = {};
    const nonMetricItems: TimelineItem[] = [];

    items.forEach(item => {
      if (item.item_type === 'metric' && item.value_numeric !== null) {
        const key = `${item.title}_${item.category}`;
        if (!metricGroups[key]) {
          metricGroups[key] = [];
        }
        metricGroups[key].push(item);
      } else {
        nonMetricItems.push(item);
      }
    });

    // Convert groups with >10 items to GroupedMetric objects
    const grouped: GroupedMetric[] = [];
    const remainingItems: TimelineItem[] = [...nonMetricItems];

    Object.entries(metricGroups).forEach(([key, items]) => {
      if (items.length > 10) {
        // Create grouped metric for chart display
        const firstItem = items[0];
        const useHours = isMinutesUnit(firstItem.unit);
        grouped.push({
          title: firstItem.title,
          category: firstItem.category,
          unit: useHours ? 'hr' : firstItem.unit,
          item_type: firstItem.item_type,
          data: items.map(item => ({
            timestamp: item.timestamp_value,
            value: useHours ? minutesToHours(item.value_numeric!) : item.value_numeric!,
          })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          firstTimestamp: items.sort((a, b) => 
            new Date(a.timestamp_value).getTime() - new Date(b.timestamp_value).getTime()
          )[0].timestamp_value,
        });
      } else {
        // Keep individual items if ≤10 occurrences
        remainingItems.push(...items);
      }
    });

    return { grouped, remainingItems };
  };

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Fetch timeline data
      const { data: timeline, error: timelineError } = await supabase
        .rpc('get_daily_timeline', { 
          user_id_input: user.id 
        });

      if (timelineError) {
        console.error('Timeline error:', timelineError);
        setError("Failed to fetch timeline data");
        return;
      }

      const timelineItemsRaw = (timeline || []) as TimelineItem[];
      const deepSleepMinutes = timelineItemsRaw
        .filter(item =>
          item.item_type === 'metric' &&
          item.value_numeric !== null &&
          isMinutesUnit(item.unit) &&
          item.title.toLowerCase().includes('deep sleep')
        )
        .reduce((sum, item) => sum + (item.value_numeric || 0), 0);
      setDeepSleepHours(deepSleepMinutes > 0 ? minutesToHours(deepSleepMinutes) : null);

      // Fetch summary stats
      const { data: stats, error: statsError } = await supabase
        .rpc('get_daily_summary_stats', { 
          user_id_input: user.id 
        });

      if (statsError) {
        console.error('Stats error:', statsError);
      }

      // Group timeline items
      const { grouped, remainingItems } = groupTimelineItems(timelineItemsRaw);
      
      setGroupedMetrics(grouped);
      setTimelineItems(remainingItems);
      setSummaryStats(stats?.[0] || null);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary Stats Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-white/20 rounded mb-4"></div>
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-6 bg-white/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Skeleton */}
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="h-6 bg-white/20 rounded mb-4 w-48"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5">
                  <div className="h-2 w-2 bg-white/20 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/20 rounded w-3/4"></div>
                  </div>
                  <div className="h-3 bg-white/20 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-md">
        <p className="text-red-400">Error: {error}</p>
        <button 
          onClick={fetchTimelineData}
          className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summaryStats && (
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
                    {summaryStats.steps_today?.toLocaleString() || '--'}
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
                    {summaryStats.resting_hr ? `${Math.round(summaryStats.resting_hr)} bpm` : '--'}
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
                    Deep Sleep Hours
                  </dt>
                  <dd className="text-2xl font-semibold text-white">
                    {deepSleepHours !== null ? formatHours(deepSleepHours) : '--'}
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
                    Data Points
                  </dt>
                  <dd className="text-2xl font-semibold text-white">
                    {(summaryStats.events_count + summaryStats.metrics_logged) || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-white mb-4">Today's Timeline</h2>
        
{timelineItems.length === 0 && groupedMetrics.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-white/50">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data logged for today yet</p>
              <p className="text-sm mt-2">Start logging your health data to see your timeline!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Render grouped metrics with charts */}
            {groupedMetrics.map((metric, index) => (
              <div 
                key={`grouped-${index}`}
                className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full bg-white/10 ${getColorForCategory(metric.item_type, metric.category)}`}>
                    {getIconForCategory(metric.item_type, metric.category)}
                  </div>
                  {(index < groupedMetrics.length - 1 || timelineItems.length > 0) && (
                    <div className="w-px h-8 bg-white/20 mt-2"></div>
                  )}
                </div>

                {/* Content with chart */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-white font-medium">
                        {metric.title}
                      </h3>
                      <p className="text-white/70 text-sm mt-1">
                        Multiple readings throughout the day
                      </p>
                      <span className="inline-block px-2 py-1 text-xs bg-white/10 text-white/60 rounded mt-2">
                        {metric.category}
                      </span>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <time className="text-sm text-white/50">
                        {format(new Date(metric.firstTimestamp), 'HH:mm')}
                      </time>
                    </div>
                  </div>
                  
                  {/* Mini Chart */}
                  <MiniChart
                    data={metric.data}
                    title={metric.title}
                    unit={metric.unit || ''}
                    color={
                      metric.category === 'Vitals & Heart' ? '#f87171' :
                      metric.category === 'Trainings' ? '#60a5fa' :
                      metric.category === 'Sleep' ? '#a78bfa' :
                      '#9ca3af'
                    }
                  />
                </div>
              </div>
            ))}

            {/* Render individual timeline items */}
            {timelineItems.map((item, index) => (
              <div 
                key={`item-${index}`}
                className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full bg-white/10 ${getColorForCategory(item.item_type, item.category)}`}>
                    {getIconForCategory(item.item_type, item.category)}
                  </div>
                  {index < timelineItems.length - 1 && (
                    <div className="w-px h-8 bg-white/20 mt-2"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium truncate">
                        {item.title}
                      </h3>
                      <p className="text-white/70 text-sm mt-1">
                        {item.item_type === 'metric' && item.value_numeric !== null && isMinutesUnit(item.unit)
                          ? formatHours(minutesToHours(item.value_numeric))
                          : item.description}
                      </p>
                      {item.item_type === 'metric' && item.category && (
                        <span className="inline-block px-2 py-1 text-xs bg-white/10 text-white/60 rounded mt-2">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <time className="text-sm text-white/50">
                        {format(new Date(item.timestamp_value), 'HH:mm')}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
