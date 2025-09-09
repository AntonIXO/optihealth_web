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
  ChartOptions,
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
  dayView?: boolean;
  minTime?: number;
  maxTime?: number;
  scatterXScale?: 'time' | 'linear';
}

export function DataChart({ chartData, chartType, dayView, minTime, maxTime, scatterXScale = 'time' }: DataChartProps) {
  const getOptions = (): ChartOptions<'line' | 'bar' | 'scatter'> => {
    const baseOptions = {
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

    if (chartType === 'scatter') {
      if (scatterXScale === 'linear') {
        return {
          ...baseOptions,
          scales: {
            ...baseOptions.scales,
            x: {
              type: 'linear' as const,
              position: 'bottom' as const,
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
            },
          },
        };
      }
      // time-based scatter
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          x: {
            type: 'time' as const,
            time: {
              unit: dayView ? ('hour' as const) : ('day' as const),
              displayFormats: dayView ? { hour: 'HH:mm' } : undefined,
            },
            min: dayView ? minTime : undefined,
            max: dayView ? maxTime : undefined,
            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
          },
        },
      };
    }

    if (dayView) {
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          x: {
            type: 'time' as const,
            min: minTime,
            max: maxTime,
            time: {
              unit: 'hour' as const,
              displayFormats: { hour: 'HH:mm' },
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
      };
    }

    // Default options for multi-day line/bar charts
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
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
      },
    };
  };

  const finalOptions = getOptions();
  const finalChartType = chartType;

  return (
    <div className="h-96 w-full">
      {finalChartType === 'line' ? (
        <Line options={finalOptions} data={chartData} />
      ) : finalChartType === 'bar' ? (
        <Bar options={finalOptions} data={chartData} />
      ) : (
        <Scatter options={finalOptions} data={chartData} />
      )}
    </div>
  );
}
