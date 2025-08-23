import { BarChart3, Download, Filter, Calendar } from "lucide-react";

export default function DataPage() {
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
            <select className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md">
              <option value="">Select a metric</option>
              <option value="steps">Steps</option>
              <option value="heart_rate">Heart Rate</option>
              <option value="sleep_score">Sleep Score</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/70" />
              <select className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Chart Type
            </label>
            <select className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md">
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="scatter">Scatter Plot</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div className="flex items-center justify-center h-96 text-white/50">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-white/30" />
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm">Select a metric to view your data visualization</p>
          </div>
        </div>
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
                <tr>
                  <td colSpan={4} className="text-center py-8 text-white/50">
                    No data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
