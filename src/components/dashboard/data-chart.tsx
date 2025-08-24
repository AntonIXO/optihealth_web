"use client";

import { Bar, Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface DataChartProps {
  chartData: {
    labels?: Date[];
    datasets: {
      label: string;
      data: number[] | { x: number; y: number }[];
      borderColor?: string;
      backgroundColor?: string;
    }[];
  };
  chartType: 'line' | 'bar' | 'scatter';
}

export function DataChart({ chartData, chartType }: DataChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
        },
      },
      title: {
        display: true,
        text: 'Metric Over Time',
        color: 'rgba(255, 255, 255, 0.9)',
      },
    },
    scales: {
      x: {
        type: 'time' as const,
                time: {
          unit: 'day' as const,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const scatterOptions = {
    ...options,
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  return (
    <div className="h-96 w-full">
      {chartType === 'line' ? (
        <Line options={options} data={chartData} />
      ) : chartType === 'bar' ? (
        <Bar options={options} data={chartData} />
      ) : (
        <Scatter options={scatterOptions} data={chartData} />
      )}
    </div>
  );
}
