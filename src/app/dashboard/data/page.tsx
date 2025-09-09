"use client";

import { BarChart3, Download, Filter, Calendar, Plus, X, ScatterChart } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as RangeCalendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { DataChart } from "@/components/dashboard/data-chart";
import { DataLogger } from "@/components/dashboard/data-logger";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useTransition } from "react";
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
  const [minTime, setMinTime] = useState<number | undefined>();
  const [maxTime, setMaxTime] = useState<number | undefined>();

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
        // End of current day (local)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (range.endsWith('d')) {
          const rangeDays = parseInt(range.slice(0, -1), 10);
          // Start of day 'rangeDays - 1' days ago (inclusive)
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate.setDate(startDate.getDate() - rangeDays + 1);
        } else if (range.endsWith('y')) {
          const years = parseInt(range.slice(0, -1), 10);
          // Start of day exactly N years ago
          startDate = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
        } else {
          // Default 30 days
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
            const timestamps = chartFormat.map(d => new Date(d.bucket).getTime());
            const min = Math.min(...timestamps);
            const max = Math.max(...timestamps);
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
        const { data } = await supabase.rpc('get_metric_time_bucketed', {
          user_id_input: user.data.user.id,
          metric_name_input: metric,
          start_date_input: startDateStr,
          end_date_input: endDateStr,
          bucket_interval: 'day',
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
  }, [supabase, metric, metric2, range, customStartParam, customEndParam, dayView, compareMode]);

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
    }
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
              data: chartData.map(d => ({ x: new Date(d.bucket).getTime(), y: d.value })),
            }
          ]
        };
      }

      // line/bar default, including multi-day and dayView non-scatter
      const labels = chartData.map(d => new Date(d.bucket));
      const datasets = [
        {
          ...baseDataset,
          data: chartData.map(d => d.value),
        } as const,
      ];

      if (compareMode && metric2 && chartData2.length > 0) {
        datasets.push({
          label: getMetricDisplayName(metric2),
          data: chartData2.map(d => d.value),
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
            x: point.value,
            y: correspondingPoint.value
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
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Primary Metric
              </label>
              <select 
                value={metric}
                onChange={(e) => handleFilterChange('metric', e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md"
                disabled={isPending}
              >
                <option value="">Select a metric</option>
                {metrics.map(m => (
                  <option key={m.metric_name} value={m.metric_name}>
                    {m.beautiful_name || m.metric_name}
                  </option>
                ))}
              </select>
            </div>
            {compareMode && (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Compare With
                </label>
                <select 
                  value={metric2}
                  onChange={(e) => handleFilterChange('metric2', e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md"
                  disabled={isPending}
                >
                  <option value="">Select second metric</option>
                  {metrics.filter(m => m.metric_name !== metric).map(m => (
                    <option key={m.metric_name} value={m.metric_name}>
                      {m.beautiful_name || m.metric_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/70" />
              <select 
                value={range}
                onChange={(e) => handleFilterChange('range', e.target.value)}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md"
                disabled={isPending}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="custom">Custom...</option>
              </select>
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
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Chart Type
              </label>
              <select 
                value={type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md"
                disabled={isPending}
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                {( (compareMode && metric2) || dayView ) && (
                  <option value="scatter">Scatter Plot</option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        {chartData.length > 0 ? (
          type === 'scatter' && compareMode && metric2 && scatterData.datasets.length > 0 ? (
            <DataChart chartData={scatterData} chartType="scatter" scatterXScale="linear" />
          ) : (
            <DataChart chartData={formattedChartData} chartType={type as 'line' | 'bar' | 'scatter'} dayView={dayView} minTime={minTime} maxTime={maxTime} scatterXScale={type === 'scatter' ? 'time' : undefined} />
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
              <div className="text-white text-2xl font-semibold mt-1">{summary.avg_val !== null ? summary.avg_val.toFixed(2) : '—'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">Minimum</div>
              <div className="text-white text-2xl font-semibold mt-1">{summary.min_val !== null ? summary.min_val.toFixed(2) : '—'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">Maximum</div>
              <div className="text-white text-2xl font-semibold mt-1">{summary.max_val !== null ? summary.max_val.toFixed(2) : '—'}</div>
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
                </tr>
              </thead>
                            <tbody>
                {tableData.length > 0 ? (
                  tableData.map((row) => (
                    <tr key={row.bucket} className="border-b border-white/10">
                      <td className="py-3 px-4 text-white/90">
                        {dayView ? new Date(row.bucket).toLocaleString() : new Date(row.bucket).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white/90">{getMetricDisplayName(metric)}</td>
                      <td className="py-3 px-4 text-white/90">{row.value.toFixed(2)}</td>
                      <td className="py-3 px-4 text-white/90">
                        {metrics.find(m => m.metric_name === metric)?.default_unit || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-white/50">
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
