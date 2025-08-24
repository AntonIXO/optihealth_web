"use client";

import { BarChart3, Download, Filter, Calendar } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as RangeCalendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { DataChart } from "@/components/dashboard/data-chart";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface MetricDefinition {
  metric_name: string;
  category: string;
}

interface ChartData {
  bucket: string;
  value: number;
}

export default function DataPage() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tableData, setTableData] = useState<ChartData[]>([]);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const metric = searchParams.get('metric') || 'hr_resting';
  const range = searchParams.get('range') || '30d';
  const customStartParam = searchParams.get('start');
  const customEndParam = searchParams.get('end');
  const type = searchParams.get('type') || 'line';

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase
        .from('metric_definitions')
        .select('metric_name, category')
        .order('category, metric_name');
      if (data) setMetrics(data);
    };
    fetchMetrics();
  }, [supabase]);

  useEffect(() => {
    const fetchData = async () => {
      let endDate = new Date();
      let startDate = new Date();

      if (range === 'custom' && customStartParam && customEndParam) {
        startDate = new Date(`${customStartParam}T00:00:00.000Z`);
        endDate = new Date(`${customEndParam}T23:59:59.999Z`);
      } else if (range.endsWith('d')) {
        const rangeDays = parseInt(range.slice(0, -1), 10);
        startDate = new Date();
        startDate.setDate(endDate.getDate() - rangeDays);
      } else if (range.endsWith('y')) {
        const years = parseInt(range.slice(0, -1), 10);
        const days = years * 365;
        startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
      } else {
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
      }

      console.log('Requesting data for metric: ', metric, 'range: ', range, 'start date: ', startDate.toISOString(), 'end date: ', endDate.toISOString());

      const { data } = await supabase.rpc('get_metric_time_bucketed', {
        user_id_input: (await supabase.auth.getUser()).data.user?.id,
        metric_name_input: metric,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        bucket_interval: 'day',
      });

      if (data) {
        setChartData(data);
        setTableData(data.slice().reverse()); // For descending order in table
      }
    };

    if (supabase && metric && (range !== 'custom' || (customStartParam && customEndParam))) {
      fetchData();
    }
  }, [supabase, metric, range, customStartParam, customEndParam]);

  const handleFilterChange = (key: 'metric' | 'range' | 'type', value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set(key, value);
    if (key === 'range' && value !== 'custom') {
      current.delete('start');
      current.delete('end');
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`);
    });
  };

  const formattedChartData = {
    labels: chartData.map(d => new Date(d.bucket)),
    datasets: [
      {
        label: metrics.find(m => m.metric_name === metric)?.metric_name || metric,
        data: chartData.map(d => d.value),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Metric
            </label>
            <select 
              value={metric}
              onChange={(e) => handleFilterChange('metric', e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md"
              disabled={isPending}
            >
              <option value="">Select a metric</option>
              {metrics.map(m => (
                <option key={m.metric_name} value={m.metric_name}>{m.metric_name}</option>
              ))}
            </select>
          </div>
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
            </select>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                {chartData.length > 0 ? (
          <DataChart chartData={formattedChartData} chartType={type as 'line' | 'bar'} />
        ) : (
          <div className="flex items-center justify-center h-96 text-white/50">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-white/30" />
              <p className="text-lg font-medium">No data to display</p>
              <p className="text-sm">Select a metric to view your data visualization</p>
            </div>
          </div>
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
                      <td className="py-3 px-4 text-white/90">{new Date(row.bucket).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-white/90">{metric}</td>
                      <td className="py-3 px-4 text-white/90">{row.value.toFixed(2)}</td>
                      <td className="py-3 px-4 text-white/90">N/A</td>
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
