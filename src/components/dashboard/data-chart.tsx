"use client";

import React, { useRef } from 'react';
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
import zoomPlugin from 'chartjs-plugin-zoom';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
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
  // Optional externally controlled viewport for X scale
  externalMin?: number;
  externalMax?: number;
  // Callbacks when user changes or resets the viewport via zoom/pan
  onViewportChange?: (min: number, max: number) => void;
  onViewportReset?: () => void;
}

export function DataChart({ chartData, chartType, dayView, minTime, maxTime, scatterXScale = 'time', externalMin, externalMax, onViewportChange, onViewportReset }: DataChartProps) {
  const chartRef = useRef<any>(null);
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
        zoom: {
          limits: {
            x: (externalMin !== undefined && externalMax !== undefined)
              ? { min: externalMin, max: externalMax }
              : (dayView ? { min: minTime, max: maxTime } : undefined),
          },
          pan: {
            enabled: true,
            mode: (chartType === 'scatter' && scatterXScale === 'linear') ? 'xy' : 'x',
            modifierKey: 'shift',
            onPanComplete: () => {
              const x = (chartRef.current as any)?.scales?.x;
              if (x && typeof x.min === 'number' && typeof x.max === 'number') {
                onViewportChange?.(x.min, x.max);
              }
            },
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            drag: {
              enabled: true,
              backgroundColor: 'rgba(59,130,246,0.15)',
              borderColor: 'rgba(59,130,246,0.4)'
            },
            mode: (chartType === 'scatter' && scatterXScale === 'linear') ? 'xy' : 'x',
            onZoomComplete: () => {
              const x = (chartRef.current as any)?.scales?.x;
              if (x && typeof x.min === 'number' && typeof x.max === 'number') {
                onViewportChange?.(x.min, x.max);
              }
            },
          },
        } as any,
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
            min: (externalMin !== undefined ? externalMin : (dayView ? minTime : undefined)),
            max: (externalMax !== undefined ? externalMax : (dayView ? maxTime : undefined)),
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
            min: (externalMin !== undefined ? externalMin : minTime),
            max: (externalMax !== undefined ? externalMax : maxTime),
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
          min: (externalMin !== undefined ? externalMin : undefined),
          max: (externalMax !== undefined ? externalMax : undefined),
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
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            (chartRef.current as any)?.resetZoom?.();
            onViewportReset?.();
          }}
        >
          Reset zoom
        </Button>
      </div>
      {finalChartType === 'line' ? (
        <Line ref={chartRef} options={finalOptions} data={chartData} />
      ) : finalChartType === 'bar' ? (
        <Bar ref={chartRef} options={finalOptions} data={chartData} />
      ) : (
        <Scatter ref={chartRef} options={finalOptions} data={chartData} />
      )}
    </div>
  );
}
