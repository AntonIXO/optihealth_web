"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MiniChartProps {
  data: Array<{
    timestamp: string;
    value: number;
  }>;
  title: string;
  unit?: string;
  color?: string;
}

export function MiniChart({ data, title, unit = "", color = "#60a5fa" }: MiniChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  const { min, max } = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0 };
    let minVal = data[0].value;
    let maxVal = data[0].value;
    for (let i = 1; i < data.length; i++) {
      const v = data[i].value;
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    return { min: minVal, max: maxVal };
  }, [data]);

  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }),
    datasets: [
      {
        label: title,
        data: data.map(item => item.value),
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 3,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: color,
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y}${unit ? ' ' + unit : ''}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10,
          },
          maxTicksLimit: 6,
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10,
          },
          maxTicksLimit: 4,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div className="w-full h-32 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/60">
          {data.length} readings
        </span>
        <span className="text-xs text-white/60">
          {data.length > 0 && (
            <>
              {min.toFixed(1)} - {max.toFixed(1)} {unit}
            </>
          )}
        </span>
      </div>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
