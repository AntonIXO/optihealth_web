"use client";

import React, { useEffect, useRef, useState } from 'react';
import makeChart from '@/lib/telegram-chart/chart';
import { cn } from '@/lib/utils';

interface TelegramChartProps {
  data: {
    name: string;
    type: string;
    dates: number[];
    lines: Record<string, {
      name: string;
      color: number;
      values: number[];
    }>;
  };
  className?: string;
  onViewportChange?: (min: number, max: number) => void;
}

export function TelegramChart({ data, className, onViewportChange }: TelegramChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [toggles, setToggles] = useState<Record<string, { name: string; color: string; enabled: boolean }>>({});
  // Debounce viewport changes
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleRangeChange = ({ start, end }: { start: number; end: number }) => {
        if (onViewportChange) {
            if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
            viewportDebounceRef.current = setTimeout(() => {
                onViewportChange(start, end);
            }, 250);
        }
    };

    // Initialize Chart
    const chart = makeChart(containerRef.current, data, 'night', { onRangeChange: handleRangeChange });
    chart.start();
    chart.setTheme('night'); // Default to night mode as per the app's dark theme

    chartInstanceRef.current = chart;

    // Initialize Toggles State
    const initialToggles: Record<string, any> = {};
    Object.keys(data.lines).forEach(key => {
      initialToggles[key] = {
        name: data.lines[key].name,
        color: '#' + data.lines[key].color.toString(16).padStart(6, '0'),
        enabled: true
      };
    });
    setToggles(initialToggles);

    return () => {
      chart.destroy();
      chartInstanceRef.current = null;
    };
  }, [data]); // Re-create chart when data object changes (deep check might be better but data is usually stable ref)

  const handleToggle = (key: string) => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.toggleLine(key);
      setToggles(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          enabled: !prev[key].enabled
        }
      }));
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div ref={containerRef} className="h-[400px] w-full relative" />

      {/* Toggles */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(toggles).map(([key, { name, color, enabled }]) => (
          <button
            key={key}
            onClick={() => handleToggle(key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
              enabled
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/10 text-white/50"
            )}
            style={{
              borderColor: enabled ? color : undefined
            }}
          >
            <span
              className={cn("w-3 h-3 rounded-full transition-all duration-300", enabled ? "opacity-100" : "opacity-0")}
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
