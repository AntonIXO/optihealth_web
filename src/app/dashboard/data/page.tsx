"use client";

import { BarChart3, Download, Filter, Calendar, Plus, X, ScatterChart, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as RangeCalendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { DataChart } from "@/components/dashboard/data-chart";
import { DataLogger } from "@/components/dashboard/data-logger";
/* Lines 12-16 omitted */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface MetricDefinition {
  metric_name: string;
  category: string;
  beautiful_name: string;
  default_unit: string;
}

interface ChartData {
  bucket: string;
  value: number;
}

interface RawDataPoint {
  timestamp: string;
  value: number;
  metric_name: string;
}

export default function DataPage() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartData2, setChartData2] = useState<ChartData[]>([]);
  const [tableData, setTableData] = useState<ChartData[]>([]);
  const [rawDataPoints, setRawDataPoints] = useState<RawDataPoint[]>([]);
  const [summary, setSummary] = useState<{
    avg_val: number | null;
    min_val: number | null;
    max_val: number | null;
    total_count: number | null;
  } | null>(null);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [compareMode, setCompareMode] = useState(false);
  const [dayView, setDayView] = useState(false);
  const [normalizeCompare, setNormalizeCompare] = useState(true);
  const [timeOffset, setTimeOffset] = useState(0); // Days to shift the time window
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [minTime, setMinTime] = useState<number | undefined>();
  const [maxTime, setMaxTime] = useState<number | undefined>();
  const [viewportMin, setViewportMin] = useState<number | undefined>(undefined);
  const [viewportMax, setViewportMax] = useState<number | undefined>(undefined);
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chartStats = useMemo(() => {
    const stats = {
      min1: 0, max1: 0,
      min2: 0, max2: 0
    };

    if (chartData.length > 0) {
      let min = chartData[0].value;
      let max = chartData[0].value;
      for (let i = 1; i < chartData.length; i++) {
        const v = chartData[i].value;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      stats.min1 = min;
      stats.max1 = max;
    }

    if (chartData2.length > 0) {
      let min = chartData2[0].value;
      let max = chartData2[0].value;
      for (let i = 1; i < chartData2.length; i++) {
        const v = chartData2[i].value;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      stats.min2 = min;
      stats.max2 = max;
    }

    return stats;
  }, [chartData, chartData2]);

  const metric = searchParams.get('metric') || 'hr_resting';
  const metric2 = searchParams.get('metric2') || '';
  const range = searchParams.get('range') || '30d';
  const customStartParam = searchParams.get('start');
  const customEndParam = searchParams.get('end');
  const type = searchParams.get('type') || 'line';
  const dayViewParam = searchParams.get('dayView') === 'true';
  const compareModeParam = searchParams.get('compare') === 'true';

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase
        .from('metric_definitions')
        .select('metric_name, category, beautiful_name, default_unit')
        .order('category, metric_name');
      if (data) setMetrics(data);
    };
    fetchMetrics();
  }, [supabase]);

  useEffect(() => {
    setCompareMode(compareModeParam);
    setDayView(dayViewParam);
  }, [compareModeParam, dayViewParam]);

  useEffect(() => {
    const fetchData = async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) return;

      // Compute full-day boundaries in local time, then send date-only strings
      let endDate = new Date();
      let startDate = new Date();

      if (range === 'custom' && customStartParam && customEndParam) {
        // Already date-only strings from URL params
        startDate = new Date(`${customStartParam}T00:00:00.000Z`);
        endDate = new Date(`${customEndParam}T23:59:59.999Z`);
      } else {
        const now = new Date();
        // End of current day (local) - shifted by timeOffset
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        endDate.setDate(endDate.getDate() + timeOffset);

        if (range.endsWith('d')) {
          const rangeDays = parseInt(range.slice(0, -1), 10);
          // Start of day 'rangeDays - 1' days ago (inclusive)
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          startDate.setHours(0, 0, 0, 0);
          startDate.setDate(startDate.getDate() - rangeDays + 1);
        } else if (range.endsWith('y')) {
          const years = parseInt(range.slice(0, -1), 10);
          // Start of day exactly N years ago
          startDate = new Date(endDate.getFullYear() - years, endDate.getMonth(), endDate.getDate());
          startDate.setHours(0, 0, 0, 0);
        } else {
          // Default 30 days
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          startDate.setHours(0, 0, 0, 0);
          startDate.setDate(startDate.getDate() - 30 + 1);
        }
      }

      // Helper function to format a date as YYYY-MM-DD in its local timezone
      const toYMDString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Send date-only strings (YYYY-MM-DD) to backend for bucketed data,
      // and full timestamps for summary RPC which expects timestamptz
      const startDateStr = toYMDString(startDate);
      const endDateStr = toYMDString(endDate);
      const startTs = startDate.toISOString();
      const endTs = endDate.toISOString();

      console.log('Requesting data for metric:', metric, 'range:', range, 'start date:', startDateStr, 'end date:', endDateStr);

      // If a zoomed viewport is active, prefer that window over the range/dayView
      const hasViewport = typeof viewportMin === 'number' && typeof viewportMax === 'number';
      if (hasViewport) {
        const startTs = new Date(viewportMin!).toISOString();
        const endTs = new Date(viewportMax!).toISOString();

        // narrow window threshold = 2 days
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        const isNarrow = (viewportMax! - viewportMin!) <= twoDaysMs;

        if (isNarrow) {
          // Fetch raw points for primary metric
          const { data: rawData } = await supabase
            .from('data_points')
            .select(`
              timestamp,
              value_numeric,
              metric_definitions!inner(metric_name)
            `)
            .eq('user_id', user.data.user.id)
            .eq('metric_definitions.metric_name', metric)
            .gte('timestamp', startTs)
            .lte('timestamp', endTs)
            .order('timestamp', { ascending: true });

          const formattedRawData: RawDataPoint[] = (rawData || []).map(point => ({
            timestamp: point.timestamp,
            value: point.value_numeric || 0,
            metric_name: (point.metric_definitions as any).metric_name,
          }));
          const chartFormat = formattedRawData.map(p => ({ bucket: p.timestamp, value: p.value }));
          setRawDataPoints(formattedRawData);
          setChartData(chartFormat);
          setTableData(chartFormat.slice().reverse());

          // second metric if needed
          if (compareMode && metric2) {
            const { data: rawData2 } = await supabase
              .from('data_points')
              .select(`
                timestamp,
                value_numeric,
                metric_definitions!inner(metric_name)
              `)
              .eq('user_id', user.data.user.id)
              .eq('metric_definitions.metric_name', metric2)
              .gte('timestamp', startTs)
              .lte('timestamp', endTs)
              .order('timestamp', { ascending: true });
            const chartFormat2 = (rawData2 || []).map(pt => ({ bucket: pt.timestamp, value: pt.value_numeric || 0 }));
            setChartData2(chartFormat2);
          } else {
            setChartData2([]);
          }

          setMinTime(viewportMin!);
          setMaxTime(viewportMax!);
        } else {
          // Use bucketed data for wider windows
          const startDateStr = startTs.slice(0, 10);
          const endDateStr = endTs.slice(0, 10);

          // dynamic bucket for performance
          const daysSpanVp = Math.ceil((viewportMax! - viewportMin!) / (24 * 60 * 60 * 1000));
          let bucket_interval_vp: 'day' | 'week' | 'month' = 'day';
          if (daysSpanVp > 400) bucket_interval_vp = 'month';
          else if (daysSpanVp > 180) bucket_interval_vp = 'week';

          const { data } = await supabase.rpc('get_metric_time_bucketed', {
            user_id_input: user.data.user.id,
            metric_name_input: metric,
            start_date_input: startDateStr,
            end_date_input: endDateStr,
            bucket_interval: bucket_interval_vp,
          });
          setChartData(data || []);
          setTableData((data || []).slice().reverse());

          if (compareMode && metric2) {
            const { data: data2 } = await supabase.rpc('get_metric_time_bucketed', {
              user_id_input: user.data.user.id,
              metric_name_input: metric2,
              start_date_input: startDateStr,
              end_date_input: endDateStr,
              bucket_interval: bucket_interval_vp,
            });
            setChartData2(data2 || []);
          } else {
            setChartData2([]);
          }

          setMinTime(undefined);
          setMaxTime(undefined);
        }

        // Summary for the viewport window
        const { data: summaryData } = await supabase.rpc('get_metric_summary_for_period', {
          metric_name_input: metric,
          start_date: startTs,
          end_date: endTs,
        });
        if (Array.isArray(summaryData) && summaryData.length > 0) setSummary(summaryData[0]); else setSummary(null);
        return;
      }

      if (dayView) {
        const dayViewStartDate = new Date(endDate);
        dayViewStartDate.setHours(0, 0, 0, 0);
        const dayViewStartTs = dayViewStartDate.toISOString();

        // Fetch raw data points directly from database for day view
        const { data: rawData } = await supabase
          .from('data_points')
          .select(`
            timestamp,
            value_numeric,
            metric_definitions!inner(metric_name, beautiful_name)
          `)
          .eq('user_id', user.data.user.id)
          .eq('metric_definitions.metric_name', metric)
          .gte('timestamp', dayViewStartTs)
          .lte('timestamp', endTs)
          .order('timestamp', { ascending: true });

        if (rawData) {
          const formattedRawData: RawDataPoint[] = rawData.map(point => ({
            timestamp: point.timestamp,
            value: point.value_numeric || 0,
            metric_name: (point.metric_definitions as any).metric_name
          }));
          setRawDataPoints(formattedRawData);
          
          // Convert raw data to chart format
          const chartFormat = formattedRawData.map(point => ({
            bucket: point.timestamp,
            value: point.value
          }));
          setChartData(chartFormat);
          setTableData(chartFormat.slice().reverse());

          if (chartFormat.length > 0) {
            let min = new Date(chartFormat[0].bucket).getTime();
            let max = min;
            for (let i = 1; i < chartFormat.length; i++) {
              const t = new Date(chartFormat[i].bucket).getTime();
              if (t < min) min = t;
              if (t > max) max = t;
            }
            setMinTime(min);
            setMaxTime(max);
          } else {
            setMinTime(undefined);
            setMaxTime(undefined);
          }
        }
      } else {
        setMinTime(undefined);
        setMaxTime(undefined);
        // Use existing bucketed data approach
        // dynamic bucket for performance
        const daysSpan = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        let bucket_interval: 'day' | 'week' | 'month' = 'day';
        if (daysSpan > 400) bucket_interval = 'month';
        else if (daysSpan > 180) bucket_interval = 'week';

        const { data } = await supabase.rpc('get_metric_time_bucketed', {
          user_id_input: user.data.user.id,
          metric_name_input: metric,
          start_date_input: startDateStr,
          end_date_input: endDateStr,
          bucket_interval,
        });

        if (data) {
          setChartData(data);
          setTableData(data.slice().reverse());
        }
      }

      // Fetch second metric data for comparison if in compare mode
      if (compareMode && metric2) {
        if (dayView) {
          const { data: rawData2 } = await supabase
            .from('data_points')
            .select(`
              timestamp,
              value_numeric,
              metric_definitions!inner(metric_name)
            `)
            .eq('user_id', user.data.user.id)
            .eq('metric_definitions.metric_name', metric2)
            .gte('timestamp', startTs)
            .lte('timestamp', endTs)
            .order('timestamp', { ascending: true });

          if (rawData2) {
            const chartFormat2 = rawData2.map(point => ({
              bucket: point.timestamp,
              value: point.value_numeric || 0
            }));
            setChartData2(chartFormat2);
          }
        } else {
          const { data: data2 } = await supabase.rpc('get_metric_time_bucketed', {
            user_id_input: user.data.user.id,
            metric_name_input: metric2,
            start_date_input: startDateStr,
            end_date_input: endDateStr,
            bucket_interval: 'day',
          });

          if (data2) {
            setChartData2(data2);
          }
        }
      }

      // Fetch summary stats for the same period
      const { data: summaryData } = await supabase.rpc('get_metric_summary_for_period', {
        metric_name_input: metric,
        start_date: startTs,
        end_date: endTs,
      });

      if (Array.isArray(summaryData) && summaryData.length > 0) {
        setSummary(summaryData[0]);
      } else {
        setSummary(null);
      }
    };

    if (supabase && metric && (range !== 'custom' || (customStartParam && customEndParam))) {
      fetchData();
    }
  }, [supabase, metric, metric2, range, customStartParam, customEndParam, dayView, compareMode, viewportMin, viewportMax, timeOffset]);

  // Debounced handler from chart viewport changes
  const handleViewportChange = (min: number, max: number) => {
    if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
    viewportDebounceRef.current = setTimeout(() => {
      setViewportMin(min);
      setViewportMax(max);
    }, 250);
  };

  const handleViewportReset = () => {
    setViewportMin(undefined);
    setViewportMax(undefined);
  };

  // Calculate the step size based on the current range
  const getNavigationStep = () => {
    if (dayView) return 1; // 1 day for day view
    if (range === '7d') return 7;
    if (range === '30d') return 30;
    if (range === '90d') return 30;
    if (range === '1y') return 90;
    if (range === 'custom' && customStartParam && customEndParam) {
      const start = new Date(customStartParam);
      const end = new Date(customEndParam);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.floor(days / 3)); // Move by 1/3 of the range
    }
    return 30; // Default
  };

  const handleTimeShift = (direction: 'prev' | 'next' | 'start' | 'end') => {
    const step = getNavigationStep();
    
    if (direction === 'prev') {
      setTimeOffset(prev => prev - step);
    } else if (direction === 'next') {
      setTimeOffset(prev => prev + step);
    } else if (direction === 'start') {
      setTimeOffset(prev => prev - step * 10); // Jump far back
    } else if (direction === 'end') {
      setTimeOffset(0); // Reset to current/latest data
    }
  };

  const isAtCurrentTime = timeOffset === 0;

  const handleDeleteDataPoint = async (timestamp: string, value: number) => {
    if (!confirm(`Are you sure you want to delete this data point?\n\nDate: ${new Date(timestamp).toLocaleString()}\nValue: ${value.toFixed(2)}`)) {
      return;
    }

    setDeletingId(timestamp);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) {
        alert('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('data_points')
        .delete()
        .eq('user_id', user.user.id)
        .eq('timestamp', timestamp)
        .eq('value_numeric', value);

      if (error) {
        console.error('Error deleting data point:', error);
        alert(`Failed to delete data point: ${error.message}`);
      } else {
        // Refresh the data
        // Remove from local state immediately for better UX
        setChartData(prev => prev.filter(d => d.bucket !== timestamp));
        setTableData(prev => prev.filter(d => d.bucket !== timestamp));
        
        // Also trigger a full data refresh to ensure consistency
        const fetchData = async () => {
          // Re-fetch data using existing logic
          window.location.reload(); // Simple refresh for now, or you can call the fetchData from useEffect
        };
        
        // Small delay before refresh to show the deletion feedback
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting data point:', error);
      alert('An unexpected error occurred while deleting the data point');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilterChange = (key: 'metric' | 'metric2' | 'range' | 'type', value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set(key, value);
    if (key === 'range' && value !== 'custom') {
      current.delete('start');
      current.delete('end');
      // If a multi-day range is selected, disable dayView
      if (value.endsWith('d') || value.endsWith('y')) {
        current.delete('dayView');
      }
      // Reset time offset when range changes
      setTimeOffset(0);
    }
    // Reset viewport on any filter change
    setViewportMin(undefined);
    setViewportMax(undefined);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`);
    });
  };

  const handleToggleChange = (key: 'compare' | 'dayView', value: boolean) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value) {
      current.set(key, 'true');
    } else {
      current.delete(key);
      if (key === 'compare') {
        current.delete('metric2');
      }
    }
    // Reset viewport on toggles as the semantic view changes
    setViewportMin(undefined);
    setViewportMax(undefined);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`);
    });
  };

  const getMetricDisplayName = (metricName: string) => {
    const metricDef = metrics.find(m => m.metric_name === metricName);
    return metricDef?.beautiful_name || metricName;
  };

  const getMetricUnit = (metricName: string) => {
    const metricDef = metrics.find(m => m.metric_name === metricName);
    return metricDef?.default_unit || 'N/A';
  };

  const isMinutesUnit = (unit: string | undefined) => {
    if (!unit) return false;
    const normalized = unit.toLowerCase();
    return normalized === 'minutes' || normalized === 'minute' || normalized === 'min';
  };

  const metricUnit = getMetricUnit(metric);
  const metric2Unit = getMetricUnit(metric2);
  const metricShownInHours = isMinutesUnit(metricUnit);
  const metric2ShownInHours = isMinutesUnit(metric2Unit);

  const convertForDisplay = (value: number, showAsHours: boolean) => (showAsHours ? value / 60 : value);
  const formatDisplayValue = (value: number, showAsHours: boolean) => convertForDisplay(value, showAsHours).toFixed(2);
  const getDisplayUnit = (unit: string) => (isMinutesUnit(unit) ? 'hr' : unit);

  // Normalize data to 0-100 range for visual comparison
  const normalizeData = (data: number[]) => {
    if (data.length === 0) return [];

    let min = data[0];
    let max = data[0];
    for (let i = 1; i < data.length; i++) {
      const val = data[i];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    const range = max - min;
    
    if (range === 0) return data.map(() => 50); // All values are the same, center at 50
    
    return data.map(value => ((value - min) / range) * 100);
  };

  const formattedChartData = (
    () => {
      const baseDataset = {
        label: getMetricDisplayName(metric),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      } as const;

      // Scatter (non-compare): use time-based points for both day and multi-day
      if (type === 'scatter' && !(compareMode && metric2)) {
        return {
          datasets: [
            {
              ...baseDataset,
              data: chartData.map(d => ({ x: new Date(d.bucket).getTime(), y: convertForDisplay(d.value, metricShownInHours) })),
            }
          ]
        };
      }

      // line/bar default, including multi-day and dayView non-scatter
      const labels = chartData.map(d => new Date(d.bucket));
      const rawData1 = chartData.map(d => convertForDisplay(d.value, metricShownInHours));
      const rawData2 = chartData2.map(d => convertForDisplay(d.value, metric2ShownInHours));
      
      // Check if normalization is needed and enabled
      const shouldNormalize = compareMode && metric2 && chartData2.length > 0 && normalizeCompare;
      
      const datasets = [
        {
          ...baseDataset,
          data: shouldNormalize ? normalizeData(rawData1) : rawData1,
          label: shouldNormalize 
            ? `${getMetricDisplayName(metric)} (normalized)`
            : getMetricDisplayName(metric),
        } as const,
      ];

      if (compareMode && metric2 && chartData2.length > 0) {
        datasets.push({
          label: shouldNormalize 
            ? `${getMetricDisplayName(metric2)} (normalized)`
            : getMetricDisplayName(metric2),
          data: shouldNormalize ? normalizeData(rawData2) : rawData2,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        } as any);
      }

      return { labels, datasets };
    }
  )();

  const scatterData = {
    datasets: compareMode && metric2 && chartData.length > 0 && chartData2.length > 0 ? [
      {
        label: `${getMetricDisplayName(metric)} vs ${getMetricDisplayName(metric2)}`,
        data: chartData.map((point) => {
          const correspondingPoint = chartData2.find(p => p.bucket === point.bucket);
          return correspondingPoint ? {
            x: convertForDisplay(point.value, metricShownInHours),
            y: convertForDisplay(correspondingPoint.value, metric2ShownInHours)
          } : null;
        }).filter((point): point is { x: number; y: number } => point !== null),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      }
    ] : [],
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Data Explorer</h1>
          <p className="mt-2 text-white/70">
            Visualize and analyze your health metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20">
                <Plus className="h-4 w-4" />
                Quick Log
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg border-white/20 bg-white/10 backdrop-blur-md">
              <DialogHeader>
                <DialogTitle className="text-white">Quick Log</DialogTitle>
                <DialogDescription className="text-white/70">
                  Quickly add a new data point
                </DialogDescription>
              </DialogHeader>
              <DataLogger className="bg-white/5 border border-white/10" title="Log a new data point" />
            </DialogContent>
          </Dialog>
          <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div className="space-y-6">
          {/* Toggle Controls */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="compare-mode"
                checked={compareMode}
                onCheckedChange={(checked) => handleToggleChange('compare', checked)}
              />
              <Label htmlFor="compare-mode" className="text-white/90">
                Compare Metrics
              </Label>
            </div>
            {compareMode && metric2 && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="normalize-compare"
                  checked={normalizeCompare}
                  onCheckedChange={setNormalizeCompare}
                />
                <Label htmlFor="normalize-compare" className="text-white/90">
                  Normalize Scale (0-100)
                </Label>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="day-view"
                checked={dayView}
                onCheckedChange={(checked) => handleToggleChange('dayView', checked)}
              />
              <Label htmlFor="day-view" className="text-white/90">
                Day View (All Logs)
              </Label>
            </div>
          </div>

          {/* Metric Selection */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Primary Metric
              </label>
              <Select 
                value={metric}
                onValueChange={(value) => handleFilterChange('metric', value)}
                disabled={isPending}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map(m => (
                    <SelectItem key={m.metric_name} value={m.metric_name}>
                      {m.beautiful_name || m.metric_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {compareMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90">
                  Compare With
                </label>
                <Select 
                  value={metric2}
                  onValueChange={(value) => handleFilterChange('metric2', value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select second metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.filter(m => m.metric_name !== metric).map(m => (
                      <SelectItem key={m.metric_name} value={m.metric_name}>
                        {m.beautiful_name || m.metric_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/70" />
              <Select 
                value={range}
                onValueChange={(value) => handleFilterChange('range', value)}
                disabled={isPending}
              >
                <SelectTrigger className="flex-1 bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {range === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="text-white/90">
                      {customStartParam && customEndParam
                        ? `${new Date(`${customStartParam}T00:00:00Z`).toLocaleDateString()} - ${new Date(`${customEndParam}T00:00:00Z`).toLocaleDateString()}`
                        : 'Pick dates'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2 bg-background border border-white/10" align="start">
                    <RangeCalendar
                      mode="range"
                      defaultMonth={customRange?.from}
                      selected={customRange}
                      onSelect={(value) => {
                        setCustomRange(value);
                        if (value?.from && value?.to) {
                          const current = new URLSearchParams(Array.from(searchParams.entries()));
                          current.set('range', 'custom');
                          const startStr = new Date(value.from).toISOString().slice(0,10);
                          const endStr = new Date(value.to).toISOString().slice(0,10);
                          current.set('start', startStr);
                          current.set('end', endStr);
                          const query = `?${current.toString()}`;
                          startTransition(() => {
                            router.push(`${pathname}${query}`);
                          });
                        }
                      }}
                      numberOfMonths={1}
                      className="rounded-lg border shadow-sm"
                    />
                    <div className="text-muted-foreground text-center text-xs mt-2">
                      Select a start and end date
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Chart Type
              </label>
              <Select 
                value={type}
                onValueChange={(value) => handleFilterChange('type', value)}
                disabled={isPending}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  {( (compareMode && metric2) || dayView ) && (
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Normalization Info */}
      {compareMode && metric2 && normalizeCompare && chartData.length > 0 && chartData2.length > 0 && (
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white/90 text-sm font-medium mb-1">
                Normalization Active
              </p>
              <p className="text-white/70 text-xs">
                Both metrics are scaled to 0-100 range for visual comparison. This preserves the patterns and trends while making different scales comparable. 
                Original values: <span className="font-mono">{getMetricDisplayName(metric)}</span> (min: {chartStats.min1.toFixed(1)}, max: {chartStats.max1.toFixed(1)}) • <span className="font-mono">{getMetricDisplayName(metric2)}</span> (min: {chartStats.min2.toFixed(1)}, max: {chartStats.max2.toFixed(1)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        {chartData.length > 0 ? (
          type === 'scatter' && compareMode && metric2 && scatterData.datasets.length > 0 ? (
            <DataChart chartData={scatterData} chartType="scatter" scatterXScale="linear" externalMin={viewportMin} externalMax={viewportMax} onViewportChange={handleViewportChange} onViewportReset={handleViewportReset} />
          ) : (
            <DataChart chartData={formattedChartData} chartType={type as 'line' | 'bar' | 'scatter'} dayView={dayView} minTime={minTime} maxTime={maxTime} scatterXScale={type === 'scatter' ? 'time' : undefined} externalMin={viewportMin} externalMax={viewportMax} onViewportChange={handleViewportChange} onViewportReset={handleViewportReset} />
          )
        ) : (
          <div className="flex items-center justify-center h-96 text-white/50">
            <div className="text-center">
              {type === 'scatter' ? (
                <ScatterChart className="h-16 w-16 mx-auto mb-4 text-white/30" />
              ) : (
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-white/30" />
              )}
              <p className="text-lg font-medium">No data to display</p>
              <p className="text-sm">
                {type === 'scatter' && compareMode 
                  ? 'Select two metrics to view scatter plot comparison'
                  : 'Select a metric to view your data visualization'
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Time Navigation Slider */}
        {chartData.length > 0 && range !== 'custom' && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">Time Navigation</span>
              {!isAtCurrentTime && (
                <button
                  onClick={() => setTimeOffset(0)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Reset to Current
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTimeShift('start')}
                className="p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Jump back"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleTimeShift('prev')}
                className="p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition"
                title={`Previous ${getNavigationStep()} days`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-center">
                <div className="text-white text-sm font-medium">
                  {timeOffset === 0 ? (
                    'Current Period'
                  ) : timeOffset > 0 ? (
                    `${timeOffset} days ahead`
                  ) : (
                    `${Math.abs(timeOffset)} days ago`
                  )}
                </div>
                <div className="text-white/60 text-xs mt-0.5">
                  {(() => {
                    const now = new Date();
                    const end = new Date(now);
                    end.setDate(end.getDate() + timeOffset);
                    
                    let start = new Date(end);
                    if (range.endsWith('d')) {
                      const days = parseInt(range.slice(0, -1), 10);
                      start.setDate(start.getDate() - days + 1);
                    } else if (range.endsWith('y')) {
                      const years = parseInt(range.slice(0, -1), 10);
                      start.setFullYear(start.getFullYear() - years);
                    } else {
                      start.setDate(start.getDate() - 30 + 1);
                    }
                    
                    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
                  })()}
                </div>
              </div>
              
              <button
                onClick={() => handleTimeShift('next')}
                className="p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAtCurrentTime}
                title={`Next ${getNavigationStep()} days`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleTimeShift('end')}
                className="p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAtCurrentTime}
                title="Jump to current"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Summary</h3>
          <span className="text-xs text-white/60">
            {getMetricDisplayName(metric)} {dayView ? '(Day View)' : ''} • {range === 'custom' && customStartParam && customEndParam ? `${new Date(`${customStartParam}T00:00:00Z`).toLocaleDateString()} - ${new Date(`${customEndParam}T00:00:00Z`).toLocaleDateString()}` : `Last ${range}`}
          </span>
        </div>
        {summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">Average</div>
              <div className="text-white text-2xl font-semibold mt-1">{summary.avg_val !== null ? formatDisplayValue(summary.avg_val, metricShownInHours) : '—'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">Minimum</div>
              <div className="text-white text-2xl font-semibold mt-1">{summary.min_val !== null ? formatDisplayValue(summary.min_val, metricShownInHours) : '—'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">Maximum</div>
              <div className="text-white text-2xl font-semibold mt-1">{summary.max_val !== null ? formatDisplayValue(summary.max_val, metricShownInHours) : '—'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">Count</div>
              <div className="text-white text-2xl font-semibold mt-1">{summary.total_count ?? '—'}</div>
            </div>
          </div>
        ) : (
          <div className="text-white/60 text-sm">No summary available for the selected period.</div>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Raw Data</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/90 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-white/90 font-medium">Metric</th>
                  <th className="text-left py-3 px-4 text-white/90 font-medium">Value</th>
                  <th className="text-left py-3 px-4 text-white/90 font-medium">Unit</th>
                  <th className="w-12 py-3 px-4"></th>
                </tr>
              </thead>
                            <tbody>
                {tableData.length > 0 ? (
                  tableData.map((row) => (
                    <tr key={row.bucket} className="border-b border-white/10 group hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white/90">
                        {dayView ? new Date(row.bucket).toLocaleString() : new Date(row.bucket).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white/90">{getMetricDisplayName(metric)}</td>
                      <td className="py-3 px-4 text-white/90">{formatDisplayValue(row.value, metricShownInHours)}</td>
                      <td className="py-3 px-4 text-white/90">
                        {getDisplayUnit(metricUnit)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteDataPoint(row.bucket, row.value)}
                          disabled={deletingId === row.bucket}
                          className="rounded-lg border border-red-400/20 bg-red-500/10 p-1.5 text-red-400 opacity-0 backdrop-blur-sm transition-all hover:bg-red-500/20 hover:border-red-400/40 hover:text-red-300 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/10"
                          title="Delete this data point"
                        >
                          {deletingId === row.bucket ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/50">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
